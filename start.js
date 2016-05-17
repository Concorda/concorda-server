'use strict'

let Server = require('./server')
let _ = require('lodash')

// load env config file
var DotEnv = require('dotenv')
DotEnv.config({path: './config/production.env'})

const LoadConfig = require('./config/config.js')
const Config = LoadConfig()

var opts = _.extend({
  server: {
    port: process.env.PORT || 3070
  },
  chairo: {
    timeout: 2000,
    secure: true,
    log: 'print'
  }
}, Config)

// Log and end the process on err.
function endIfErr (err) {
  if (err) {
    console.error(err)
    process.exit(1)
  }
}

// Create our server.
Server(opts, function (err, server) {
  endIfErr(err)
})
