'use strict'

const _ = require('lodash')
var Jsonic = require('jsonic')

module.exports = function (options) {
  var seneca = this

  var name = 'concorda-client'

  function listClients (msg, response) {
    var limit = msg.limit
    var skip = msg.skip
    var orderBy = msg.order

    var q = {}

    if (limit) {
      q['limit$'] = limit
    }
    if (skip) {
      q['skip$'] = skip
    }

    if (orderBy) {
      if (_.isObject(orderBy)) {
        q['sort$'] = orderBy
      }
      else {
        try {
          orderBy = orderBy.replace(/%22/g, '\"').replace(/%20/g, ' ')
          q['sort$'] = Jsonic(orderBy)
        }
        catch (e) {
        }
      }
    }

    this.make$('client', 'data').list$(q, function (err, clients) {
      if (err) {
        return response(null, {ok: false, why: err})
      }
      clients = clients || []

      for (var i in clients) {
        clients[i] = clients[i].data$(false)
      }

      response(null, {ok: true, data: clients, count: clients.length})
    })
  }

  function loadClient (msg, response) {
    var clientId = msg.clientId

    if (!clientId) {
      return response(null, {ok: false, why: 'Invalid client id'})
    }

    this.make$('client', 'data').load$({id: clientId}, function (err, client) {
      if (err) {
        return response(null, {ok: false, why: err})
      }
      if (!client) {
        return response(null, {ok: false, why: 'Client not found'})
      }

      response(null, {ok: true, data: client.data$(false)})
    })
  }

  function publicLoadClient (msg, response) {
    var clientName = msg.clientName

    var q = {name: clientName}

    this.make$('client', 'data').load$(q, function (err, client) {
      if (err) {
        return response(null, {ok: false, why: err})
      }
      if (!client) {
        return response(null, {ok: false, why: 'Cannot find specified client'})
      }

      response(null, {ok: true, data: client.data$(false)})
    })
  }

  function publicUpdateClient (msg, response) {
    var clientData = msg.data

    // first validate that this client is not configured
    // only a non-configured client is allowed to be configured using the public service - as part of initial configuration
    var clientId = clientData.id
    if (!clientId) {
      return response(null, {ok: false, why: 'Invalid client data'})
    }

    // load client from db to validate the access to this service
    this.make$('client', 'data').save$({id: clientId}, function (err, dbclient) {
      if (err) {
        return response(null, {ok: false, why: err})
      }

      if (!dbclient || dbclient.configured) {
        return response(null, {ok: false, why: 'Action not allowed.'})
      }
      this.make$('client', 'data', clientData).save$(function (err, client) {
        if (err) {
          return response(null, {ok: false, why: err})
        }
        response(null, {ok: true, data: client.data$(false)})
      })
    })
  }

  function createClient (msg, response) {
    var clientData = msg.data

    this.make$('client', 'data').load$({appkey: clientData.appkey}, function (err, client) {
      if (err) {
        return response(null, {ok: false, why: err})
      }
      if (client) {
        return response(null, {ok: false, why: 'Client with same appkey already exists'})
      }
      this.make$('client', 'data', clientData).save$(function (err, client) {
        if (err) {
          return response(null, {ok: false, why: err})
        }
        response(null, {ok: true, data: client.data$(false)})
      })
    })
  }

  function deleteClient (msg, response) {
    var clientId = msg.clientId

    var that = this

    // delete client settings
    this.make$('client', 'settings').remove$({clientId: clientId}, function (err) {
      if (err) {
        return response(null, {ok: false, why: err})
      }

      // now delete client
      that.make$('client', 'data').remove$({id: clientId}, function (err) {
        if (err) {
          return response({ok: false, why: err})
        }
        response(null, {ok: true})
      })
    })
  }

  function init (args, done) {
    seneca
      .add('role: concorda, cmd: listClients', listClients)
      .add('role: concorda, cmd: loadClient', loadClient)
      .add('role: concorda, cmd: publicGetClient', publicLoadClient)
      .add('role: concorda, cmd: publicUpdateClient', publicUpdateClient)
      .add('role: concorda, cmd: listClientsAlias', listClients)
      .add('role: concorda, cmd: createClient', createClient)
      .add('role: concorda, cmd: deleteClient', deleteClient)

    done()
  }

  seneca.add('init: ' + name, init)

  return {
    name: name
  }
}
