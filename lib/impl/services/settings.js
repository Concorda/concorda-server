'use strict'

const _ = require('lodash')
const Jsonic = require('jsonic')

module.exports = function (options) {
  let seneca = this

  let name = 'concorda-client'
  let settingsEntity = 'settings'

  function loadSettings (msg, response) {
    this.make$(settingsEntity).load$({}, function (err, settings) {
      if (err) {
        return response(null, {ok: false, why: err})
      }

      if (settings && settings.id) {
        settings = settings ? settings.data$(false) : {}
      }
      else {
        // settings not in DB, report default settings
        settings = getDefaultValues()
      }

      return response(null, {ok: true, data: settings})
    })
  }

  function saveSettings (msg, response) {
    let settings = msg.data
    const context = this

    this.make$(settingsEntity).load$({}, function (err, dbsettings) {
      if (err) {
        return response(null, {ok: false, why: err})
      }

      if (!dbsettings) {
        dbsettings = context.make$(settingsEntity, {})
      }

      settings = _.extend(dbsettings, settings, {configured: true})

      settings.save$(function (err, settings) {
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

      if (!dbsettings) {
        dbsettings = context.make$(settingsEntity, {})
      }

      if (dbsettings.configured) {
        return response(null, {ok: false, why: 'No Access'})
      }

      dbsettings = _.extend(dbsettings, settings, {configured: true})

      dbsettings.save$(function (err, settings) {
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
      .add('role: concorda, cmd: publicLoadSettings', loadSettings)// maybe here I need to filter settings ?
      .add('role: concorda, cmd: publicSaveSettings', publicSaveSettings)

    done()
  }

  function getDefaultValues () {
    let settings = {}

    settings.publicRegister = (process.env.PUBLIC_REGISTER || '1')
    settings.authType = process.env.AUTH_TYPE ? Jsonic(process.env.AUTH_TYPE) : {
      'google': '0',
      'github': '0',
      'twitter': '0'
    }
    settings.configured = true
    settings.passwordPolicy = process.env.PASSWORD_POLICY ? Jsonic(process.env.PASSWORD_POLICY) : {
      'requireLowercase': '0',
      'requireNumeric': '0',
      'requireUppercase': '0',
      'minLength': 6
    }
    settings.userPolicy = process.env.USER_POLICY ? Jsonic(process.env.USER_POLICY) : {
      'activateAccount': '0',
      'forceChangePassword': '0'
    }
    settings.emailTemplateFolder = process.env.MAIL_TEMPLATE_FOLDER
    return settings
  }

  seneca.add('init: ' + name, init)

  return {
    name: name
  }
}
