'use strict'

module.exports = function (options) {
  var seneca = this

  var name = 'concorda-core-redirect'

  function routeExternal (msg, response) {
    msg.role = 'concorda-communication'
    seneca.act(msg, response)
  }

  function routeExternalAuth (msg, response) {
    msg.role = 'concorda-communication-auth'
    seneca.act(msg, response)
  }

  function init (args, done) {
    // redirect externally all user commands
    seneca
      // settings actions
      .add('role: concorda, cmd: publicLoadSettings', routeExternal)
      .add('role: concorda, cmd: publicSaveSettings', routeExternal)
      .add('role: concorda, cmd: loadSettings', routeExternal)
      .add('role: concorda, cmd: saveSettings', routeExternal)
      // group actions
      .add('role: concorda, cmd: listGroups', routeExternal)
      .add('role: concorda, cmd: listGroupsAlias', routeExternal)
      .add('role: concorda, cmd: setUserGroups', routeExternal)
      // user actions
      .add('role: auth, cmd: create_reset', routeExternalAuth)
      .add('role: auth, cmd: create_reset', routeExternalAuth)

      .add('role: concorda, cmd: closeSession', routeExternal)
      .add('role: concorda, cmd: listUsers', routeExternal)
      .add('role: concorda, cmd: loadUser', routeExternal)
      .add('role: concorda, cmd: createUser', routeExternal)
      .add('role: concorda, cmd: updateUser', routeExternal)
      .add('role: concorda, cmd: deleteUser', routeExternal)
      .add('role: concorda, cmd: inviteUser', routeExternal)
      // client actions
      .add('role: concorda, cmd: setUserClients', routeExternal)
      .add('role: concorda, cmd: listClients', routeExternal)
      .add('role: concorda, cmd: loadClient', routeExternal)
      .add('role: concorda, cmd: listClientsAlias', routeExternal)
      .add('role: concorda, cmd: createClient', routeExternal)
      .add('role: concorda, cmd: deleteClient', routeExternal)
      .add('role: concorda, cmd: validateEmail', routeExternal)

    done()
  }

  seneca.add('init: ' + name, init)

  return {
    name: name
  }
}
