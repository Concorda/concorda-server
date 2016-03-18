'use strict'

// external plugins
const ExternalAuth = require('./auth')
const Mesh = require('seneca-mesh')
const Postgrator = require('postgrator')
const _ = require('lodash')

// load related modules
const ExternalCore = require('./redirect/core_external')
const InternalCore = require('./redirect/core_internal')
const ConcordaCore = require('./impl/concorda-core')

// services
const ConcordaClient = require('./client')
const ConcordaUser = require('./user')
const ConcordaGroup = require('./group')

const PostgresStore = require('seneca-postgres-store')

const ConcordaDummyData = require('./impl/util/dummyData')
const defaultOptions = {
  mesh: {
    active: process.env.USE_MESH || false,
    auto: true
  },
  transport: {
    active: process.env.USE_TRANSPORT || false,
    type: process.env.TRANSPORT_TYPE || 'tcp'
  }
}

module.exports = function (opts) {
  let seneca = this

  let name = 'concorda'

  const options = _.extend(
    {},
    defaultOptions,
    opts
  )

  seneca.use(PostgresStore, {
    name: process.env.DB_NAME || 'concorda',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    username: process.env.DB_USER || 'concorda',
    password: process.env.DB_PWD || 'concorda',
    options: {}
  })

  Postgrator.setConfig({
    migrationDirectory: __dirname + '/../migrations',
    driver: 'pg',
    host: process.env.DB_HOST || '127.0.0.1',
    database: process.env.DB_NAME || 'concorda',
    username: process.env.DB_USER || 'concorda',
    password: process.env.DB_PWD || 'concorda'
  })

  Postgrator.migrate('max', function (err, migrations) {
    if (err) {
      console.log(err)
    }
    else {
      console.log(migrations)
    }
    Postgrator.endConnection(function () {
      loadDependencies()
    })
  })

//  loadDependencies()
  function loadDependencies () {
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
      options.mesh.pin = ['role: user', 'role: concorda-communication']
    }
    else {
      seneca.log.info('Concorda', 'using external micro-service')
      seneca
        .use(ExternalCore, options)

      if (options.mesh.active) {
        seneca.log.info('register as mesh service for: ', options.mesh.pin)
        seneca
          .use(Mesh, options.mesh)
      }
      if (options.transport.active) {
        seneca.log.info('register as transport server for: ', options.transport.pin)
        seneca
          .listen(options.transport)
      }
    }

    seneca.ready(function () {
      seneca
        .use(ConcordaUser, options)
        .use(ConcordaGroup, options)
        .use(ConcordaClient, options)

      if (useLocalCore) {
        seneca.ready(function () {
          if (options.mesh.active === true || options.mesh.active === 'true') {
            seneca.log.info('register as mesh service for: ', options.mesh.pin)
            seneca
              .use(Mesh, options.mesh)
          }
          if (options.transport.active === true || options.transport.active === 'true') {
            seneca.log.info('register as transport server for: ', options.transport.pin)
            seneca
              .listen(options.transport)
          }

          seneca
            .use(ConcordaDummyData)
        })
      }
    })
  }

  return {
    name: name
  }
}
