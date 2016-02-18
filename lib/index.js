'use strict'

// load related modules
const ExternalAuth = require('./auth')
const User = require('./user')
const Client = require('./client')

module.exports = function (options) {
  var seneca = this

  var name = 'concorda-api'

  function init (args, done) {
    seneca
      .use(User, options)
      .use(ExternalAuth, options)
      .use(Client, options)

    done()
  }

  seneca.add('init: ' + name, init)

  return {
    name: name
  }
}
