const Chairo = require('chairo')
const Hapi = require('hapi')
const Bell = require('bell')
const Hapi_Cookie = require('hapi-auth-cookie')

const InternalCore = require('../lib/redirect/core_internal')
const ConcordaCore = require('../lib/impl/concorda-core')

// services
const Client = require('../lib/client')
const User = require('../lib/user')
const Tag = require('../lib/tag')

const ExternalAuth = require('../lib/auth')

exports.init = function (options, done) {
  var server = new Hapi.Server()
  server.connection()

  server.register([
    Hapi_Cookie,
    Bell, {
      register: Chairo,
      options: {
        web: true,
        log: 'silent'
      }
    }
  ], function (err) {
    if (err) {
      return done(err)
    }

    var si = server.seneca

    si
      .use(ExternalAuth, options)
      .use(InternalCore, options)
      .use(ConcordaCore, options)

    si.ready(function () {
      si
        .use(User, options)
        .use(Tag, options)
        .use(Client, options)

      si.ready(function () {
        done(null, server)
      })
    })
  })
}

exports.checkCookie = function (res) {
  var cookie = res.headers['set-cookie'][0]
  cookie = cookie.match(/(?:[^\x00-\x20\(\)<>@\,;\:\\"\/\[\]\?\=\{\}\x7F]+)\s*=\s*(?:([^\x00-\x20\"\,\;\\\x7F]*))/)[1]
  return cookie
}
