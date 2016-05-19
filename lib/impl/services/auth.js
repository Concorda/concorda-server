'use strict'

const _ = require('lodash')

module.exports = function (options) {
  let seneca = this
  let name = 'concorda-auth-service'
  let clientDataEntity = 'client_data'
  let clientToken = 'client_token'


  function validateClient (msg, response) {
    var appkey = msg.data ? msg.data.appkey : msg.appkey
    var context = this

    if (!appkey) {
      return response(null, {ok: false, why: 'All commands require identification appkey'})
    }

    context.act('role: concorda, cmd: loadClient', {appkey: appkey}, function (err, result) {
      if (err) {
        return response(null, {ok: false, why: err})
      }

      if (!result || !result.ok) {
        return response(null, {ok: false, why: 'Client with specified appkey not found. appkey: ' + appkey})
      }

      var client = result.data

      context.act('role: concorda, cmd: loadSettings', function (err, settingsResp) {
        if (err) {
          return response(err)
        }
        if (!settingsResp || !settingsResp.ok) {
          return response(err, {ok: false, why: 'Internal server error'})
        }
        var settings = settingsResp.data

        context.prior(msg, function (err, out) {
          if (err) {
            return response(err, out)
          }
          if (!out || !out.ok) {
            // this is a invalid login - need to check if user should be locked
            return verifyIfDisableAccount(msg, settings, response)
          }

          var user = out.user

          if (!user) {
            return respondWithError({ok: false, why: 'Incorrect login information.'}, response)
          }

          resetUserFailedCount(user)
          if (settings && settings.userPolicy && settings.userPolicy.activateAccount === '1' && !user.emailValidated) {
            return respondWithError({
              ok: false,
              code: 1,
              why: 'Account is disabled. Please confirm your email to activate account.'
            }, response)
          }

          if (settings && settings.userPolicy && settings.userPolicy.forceChangePassword === '1' && user.forcePwdChange) {
            return response(null, {
              ok: false,
              code: 2,
              why: 'You must change your password to be able to login.'
            }, response)
          }

          if (!user.clients) {
            return respondWithError({ok: false, why: 'User cannot login in this application: ' + client.name}, response)
          }

          if (_.findIndex(user.clients,
            function (o) {
              if (!o) return false
              return o.id === client.id
            }) === -1) {
            return respondWithError({ok: false, why: 'User cannot login in this application: ' + client.name}, response)
          }
          response(err, out)
        })
      })

      function resetUserFailedCount (user) {
        context.make$('sys', 'user').load$({email: user.email}, function (err, user) {
          if (err || !user) {
            return
          }
          user.failedLoginCount = 0
          user.save$()
        })
      }

      function verifyIfDisableAccount (msg, settings, response) {
        let nick = msg.data.username || msg.data.nick || msg.data.email
        if (!nick) {
          return respondWithError({ok: false, why: 'Invalid login information.'}, response)
        }
        context.make$('sys', 'user').load$({nick: nick}, function (err, user) {
          if (err || !user) {
            return respondWithError({ok: false, why: 'Invalid login information.'}, response)
          }

          if (!user.active) {
            return respondWithError({ok: false, why: 'Account is disabled.'}, response)
          }

          let count = user.failedLoginCount || 0

          let limit = parseInt(settings.passwordPolicy.forceResetPasswordAfterFailedCount || 0, 10)

          if (limit && count > limit) {
            // must disable account
            user.active = false
            context.act('role: util, cmd: sendAccountDisabledEmail', user)
          }
          else {
            // must increase failed count
            user.failedLoginCount = ++count
          }

          user.save$(function () {
            return respondWithError({ok: false, why: 'Invalid login information.'}, response)
          })
        })
      }
    })

    function respondWithError (responseData, done) {
      context.act('role: auth, cmd: logout', function () {
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

      context.act('role: auth, cmd: validate_password', user, function (err, resp) {
        if (err) {
          return response(null, {ok: false, why: err})
        }

        if (!resp.ok) {
          return response(null, {ok: false, why: resp.why})
        }

        user.forcePwdChange = false
        user.save$(function () {
          context.prior(msg, response)
        })
      })
    })
  }

  function validatePassword (user, done) {
    var context = this
    context.act('role: concorda, cmd: loadSettings', function (err, settings) {
      if (err) {
        return done(null, {ok: false, why: err})
      }
      if (!user.password) {
        return done(null, {ok: false, why: 'Password Required'})
      }
      if (!user.repeat) {
        return done(null, {ok: false, why: 'Repeat password required'})
      }
      if (user.password !== user.repeat) {
        return done(null, {ok: false, why: 'Confirm Password must match Password'})
      }
      if (user.password === user.email) {
        return done(null, {ok: false, why: 'Cannot set password equal with email'})
      }

      if (user.password.length < settings.minLength) {
        return done(null, {ok: false, why: `Error: Password must contain at least ${settings.minLength} characters!`})
      }

      let re
      if (settings.requireNumeric) {
        re = /[0-9]/
        if (!re.test(user.password)) {
          return done(null, {ok: false, why: 'Error: password must contain at least one number (0-9)!'})
        }
      }

      if (settings.requireLowercase) {
        re = /[a-z]/
        if (!re.test(user.password)) {
          return done(null, {ok: false, why: 'Error: password must contain at least one lowercase letter (a-z)!'})
        }
      }

      if (settings.requireUppercase) {
        re = /[A-Z]/
        if (!re.test(user.password)) {
          return done(null, {ok: false, why: 'Error: password must contain at least one uppercase letter (A-Z)!'})
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

    seneca.act('role: user, get: user', q, respond)
  }

  // this is used to prepare user data from external auth providers to match our user data structure.
  var prepareLoginData = function (args, cb) {
    var profile = args.profile

    var data = {}

    if (profile.emails && profile.emails.length > 0) {
      data.email = profile.emails[0].value
    }
    data.name = profile.displayName

    cb(null, data)
  }

  function verifyToken (msg, done) {
    let context = this
    let token = msg.token
    let email = msg.email

    if (!token) {
      return done('Invalid data')
    }

    var q = {
      token: token
    }

    if (email) {
      q.email = email
    }

    context.make$(clientToken).load$(q, function (err, tokenData) {
      if (err) {
        return done(err)
      }

      if (!tokenData) {
        return done('No valid token or email.')
      }

      // after this token is used so it must be removed
      tokenData.remove$(function () {
        done(null, tokenData)
      })
    })
  }

  // this is called for POST /auth/register so I need to verify the appkey
  function createUser (msg, response) {
    let context = this
    let userData = msg.data || msg

    let appkey = msg.appkey || userData.appkey
    delete userData.appkey

    if (!appkey) {
      return response(null, {ok: false, why: 'No appkey provided.'})
    }

    userData.emailValidated = _.contains(userData, 'emailValidated') ? userData.emailValidated : false// not validated if not specified otherwise
    userData.forcePwdChange = _.contains(userData, 'forcePwdChange') ? userData.forcePwdChange : false// should not change pwd on first login if not specified otherwise

    context.act('role: auth, cmd: validate_password', userData, function (err, resp) {
      if (err) {
        return response(null, {ok: false, why: err})
      }

      if (resp && !resp.ok) {
        return response(null, {ok: false, why: resp.why})
      }

      context.act('role: concorda, cmd: loadSettings', function (err, settings) {
        if (err) {
          return response(null, {ok: false, why: err})
        }
        settings = settings.data

        var publicRegister = settings.publicRegister
        if (appkey === 'concorda') {
          publicRegister = settings.concordaPublicRegister
        }

        // this registration can be due to an email invitation with a valid token
        // in this case user can register even if public registration is not active
        var token = userData.token
        delete userData.token

        if (publicRegister && publicRegister !== '1') {
          // verify token
          if (!token) {
            return response(null, {ok: false, why: 'Register available only by invitation.'})
          }

          // now verify token
          context.act('role: concorda, verify: token', {token: token, email: userData.email}, function (err) {
            if (err) {
              return response(null, {ok: false, why: err})
            }

            verifyClient(function (err, client) {
              if (err) {
                return response(null, {ok: false, why: err})
              }

              do_register(client, response)
            })
          })
        }
        else {
          verifyClient(function (err, client) {
            if (err) {
              return response(null, {ok: false, why: err})
            }

            do_register(client, response)
          })
        }
      })

      function verifyClient (cb) {
        context.make$(clientDataEntity).load$({appkey: appkey, fields$: ['name']}, function (err, client) {
          if (err) {
            return cb(err)
          }

          if (!client) {
            return cb('No valid application found.')
          }

          return cb(null, client)
        })
      }

      function do_register (client, cb) {
        userData.clients = userData.clients || []
        userData.clients.push({
          id: client.id,
          name: client.name
        })

        context.act('role: user, cmd: register', userData, function (err, result) {
          if (err) {
            return cb(null, {ok: false, why: err})
          }
          if (!result.ok) {
            return cb(null, {ok: false, why: result.why})
          }

          if (!result.user.emailValidated) {
            context.act('role: util, cmd: sendValidationEmail', result.user, function () {
              return cb(null, {ok: true, data: result.user})
            })
          }
        })
      }
    })
  }

  seneca
    .add('role: auth, cmd: register', createUser)
    .add('role: auth, cmd: login', validateClient)
    .add('role: auth, cmd: change_password', changePassword)
    .add('role: auth, identify: user', identify_service_user)
    .add('role: auth, cmd: validate_password', validatePassword)
    .add('role: auth, prepare: google_login_data', prepareLoginData)
    .add('role: concorda, verify: token', verifyToken)


  return {
    name: name
  }
}
