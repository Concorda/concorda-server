'use strict'

const _ = require('lodash')
const Async = require('async')
var Jsonic = require('jsonic')

module.exports = function (options) {
  var seneca = this

  var name = 'concorda-user'

  function listUsers (msg, response) {
    var limit = msg.limit
    var skip = msg.skip
    var orderBy = msg.order

    var q = {}

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

      response(null, {ok: true, data: users, count: users.length})
    })
  }

  function loadUser (msg, response) {
    var userId = msg.userId
    var that = this

    that.make$('sys', 'user').load$({id: userId}, function (err, user) {
      if (err) {
        return response(null, {ok: false, why: err})
      }
      if (!user) {
        return response(null, {ok: false, why: 'User not found'})
      }

      response(null, {ok: true, data: user})
    })
  }

  function createUser (msg, response) {
    var userData = msg.data

    this.act('role: user, cmd: register', userData, function (err, result) {
      if (err) {
        return response(null, {ok: false, why: err})
      }
      if (!result.ok) {
        return response(null, {ok: false, why: result.why})
      }
      response(null, {ok: true, data: result.user})
    })
  }

  function updateUser (msg, response) {
    var userData = msg.data

    this.act('role: user, cmd: update', userData, function (err, result) {
      if (err) {
        return response(null, {ok: false, why: err})
      }
      if (!result.ok) {
        return response(null, {ok: false, why: result.why})
      }
      response(null, {ok: true, data: result.user})
    })
  }

  function deleteUser (msg, response) {
    var userId = msg.req$.params.userId

    this.make$('sys', 'user').load$({id: userId}, function (err, user) {
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
    let user_id = msg.req$.params.user_id
    let that = this

    if (!user_id) {
      return response('Invalid user selected')
    }

    this.make$('sys', 'login').list$({user: user_id, active: true}, function (err, logins) {
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
        that.act('role: concorda, info: logout', {user_id: user_id})
        response(null, {ok: true, sessions: logins.length})
      })
    })
  }

  function closeSession (session, done) {
    seneca.log.debug('closing session', session)
    session.remove$(done)
  }

  function inviteUser (msg, response) {
    var email = msg.email
    var message = msg.message

    // var user = msg.req$.user.user
    // var invitedBy =
    //  user.firstName ? user.firstName : '' + ' ' +
    //  user.lastName ? user.lastName : ''

    // @hack until we will have proper settings
    var url = `http://localhost:3050/register`
    seneca.act('role: email, cmd: send_email',
      {
        to: email,
        data: {
          // invitedBy: invitedBy,
          email: email,
          message: message,
          url: url
        },
        template: 'inviteUser',
        subject: 'You have been invited to join Concorda'
      }, function (err) {
        if (err) {
          return response(null, {ok: false, why: err})
        }
        response(null, {ok: true})
      })
  }

  function createReset (msg, response) {
    var email = msg.data.email
    seneca.log.debug('create reset token for', email)
    if (!email) {
      return response(null, {ok: false, why: 'No valid email'})
    }

    this.make$('sys', 'user').load$({email: email}, function (err, user) {
      if (err) {
        return response(null, {ok: false, why: err})
      }
      if (!user) {
        return response(null, {ok: false, why: 'No user found'})
      }

      seneca.act('role:user, cmd:create_reset', {email: email}, function (err, data) {
        if (err) {
          return response(null, {ok: false, why: err})
        }
        if (!data) {
          return response(null, {ok: false, why: 'Internal error'})
        }
        var token = data.reset.id

        // @hack until we will have proper settings
        var url = `http://localhost:3050/password_reset/${token}`
        seneca.act('role: email, cmd: send_email',
          {
            to: email,
            data: {
              email: email,
              url: url
            },
            template: 'resetPassword',
            subject: 'Reset password required'
          }, function (err) {
            if (err) {
              return response(null, {ok: false, why: err})
            }
            response(null, {ok: true})
          })
      })
    })
  }

  function restrictLogin (args, done) {
    var userId = args.user.id
    var that = this

    // hardcoded for now
    var tagName = 'Concorda'

    that.make$('user_tag').load$({userId: userId, tagName: tagName}, function (err, tags) {
      if (err) {
        return done(null, {ok: false, why: err})
      }

      if (!tags) {
        return done(null, {ok: false, why: 'Restricted login'})
      }
      done(null, {ok: true})
    })
  }

  function init (args, done) {
    seneca
      .add('role: auth, cmd: create_reset', createReset)
      .add('role: concorda, cmd: closeSession', closeUserSessions)
      .add('role: concorda, cmd: listUsers', listUsers)
      .add('role: concorda, cmd: loadUser', loadUser)
      .add('role: concorda, cmd: createUser', createUser)
      .add('role: concorda, cmd: updateUser', updateUser)
      .add('role: concorda, cmd: deleteUser', deleteUser)
      .add('role: auth, restrict: login', restrictLogin)
      .add({
        role: 'concorda', cmd: 'inviteUser',
        email: {
          string$: true, required$: true,
          message: {string$: true}
        }
      }, inviteUser)

    done()
  }

  seneca.add('init: ' + name, init)

  return {
    name: name
  }
}
