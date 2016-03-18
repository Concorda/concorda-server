'use strict'

var Async = require('async')

module.exports = function (options) {
  var seneca = this

  var name = 'concorda-group'

  function listGroups (msg, response) {
    this.make$('group').list$({}, function (err, groups) {
      if (err) {
        return response(null, {ok: false, why: err})
      }
      groups = groups || []

      for (var i in groups) {
        groups[i] = groups[i].data$(false)
      }

      response(null, {ok: true, data: groups, count: groups.length})
    })
  }

  function addGroup (msg, response) {
    var group = msg.data

    this.make$('group').load$({name: group.name}, function (err, dbgroup) {
      if (err) {
        return response(null, {ok: false, why: err})
      }
      if (dbgroup) {
        return response(null, {ok: false, why: 'Group with same name already exists'})
      }
      this.make$('group', group).save$(function (err, group) {
        if (err) {
          return response(null, {ok: false, why: err})
        }
        if (!group) {
          return response(null, {ok: false, why: 'Internal error'})
        }
        return response(null, {ok: true, data: group.data$(false)})
      })
    })
  }

  function setUserGroups (msg, response) {
    var userId = msg.userId
    var groups = msg.groups
    var that = this

    this.make$('sys', 'user').load$({id: userId}, function (err, user) {
      if (err) {
        return response(null, {ok: false, why: err})
      }
      if (!user) {
        return response(null, {ok: false, why: 'User not found'})
      }

      groups = groups || []
      Async.map(groups, getGroup, function (err, groups) {
        if (err) {
          return response(null, {ok: false, why: err})
        }

        user.groups = groups
        user.save$(function (err) {
          if (err) {
            return response(null, {ok: false, why: err})
          }
          seneca.act('role: concorda, cmd: loadUser', {userId: userId}, response)
        })
      })
    })

    function getGroup (groupId, done) {
      that.make$('group').load$({
        id: groupId
      }, function (err, group) {
        if (group) {
          group = group.data$(false)
        }

        done(err, group)
      })
    }
  }

  function init (args, done) {
    seneca
      .add('role: concorda, cmd: addGroup', addGroup)
      .add('role: concorda, cmd: listGroups', listGroups)
      .add('role: concorda, cmd: listGroupsAlias', listGroups)
      .add('role: concorda, cmd: setUserGroups', setUserGroups)

    done()
  }

  seneca.add('init: ' + name, init)

  return {
    name: name
  }
}
