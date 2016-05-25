'use strict'

// load related modules
module.exports = function (options) {
  var seneca = this

  var name = 'concorda-user-api'

  function init (args, done) {
    seneca.act({
      role: 'web', use: {
        name: 'concorda',
        prefix: '/api/v1/admin',
        pin: {role: 'concorda', cmd: '*'},
        map: {
          enableUser: {POST: true, alias: 'user/:user_id/enable'},
          disableUser: {POST: true, alias: 'user/:user_id/disable'},
          closeSession: {POST: true, alias: 'user/:user_id/session/close'},
          listUsers: {GET: true, alias: 'user'},
          loadUser: {GET: true, alias: 'user/:userId'},
          createUser: {POST: true, data: true, alias: 'user'},
          updateUser: {PUT: true, data: true, alias: 'user'},
          deleteUser: {DELETE: true, alias: 'user/:userId'},
          inviteUser: {POST: true, alias: 'invite/user'}
        }
      }
    })

    seneca.act({
      role: 'web', use: {
        name: 'concorda',
        prefix: '/api/v1',
        pin: {role: 'concorda', cmd: '*'},
        map: {
          validateEmail: {GET: true, alias: 'validate/:userId'}
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
