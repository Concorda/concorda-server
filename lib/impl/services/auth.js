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

      user.forcePwdChange = false
      user.save$(function () {
        context.prior(msg, response)
      })
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
    .add({role: 'auth', prepare: 'google_login_data'}, prepareLoginData)


  return {
    name: name
  }
}
