'use strict'

// external plugins
const Auth = require('./auth')
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

  function run () {
    if (
      (options.concorda && options.concorda) &&
      (options.concorda.external_core === true || options.concorda.external_core === 'true')
    ) {
      seneca.log.debug('Using external core implementation')
      useLocalCore = false

      // skip loading DB store as it will use an external concorda core
      loadDependencies()
    }
    else {
      seneca.log.info('Using local core implementation')

      // load db as is using the internal core implementation
      loadDBInstance()
    }
  }

  function loadDBInstance () {
    seneca.use(PostgresStore, {
      name: opts.db_name || process.env.DB_NAME || 'concorda',
      host: opts.db_host || process.env.DB_HOST || 'localhost',
      port: opts.db_port || process.env.DB_PORT || 5432,
      username: opts.db_user || process.env.DB_USER || 'concorda',
      password: opts.db_pwd || process.env.DB_PWD || 'concorda',
      options: {}
    })

    Postgrator.setConfig({
      migrationDirectory: __dirname + '/../migrations',
      driver: 'pg',
      database: opts.db_name || process.env.DB_NAME || 'concorda',
      host: opts.db_host || process.env.DB_HOST || '127.0.0.1',
      port: opts.db_port || process.env.DB_PORT || 5432,
      username: opts.db_user || process.env.DB_USER || 'concorda',
      password: opts.db_pwd || process.env.DB_PWD || 'concorda'
    })

    Postgrator.migrate('max', function (err, migrations) {
      if (err) {
        console.log(err)
        process.exit(1)
      }
      else {
        seneca.log.debug(migrations)
      }
      Postgrator.endConnection(function () {
        loadDependencies()
      })
    })
  }

  function loadDependencies () {
    seneca
      .use(Auth, options)

    // we need to make sure auth is fully loaded because we are overwriting some of its patterns
    seneca.ready(function () {
      if (useLocalCore) {
        // load all local core services
        seneca.log.info('Concorda using local core implementation')

        // add services to expose via mesh if required
        options.mesh.pin = ['role: user', 'role: concorda-communication', 'role: concorda-communication-user']

        seneca
          // redirect all routes to internal core
          .use(InternalCore, options)
          // load Concorda core
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
        seneca.log.info('Concorda using external micro-service')

        seneca
          .use(ExternalCore, options)

        configureTransport()

        seneca.ready(function () {
          // register services endpoints only after all seneca actions are registered
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
      // load mesh if active
      if (options.mesh.active === true || options.mesh.active === 'true') {
        seneca.log.info(`Register as mesh service for: ${JSON.stringify(options.mesh)}`)
        seneca
          .use(Mesh, options.mesh)
      }

      // load transport if active
      if (options.transport.active === true || options.transport.active === 'true') {
        if (useLocalCore) {
          // load as server
          seneca.log.info(`Register as transport server for: ${JSON.stringify(options.transport)}`)
          seneca
            .listen(options.transport)
        }
        else {
          // load as client
          seneca.log.info(`Register as transport client for: ${JSON.stringify(options.transport)}`)
          seneca
            .client(options.transport)
        }
      }
    }
  }

  // load all
  run()

  return {
    name: name
  }
}
