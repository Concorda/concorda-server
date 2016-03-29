'use strict'

const _ = require('lodash')
const Jsonic = require('jsonic')

module.exports = function (options) {
  let seneca = this

  let name = 'concorda-auth-service'
  let clientDataEntity = 'concorda-auth-service'

  function validateClient (msg, response) {

    var appkey = msg.data ? msg.data.appkey : msg.appkey
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

      that.prior(msg, function(err, out){
        if (err) {
          return response(err, out)
        }
        if (!out || !out.ok){
          return response(err, {ok: false, why: 'Incorrect login information'})
        }

        var user = out.user

        if (!user){
          return respondWithError({ok: false, why: 'Incorrect login information.'}, response)
        }

        if (user.validateEmail){
          return respondWithError({ok: false, code: 1, why: 'Account is disabled. Please confirm your email to activate account.'}, response)
        }

        if (user.forcePwdChange){
          return respondWithError({ok: false, code: 2, why: 'You must change your password to be ablle to login.'}, response)
        }

        if (!user.clients){
          return respondWithError({ok: false, why: 'User is not associated with this client:' + appkey}, response)
        }

        if (_.findIndex(user.clients, function(o) {
            return o.id === client.id;
          }) === -1) {
          return respondWithError({ok: false, why: 'User is not associated with this client:' + appkey}, response)
        }
        response(err, out)
      })
    })

    function respondWithError(responseData, done){
      that.act('role: auth, cmd: logout', function (){
        done(null, responseData)
      })
    }
  }

  seneca
    .add('role: auth, cmd: login', validateClient)

  return {
    name: name
  }
}
