'use strict'

// external plugins
var User = require('seneca-user')
var SenecaMail = require('seneca-mail')

// internal plugins
var ConcordaUser = require('./services/user')
var ConcordaClient = require('./services/client')
var ConcordaTag = require('./services/tag')
var ConcordaEmail = require('./util/email')
// var ConcordaCommunications = require('./util/communication')

module.exports = function (options) {
  // Set up our seneca plugins
  var seneca = this
  const name = 'concorda-core'

  function init (args, done) {
    // load user
    seneca
      .use(User)
      .use(ConcordaUser)
      .use(ConcordaClient)
      .use(ConcordaTag)
      .use(SenecaMail)
      .use(ConcordaEmail)
//      .use(ConcordaCommunications)

    done()
  }

  seneca.add('init: ' + name, init)

  return {
    name: name
  }
}
