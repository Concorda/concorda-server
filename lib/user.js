'use strict'

// load related modules
module.exports = function (options) {
  var seneca = this

  var name = 'concorda-user-api'

  function init (args, done) {
    seneca.act({
      role: 'web', use: {
        name: 'concorda',
        prefix: '/api',
        pin: {role: 'concorda', cmd: '*'},
        map: {
          closeSession: {POST: true, alias: 'user/:user_id/session/close'},
          listUsers: {GET: true, alias: 'user'},
          loadUser: {GET: true, alias: 'user/:userId'},
          createUser: {POST: true, data: true, alias: 'user'},
          updateUser: {PUT: true, data: true, alias: 'user'},
          deleteUser: {DELETE: true, alias: 'user/:userId'},
          inviteUser: {POST: true, alias: 'invite/user'}
        }
      }
    }, done)
  }

  seneca.add('init: ' + name, init)

  return {
    name: name
  }
}
