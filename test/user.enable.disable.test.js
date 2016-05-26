'use strict'

const Assert = require('assert')

const Lab = require('lab')
const lab = exports.lab = Lab.script()
const suite = lab.suite
const test = lab.test
const before = lab.before
const after = lab.after

var Util = require('./test-init.js')

suite('Hapi user suite tests ', () => {
  let server = null
  let cookie = null
  let seneca = null
  let userId = null

  let user = {nick: 'user1', name: 'user1', email: 'user1@example.com', password: '123123123aZ', repeat: '123123123aZ', appkey: 'some'}

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
      payload: {name: 'Some client application', appkey: 'some'},
      headers: { cookie: 'seneca-login=' + cookie }
    }, function (res) {
      Assert.equal(200, res.statusCode)
      Assert(JSON.parse(res.payload).ok)
      Assert(JSON.parse(res.payload).data)
      done()
    })
  })

  test('register user test', (done) => {
    let url = '/api/v1/auth/register'

    server.inject({
      url: url,
      method: 'POST',
      payload: user
    }, function (res) {
      Assert.equal(200, res.statusCode)
      Assert(JSON.parse(res.payload).ok)
      Assert(JSON.parse(res.payload).data)

      done()
    })
  })

  test('login user test', (done) => {
    let url = '/api/v1/auth/login'
    server.inject({
      url: url,
      method: 'POST',
      payload: {email: user.email, password: user.password, appkey: user.appkey}
    }, function (res) {
      Assert.equal(200, res.statusCode)
      Assert(JSON.parse(res.payload).ok)
      Assert(JSON.parse(res.payload).user)
      Assert(JSON.parse(res.payload).login)

      userId = JSON.parse(res.payload).user.id
      done()
    })
  })

  test('disable user test', (done) => {
    let url = `/api/v1/admin/user/${userId}/disable`
    server.inject({
      url: url,
      method: 'POST',
      headers: { cookie: 'seneca-login=' + cookie }
    }, function (res) {
      Assert.equal(200, res.statusCode)
      Assert(JSON.parse(res.payload).ok)

      done()
    })
  })

  test('login user should faild because account is disabled test', (done) => {
    let url = '/api/v1/auth/login'
    server.inject({
      url: url,
      method: 'POST',
      payload: {email: user.email, password: user.password, appkey: user.appkey}
    }, function (res) {
      Assert.equal(200, res.statusCode)
      Assert(!JSON.parse(res.payload).ok)

      done()
    })
  })

  test('enable user test', (done) => {
    let url = `/api/v1/admin/user/${userId}/enable`
    server.inject({
      url: url,
      method: 'POST',
      headers: { cookie: 'seneca-login=' + cookie }
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
      payload: {email: user.email, password: user.password, appkey: user.appkey}
    }, function (res) {
      Assert.equal(200, res.statusCode)
      Assert(JSON.parse(res.payload).ok)
      Assert(JSON.parse(res.payload).user)
      Assert(JSON.parse(res.payload).login)
      done()
    })
  })
})
