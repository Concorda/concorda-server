'use strict'

var Async = require('async')

module.exports = function (options) {
  var seneca = this

  var name = 'concorda-user'

  function listTags (msg, response) {
    this.make$('tag').list$({}, function (err, tags) {
      if (err) {
        return response(null, {ok: false, why: err})
      }
      tags = tags || []

      for (var i in tags) {
        tags[i] = tags[i].data$(false)
      }

      response(null, {ok: true, data: tags, count: tags.length})
    })
  }

  function addTag (msg, response) {
    var tag = msg.data

    this.make$('tag', tag).save$(function (err, tag) {
      if (err) {
        return response(null, {ok: false, why: err})
      }
      if (!tag) {
        return response(null, {ok: false, why: 'Internal error'})
      }
      return response(null, {ok: true, data: tag.data$(false)})
    })
  }

  function setUserTags (msg, response) {
    var userId = msg.userId
    var tags = msg.tag
    var that = this

    this.make$('sys', 'user').load$({id: userId}, function (err, user) {
      if (err) {
        return response(null, {ok: false, why: err})
      }
      if (!user) {
        return response(null, {ok: false, why: 'User not found'})
      }

      removeUserTags({userId: userId, all$: true}, function (err) {
        if (err) {
          return response(null, {ok: false, why: err})
        }

        tags = tags || []
        Async.each(tags, saveTag, function (err) {
          if (err) {
            return response(null, {ok: false, why: err})
          }

          seneca.act('role: concorda, cmd: loadUser', {userId: userId}, response)
        })
      })
    })

    function saveTag (tagId, done) {
      that.make$('tag').load$({id: tagId}, function (err, tag) {
        if (err) {
          return done(err)
        }

        if (!tag) {
          return done('Invalid tag')
        }

        that.make$('user_tag', {userId: userId, tagId: tagId, tagName: tag.name}).save$(done)
      })
    }

    function removeUserTags (msg, response) {
      var userId = msg.userId

      that.make$('user_tag').remove$({userId: userId, all$: true}, response)
    }
  }

  function init (args, done) {
    seneca
      .add('role: concorda, cmd: addTag', addTag)
      .add('role: concorda, cmd: listTags', listTags)
      .add('role: concorda, cmd: listTagsAlias', listTags)
      .add('role: concorda, cmd: setUserTags', setUserTags)

    done()
  }

  seneca.add('init: ' + name, init)

  return {
    name: name
  }
}
