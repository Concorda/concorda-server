'use strict'

module.exports = function (options) {
  var seneca = this

  var name = 'concorda-core-redirect'

  function routeExternal (msg, response) {
    msg.role = 'concorda'
    seneca.act(msg, response)
  }

  function routeAuthExternal (msg, response) {
    msg.role = 'auth'
    seneca.act(msg, response)
  }

  function getInfo (msg, response) {
    return response(null, {version: 'TBD'})
  }

  function init (args, done) {
    // redirect externally all user commands
    seneca
      // user actions
      .add('role: concorda-communication, cmd: create_reset', routeAuthExternal)
      .add('role: concorda-communication', routeExternal)
      .add('role: concorda-communication, cmd: getInfo', getInfo)

    done()
  }

  seneca.add('init: ' + name, init)

  return {
    name: name
  }
}
