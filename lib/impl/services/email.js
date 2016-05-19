'use strict'

module.exports = function (options) {
  let seneca = this

  let name = 'concorda-email'

  let clientToken = 'client_token'

  function sendValidationEmail (msg, done) {
    let context = this
    context.act('role: util, find: mainClient', function (err, client) {
      if (err || !client) {
        return done('Invalid main client')
      }

      context.act('role: util, find: genstrtoken', function (err, token) {
        if (err) {
          return done(null, {ok: false, why: err})
        }

        context.make$(clientToken).save$({token: token, email: msg.email}, function (err, tokenData) {
          if (err) {
            return done(null, {ok: false, why: err})
          }

          let url = `${client.protocol}://${client.host}:${client.port}/validate/${token}`

          let sendEmailOptions = {
            to: msg.email,
            subject: 'Confirm your email'
          }

          // now if custom folder is used the email temaplate should be loaded here
          if (client.emailTemplateFolder) {
            sendEmailOptions.folder = client.emailTemplateFolder
          }

          sendEmailOptions.data = {
            email: msg.email,
            url: url
          }
          sendEmailOptions.template = 'validateEmail'

          console.log('Send email: ', sendEmailOptions)
          context.act('role: email, cmd: send_email', sendEmailOptions, done)
        })
      })
    })
  }

  function sendAccountDisabledEmail (user, done) {
    let context = this
    context.act('role: util, find: mainClient', function (err, client) {
      if (err || !client) {
        return done('Invalid main client')
      }

      context.act('role: util, find: genstrtoken', function (err, token) {
        if (err) {
          return done(null, {ok: false, why: err})
        }

        context.make$(clientToken).save$({token: token, email: user.email}, function (err, tokenData) {
          if (err) {
            return done(null, {ok: false, why: err})
          }

          let concordaUrl = `${client.protocol}://${client.host}:${client.port}/`
          let url = `${client.protocol}://${client.host}:${client.port}/validate/${token}`

          let sendEmailOptions = {
            to: user.email,
            subject: 'Account is disabled'
          }

          // now if custom folder is used the email temaplate should be loaded here
          if (client.emailTemplateFolder) {
            sendEmailOptions.folder = client.emailTemplateFolder
          }

          sendEmailOptions.data = {
            email: user.email,
            url: url,
            concordaUrl: concordaUrl
          }
          sendEmailOptions.template = 'accountDisabled'

          console.log('Send email: ', sendEmailOptions)
          context.act('role: email, cmd: send_email', sendEmailOptions, done)
        })
      })
    })
  }

  function init (args, done) {
    seneca
      .add('role: util, cmd: sendValidationEmail', sendValidationEmail)
      .add('role: util, cmd: sendAccountDisabledEmail', sendAccountDisabledEmail)

    done()
  }

  seneca.add('init: ' + name, init)

  return {
    name: name
  }
}
