'use strict'

// external plugins
var Lodash = require('lodash')
var Auth = require('seneca-auth')
var AuthGoogle = require('seneca-google-auth')
var AuthTwitter = require('seneca-twitter-auth')
var AuthGithub = require('seneca-github-auth')

module.exports = function (options) {
  var seneca = this

  var name = 'concorda-auth-api'

  function loginTwitter(args, done) {
    seneca.log.debug('Twitter login')

    var callback_url = Lodash.get(args, 'req$.auth.credentials.query.callback_url')
    seneca.log.debug('Callback: ', callback_url)
    this.prior(args, function (err, data) {
      if (callback_url) {
        data.http$ = data.http$ || {}
        data.http$.redirect = callback_url
      }
      done(err, data)
    })
  }

  function loginGithub(args, done) {
    seneca.log.debug('Github login')

    var callback_url = Lodash.get(args, 'req$.auth.credentials.query.callback_url')
    seneca.log.debug('Callback: ', callback_url)
    this.prior(args, function (err, data) {
      if (callback_url) {
        data.http$ = data.http$ || {}
        data.http$.redirect = callback_url
      }
      done(err, data)
    })
  }

  function loginGoogle(args, done) {
    seneca.log.debug('Google login')

    var callback_url = Lodash.get(args, 'req$.auth.credentials.query.callback_url')
    seneca.log.debug('Callback: ', callback_url)
    this.prior(args, function (err, data) {
      if (callback_url) {
        data.http$ = data.http$ || {}
        data.http$.redirect = callback_url
      }
      done(err, data)
    })
  }

  function init(args, done){
    seneca.use(Auth, {
      restrict: '/api',
      redirect: {
        login: {
          always: true,
          win: '/',
          fail: '/login'
        }
      }
    })

    // load external auth only after auth is fully loaded
    seneca.ready(function () {
      seneca.use(AuthGoogle, Config.googleLogin)

      seneca.use(AuthTwitter, Config.twitterLogin)

      seneca.use(AuthGithub, Config.githubLogin)

      seneca.ready(function () {
        // this is for other apps using Twitter login via redirect
        seneca.add('role: auth, cmd: loginTwitter', loginTwitter)

        // this is for other apps using Github login via redirect
        seneca.add('role: auth, cmd: loginGithub', loginGithub)

        // this is for other apps using Google login via redirect
        seneca.add('role: auth, cmd: loginGoogle', loginGoogle)
      })

      seneca.ready(done)
    })
  }

  seneca.add('init: ' + name, init)

  return {
    name: name
  }
}

