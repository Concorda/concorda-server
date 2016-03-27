'use strict'

// load related modules
module.exports = function (options) {
  var seneca = this

  var name = 'concorda-group-api'

  function init (args, done) {
    seneca.act({
      role: 'web', use: {
        name: 'concorda',
        prefix: '/api',
        pin: {role: 'concorda', cmd: '*'},
        map: {
          listGroups: {GET: true, alias: 'group'},
          listGroupsAlias: {GET: true, alias: 'groups'},
          setUserGroups: {POST: true, PUT: true, alias: 'user/:userId/groups'}
        }
      }
    }, done)
  }

  seneca.add('init: ' + name, init)

  return {
    name: name
  }
}
