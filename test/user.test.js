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
  let server
  let cookie
  let user = {nick: 'user1', name: 'user1', email: 'user1@example.com', password: '123123123aZ', repeat: '123123123aZ', appkey: 'some'}
  let user2 = {nick: 'user2', name: 'user2', email: 'user2@example.com', password: '123123123aZ', repeat: '123123123aZ'}

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
  /*test('delete user', (done) => {
    let url = '/api/v1/admin/user'

    server.inject({
      url: url,
      method: 'GET',
      headers: { cookie: 'seneca-login=' + cookie }
    }, function (res) {
      Assert.equal(200, res.statusCode)
      const userId = JSON.parse(res.payload).data[0].id

      url = '/api/user/' + userId
      server.inject({
        url: url,
        method: 'DELETE',
        headers: { cookie: 'seneca-login=' + cookie }
      }, function (res) {
        Assert.equal(200, res.statusCode)
        done()
      })
    })
  })*/

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

  /*test('edit profile information', (done) => {
    let url = '/auth/update_user'

    let post = {
      name: 'namey',
      email: 'fake@email.com'
    }

    server.inject({
      url: url,
      method: 'POST',
      headers: { cookie: 'seneca-login=' + cookie },
      payload: post
    }, function (res) {
      Assert.equal('namey', JSON.parse(res.payload))
      Assert.equal('email', JSON.parse(res.payload).email)

      done()
    })
  })*/

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

  test('list user test', (done) => {
    let url = '/api/v1/admin/user'

    server.inject({
      url: url,
      method: 'GET',
      headers: { cookie: 'seneca-login=' + cookie }
    }, function (res) {
      Assert.equal(200, res.statusCode)
      Assert.equal(7, JSON.parse(res.payload).data.length)
      Assert.equal(7, JSON.parse(res.payload).count)

      done()
    })
  })

  test('load user', (done) => {
    let url = '/api/v1/admin/user'

    server.inject({
      url: url,
      method: 'GET',
      headers: { cookie: 'seneca-login=' + cookie }
    }, function (res) {
      Assert.equal(200, res.statusCode)
      const userId = JSON.parse(res.payload).data[0].id

      let url = '/api/v1/admin/user/' + userId
      server.inject({
        url: url,
        method: 'GET',
        headers: { cookie: 'seneca-login=' + cookie }
      }, function (res) {
        Assert.equal(200, res.statusCode)
        Assert.equal(userId, JSON.parse(res.payload).data.id)
        done()
      })
    })
  })

  test('register another user test', (done) => {
    let url = '/api/v1/admin/user'

    server.inject({
      url: url,
      method: 'POST',
      payload: user2,
      headers: { cookie: 'seneca-login=' + cookie }
    }, (res) => {
      Assert.equal(200, res.statusCode)
      Assert.equal(true, JSON.parse(res.payload).ok)
      Assert(JSON.parse(res.payload).data)
      Assert.equal(user2.name, JSON.parse(res.payload).data.name)

      user2 = JSON.parse(res.payload).data

      done()
    })
  })

  let newName = 'aaaaaa'
  test('update another user test', (done) => {
    let url = '/api/v1/admin/user'

    user2.name = newName
    server.inject({
      url: url,
      method: 'PUT',
      payload: user2,
      headers: { cookie: 'seneca-login=' + cookie }
    }, (res) => {
      Assert.equal(200, res.statusCode)

      Assert.equal(true, JSON.parse(res.payload).ok)
      Assert(JSON.parse(res.payload).data)
      Assert.equal(newName, JSON.parse(res.payload).data.name)

      done()
    })
  })

  test('list user test with name sorted ASC', (done) => {
    let url = '/api/v1/admin/user?order={name: 1}'

    server.inject({
      url: url,
      method: 'GET',
      headers: { cookie: 'seneca-login=' + cookie }
    }, function (res) {
      Assert.equal(200, res.statusCode)
      Assert.equal(8, JSON.parse(res.payload).data.length)
      Assert.equal(8, JSON.parse(res.payload).count)

      Assert.equal(newName, JSON.parse(res.payload).data[0].name)

      done()
    })
  })

  test('list user test with name sorted DESC and limit 1 and skip 10', (done) => {
    let url = '/api/v1/admin/user?order={name: -1}&limit=1&skip=10'

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

  test('list user test with name sorted DESC and limit 1 and skip 10', (done) => {
    let url = '/api/v1/admin/user?order={name: -1}&limit=1&skip=10'

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
