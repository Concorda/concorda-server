'use strict'

const _ = require('lodash')

module.exports = function (options) {
  var seneca = this

  var name = 'concorda-core-redirect'

  function routeInternal (msg, response) {
    seneca.log.debug(`Received command: ${msg.role}:${msg.cmd} from app ${msg.appkey}`)
    msg.role = 'concorda'

    var pattern = 'concorda-'
    if (_.startsWith(msg.cmd, pattern)) {
      msg.cmd = msg.cmd.substr(pattern.length)
    }
    seneca.act(msg, response)
  }

  function routeUserInternal (msg, response) {
    seneca.log.debug(`Received command: ${msg.role}:${msg.cmd} from app ${msg.appkey}`)
    msg.role = 'user'

    var pattern = 'concorda-'
    if (_.startsWith(msg.cmd, pattern)) {
      msg.cmd = msg.cmd.substr(pattern.length)
    }
    seneca.act(msg, response)
  }

  function routeAuthInternal (msg, response) {
    seneca.log.debug(`Received command: ${msg.role}:${msg.cmd} from app ${msg.appkey}`)
    msg.role = 'auth'

    var pattern = 'concorda-'
    if (_.startsWith(msg.cmd, pattern)) {
      msg.cmd = msg.cmd.substr(pattern.length)
    }
    seneca.act(msg, response)
  }

  function getInfo (msg, response) {
    return response(null, {version: 'TBD'})
  }

  function init (args, done) {
    // redirect externally all user commands
    seneca
    // user actions
      .add('role: concorda-communication-auth', routeAuthInternal)
      .add('role: concorda-communication', routeInternal)
      .add('role: concorda-communication-user', routeUserInternal)
      .add('role: concorda-communication, cmd: getInfo', getInfo)

    done()
  }

  seneca.add('init: ' + name, init)

  return {
    name: name
  }
}
