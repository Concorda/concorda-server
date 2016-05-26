'use strict'

var Assert = require('assert')

var Lab = require('lab')
var lab = exports.lab = Lab.script()
var suite = lab.suite
var test = lab.test
var before = lab.before
var after = lab.after

var Util = require('./test-init.js')

suite('Hapi user session suite tests ', function () {
  let cookie
  let server
  let seneca
  let user = {name: 'zzzzzz', email: 'u2@example.com', password: '123123123aZ', repeat: '123123123aZ', appkey: 'session'}

  before({}, function (done) {
    Util.init({}, function (err, srv) {
      Assert.ok(!err)

      server = srv
      seneca = server.seneca

      done()
    })
  })

  after({}, (done) => {
    Util.after(seneca, done)
  })

  // ////////////////////////////////////////
  // this will "unlock" default user as this
  // is locked to force change its password
  // START
  // ////////////////////////////////////////
  let token
  test('login default user failed test', (done) => {
    let url = '/api/v1/auth/login'
    server.inject({
      url: url,
      method: 'POST',
      payload: {email: 'admin@concorda.com', password: 'concorda', appkey: 'concorda'}
    }, function (res) {
      Assert.equal(200, res.statusCode)
      Assert(!JSON.parse(res.payload).ok)
      Assert(JSON.parse(res.payload).why)
      Assert(JSON.parse(res.payload).token)
      Assert.equal(JSON.parse(res.payload).code, 2)

      token = JSON.parse(res.payload).token
      done()
    })
  })

  test('change password for default user test', (done) => {
    let url = '/api/v1/auth/execute_reset'
    server.inject({
      url: url,
      method: 'POST',
      payload: {token: token, password: 'concorda', repeat: 'concorda'}
    }, function (res) {
      Assert.equal(200, res.statusCode)
      Assert(JSON.parse(res.payload).ok)

      done()
    })
  })

  test('login user test', (done) => {
    let url = '/api/v1/auth/login'
    server.inject({
      url: url,
      method: 'POST',
      payload: {email: 'admin@concorda.com', password: 'concorda', appkey: 'concorda'}
    }, function (res) {
      Assert.equal(200, res.statusCode)
      Assert(JSON.parse(res.payload).user)
      Assert(JSON.parse(res.payload).login)

      cookie = Util.checkCookie(res)
      done()
    })
  })
  // /////////////////////////////////////
  // END "unlocking" default user
  // /////////////////////////////////////

  test('register client test', (done) => {
    let url = '/api/v1/admin/client'

    server.inject({
      url: url,
      method: 'POST',
      payload: {name: 'Some client application', appkey: 'session'},
      headers: { cookie: 'seneca-login=' + cookie }
    }, function (res) {
      Assert.equal(200, res.statusCode)
      Assert(JSON.parse(res.payload).ok)
      Assert(JSON.parse(res.payload).data)

      done()
    })
  })

  test('register user test', function (done) {
    var url = '/api/v1/auth/register'

    server.inject({
      url: url,
      method: 'POST',
      payload: user
    }, function (res) {
      Assert.equal(200, res.statusCode)
      Assert(JSON.parse(res.payload).ok)
      Assert(JSON.parse(res.payload).data)

      user = JSON.parse(res.payload).data
      done()
    })
  })

  test('register new user', (done) => {
    let url = '/api/v1/auth/login'

    server.inject({
      url: url,
      method: 'POST',
      payload: {nick: user.nick, password: '123123123aZ', appkey: 'session'}
    }, function (res) {
      Assert.equal(200, res.statusCode)
      Assert(JSON.parse(res.payload).ok)
      Assert(JSON.parse(res.payload).user)
      Assert(JSON.parse(res.payload).login)
      done()
    })
  })

  test('login user test', (done) => {
    let url = '/api/v1/auth/login'

    server.inject({
      url: url,
      method: 'POST',
      payload: {nick: 'admin@concorda.com', password: 'concorda', appkey: 'concorda'}
    }, function (res) {
      Assert.equal(200, res.statusCode)
      Assert(JSON.parse(res.payload).user)
      Assert(JSON.parse(res.payload).login)

      cookie = Util.checkCookie(res)
      done()
    })
  })

  test('close user session test', function (done) {
    var url = '/api/v1/admin/user/' + user.id + '/session/close'

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
