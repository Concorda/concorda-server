'use strict'

// load related modules
const ExternalAuth = require('./auth')
const User = require('./user')
const ExternalCore = require('./redirect/core_external')
const InternalCore = require('./redirect/core_internal')
const Client = require('./client')
const ConcordaCore = require('concorda-core')

module.exports = function (options) {
  var seneca = this

  var name = 'concorda'

  function init (args, done) {
    if (options.local) {
      seneca
        .use(InternalCore, options)
      seneca
        .use(ConcordaCore, options)
    }
    else{
      seneca
        .use(ExternalCore, options)
    }

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
