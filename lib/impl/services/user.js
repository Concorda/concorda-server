'use strict'

const _ = require('lodash')
const Async = require('async')
const Jsonic = require('jsonic')

module.exports = function (options) {
  let seneca = this

  let name = 'concorda-user'

  let clientToken = 'client_token'
  let clientDataEntity = 'client_data'
  let userGroupEntity = 'sys_group'

  function listUsers (msg, response) {
    // parameters to support pagination
    let limit = msg.limit
    let skip = msg.skip
    let orderBy = msg.order

    let q = {}

    if (limit) {
      q['limit$'] = limit
    }
    if (skip) {
      q['skip$'] = skip
    }

    if (orderBy) {
      if (_.isObject(orderBy)) {
        q['sort$'] = orderBy
      }
      else {
        try {
          orderBy = orderBy.replace(/%22/g, '\"').replace(/%20/g, ' ')
          q['sort$'] = Jsonic(orderBy)
        }
        catch (e) {
        }
      }
    }

    this.make$('sys', 'user').list$(q, function (err, users) {
      if (err) {
        return response(null, {ok: false, why: err})
      }
      users = users || []

      for (var i in users) {
        users[i] = users[i].data$(false)
      }

      // TODO: here count should be the total count of users, not just this page length
      response(null, {ok: true, data: users, count: users.length})
    })
  }

  function loadUser (msg, response) {
    let userId = msg.userId
    let context = this

    if (!userId) {
      return response(null, {ok: false, why: 'Invalid user'})
    }

    context.make$('sys', 'user').load$({id: userId}, function (err, user) {
      if (err) {
        return response(null, {ok: false, why: err})
      }
      if (!user) {
        return response(null, {ok: false, why: 'User not found'})
      }

      user = user.data$(false)
      response(null, {ok: true, data: user})
    })
  }

  // this is called only from Concorda dashboard to create a user for another application
  // this is not register user
  function createUser (msg, response) {
    let context = this
    let userData = msg.data

    // by default is false - so user must validate its email
    // if from dashboard the email is set as validated (TBD) then this is not necessary
    userData.emailValidated = _.contains(userData, 'emailValidated') ? userData.emailValidated : false
    // force change password by default if not otherwise specified by dashboard (TBD)
    userData.forcePwdChange = _.contains(userData, 'forcePwdChange') ? userData.forcePwdChange : true

    context.act('role: user, cmd: register', userData, function (err, result) {
      if (err) {
        return response(null, {ok: false, why: err})
      }
      if (!result.ok) {
        return response(null, {ok: false, why: result.why})
      }

      if (!result.user.emailValidated) {
        context.act('role: util, cmd: sendValidationEmail', result.user, function () {
          response(null, {ok: true, data: result.user})
        })
      }
    })
  }

  function updateUser (msg, response) {
    let userData = msg.data
    let context = this

    if (userData.password || userData.repeat) {
      context.act('role: auth, cmd: validate_password', userData, function (err, resp) {
        if (err) {
          return response(null, {ok: false, why: err})
        }

        if (!resp.ok) {
          return response(null, {ok: false, why: resp.why})
        }

        do_update(userData, response)
      })
    }
    else {
      do_update(userData, response)
    }

    function do_update (userData, response) {
      context.act('role: user, cmd: update', userData, function (err, result) {
        if (err) {
          return response(null, {ok: false, why: err})
        }
        if (!result.ok) {
          return response(null, {ok: false, why: result.why})
        }
        response(null, {ok: true, data: result.user})
      })
    }
  }

  function deleteUser (msg, response) {
    let userId = msg.userId
    let context = this

    if (!userId) {
      return response(null, {ok: false, why: 'Invalid user'})
    }

    context.make$('sys', 'user').load$({id: userId}, function (err, user) {
      if (err) {
        return response({ok: false, why: err})
      }
      if (!user || !user.nick) {
        return response(null, {ok: false, why: 'User not found'})
      }

      this.act('role: user, cmd: delete', {nick: user.nick}, function (err, result) {
        if (err) {
          return response(null, {ok: false, why: err})
        }
        if (!result.ok) {
          return response(null, {ok: false, why: result.why})
        }
        response(null, {ok: true})
      })
    })
  }

  function closeUserSessions (msg, response) {
    let userId = msg.req$.params.user_id
    let context = this

    if (!userId) {
      return response('Invalid user selected')
    }

    context.make$('sys', 'login').list$({user: userId, active: true}, function (err, logins) {
      if (err) {
        return response(null, {ok: false, why: err})
      }
      if (!logins) {
        return response(null, {ok: true, sessions: 0})
      }

      Async.each(logins, closeSession, function (err) {
        if (err) {
          return response(null, {ok: false, why: err})
        }

        // now I should notify all other apps to logout that user
        context.act('role: concorda, info: logout', {user_id: userId})
        response(null, {ok: true, sessions: logins.length})
      })
    })

    function closeSession (session, done) {
      seneca.log.debug('closing session', session)
      session.remove$(done)// should I just set 'active: false' here?
    }
  }

  // generate a random string with specified length and set of characters
  function genrandstr (args, cb) {
    var len = args.len || 8
    var dict = args.dict || 'abcdefghjkmnpqrstuvwxyzACDEFGHJKLMNPQRSTUVWXYZ2345679'

    var str = ''
    for (var i = 0; i < len; i++) {
      str += dict.charAt(Math.floor(Math.random() * dict.length))
    }

    cb(null, {token: str})
  }

  function inviteUser (msg, response) {
    let email = msg.email
    let message = msg.message

    let context = this

    genrandstr({}, function (err, tokenData) {
      if (err) {
        return response(null, {ok: false, why: err})
      }

      let token = tokenData.token

      context.make$(clientToken).save$({token: token, email: email}, function (err, tokenData) {
        if (err) {
          return response(null, {ok: false, why: err})
        }

        // @hack until we will have proper settings
        // also I need here the appkey for application for which the user is invited - need support in dashboard first
        let url = `http://localhost:3050/register/${token}`

        context.act('role: email, cmd: send_email',
          {
            to: email,
            data: {
              // invitedBy: invitedBy,
              email: email,
              message: message,
              url: url
            },
            template: 'inviteUser',
            subject: 'You have been invited to join Concorda'// or another applications ?
          }, function (err) {
            if (err) {
              return response(null, {ok: false, why: err})
            }
            response(null, {ok: true})
          })
      })
    })
  }

  function createReset (msg, response) {
    var appkey = msg.appkey || (msg.data ? msg.data.appkey : undefined)
    var context = this

    if (!appkey) {
      return response(null, {ok: false, why: 'All commands require identification appkey'})
    }

    let email = msg.email || (msg.data ? msg.data.email : undefined)
    seneca.log.debug('create reset token for', email)
    if (!email) {
      return response(null, {ok: false, why: 'No valid email'})
    }

    context.act('role: concorda, cmd: loadClient', {appkey: appkey}, function (err, result) {
      if (err) {
        return response(null, {ok: false, why: err})
      }

      if (!result || !result.ok) {
        return response(null, {ok: false, why: 'Client with specified appkey not found. appkey: ' + appkey})
      }

      var client = result.data

      context.make$('sys', 'user').load$({email: email}, function (err, user) {
        if (err) {
          return response(null, {ok: false, why: err})
        }

        if (!user) {
          return response(null, {ok: false, why: 'No user found'})
        }

        context.prior({email: email}, function (err, data) {
          if (err) {
            return response(null, {ok: false, why: err})
          }

          if (!data) {
            return response(null, {ok: false, why: 'Internal error'})
          }

          var token = data.reset.id

          var url = `${client.protocol}://${client.host}:${client.port}/password_reset/${token}`

          var sendEmailOptions = {
            to: email,
            subject: 'Reset password required'
          }

          // now if custom folder is used the email template should be loaded here
          if (client.emailTemplateFolder) {
            sendEmailOptions.folder = client.emailTemplateFolder
          }

          sendEmailOptions.data = {
            email: email,
            url: url
          }

          sendEmailOptions.template = 'resetPassword'

          context.log.info('Send email: ', sendEmailOptions)

          context.act('role: email, cmd: send_email', sendEmailOptions, function (err) {
            if (err) {
              return response(null, {ok: false, why: err})
            }
            response(null, {ok: true})
          })
        })
      })
    })
  }

  // this is called for all register user actions to actually create the user in DB
  function registerUser (args, done) {
    var context = this

    delete args.cmd
    context.act('role: auth, cmd: validate_password', args, function (err, resp) {
      if (err) {
        return done(null, {ok: false, why: err})
      }

      if (resp && !resp.ok) {
        return done(null, {ok: false, why: resp.why})
      }

      context.prior(args, done)
    })
  }

  function setUserGroups (msg, response) {
    let userId = msg.userId
    let groups = msg.groups || []
    let context = this

    if (!userId) {
      return response(null, {ok: false, why: 'Invalid user'})
    }

    context.make$('sys', 'user').load$({id: userId}, function (err, user) {
      if (err) {
        return response(null, {ok: false, why: err})
      }

      if (!user) {
        return response(null, {ok: false, why: 'User not found'})
      }

      groups = groups || []
      Async.map(groups, getGroup, function (err, groups) {
        if (err) {
          return response(null, {ok: false, why: err})
        }

        user.groups = groups
        user.save$(function (err) {
          if (err) {
            return response(null, {ok: false, why: err})
          }
          seneca.act('role: concorda, cmd: loadUser', {userId: userId}, response)
        })
      })
    })

    function getGroup (groupId, done) {
      context.make$(userGroupEntity).load$({id: groupId}, function (err, group) {
        if (group) {
          group = group.data$(false)
        }

        done(err, group)
      })
    }
  }

  const setUserClients = (msg, response) => {
    let userId = msg.userId
    let clients = msg.clients || []
    let context = this

    if (!userId) {
      return response(null, {ok: false, why: 'Invalid user'})
    }

    context.make$('sys', 'user').load$({id: userId}, function (err, user) {
      if (err) {
        return response(null, {ok: false, why: err})
      }
      if (!user) {
        return response(null, {ok: false, why: 'User not found'})
      }

      clients = clients || []
      Async.map(clients, getClient, function (err, clients) {
        if (err) {
          return response(null, {ok: false, why: err})
        }

        user.clients = clients
        user.save$(function (err) {
          if (err) {
            return response(null, {ok: false, why: err})
          }
          seneca.act('role: concorda, cmd: loadUser', {userId: userId}, response)
        })
      })
    })

    function getClient (groupId, done) {
      context.make$(clientDataEntity).load$({id: groupId, fields$: ['name']}, function (err, client) {
        if (client) {
          client = client.data$(false)
        }

        done(err, client)
      })
    }
  }

  function findMainClient (msg, done) {
    this.make$(clientDataEntity).load$({appkey: 'concorda'}, done)
  }

  function validateEmail (msg, done) {
    let token = msg.userId
    let context = this

    context.act('role: concorda, verify: token', {token: token}, function (err, tokenData) {
      if (err || !tokenData) {
        return done(null, {ok: false, why: 'Invalid token', 'http$': {'status': 301, 'redirect': '/login'}})
      }

      this.make$('sys', 'user').load$({email: tokenData.email}, function (err, user) {
        if (err || !user) {
          return done(null, {ok: false, why: 'Invalid user.', 'http$': {'status': 301, 'redirect': '/login'}})
        }

        user.emailValidated = true
        user.active = true

        user.save$(function () {
          return done(null, {ok: true, why: 'Account activated', 'http$': {'status': 301, 'redirect': '/login'}})
        })
      })
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

        seneca.act({ role: 'user', cmd: 'change_password', user: user, password: password, repeat: repeat }, function (err, out) {
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
  }

  function init (args, done) {
    seneca
      .add('role: concorda, cmd: closeSession', closeUserSessions)
      .add('role: concorda, cmd: listUsers', listUsers)
      .add('role: concorda, cmd: loadUser', loadUser)
      .add('role: concorda, cmd: createUser', createUser)// POST api/user
      .add('role: concorda, cmd: updateUser', updateUser)
      .add('role: concorda, cmd: deleteUser', deleteUser)
      .add('role: concorda, cmd: setUserGroups', setUserGroups)
      .add('role: concorda, cmd: setUserClients', setUserClients)
      .add('role: concorda, cmd: validateEmail', validateEmail)
      .add({
        role: 'concorda', cmd: 'inviteUser',
        email: {
          string$: true, required$: true,
          message: {string$: true}
        }
      }, inviteUser)

      .add('role: user, cmd: register', registerUser)
      .add('role: user, cmd: create_reset', createReset)
      .add('role: util, find: mainClient', findMainClient)
      .add('role: util, cmd: genstrtoken', genrandstr)
      .add('role: auth, cmd: load_reset', loadReset)
      .add('role: auth, cmd: execute_reset', executeReset)

    done()
  }

  seneca.add('init: ' + name, init)

  return {
    name: name
  }
}
