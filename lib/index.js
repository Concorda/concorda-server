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

var ConcordaDummyData = require('./impl/util/dummyData')

module.exports = function (options) {
  var seneca = this

  var name = 'concorda'
  var meshOptions = {
    auto: true
  }

  seneca.use('postgres-store', {
    "name": "concorda",
    "host": "localhost",
    "port": 5432,
    "username": "concorda",
    "password": "concorda",
    "options": { }
  })

  postgrator.setConfig({
    migrationDirectory: __dirname + '/../migrations',
    driver: 'pg', // or pg.js, mysql, mssql, tedious
    host: '127.0.0.1',
    database: 'concorda',
    username: 'concorda',
    password: 'concorda'
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
    var useLocalCore = false
    if (options.local === true || options.local === 'true') {
      useLocalCore = true
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
