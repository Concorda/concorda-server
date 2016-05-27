'use strict'

module.exports = function (opts) {
  var seneca = this

  var options = {
    name: 'concorda-client-api'
  }

  let logMapping = {
    'post': {
      '/api/v1/admin/client': function (req, res) {
        let logData = {
          action_type: 'Create Client',
          status: res.ok || false,
          entity: res.data ? {name: res.data.name, id: res.data.id} : {name: req.payload.name}
        }
        this.act('role: concorda, cmd: addLog', {req: req, user: req.seneca.user, log: logData})
      }
    },
    'delete': {
      '/api/v1/admin/client/:clientId': function (req, res) {
        let logData = {
          action_type: 'Delete Client',
          status: res.ok || false,
          entity: res.data ? {name: res.data.name, id: res.data.id} : {}
        }
        this.act('role: concorda, cmd: addLog', {req: req, user: req.seneca.user, log: logData})
      }
    }
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
        },
        postmap: function (req, res, done) {
          let params = req.params || []

          let key = req.path

          for (let name in params) {
            if (params[name]) {
              key = key.replace(params[name], ':' + name)
            }
          }

          let fct = logMapping[req.method] ? logMapping[req.method][key] ? logMapping[req.method][key] : null : null
          if (fct) {
            fct.call(req.seneca, req, res, done)
          }

          done()
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
