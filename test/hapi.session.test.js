'use strict'

var Assert = require('assert')

var Lab = require('lab')
var lab = exports.lab = Lab.script()
var suite = lab.suite
var test = lab.test
var before = lab.before
var after = lab.after

var Util = require('./hapi-init.js')

suite('Hapi user session suite tests ', function () {
  let cookie
  let server
  let user = {nick: 'u1', name: 'nu1', email: 'u1@example.com', password: 'u1', active: true}

  before({}, function (done) {
    Util.init({}, function (err, srv) {
      Assert.ok(!err)

      server = srv

      done()
    })
  })

  after({}, function (done) {
    server.seneca.close()
    done()
  })

  test('register user test', function (done) {
    var url = '/auth/register'

    server.inject({
      url: url,
      method: 'POST',
      payload: user
    }, function (res) {
      Assert.equal(200, res.statusCode)
      Assert(JSON.parse(res.payload).ok)
      Assert(JSON.parse(res.payload).user)
      Assert(JSON.parse(res.payload).login)

      cookie = Util.checkCookie(res)
      user = JSON.parse(res.payload).user

      done()
    })
  })

  test('close user session test', function (done) {
    var url = '/api/user/' + user.id + '/session/close'

    server.inject({
      url: url,
      method: 'POST',
      headers: { cookie: 'seneca-login=' + cookie }
    }, function (res) {
      Assert.equal(200, res.statusCode)
      Assert.equal(1, JSON.parse(res.payload).sessions)

      done()
    })
  })
})
