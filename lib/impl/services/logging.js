'use strict'

const _ = require('lodash')
const Jsonic = require('jsonic')

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

  function listLogs (msg, response) {
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

    this.make$(loggingEntity).list$(q, function (err, logs) {
      if (err) {
        return response(null, {ok: false, why: err})
      }
      logs = logs || []

      for (var i in logs) {
        logs[i] = logs[i].data$(false)
      }

      // TODO: here count should be the total count of logs, not just this page length
      response(null, {ok: true, data: logs, count: logs.length})
    })
  }

  function init (args, done) {
    seneca
      .add('role: concorda, cmd: addLog', addLog)
      .add('role: concorda, cmd: listLogs', listLogs)

    done()
  }

  seneca.add('init: ' + name, init)

  return {
    name: name
  }
}
