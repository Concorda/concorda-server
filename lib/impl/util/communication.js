'use strict'

module.exports = function (options) {
  var seneca = this

  var name = 'concorda-dummyData'

  setTimeout(function () {
    seneca.listen({
      pin: 'role:user, cmd:*',
      type: 'tcp',
      port: '3055'
    })

    seneca
      .use('mesh', {auto: true, pin: ['role: user', 'role: concorda-communication']})
  }, 3 * 1000)

  function init (args, done) {
    done()
  }

  seneca.add('init: ' + name, init)

  return {
    name: name
  }
}
