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
          user: {
            email: req.seneca.user.email,
            id: req.seneca.user.id,
            name: req.seneca.user.name,
          },
          action: 'Create Client',
          status: res.ok || false,
          entity: res.data ? {name: res.data.name, id: res.data.id} : {name: req.payload.name}
        }
        // here I will call the logging action
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
          let fct = logMapping[req.method] ? logMapping[req.method][req.path] ? logMapping[req.method][req.path].fct : null : null
          console.log(fct, req.method, req.path)
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
