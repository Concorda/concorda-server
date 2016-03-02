'use strict'

var Lodash = require('lodash')


module.exports = function (options) {
  var seneca = this

  var name = 'concorda-dummyData'

  function init (args, done) {
    // Dummy data, to be removed
    Lodash.each([
      {name: 'John Davids', email: 'john@vidi.com', password: 'pass'},
      {name: 'Jane Holten', email: 'jane@vidi.com', password: 'pass'},
      {name: 'Jenn Styles', email: 'jenn@concorda.com', password: 'pass'},
      {name: 'Mick Savage', email: 'mick@concorda.com', password: 'pass'}
    ], (user) => {
      seneca.act({role: 'user', cmd: 'register'}, user)
    })

    seneca.act('role: user, cmd: register', {name: 'John Davids', email: 'admin@concorda.com', password: 'concorda'}, function (err, user) {
      if (err) {
        seneca.log.error('Error while registering client', err)
      }
      seneca.make$('client', 'data').save$({name: 'Concorda', configured: false}, function (err) {
        if (err) {
          seneca.log.error('Error while loading client', err)
        }
        seneca.act('role: concorda, cmd: addTag', {data: {name: 'Vidi'}})
        seneca.act('role: concorda, cmd: addTag', {data: {name: 'Admin'}})

        seneca.act('role: concorda, cmd: addTag', {data: {name: 'Concorda'}}, function (err, tag) {
          if (err) {
            seneca.log.error('Error while saving tag', err)
          }
          seneca.act('role: concorda, cmd: setUserTags', {tag: [tag.data.id], userId: user.user.id}, done)
        })
      })
    })
  }

  seneca.add('init: ' + name, init)

  return {
    name: name
  }
}
