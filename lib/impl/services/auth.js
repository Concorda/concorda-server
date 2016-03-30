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
          return response(null, {ok: false, code: 2, why: 'You must change your password to be able to login.'}, response)
        }

        if (!user.clients){
          return respondWithError({ok: false, why: 'User cannot login in this application: ' + client.name}, response)
        }

        if (_.findIndex(user.clients, function(o) {
            return o.id === client.id;
          }) === -1) {
          return respondWithError({ok: false, why: 'User cannot login in this application: ' + client.name}, response)
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

  function changePassword(msg, response){

    var user = msg.req$.seneca.user
    var context = this

    context.make$('sys', 'user').load$({id: user.id}, function (err, user){
      if (err || !user){
        return response(null, {ok: false, why: 'Internal server error'})
      }

      user.forcePwdChange = false
      user.save$(function(){
        context.prior(msg, response)
      })
    })
  }

  seneca
    .add('role: auth, cmd: login', validateClient)
    .add('role: auth, cmd: change_password', changePassword)

  return {
    name: name
  }
}
