'use strict'

const Concorda = require('./lib/index')

var Hapi = require('hapi')
var Bell = require('bell')
var Chairo = require('chairo')
var Cookie = require('hapi-auth-cookie')

module.exports = function (options, done) {

  // Create our server.
  var server = new Hapi.Server({debug: {request: ['error']}})
  server.connection({port: options.server.port})

  // Declare our Hapi plugin list.
  var plugins = [
    {register: Bell},
    {register: Cookie},
    {register: Chairo, options: options.chairo}
  ]

  // Register our plugins.
  server.register(plugins, function (err) {
    if (err) {
      return done(err)
    }

    server.seneca.use(Concorda, options)

    // Kick off the server.
    server.start(function (err) {
      if (err) {
        return done(err)
      }

      server.seneca.log.debug('Listening at: ' + server.info.port)
      done(err, server)
    })
  })
}
