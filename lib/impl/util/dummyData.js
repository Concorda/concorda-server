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
      }, function (err, client) {
        if (err) {
          // this tag was already added - this means that application was configured
          seneca.log.info('Found client, abort adding default data')
          return done()
        }

        console.log('Added default client')

        seneca.act('role: user, cmd: register', {
          name: 'Concorda Administrator',
          email: 'admin@concorda.com',
          password: 'concorda',
          repeat: 'concorda',
          emailValidated: true,
          forcePwdChange: false
        }, function (err, data) {
          if (err || !data.ok) {
            seneca.log.info('Found default user, abort adding default data')
            return done()
          }
          console.log('Added default user', data)

          seneca.act('role: concorda, cmd: setUserClients', {clients: [client.data.id], userId: data.user.id}, function (err, data) {
            if (err || !data.ok) {
              seneca.log.info('Error adding client to user', err, data)
              return done()
            }
            console.log('Added default application Concorda to default user')
            done()
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
