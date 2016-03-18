'use strict'

module.exports = function (options) {
  var seneca = this

  var name = 'concorda-group'

  function listGroups (msg, response) {
    this.make$('user_group').list$({}, function (err, groups) {
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

    this.make$('user_group').load$({name: group.name}, function (err, dbgroup) {
      if (err) {
        return response(null, {ok: false, why: err})
      }
      if (dbgroup) {
        return response(null, {ok: false, why: 'Group with same name already exists'})
      }
      this.make$('user_group', group).save$(function (err, group) {
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

  function init (args, done) {
    seneca
      .add('role: concorda, cmd: addGroup', addGroup)
      .add('role: concorda, cmd: listGroups', listGroups)
      .add('role: concorda, cmd: listGroupsAlias', listGroups)

    done()
  }

  seneca.add('init: ' + name, init)

  return {
    name: name
  }
}
