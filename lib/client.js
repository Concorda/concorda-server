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
        prefix: '/api/v1',
        pin: {role: 'concorda', cmd: '*'},
        map: {
          listClients: {GET: true, alias: 'client'},
          loadClient: {GET: true, alias: 'client/:clientId'},
          listClientsAlias: {GET: true, alias: 'clients'},
          createClient: {POST: true, PUT: true, data: true, alias: 'client'},
          deleteClient: {DELETE: true, alias: 'client/:clientId'},
          setUserClients: {POST: true, PUT: true, alias: 'user/:userId/clients'}
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
