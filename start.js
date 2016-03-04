'use strict'

const Concorda = require('./lib/index')

var Hapi = require('hapi')
var Bell = require('bell')
var Chairo = require('chairo')
var Cookie = require('hapi-auth-cookie')

// Options for our hapi plugins.
var opts = {
  server: {
    port: process.env.PORT || 3070
  },
  chairo: {
    timeout: 2000,
    secure: true,
    log: 'level:info'
  }
}

// Log and end the process on err.
function endIfErr (err) {
  if (err) {
    console.error(err)
    process.exit(1)
  }
}

// Create our server.
var server = new Hapi.Server({ debug: { request: ['error'] } })
server.connection({port: opts.server.port})

// Declare our Hapi plugin list.
var plugins = [
  {register: Bell},
  {register: Cookie},
  {register: Chairo, options: opts.chairo}
]

// Register our plugins.
server.register(plugins, function (err) {
  endIfErr(err)

  server.seneca.use(Concorda, {local: true})

  // Kick off the server.
  server.start(function (err) {
    endIfErr(err)

    console.log('Listening at: ' + server.info.port)
  })
})
