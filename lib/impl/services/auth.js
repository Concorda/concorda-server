'use strict'

const _ = require('lodash')
const Moment = require('moment')

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
            return verifyShouldDisableAccount(msg, settings, response)
          }

          var user = out.user

          if (!user) {
            return respondWithError({ok: false, why: 'Incorrect login information.'}, response)
          }

          resetUserFailedCount(user)

          if (shouldResetPassword(user, settings, response)) { // if should reset password then this function will send the response
            return
          }

          if (settings && settings.userPolicy && settings.userPolicy.activateAccount === '1' && !user.emailValidated) {
            return respondWithError({
              ok: false,
              code: 1,
              why: 'Account is disabled. Please confirm your email to activate account.'
            }, response)
          }

          if (settings && settings.userPolicy && settings.userPolicy.forceChangePassword === '1' && user.forcePwdChange) {
            return respondWithShouldChangePwd(user, response)
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

      // prepare response with reset pwd token
      function respondWithShouldChangePwd (user, response) {
        context.act('role: util, cmd: genstrtoken', function (err, tokenData) {
          if (err) {
            return respondWithError({ok: false, why: 'Internal server error.'}, response)
          }

          let token = tokenData.token
          context.make$(clientToken).save$({token: token, email: user.email}, function (err, tokenData) {
            if (err) {
              return respondWithError({ok: false, why: 'Internal server error.'}, response)
            }

            return respondWithError({ok: false, why: 'You must change your password to be able to login.', code: 2, token: token}, response)
          })
        })
      }

      function shouldResetPassword (user, settings, response) {
        if (user.forcePwdChange) {
          respondWithShouldChangePwd(user, response)
          return true
        }

        let interval = parseInt(settings.passwordPolicy.forceChangePasswordAfterInterval || 0, 10)

        if (interval) {
          let pwdTime = user.passwordChangeTimestamp
          if (!pwdTime) {
            // this should never happen but still trying to fix it
            context.make$('sys', 'user').load$({id: user.id}, function (err, user) {
              if (err) {
                return false
              }
              if (user) {
                user.passwordChangeTimestamp = new Date()
                user.save$()
              }
            })
            return false
          }

          pwdTime = Moment(pwdTime)
          let now = Moment()
          let diff = now.diff(pwdTime, 'days')

          if (diff > interval) {
            respondWithShouldChangePwd(user, response)
            return true
          }
        }
        return false
      }

      function resetUserFailedCount (user) {
        context.make$('sys', 'user').load$({email: user.email}, function (err, user) {
          if (err || !user) {
            return
          }
          user.failedLoginCount = 0
          user.save$()
        })
      }

      function verifyShouldDisableAccount (msg, settings, response) {
        let nick = msg.data.nick || msg.data.username || msg.data.email
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
          if (limit && count >= limit) {
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

    // send response with error after forcing logout
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
        user.passwordChangeTimestamp = new Date()
        user.save$(function () {
          context.act('role: util, cmd: genstrtoken', function (err, tokenData) {
            if (err || !tokenData) {
              return response(null, {ok: false, why: 'Internal server error'})
            }

            msg.salt = tokenData.token

            context.prior(msg, response)
          })
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
  function prepareLoginData (args, cb) {
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

    userData.emailValidated = _.has(userData, 'emailValidated') ? userData.emailValidated : false// not validated if not specified otherwise
    userData.forcePwdChange = _.has(userData, 'forcePwdChange') ? userData.forcePwdChange : false// should not change pwd on first login if not specified otherwise

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

        userData.passwordChangeTimestamp = new Date()
        userData.forcePwdChange = userData.forcePwdChange || false

        context.act('role: util, cmd: genstrtoken', function (err, tokenData) {
          if (err || !tokenData) {
            return cb(null, {ok: false, why: 'Internal server error'})
          }

          userData.salt = tokenData.token
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
        })
      }
    })
  }

  function loadReset (msg, done) {
    let token = msg.data.token
    let context = this

    context.make$(clientToken).load$({token: token}, function (err, tokenData) {
      if (err || !tokenData) {
        return done(null, {ok: false, why: err || 'Invalid token.'})
      }

      context.make$('sys', 'user').load$({email: tokenData.email}, function (err, user) {
        if (err || !user) {
          return done(null, {ok: false, why: err || 'User not found'})
        }

        return done(null, {ok: true, user: user.data$(false)})
      })
    })
  }

  function executeReset (msg, done) {
    let token = msg.data.token
    let password = msg.data.password
    let repeat = msg.data.repeat
    let context = this

    if (!token || !password || !repeat) {
      return done(null, {ok: false, why: 'Invalid data.'})
    }
    context.act('role: concorda, verify: token', {token: token}, function (err, tokenData) {
      if (err || !tokenData) {
        return done(null, {ok: false, why: err || 'Invalid token.'})
      }

      context.make$('sys', 'user').load$({email: tokenData.email}, function (err, user) {
        if (err || !user) {
          return done(null, {ok: false, why: err || 'User not found'})
        }

        user.forcePwdChange = false
        user.passwordChangeTimestamp = new Date()
        context.act('role: util, cmd: genstrtoken', function (err, tokenData) {
          if (err || !tokenData) {
            return done(null, {ok: false, why: 'Internal server error'})
          }
          msg.salt = tokenData.token

          seneca.act({ role: 'user', cmd: 'change_password', user: user, password: password, repeat: repeat, salt: msg.salt }, function (err, out) {
            if (err) {
              return done(null, {ok: false, why: err})
            }

            if (!out.ok) {
              return done(null, {ok: false, why: err})
            }

            user.save$(function () {
              return done(null, {ok: true})
            })
          })
        })
      })
    })
  }

  seneca
    .add('role: auth, cmd: register', createUser)
    .add('role: auth, cmd: login', validateClient)
    .add('role: auth, cmd: change_password', changePassword)
    .add('role: auth, identify: user', identify_service_user)
    .add('role: auth, cmd: validate_password', validatePassword)
    .add('role: auth, prepare: google_login_data', prepareLoginData)
    .add('role: auth, cmd: load_reset', loadReset)
    .add('role: auth, cmd: execute_reset', executeReset)

    .add('role: concorda, verify: token', verifyToken)

  return {
    name: name
  }
}
