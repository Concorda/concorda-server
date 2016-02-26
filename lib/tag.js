'use strict'

// load related modules
module.exports = function (options) {
  var seneca = this

  var name = 'concorda-tag-api'

  function init (args, done) {
    seneca.act({
      role: 'web', use: {
        name: 'concorda',
        prefix: '/api',
        pin: {role: 'concorda', cmd: '*'},
        map: {
          listTags: {GET: true, alias: 'tag'},
          listTagsAlias: {GET: true, alias: 'tags'},
          setUserTags: {POST: true, PUT: true, alias: 'user/:userId/tag'}
        }
      }
    }, done)
  }

  seneca.add('init: ' + name, init)

  return {
    name: name
  }
}
