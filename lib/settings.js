'use strict'

module.exports = function (opts) {
  var seneca = this

  var options = {
    name: 'concorda-settings-api'
  }

  function init (args, done) {
    seneca.act({
      role: 'web', use: {
        name: 'concorda',
        prefix: '/api/v1/admin',
        pin: {role: 'concorda', cmd: '*'},
        map: {
          loadSettings: {GET: true, alias: 'settings'},
          saveSettings: {POST: true, PUT: true, data: true, alias: 'settings'}
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
