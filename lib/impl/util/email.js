'use strict'

const _ = require('lodash')

module.exports = function (opts) {
  var seneca = this

  var options = {}
  options = _.extend(options, opts || {}, {name: 'concorda-email'})

  function sendEmail (msg, response) {
    var mailOptions = {
      role: 'mail',
      cmd: 'send'
    }

    mailOptions.to = msg.to
    mailOptions.bcc = msg.bcc
    mailOptions.cc = msg.cc
    mailOptions.content = msg.data
    mailOptions.code = msg.template
    mailOptions.subject = msg.subject

    seneca.act(mailOptions, function (err) {
      if (err) {
        response(err)
      }
      else {
        seneca.log.debug(
          'Mail sent, template name: ', '<' + msg.template + '>',
          ' \n To: ', msg.to || 'No To',
          ' \n CC: ', msg.cc || 'No CC',
          ' \n BCC: ', msg.bcc || 'No BCC')
        response()
      }
    })
  }

  seneca
    .add({
      role: 'email',
      cmd: 'send_email',
      subject: {string$: true, required$: true},
      to: {string$: true, required$: true},
      cc: {string$: true},
      bcc: {string$: true},
      template: {string$: true},
      data: {object$: true}

    }, sendEmail)

  function init (args, done) {
    done()
  }

  seneca.add(`init: ${options.name}`, init)

  return {
    name: options.name
  }
}
