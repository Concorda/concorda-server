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
const ConcordaSettings = require('./settings')
const ConcordaClient = require('./client')
const ConcordaUser = require('./user')
const ConcordaGroup = require('./group')

const PostgresStore = require('seneca-postgres-store')

const ConcordaDummyData = require('./impl/util/dummyData')

module.exports = function (opts) {
  let name = 'concorda'
  let seneca = this
  let useLocalCore = true

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

  const options = _.extend(
    {},
    defaultOptions,
    opts
  )

  seneca.log.info('Using configuration (concorda): ', JSON.stringify(options))

  run()

  function loadDBInstance () {
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
        process.exit(1)
      }
      else {
        console.log(migrations)
      }
      Postgrator.endConnection(function () {
        loadDependencies()
      })
    })
  }

  function run () {
    if (
      (options.concorda && options.concorda) &&
      (options.concorda.external_core === true || options.concorda.external_core === 'true')
    ) {
      seneca.log.debug('Using external core implementation')
      useLocalCore = false
    }
    else {
      seneca.log.debug('Using local core implementation')
      loadDBInstance()
    }
  }

  function loadDependencies () {
    seneca
      .use(ExternalAuth, options)
    // we need to make sure auth is fully loaded because we are overwriting some of its patterns
    seneca.ready(function () {
      if (useLocalCore) {
        // load all for local core services

        seneca.log.info('Concorda', 'using local core implementation')

        // add services to expose via mesh
        options.mesh.pin = ['role: user', 'role: concorda-communication', 'role: concorda-communication-user']

        seneca
          .use(InternalCore, options)
          .use(ConcordaCore, options)

        seneca.ready(function () {
          // register services endpoints
          registerConcordaServicesEndpoints()

          seneca.ready(function () {
            configureTransport()

            seneca
              .use(ConcordaDummyData)
          })
        })
      }
      else {
        // load all for external core services

        seneca.log.info('Concorda', 'using external micro-service')
        seneca
          .use(ExternalCore, options)

        configureTransport()

        seneca.ready(function () {
          // register services endpoints
          registerConcordaServicesEndpoints()
        })
      }
    })

    function registerConcordaServicesEndpoints () {
      seneca
        .use(ConcordaUser, options)
        .use(ConcordaGroup, options)
        .use(ConcordaClient, options)
        .use(ConcordaSettings, options)
    }

    // Load configured transport
    function configureTransport () {
      if (options.mesh.active === true || options.mesh.active === 'true') {
        seneca.log.info(`Register as mesh service for: ${JSON.stringify(options.mesh)}`)
        seneca
          .use(Mesh, options.mesh)
      }
      if (options.transport.active === true || options.transport.active === 'true') {
        if (useLocalCore) {
          seneca.log.info(`Register as transport server for: ${JSON.stringify(options.transport)}`)
          seneca
            .listen(options.transport)
        }
        else {
          seneca.log.info(`Register as transport client for: ${JSON.stringify(options.transport)}`)
          seneca
            .client(options.transport)
        }
      }
    }
  }

  return {
    name: name
  }
}
