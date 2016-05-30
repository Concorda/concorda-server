'use strict'

// load related modules
module.exports = function (options) {
  var seneca = this

  var name = 'concorda-logs-api'

  function init (args, done) {
    seneca.act({
      role: 'web', use: {
        name: 'concorda',
        prefix: '/api/v1/admin',
        pin: {role: 'concorda', cmd: '*'},
        map: {
          listLogs: {GET: true, auth: 'session', alias: 'logs'}
        }
      }
    })

    done()
  }


  seneca.add('init: ' + name, init)

  return {
    name: name
  }
}
