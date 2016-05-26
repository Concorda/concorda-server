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
          enableUser: {POST: true, auth: 'session', alias: 'user/:user_id/enable'},
          disableUser: {POST: true, auth: 'session', alias: 'user/:user_id/disable'},
          closeSession: {POST: true, auth: 'session', alias: 'user/:user_id/session/close'},
          listUsers: {GET: true, auth: 'session', alias: 'user'},
          loadUser: {GET: true, auth: 'session', alias: 'user/:userId'},
          createUser: {POST: true, auth: 'session', data: true, alias: 'user'},
          updateUser: {PUT: true, auth: 'session', data: true, alias: 'user'},
          deleteUser: {DELETE: true, auth: 'session', alias: 'user/:userId'},
          inviteUser: {POST: true, auth: 'session', alias: 'invite/user'}
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
