'use strict'

module.exports = function (options) {
  let seneca = this
  let name = 'concorda-log'
  let loggingEntity = 'logging'

  function addLog (msg, response) {
    let logData = msg.log
    let user = msg.user
    let req = msg.req

    if (!logData || !user || !req) {
      return response('Invalid logging data')
    }

    logData.user_data = {
      email: user.email,
      id: user.id,
      name: user.name
    }
    logData.action_date = new Date()
    logData.remoteAddress = req.info.remoteAddress

    this.make$(loggingEntity, logData).save$(response)
  }

  function init (args, done) {
    seneca
      .add('role: concorda, cmd: addLog', addLog)

    done()
  }

  seneca.add('init: ' + name, init)

  return {
    name: name
  }
}
