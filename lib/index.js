'use strict'

// external plugins
const ExternalAuth = require('./auth')
const Mesh = require('seneca-mesh')

// load related modules
const ExternalCore = require('./redirect/core_external')
const InternalCore = require('./redirect/core_internal')
const ConcordaCore = require('./impl/concorda-core')

// services
const ConcordaClient = require('./client')
const ConcordaUser = require('./user')
const ConcordaTag = require('./tag')

var ConcordaDummyData = require('./impl/util/dummyData')

module.exports = function (options) {
  var seneca = this

  var name = 'concorda'
  var meshOptions = {
    auto: true
  }

  var useLocalCore = true
  if (
    (options.concorda && options.concorda) &&
    (options.concorda.external_core === true || options.concorda.external_core === 'true')
  ) {
    useLocalCore = false
  }

  seneca
    .use(ExternalAuth, options)

  if (useLocalCore) {
    seneca.log.info('Concorda', 'using local core implementation')
    seneca
      .use(InternalCore, options)
      .use(ConcordaCore, options)

    // add services to expose via mesh
    meshOptions.pin = ['role: user', 'role: concorda-communication']
  }
  else {
    seneca.log.info('Concorda', 'using external micro-service')
    seneca
      .use(ExternalCore, options)

    seneca.log.info('register as mesh client: ', meshOptions)
    seneca
      .use(Mesh, meshOptions)
  }

  seneca.ready(function () {
    seneca
      .use(ConcordaUser, options)
      .use(ConcordaTag, options)
      .use(ConcordaClient, options)

    if (useLocalCore) {
      seneca.ready(function () {
        seneca.log.info('register as mesh service provider: ', meshOptions)
        seneca
          .use(Mesh, meshOptions)
          .use(ConcordaDummyData)
      })
    }
  })

  return {
    name: name
  }
}
