'use strict'

module.exports = function (opts) {
  var seneca = this

  var options = {
    name: 'concorda-settings-api'
  }

  let logMapping = {
    'post': {
      '/api/v1/admin/settings': function (req, res) {
        let logData = {
          action_type: 'Changed Settings',
          status: res.ok || false
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
          loadSettings: {GET: true, auth: 'session', alias: 'settings'},
          saveSettings: {POST: true, auth: 'session', PUT: true, data: true, alias: 'settings'}
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
