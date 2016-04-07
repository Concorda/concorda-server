'use strict'

const _ = require('lodash')

module.exports = function (options) {
  let seneca = this

  let name = 'concorda-client'
  let settingsEntity = 'settings'

  function loadSettings (msg, response) {
    const context = this

    this.make$(settingsEntity).load$({}, function (err, settings) {
      if (err) {
        return response(null, {ok: false, why: err})
      }

      if (settings && settings.id){
        settings = settings ? settings.data$(false) : {}
        return response(null, {ok: true, data: settings})
      }

      // settings not in DB - strange but I must make sure there are some default settings - adding them now
      this.make$(settingsEntity, {configured: true, publicRegister: 'public'}).save$(function (err, settings){
        if (err) {
          return response(null, {ok: false, why: err})
        }

        settings = settings.data$(false)
        return response(null, {ok: true, data: settings})
      })
    })
  }

  function saveSettings (msg, response) {
    let settings = msg.data
    const context = this

    this.make$(settingsEntity).load$({}, function (err, dbsettings) {
      if (err) {
        return response(null, {ok: false, why: err})
      }

      if (!dbsettings){
        dbsettings = context.make$(settingsEntity, {})
      }

      settings = _.extend(dbsettings, settings, {configured: true})

      settings.save$(function(err, settings){
        if (err) {
          return response(null, {ok: false, why: err})
        }

        settings = settings.data$(false)
        return response(null, {ok: true, data: settings})
      })
    })
  }

  function publicSaveSettings (msg, response) {
    let settings = msg.data
    const context = this

    this.make$(settingsEntity).load$({}, function (err, dbsettings) {
      if (err) {
        return response(null, {ok: false, why: err})
      }

      if (!dbsettings){
        dbsettings = context.make$(settingsEntity, {})
      }

      if (dbsettings.configured){
        return response(null, {ok: false, why: 'No Access'})
      }

      dbsettings = _.extend(dbsettings, settings, {configured: true})

      dbsettings.save$(function(err, settings){
        if (err) {
          return response(null, {ok: false, why: err})
        }

        settings = settings.data$(false)
        return response(null, {ok: true, data: settings})
      })
    })
  }

  function init (args, done) {
    seneca
      .add('role: concorda, cmd: loadSettings', loadSettings)
      .add('role: concorda, cmd: saveSettings', saveSettings)
      .add('role: concorda, cmd: publicLoadSettings', loadSettings)// maybe here I need to filter settings
      .add('role: concorda, cmd: publicSaveSettings', publicSaveSettings)

    done()
  }

  seneca.add('init: ' + name, init)

  return {
    name: name
  }
}
