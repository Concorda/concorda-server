'use strict'

const Server = require('../server')
const Async = require('async')

let dbColumns = [
  'sys_account',
  'sys_entity',
  'sys_group',
  'sys_login',
  'sys_reset',
  'sys_user',
  'client_token',
  'client_data',
  'logging'
]

exports.init = function (options, done) {
  Server({
    server: {
      port: 3070
    },
    db_name: 'concordatest'
  }, function (err, server) {
    if (err) {
      console.log('Error preparing Hapi: ', err)
    }
    setTimeout(function () {
      done(err, server)
    }, 5 * 1000)
  })
}

exports.after = function (seneca, done) {
  seneca.make$().native$(function (err, client) {
    if (err || !client) {
      return done('Cannot clean db when tests are finished.')
    }

    Async.eachSeries(dbColumns, function truncateTables (tableName, cb) {
      client.query(`TRUNCATE ${tableName} CASCADE`, cb)
    },
    function (err) {
      if (err) {
        return done('Cannot clean db when tests are finished.')
      }

      seneca.close()
      done()
    })
  })
}

exports.checkCookie = function (res) {
  var cookie = res.headers['set-cookie'][0]
  cookie = cookie.match(/(?:[^\x00-\x20\(\)<>@\,;\:\\"\/\[\]\?\=\{\}\x7F]+)\s*=\s*(?:([^\x00-\x20\"\,\;\\\x7F]*))/)[1]
  return cookie
}
