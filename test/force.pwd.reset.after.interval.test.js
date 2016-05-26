'use strict'

const Assert = require('assert')

const Lab = require('lab')
const lab = exports.lab = Lab.script()
const suite = lab.suite
const test = lab.test
const before = lab.before
const after = lab.after

let Util = require('./test-init.js')

suite('Force reset pwd after interval', () => {
  let server
  let cookie
  let seneca
  let user = {
    name: 'someName',
    email: 'someUser3@example.com',
    password: '123123123aZ',
    repeat: '123123123aZ',
    appkey: 'client3'
  }

  before({}, function (done) {
    process.env.PASSWORD_POLICY = JSON.stringify({
      'requireLowercase': '0',
      'requireNumeric': '0',
      'requireUppercase': '0',
      'forceResetPasswordAfterFailedCount': 0,
      'forceChangePasswordAfterInterval': 1,
      'minLength': 6
    })

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
      payload: {name: 'client3', appkey: 'client3'},
      headers: {cookie: 'seneca-login=' + cookie}
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
      Assert(JSON.parse(res.payload).user)
      Assert(JSON.parse(res.payload).login)

      done()
    })
  })

  // change password timestamp for 2 days ago to test this feature
  test('change pwd timestamp', (done) => {
    seneca.make$('sys', 'user').load$({email: user.email}, function (err, user) {
      Assert(!err)
      Assert(user)
      Assert(user.passwordChangeTimestamp)
      user.passwordChangeTimestamp = new Date(user.passwordChangeTimestamp.getTime() - 2 * 24 * 60 * 60 * 1000)
      user.save$(function (err) {
        Assert(!err)
        done()
      })
    })
  })

  test('login failed test - after interval', (done) => {
    let url = '/api/v1/auth/login'
    server.inject({
      url: url,
      method: 'POST',
      payload: {email: user.email, password: user.password, appkey: user.appkey}
    }, function (res) {
      Assert.equal(200, res.statusCode)
      Assert(!JSON.parse(res.payload).ok)
      Assert(JSON.parse(res.payload).why)
      Assert(JSON.parse(res.payload).token)
      Assert.equal(JSON.parse(res.payload).code, 2)

      done()
    })
  })
})
