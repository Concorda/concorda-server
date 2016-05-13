'use strict'

// external plugins
const _ = require('lodash')
const Auth = require('seneca-auth')
const AuthGoogle = require('seneca-google-auth')
// const AuthTwitter = require('seneca-twitter-auth')
// const AuthGithub = require('seneca-github-auth')

const DefaultAuthConfig = {
  auth: {
    restrict: '/api',
    redirect: {
      login: {
        always: true,
        win: '/',
        fail: '/login'
      }
    },
    prefix: '',
    urlpath: {
      login: '/api/v1/auth/login',
      user: '/api/v1/auth/user'
    }
  }
}

module.exports = function (opts) {
  var seneca = this

  const options = _.extend(
    {},
    DefaultAuthConfig,
    opts
  )

  var name = 'concorda-auth-api'
/*
  function loginTwitter (args, done) {
    seneca.log.debug('Twitter login')

    var callback_url = _.get(args, 'req$.auth.credentials.query.callback_url')
    seneca.log.debug('Callback: ', callback_url)
    this.prior(args, function (err, data) {
      if (callback_url) {
        data.http$ = data.http$ || {}
        data.http$.redirect = callback_url
      }
      done(err, data)
    })
  }

  function loginGithub (args, done) {
    seneca.log.debug('Github login')

    var callback_url = _.get(args, 'req$.auth.credentials.query.callback_url')
    seneca.log.debug('Callback: ', callback_url)
    this.prior(args, function (err, data) {
      if (callback_url) {
        data.http$ = data.http$ || {}
        data.http$.redirect = callback_url
      }
      done(err, data)
    })
  }

  function loginGoogle (args, done) {
    seneca.log.debug('Google login')

    var callback_url = _.get(args, 'req$.auth.credentials.query.callback_url')
    seneca.log.debug('Callback: ', callback_url)
    this.prior(args, function (err, data) {
      if (callback_url) {
        data.http$ = data.http$ || {}
        data.http$.redirect = callback_url
      }
      done(err, data)
    })
  }
*/
  seneca
    .use(Auth, options.auth)
    .use(AuthGoogle, options['google-auth'])
/*    .use(AuthTwitter)
    .use(AuthGithub)

  seneca
    .add('role: auth, cmd: loginTwitter', loginTwitter)
    .add('role: auth, cmd: loginGithub', loginGithub)
    .add('role: auth, cmd: loginGoogle', loginGoogle)
*/
  return {
    name: name
  }
}

