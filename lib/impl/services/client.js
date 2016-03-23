'use strict'

const _ = require('lodash')
const Jsonic = require('jsonic')

module.exports = function (options) {
  let seneca = this

  let name = 'concorda-client'
  let clientDataEntity = 'client_data'

  function listClients (msg, response) {
    let limit = msg.limit
    let skip = msg.skip
    let orderBy = msg.order

    let q = {}

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

    this.make$(clientDataEntity).list$(q, function (err, clients) {
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
    let clientId = msg.clientId
    let appkey = msg.appkey

    if (!clientId && !appkey) {
      return response(null, {ok: false, why: 'Invalid client id or appkey'})
    }

    var q = {}
    if (clientId){
      q.id = clientId
    }
    if (appkey){
      q.appkey = appkey
    }

    this.make$(clientDataEntity).load$(q, function (err, client) {
      if (err) {
        return response(null, {ok: false, why: err})
      }
      if (!client) {
        return response(null, {ok: false, why: 'Client not found'})
      }

      response(null, {ok: true, data: prepareClientForUI(client.data$(false))})
    })
  }

  function publicLoadClient (msg, response) {
    let clientName = msg.clientName

    let q = {name: clientName}

    this.make$(clientDataEntity).load$(q, function (err, client) {
      if (err) {
        return response(null, {ok: false, why: err})
      }
      if (!client) {
        return response(null, {ok: false, why: 'Cannot find specified client'})
      }

      response(null, {ok: true, data: prepareClientForUI(client.data$(false))})
    })
  }

  function publicUpdateClient (msg, response) {
    let clientData = msg.data

    prepareClientForDB(clientData)
    // first validate that this client is not configured
    // only a non-configured client is allowed to be configured using the public service - as part of initial configuration
    let clientId = clientData.id
    if (!clientId) {
      return response(null, {ok: false, why: 'Invalid client data'})
    }

    // load client from db to validate the access to this service
    this.make$(clientDataEntity).save$({id: clientId}, function (err, dbclient) {
      if (err) {
        return response(null, {ok: false, why: err})
      }

      if (!dbclient || dbclient.configured) {
        return response(null, {ok: false, why: 'Action not allowed.'})
      }
      this.make$(clientDataEntity, clientData).save$(function (err, client) {
        if (err) {
          return response(null, {ok: false, why: err})
        }
        response(null, {ok: true, data: client.data$(false)})
      })
    })
  }

  function prepareClientForDB (clientData) {
    let auth = {}
    if (clientData.authType) {
      if (_.isArray(clientData.authType)) {
        for (let i in clientData.authType) {
          auth[clientData.authType[i]] = true
        }
      }
      else {
        auth[clientData.authType] = true
      }
      clientData.authType = auth
    }

    return clientData
  }

  function prepareClientForUI (clientData) {
    let auth = []

    if (clientData.authType) {
      for (let i in clientData.authType) {
        auth.push(i)
      }
      clientData.authType = auth
    }

    return clientData
  }

  function upsertClient (msg, response) {
    let clientData = msg.data

    // @hack - until UI is fixed for this
    prepareClientForDB(clientData)

    // @hack - just for now until make sure all requests have an appkey
    if (clientData.id) {
      this.make$(clientDataEntity, clientData).save$(function (err, client) {
        if (err) {
          return response(null, {ok: false, why: err})
        }
        response(null, {ok: true, data: client.data$(false)})
      })
      return
    }

    this.make$(clientDataEntity).load$({appkey: clientData.appkey}, function (err, client) {
      if (err) {
        return response(null, {ok: false, why: err})
      }
      if (client) {
        return response(null, {ok: false, why: 'Client with same appkey already exists'})
      }
      this.make$(clientDataEntity, clientData).save$(function (err, client) {
        if (err) {
          return response(null, {ok: false, why: err})
        }
        response(null, {ok: true, data: prepareClientForUI(client.data$(false))})
      })
    })
  }

  function deleteClient (msg, response) {
    let clientId = msg.clientId

    let that = this

    // now delete client
    that.make$(clientDataEntity).remove$({id: clientId}, function (err) {
      if (err) {
        return response({ok: false, why: err})
      }
      response(null, {ok: true})
    })
  }

  function init (args, done) {
    seneca
      .add('role: concorda, cmd: listClients', listClients)
      .add('role: concorda, cmd: loadClient', loadClient)
      .add('role: concorda, cmd: publicGetClient', publicLoadClient)
      .add('role: concorda, cmd: publicUpdateClient', publicUpdateClient)
      .add('role: concorda, cmd: listClientsAlias', listClients)
      .add('role: concorda, cmd: createClient', upsertClient)
      .add('role: concorda, cmd: deleteClient', deleteClient)

    done()
  }

  seneca.add('init: ' + name, init)

  return {
    name: name
  }
}
