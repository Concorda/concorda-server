'use strict'

// external plugins
const ExternalAuth = require('./auth')
const Mesh = require('seneca-mesh')
var postgrator = require('postgrator')

// load related modules
const ExternalCore = require('./redirect/core_external')
const InternalCore = require('./redirect/core_internal')
const ConcordaCore = require('./impl/concorda-core')

// services
const ConcordaClient = require('./client')
const ConcordaUser = require('./user')
const ConcordaTag = require('./tag')

const PostgresStore = require('seneca-postgres-store')

var ConcordaDummyData = require('./impl/util/dummyData')

module.exports = function (options) {
  var seneca = this

  var name = 'concorda'
  var meshOptions = {
    auto: true
  }

  seneca.use(PostgresStore, {
    "name": process.env.DB_NAME || "concorda",
    "host": process.env.DB_HOST || "localhost",
    "port": process.env.DB_PORT || 5432,
    "username": process.env.DB_USER || "concorda",
    "password": process.env.DB_PWD || "concorda",
    "options": { }
  })

  postgrator.setConfig({
    migrationDirectory: __dirname + '/../migrations',
    driver: 'pg', // or pg.js, mysql, mssql, tedious
    host: process.env.DB_HOST || '127.0.0.1',
    database: process.env.DB_NAME || 'concorda',
    username: process.env.DB_USER || 'concorda',
    password: process.env.DB_PWD || 'concorda'
  });

  postgrator.migrate('max', function (err, migrations) {
    if (err) {
      console.log(err)
    }
    else {
      console.log(migrations)
    }
    postgrator.endConnection(function () {
      loadDependencies()
    })
  })

//  loadDependencies()
  function loadDependencies(){
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
  }

  return {
    name: name
  }
}
