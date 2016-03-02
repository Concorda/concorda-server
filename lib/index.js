'use strict'

// load related modules
const ExternalAuth = require('./auth')
const ExternalCore = require('./redirect/core_external')
const InternalCore = require('./redirect/core_internal')
const ConcordaCore = require('./impl/concorda-core')

// services
const Client = require('./client')
const User = require('./user')
const Tag = require('./tag')

var ConcordaDummyData = require('./impl/util/dummyData')

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
        .use(ConcordaDummyData)
    }
    else {
      seneca
        .use(ExternalCore, options)
      seneca
        .use('mesh', {auto: true})
    }

    seneca.ready(function () {
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
