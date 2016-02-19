'use strict'

// load related modules
const ExternalAuth = require('./auth')
const ExternalCore = require('./redirect/core_external')
const InternalCore = require('./redirect/core_internal')
const ConcordaCore = require('concorda-core')

// services
const Client = require('./client')
const User = require('./user')


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
      seneca
        .use('mesh', {auto: true})
    }

    setTimeout(function() {
      seneca
        .use(ExternalAuth, options)
        .use(User, options)
        .use(Client, options)
    }, 3 * 1000)

    done()
  }

  seneca.add('init: ' + name, init)

  return {
    name: name
  }
}
