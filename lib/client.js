'use strict'

module.exports = function (opts) {
  var seneca = this

  var options = {
    name: 'concorda-client-api'
  }

  function init (args, done) {
    seneca.act({
      role: 'web', use: {
        name: 'concorda',
        prefix: '/api/v1/admin',
        pin: {role: 'concorda', cmd: '*'},
        map: {
          listClients: {GET: true, auth: 'session', alias: 'client'},
          loadClient: {GET: true, auth: 'session', alias: 'client/:clientId'},
          listClientsAlias: {GET: true, auth: 'session', alias: 'clients'},
          createClient: {POST: true, PUT: true, auth: 'session', data: true, alias: 'client'},
          deleteClient: {DELETE: true, auth: 'session', alias: 'client/:clientId'},
          setUserClients: {POST: true, PUT: true, auth: 'session', alias: 'user/:userId/clients'}
        }
      }
    })

    done()
  }

  seneca.add('init: ' + options.name, init)

  return {
    name: options.name
  }
}
