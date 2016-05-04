'use strict'

const _ = require('lodash')

module.exports = function (options) {
  var seneca = this

  var name = 'concorda-core-redirect'

  function routeConcordaInternal (msg, response) {
    this.log.debug(`Received command: ${msg.role}:${msg.cmd} from app ${msg.appkey}`)

    msg.role = 'concorda'
    var pattern = 'concorda-'
    if (_.startsWith(msg.cmd, pattern)) {
      msg.cmd = msg.cmd.substr(pattern.length)
    }
    this.act(msg, response)
  }

  function routeUserInternal (msg, response) {
    this.log.debug(`Received command: ${msg.role}:${msg.cmd} from app ${msg.appkey}`)

    msg.role = 'user'
    var pattern = 'concorda-'
    if (_.startsWith(msg.cmd, pattern)) {
      msg.cmd = msg.cmd.substr(pattern.length)
    }
    this.act(msg, response)
  }

  function routeAuthInternal (msg, response) {
    this.log.debug(`Received command: ${msg.role}:${msg.cmd} from app ${msg.appkey}`)

    msg.role = 'auth'
    var pattern = 'concorda-'
    if (_.startsWith(msg.cmd, pattern)) {
      msg.cmd = msg.cmd.substr(pattern.length)
    }
    this.act(msg, response)
  }

  function init (args, done) {
    // redirect externally all user commands
    seneca
      .add('role: concorda-communication', routeConcordaInternal)
      .add('role: concorda-communication-auth', routeAuthInternal)
      .add('role: concorda-communication-user', routeUserInternal)

    done()
  }

  seneca.add('init: ' + name, init)

  return {
    name: name
  }
}
