'use strict'

const _ = require('lodash')
const Jsonic = require('jsonic')

module.exports = function (options) {
  let seneca = this

  let name = 'concorda-client'
  let clientDataEntity = 'client_data'

  function listClients (msg, response) {
    // pagination parameters - need UI support
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

      // count should be the count of all clients in DB not just current page length
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
    if (clientId) {
      q.id = clientId
    }
    if (appkey) {
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

  // @hack
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

  // @hack
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
    let context = this

    // @hack - until UI is fixed for this
    prepareClientForDB(clientData)

    // @hack - just for now until make sure all requests have an appkey
    if (clientData.id) {
      context.make$(clientDataEntity, clientData).save$(function (err, client) {
        if (err) {
          return response(null, {ok: false, why: err})
        }
        return response(null, {ok: true, data: client.data$(false)})
      })
    }
    else {
      context.make$(clientDataEntity).load$({appkey: clientData.appkey}, function (err, client) {
        if (err) {
          return response(null, {ok: false, why: err})
        }
        if (client) {
          return response(null, {ok: false, why: 'Client with same appkey already exists'})
        }
        context.make$(clientDataEntity, clientData).save$(function (err, client) {
          if (err) {
            return response(null, {ok: false, why: err})
          }
          return response(null, {ok: true, data: prepareClientForUI(client.data$(false))})
        })
      })
    }
  }

  function deleteClient (msg, response) {
    let clientId = msg.clientId
    let context = this

    if (!clientId) {
      return response({ok: false, why: 'Not a valid client'})
    }

    // now delete client
    // here I must check if there are users assigned to the client
    // and not allow this operation in this case ?
    context.make$(clientDataEntity).remove$({id: clientId}, function (err) {
      if (err) {
        return response({ok: false, why: err})
      }
      return response(null, {ok: true})
    })
  }

  function init (args, done) {
    seneca
      .add('role: concorda, cmd: listClients', listClients)
      .add('role: concorda, cmd: loadClient', loadClient)
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
