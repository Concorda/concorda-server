'use strict'

module.exports = function (options) {
  var seneca = this

  var name = 'concorda-core-redirect'

  function routeExternal (msg, response) {
    msg.role = 'concorda'
    seneca.act(msg, response)
  }

  function init (args, done) {
    // redirect externally all user commands
    seneca
      // user actions
      .add('role: concorda-communication', routeExternal)

    done()
  }

  seneca.add('init: ' + name, init)

  return {
    name: name
  }
}
