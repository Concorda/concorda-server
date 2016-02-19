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
        prefix: '/api',
        pin: {role: 'concorda', cmd: '*'},
        map: {
          listClients: {GET: true, alias: 'client'},
          listClientsAlias: {GET: true, alias: 'clients'},
          createClient: {POST: true, PUT: true, data: true, alias: 'client'},
          deleteClient: {DELETE: true, alias: 'client/{clientId}'}
        }
      }
    })

    seneca.act({
      role: 'web', use: {
        name: 'concorda',
        prefix: '',
        pin: {role: 'concorda', cmd: '*'},
        map: {
          publicGetClient: {GET: true, alias: 'client/:clientName'},
          publicUpdateClient: {PUT: true, data: true, alias: 'client'}
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