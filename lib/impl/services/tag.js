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

    this.make$('tag').load$({name: tag.name}, function (err, dbtag) {
      if (err) {
        return response(null, {ok: false, why: err})
      }
      if (dbtag) {
        return response(null, {ok: false, why: 'Tag with same name already exists'})
      }
      this.make$('tag', tag).save$(function (err, tag) {
        if (err) {
          return response(null, {ok: false, why: err})
        }
        if (!tag) {
          return response(null, {ok: false, why: 'Internal error'})
        }
        return response(null, {ok: true, data: tag.data$(false)})
      })
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

      tags = tags || []

      Async.map(tags, getTag, function (err, tags){

        user.tags = tags
        user.save$(function(err, user){
          if (err) {
            return response(null, {ok: false, why: err})
          }
          seneca.act('role: concorda, cmd: loadUser', {userId: userId}, response)
        })
      })
    })

    function getTag(tagId, done){
      that.make$('tag').load$({
        id: tagId
      }, function(err, tag){
        if (tag){
          tag = tag.data$(false)
        }

        done(err, tag)
      })
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
