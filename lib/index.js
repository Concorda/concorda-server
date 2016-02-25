'use strict'

// load related modules
const ExternalAuth = require('./auth')
const ExternalCore = require('./redirect/core_external')
const InternalCore = require('./redirect/core_internal')
const ConcordaCore = require('concorda-core')

// services
const Client = require('./client')
const User = require('./user')
const Tag = require('./tag')


module.exports = function (options) {
  var seneca = this

  var name = 'concorda'

  function init (args, done) {
    seneca
      .use(ExternalAuth, options)


    if (options.local) {
      seneca
        .use(InternalCore, options)
        .use(ConcordaCore, options)
    }
    else{
      seneca
        .use(ExternalCore, options)
      seneca
        .use('mesh', {auto: true})
    }

    seneca.ready(function(){
      seneca
        .use(User, options)
        .use(Tag, options)
        .use(Client, options)
    })

    done()
  }

  seneca.add('init: ' + name, init)

  return {
    name: name
  }
}
