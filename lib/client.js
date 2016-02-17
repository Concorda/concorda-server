'use strict'

const _ = require('lodash')
var Jsonic = require('jsonic')

module.exports = function (opts) {
  var seneca = this

  var options = {
    name: 'concorda-client-api'
  }

  function init (args, done) {
    seneca.act({
      role: 'web', use: {
        name: 'concorda-client',
        prefix: '/api',
        pin: {role: 'concorda-client', cmd: '*'},
        map: {
          listClients: {GET: true, alias: 'client'},
          listClientsAlias: {GET: true, alias: 'clients'},
          loadClientSettings: {GET: true, alias: 'client/:clientId/settings'},
          createClient: {POST: true, PUT: true, data: true, alias: 'client'},
          deleteClient: {DELETE: true, alias: 'client/{clientId}'}
        }
      }
    }, done)
  }

  seneca.add('init: ' + options.name, init)

  return {
    name: options.name
  }
}
