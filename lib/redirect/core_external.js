'use strict'

module.exports = function (options) {
  var seneca = this

  var name = 'concorda-core-redirect'

  function routeExternal (msg, response) {
    msg.role = 'concorda-communication'
    seneca.act(msg, response)
  }

  function init (args, done) {
    // redirect externally all user commands
    seneca
      // user actions
      .add('role: concorda, cmd: create_reset', routeExternal)
      .add('role: concorda, cmd: closeSession', routeExternal)
      .add('role: concorda, cmd: listUsers', routeExternal)
      .add('role: concorda, cmd: loadUser', routeExternal)
      .add('role: concorda, cmd: createUser', routeExternal)
      .add('role: concorda, cmd: updateUser', routeExternal)
      .add('role: concorda, cmd: deleteUser', routeExternal)
      .add('role: concorda, cmd: inviteUser', routeExternal)
    // client actions
      .add('role: concorda, cmd: listClients', routeExternal)
      .add('role: concorda, cmd: publicGetClient', routeExternal)
      .add('role: concorda, cmd: listClientsAlias', routeExternal)
      .add('role: concorda, cmd: createClient', routeExternal)
      .add('role: concorda, cmd: deleteClient', routeExternal)

      done()
  }

  seneca.add('init: ' + name, init)

  return {
    name: name
  }
}
