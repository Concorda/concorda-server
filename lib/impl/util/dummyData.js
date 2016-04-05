'use strict'

module.exports = function (options) {
  var seneca = this

  var name = 'concorda-dummyData'

  function init (args, done) {
    seneca.act('role: concorda, cmd: loadSettings', function (err, res) {
      if (err) {
        return done()
      }

      seneca.act('role: concorda, cmd: createClient', {
        data: {
          name: 'Concorda',
          appkey: 'concorda'
        }
      }, function (err, res) {
        if (err) {
          // this tag was already added - this means that application was configured
          seneca.log.info('Found client, abort adding default data')
          return done()
        }

        seneca.act('role: concorda, cmd: addGroup', {data: {name: 'Default'}}, function (err, res) {
          if (err || !res.ok) {
            // this tag was already added - this means that application was configured
            seneca.log.info('Found group, abort adding default data')
            return done()
          }
          var group = res.data

          seneca.act('role: user, cmd: register', {
            name: 'Concorda Administrator',
            email: 'admin@concorda.com',
            password: 'concorda',
            appkey: 'concorda'
          }, function (err, data) {
            if (err) {
              // this tag was already added - this means that application was configured
              seneca.log.info('Found default user, abort adding default data')
              return done()
            }

            seneca.act('role: concorda, cmd: setUserGroups', {groups: [group.id], userId: data.user.id}, done)
          })
        })
      })
    })
  }

  seneca.add('init: ' + name, init)

  return {
    name: name
  }
}
