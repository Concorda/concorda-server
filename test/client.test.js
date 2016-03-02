'use strict'

const Assert = require('assert')

const Lab = require('lab')
const lab = exports.lab = Lab.script()
const suite = lab.suite
const test = lab.test
const before = lab.before
const after = lab.after

var Util = require('./hapi-init.js')

suite('Hapi client suite tests ', () => {
  let server
  let cookie
  let user = {nick: 'u1', name: 'nu1', email: 'u1@example.com', password: 'u1', active: true}
  let client = {name: 'Client', active: true}
  var clientId

  before({}, function (done) {
    Util.init({}, function (err, srv) {
      Assert.ok(!err)

      server = srv

      done()
    })
  })

  after({}, (done) => {
    server.seneca.close()
    done()
  })

  test('register user test', (done) => {
    let url = '/auth/register'

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

      done()
    })
  })


  test('register client test', (done) => {
    let url = '/api/client'

    server.inject({
      url: url,
      method: 'POST',
      payload: client,
      headers: { cookie: 'seneca-login=' + cookie }
    }, function (res) {
      Assert.equal(200, res.statusCode)
      Assert(JSON.parse(res.payload).ok)
      Assert(JSON.parse(res.payload).data)

      done()
    })
  })

  test('list clients test', (done) => {
    let url = '/api/client'

    server.inject({
      url: url,
      method: 'GET',
      headers: { cookie: 'seneca-login=' + cookie }
    }, function (res) {
      Assert.equal(200, res.statusCode)
      // 2 clients because one is created by default - Concorda
      Assert.equal(1, JSON.parse(res.payload).data.length)
      Assert.equal(1, JSON.parse(res.payload).count)

      clientId = JSON.parse(res.payload).data[0].id

      done()
    })
  })

  test('delete client', (done) => {
    let url = '/api/client/' + clientId

    server.inject({
      url: url,
      method: 'DELETE',
      headers: { cookie: 'seneca-login=' + cookie }
    }, function (res) {
      Assert.equal(200, res.statusCode)
      Assert(JSON.parse(res.payload).ok)

      done()
    })
  })

  test('list clients test', (done) => {
    let url = '/api/client'

    server.inject({
      url: url,
      method: 'GET',
      headers: { cookie: 'seneca-login=' + cookie }
    }, function (res) {
      Assert.equal(200, res.statusCode)
      Assert.equal(0, JSON.parse(res.payload).data.length)
      Assert.equal(0, JSON.parse(res.payload).count)

      done()
    })
  })
})
