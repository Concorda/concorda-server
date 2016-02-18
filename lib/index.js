'use strict'

// load related modules
const ExternalAuth = require('./auth')
const User = require('./user')
const Client = require('./client')
const ConcordaCore = require('concorda-core')

module.exports = function (options) {
  var seneca = this

  var name = 'concorda-api'

  function init (args, done) {
    seneca
      .use(ConcordaCore, options)

    setTimeout(function() {
      seneca
        .use(User, options)
        .use(ExternalAuth, options)
        .use(Client, options)
    }, 3 * 1000)

    done()
  }

  seneca.add('init: ' + name, init)

  return {
    name: name
  }
}
