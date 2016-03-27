'use strict'

const _ = require('lodash')
const Async = require('async')
const Jsonic = require('jsonic')

module.exports = function (options) {
  let seneca = this

  let name = 'concorda-user'
  let clientDataEntity = 'client_data'
  let userGroupEntity = 'sys_group'

  function listUsers (msg, response) {
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

      response(null, {ok: true, data: users, count: users.length})
    })
  }

  function loadUser (msg, response) {
    let userId = msg.userId
    let that = this

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
    let userData = msg.data

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
    let userData = msg.data

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
    let userId = msg.req$.params.userId

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
    let email = msg.email
    let message = msg.message

    // var user = msg.req$.user.user
    // var invitedBy =
    //  user.firstName ? user.firstName : '' + ' ' +
    //  user.lastName ? user.lastName : ''

    // @hack until we will have proper settings
    let url = `http://localhost:3050/register`
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
    var appkey = msg.appkey || (msg.data ? msg.data.appkey : undefined)
    var that = this

    if (!appkey){
      return response(null, {ok: false, why: 'All commands require identification appkey'})
    }

    seneca.act('role: concorda, cmd: loadClient', {appkey: appkey}, function (err, result){
      if (err){
        return response(null, {ok: false, why: err})
      }

      if (!result || !result.ok){
        return response(null, {ok: false, why: 'Client with specified appkey not found. appkey: ' + appkey})
      }

      var client = result.data

      let email = msg.email || (msg.data ? msg.data.email : undefined)
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

        that.prior({email: email}, function (err, data) {
          if (err) {
            return response(null, {ok: false, why: err})
          }
          if (!data) {
            return response(null, {ok: false, why: 'Internal error'})
          }
          var token = data.reset.id


          // @hack until we will have proper settings
          var url = `${client.protocol}://${client.host}:${client.port}/password_reset/${token}`

          var sendEmailOptions = {
            to: email,
            subject: 'Reset password required'
          }


          // now if custom folder is used the email temaplate should be loaded here
          if (client.emailTemplateFolder){
            sendEmailOptions.folder = client.emailTemplateFolder
          }

          sendEmailOptions.data = {
            email: email,
            url: url
          },
          sendEmailOptions.template = 'resetPassword'

          console.log('Send email: ', sendEmailOptions)

          seneca.act('role: email, cmd: send_email', sendEmailOptions, function (err) {
              if (err) {
                return response(null, {ok: false, why: err})
              }
              response(null, {ok: true})
            })
        })
      })
    })
  }

  function registerUser (args, done) {
    let appkey = args.appkey

    // thins will be reomoved in the future
    var that = this
    delete args.appkey

    that.make$(clientDataEntity).load$({appkey: appkey, fields$: ['name']}, function (err, client) {
      if (err) {
        return done(null, {ok: false, why: err})
      }

      if (client) {
        return register(args, client, done)
      }

      that.act('role: concorda, cmd: createClient', {data: {appkey: appkey, name: appkey}}, function (err, client) {
        if (err) {
          return done(null, {ok: false, why: err})
        }

        register(args, client, done)
      })
    })

    function register (args, client, done) {
      that.prior(args, function (err, data) {
        if (err) {
          return done(err, data)
        }

        if (!data || !data.ok) {
          return done(err, data)
        }

        that.act('role: concorda, cmd: setUserClients', {userId: data.user.id, clients: [client.id]}, function (err) {
          if (err) {
            return done(null, {ok: false, why: err})
          }

          done(null, data)
        })
      })
    }
  }

  function setUserGroups (msg, response) {
    let userId = msg.userId
    let groups = msg.groups
    let that = this

    this.make$('sys', 'user').load$({id: userId}, function (err, user) {
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
      that.make$(userGroupEntity).load$({
        id: groupId
      }, function (err, group) {
        if (group) {
          group = group.data$(false)
        }

        done(err, group)
      })
    }
  }

  const setUserClients = (msg, response) => {
    let userId = msg.userId
    let clients = msg.clients
    let that = this

    this.make$('sys', 'user').load$({id: userId}, function (err, user) {
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
      that.make$(clientDataEntity).load$({
        id: groupId,
        fields$: ['name']
      }, function (err, client) {
        if (client) {
          client = client.data$(false)
        }

        done(err, client)
      })
    }
  }

  function init (args, done) {
    seneca
      .add('role: user, cmd: create_reset', createReset)
      .add('role: concorda, cmd: closeSession', closeUserSessions)
      .add('role: concorda, cmd: listUsers', listUsers)
      .add('role: concorda, cmd: loadUser', loadUser)
      .add('role: concorda, cmd: createUser', createUser)
      .add('role: concorda, cmd: updateUser', updateUser)
      .add('role: concorda, cmd: deleteUser', deleteUser)
      .add('role: concorda, cmd: setUserGroups', setUserGroups)
      .add('role: concorda, cmd: setUserClients', setUserClients)
      .add({
        role: 'concorda', cmd: 'inviteUser',
        email: {
          string$: true, required$: true,
          message: {string$: true}
        }
      }, inviteUser)

      .add('role: user, cmd: register', registerUser)

    done()
  }

  seneca.add('init: ' + name, init)

  return {
    name: name
  }
}
