'use strict'

const _ = require('lodash')
const Jsonic = require('jsonic')

module.exports = function (options) {
  let seneca = this

  let name = 'concorda-auth-service'
  let clientDataEntity = 'concorda-auth-service'

  function validateClient (msg, response) {

    var appkey = msg.appkey
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

      delete msg.appkey
      delete msg.username

      that.prior(msg, function(err, out){
        if (err) {
          return response(err, out)
        }
        if (!out || !out.ok){
          return response(err, out)
        }

        var user = out.user
        if (!user || !user.clients){
          return response(err, {ok: false, why: 'User is not associated with this client:' + appkey})
        }

        if (_.findIndex(user.clients, function(o) {
            return o.id === client.id;
          }) === -1) {
          return response(err, {ok: false, why: 'User is not associated with this client:' + appkey})
        }
        response(err, out)
      })
    })
  }

  seneca
    .add('role: user, cmd: login', validateClient)

  return {
    name: name
  }
}
