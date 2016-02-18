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
      .add('role: auth, cmd: create_reset', routeExternal)
      .add('role: concorda-communication, cmd: closeSession', routeExternal)
      .add('role: concorda-communication, cmd: listUsers', routeExternal)
      .add('role: concorda-communication, cmd: loadUser', routeExternal)
      .add('role: concorda-communication, cmd: createUser', routeExternal)
      .add('role: concorda-communication, cmd: updateUser', routeExternal)
      .add('role: concorda-communication, cmd: deleteUser', routeExternal)
      .add('role: concorda-communication, cmd: inviteUser', routeExternal)

    done()
  }

  seneca.add('init: ' + name, init)

  return {
    name: name
  }
}
