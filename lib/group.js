'use strict'

// load related modules
module.exports = function (options) {
  var seneca = this

  var name = 'concorda-group-api'

  function init (args, done) {
    seneca.act({
      role: 'web', use: {
        name: 'concorda',
        prefix: '/api/v1/admin',
        pin: {role: 'concorda', cmd: '*'},
        map: {
          listGroups: {GET: true, auth: 'session', alias: 'group'},
          listGroupsAlias: {GET: true, auth: 'session', alias: 'groups'},
          setUserGroups: {POST: true, PUT: true, auth: 'session', alias: 'user/:userId/groups'}
        }
      }
    }, done)
  }

  seneca.add('init: ' + name, init)

  return {
    name: name
  }
}
