'use strict'

module.exports = function (options) {
  var seneca = this

  var name = 'concorda-dummyData'

  function init (args, done) {
    seneca.act('role: concorda, cmd: createClient', {data: {name: 'Concorda', configured: false, appkey: 'concorda'}}, function (err, res) {
      if (err) {
        // this tag was already added - this means that application was configured
        return done()
      }

      seneca.act('role: concorda, cmd: addTag', {data: {name: 'Concorda'}}, function (err, res) {
        if (err || !res.ok) {
          // this tag was already added - this means that application was configured
          return done()
        }
        var tag = res.data

        seneca.act('role: user, cmd: register', {
          name: 'Concorda Administrator',
          email: 'admin@concorda.com',
          password: 'concorda'
        }, function (err, user) {
          if (err) {
            // this tag was already added - this means that application was configured
            return done()
          }
          seneca.act('role: concorda, cmd: setUserTags', {tag: [tag.id], userId: user.user.id}, done)
        })
      })
    })
  }

  seneca.add('init: ' + name, init)

  return {
    name: name
  }
}
