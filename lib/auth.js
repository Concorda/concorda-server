'use strict'

// external plugins
const Lodash = require('lodash')
const Auth = require('seneca-auth')
const AuthGoogle = require('seneca-google-auth')
const AuthTwitter = require('seneca-twitter-auth')
const AuthGithub = require('seneca-github-auth')

const AuthConfig = {
  restrict: '/api',
  //redirect: {
  //  login: {
  //    always: true,
  //    win: '/',
  //    fail: '/login'
  //  }
  //}
}

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

  seneca
    .use(Auth, AuthConfig)
    .use(AuthGoogle, options['google-auth'])
    .use(AuthTwitter, options['twitter-auth'])
    .use(AuthGithub, options['github-auth'])

   //this is for other apps using external login via redirect
  seneca
    .add('role: auth, cmd: loginTwitter', loginTwitter)
    .add('role: auth, cmd: loginGithub', loginGithub)
    .add('role: auth, cmd: loginGoogle', loginGoogle)

  seneca.add('init: ' + name, init)

  return {
    name: name
  }
}

