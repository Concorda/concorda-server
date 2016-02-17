'use strict'

// load related modules
const ExternalAuth = require('./auth')
const User = require('./user')
const Client = require('./client')

module.exports = function (options) {
  var seneca = this

  var name = 'concorda-api'

  function init (args, done) {
    seneca.use(ExternalAuth)
    seneca.use(User)
    seneca.use(Client)

    seneca.ready(done)
  }

  seneca.add('init: ' + name, init)

  return {
    name: name
  }
}
