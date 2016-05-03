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

  // this is called only from concorda dashboard to create another user
  function createUser (msg, response) {
    let context = this
    let userData = msg.data

    userData.emailValidated = _.contains(userData, 'emailValidated') ? userData.emailValidated : false
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
    if (userData.password || userData.repeat){
      context.act('role: auth, cmd: validate_password', userData, function(err, resp) {
        if (err) {
          return response(null, {ok: false, why: err})
        }

        if (!resp.ok) {
          return response(null, {ok: false, why: resp.why})
        }

        do_update(userData, response)
      })
    }
    else{
      do_update(userData, response)
    }

    function do_update(userData, response) {
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

  function genrandstr( args, cb ){
    var len = args.len || 8
    var dict = args.dict || "abcdefghjkmnpqrstuvwxyzACDEFGHJKLMNPQRSTUVWXYZ2345679";

    var str = "";
    for (var i = 0; i < len; i++) {
      str += dict.charAt(Math.floor(Math.random() * dict.length))
    }

    cb(null, str);
  }

  function inviteUser (msg, response) {
    let email = msg.email
    let message = msg.message

    let context = this

    genrandstr({}, function (err, token){
      context.make$(clientToken).save$({token: token, email: email}, function (err, tokenData) {
        // @hack until we will have proper settings
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
            subject: 'You have been invited to join Concorda'
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

  // this is called for all register user actions to actually create the user in DB
  function registerUser (args, done) {
    var context = this

    delete args.cmd
    context.act('role: auth, cmd: validate_password', args, function(err, resp){
      if (err) {
        return done(null, {ok: false, why: err})
      }

      if (resp && !resp.ok) {
        return done(null, {ok: false, why: resp.why})
      }

      context.prior(args, function (err, data) {
        if (err) {
          return done(err, data)
        }

        if (!data || !data.ok) {
          return done(err, data)
        }

        done(null, data)
      })
    })
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

  function findMainClient (msg, done) {
    this.make$(clientDataEntity).load$({
      appkey: 'concorda'
    }, done)
  }

  function sendValidationEmail (msg, done) {
    this.act('role: util, find: mainClient', function (err, client) {
      if (err || !client){
        return done('Invalid main client')
      }

      let url = `${client.protocol}://${client.host}:${client.port}/validate/${msg.id}`

      let sendEmailOptions = {
        to: msg.email,
        subject: 'Confirm your email'
      }

      // now if custom folder is used the email temaplate should be loaded here
      if (client.emailTemplateFolder){
        sendEmailOptions.folder = client.emailTemplateFolder
      }

      sendEmailOptions.data = {
        email: msg.email,
        url: url
      },
        sendEmailOptions.template = 'validateEmail'

      console.log('Send email: ', sendEmailOptions)
      seneca.act('role: email, cmd: send_email', sendEmailOptions, done)
    })
  }

  function validateEmail (msg, done) {
    var userId = msg.userId

    if (!userId){
      return done(null, {ok: false, why: 'Invalid user', "http$":{"status":301,"redirect":"/login"}})
    }
    this.make$('sys', 'user').load$({id: userId}, function (err, user) {
      if (err || !user){
        return done(null, {ok: false, why: 'Invalid user', "http$":{"status":301,"redirect":"/login"}})
      }

      user.emailValidated = true

      user.save$(function(){
        return done(null, {ok: true, why: 'Account activated', "http$":{"status":301,"redirect":"/login"}})
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
      .add('role: util, cmd: sendValidationEmail', sendValidationEmail)

    done()
  }

  seneca.add('init: ' + name, init)

  return {
    name: name
  }
}
