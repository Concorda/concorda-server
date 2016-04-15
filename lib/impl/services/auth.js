'use strict'

const _ = require('lodash')

module.exports = function (options) {
  let seneca = this
  let name = 'concorda-auth-service'

  function validateClient (msg, response) {
    var appkey = msg.data ? msg.data.appkey : msg.appkey
    var that = this

    if (!appkey) {
      return response(null, {ok: false, why: 'All commands require identification appkey'})
    }

    seneca.act('role: concorda, cmd: loadClient', {appkey: appkey}, function (err, result) {
      if (err) {
        return response(null, {ok: false, why: err})
      }

      if (!result || !result.ok) {
        return response(null, {ok: false, why: 'Client with specified appkey not found. appkey: ' + appkey})
      }

      var client = result.data

      that.prior(msg, function (err, out) {
        if (err) {
          return response(err, out)
        }
        if (!out || !out.ok) {
          return response(err, {ok: false, why: 'Incorrect login information'})
        }

        var user = out.user

        if (!user) {
          return respondWithError({ok: false, why: 'Incorrect login information.'}, response)
        }

        if (user.validateEmail) {
          return respondWithError({
            ok: false,
            code: 1,
            why: 'Account is disabled. Please confirm your email to activate account.'
          }, response)
        }

        if (user.forcePwdChange) {
          return response(null, {
            ok: false,
            code: 2,
            why: 'You must change your password to be able to login.'
          }, response)
        }

        if (!user.clients) {
          return respondWithError({ok: false, why: 'User cannot login in this application: ' + client.name}, response)
        }

        if (_.findIndex(user.clients, function (o) {
            return o.id === client.id
          }) === -1) {
          return respondWithError({ok: false, why: 'User cannot login in this application: ' + client.name}, response)
        }
        response(err, out)
      })
    })

    function respondWithError (responseData, done) {
      that.act('role: auth, cmd: logout', function () {
        done(null, responseData)
      })
    }
  }

  function changePassword (msg, response) {
    var user = msg.req$.seneca.user
    var context = this

    context.make$('sys', 'user').load$({id: user.id}, function (err, user) {
      if (err || !user) {
        return response(null, {ok: false, why: 'Internal server error'})
      }

      context.act('role: auth, validate: password', user, function(err, response){
        if (err){
          return response(null, {ok: false, why: err})
        }
        if (!response.ok){
          return response(null, {ok: false, why: response.why})
        }

        user.forcePwdChange = false
        user.save$(function () {
          context.prior(msg, response)
        })
      })
    })
  }

  function validatePassword(user, done){
    var context = this
    context.act('role: concorda, cmd: loadSettings', function (err, response){
      if (err){
        return done(err)
      }
      if (!response.ok){
        return done(response.why)
      }

      let settings = response.data

      seneca.log.debug(`Validate password using settings: ${JSON.stringify(settings)}`)
      if (!user.password) {
        return done(null, {ok: false, why:'Password Required'})
      }
      if (!user.repeat) {
        return done(null, {ok: false, why:'Repeat password required'})
      }
      if (user.password !== user.repeat) {
        return done(null, {ok: false, why:'Confirm Password must match Password'})
      }
      if (user.password === user.email) {
        return done(null, {ok: false, why:'Cannot set password equal with email'})
      }

      if(user.password.length < settings.passwordPolicy.minLength) {
        return done(null, {ok: false, why:`Error: Password must contain at least ${settings.passwordPolicy.minLength} characters!`})
      }

      let re
      if (settings.passwordPolicy.requireNumeric) {
        re = /[0-9]/;
        if (!re.test(user.password)) {
          return done(null, {ok: false, why:"Error: password must contain at least one number (0-9)!"})
        }
      }

      if (settings.passwordPolicy.requireLowercase) {
        re = /[a-z]/;
        if (!re.test(user.password)) {
          return done(null, {ok: false, why:"Error: password must contain at least one lowercase letter (a-z)!"})
        }
      }

      if (settings.passwordPolicy.requireUppercase) {
        re = /[A-Z]/;
        if (!re.test(user.password)) {
          return done(null, {ok: false, why:"Error: password must contain at least one uppercase letter (A-Z)!"})
        }
      }
      return done()

    })
  }

  function identify_service_user (msg, respond) {
    if (!msg.user) {
      return respond(null, {ok: false, why: 'no-user'})
    }

    var user_data = msg.user

    var q = {}

    if (user_data.email) {
      q.email = user_data.email
    }
    else {
      return respond(null, {ok: false, why: 'no-identifier'})
    }

    seneca.act("role: 'user', get: 'user'", q, respond)
  }

  var prepareLoginData = function (args, cb) {
    var profile = args.profile

    var data = {}

    if (profile.emails && profile.emails.length > 0) {
      data.email = profile.emails[0].value
    }
    data.name = profile.displayName

    cb(null, data)
  }

  seneca
    .add('role: auth, cmd: login', validateClient)
    .add('role: auth, cmd: change_password', changePassword)
    .add('role: auth, identify: user', identify_service_user)
    .add('role: auth, validate: password', validatePassword)
    .add({role: 'auth', prepare: 'google_login_data'}, prepareLoginData)


  return {
    name: name
  }
}
