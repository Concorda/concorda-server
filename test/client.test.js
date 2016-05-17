'use strict'

const Assert = require('assert')

const Lab = require('lab')
const lab = exports.lab = Lab.script()
const suite = lab.suite
const test = lab.test
const before = lab.before
const after = lab.after
// var Code = require('code')
// var expect = Code.expect

var Util = require('./hapi-init.js')

suite('Hapi client suite tests ', () => {
  let server
  let cookie
  // let user = {nick: 'u1', name: 'nu1', email: 'u1@example.com', password: '123123123aZ', repeat: '123123123aZ', active: true, appkey: 'some'}
  // let client = {name: 'Client', active: true, appkey: 'client'}
  // let userId
  // let clientId
  // let seneca

  before({}, function (done) {
    Util.init({}, function (err, srv) {
      Assert.ok(!err)

      server = srv
      // seneca = server.seneca

      done()
    })
  })

  after({}, (done) => {
    server.seneca.close()
    done()
  })
/*
  test('register user test', (done) => {
    let url = '/api/v1/auth/register'

    server.inject({
      url: url,
      method: 'POST',
      payload: user
    }, function (res) {
      Assert.equal(200, res.statusCode)
      console.log(JSON.stringify(res.payload))
      Assert(JSON.parse(res.payload).ok)
      Assert(JSON.parse(res.payload).data)

      done()
    })
  })
*/
  test('login user test', (done) => {
    let url = '/api/v1/auth/login'

    server.inject({
      url: url,
      method: 'POST',
      payload: {nick: 'admin@concorda.com', password: 'concorda', appkey: 'concorda'}
    }, function (res) {
      Assert.equal(200, res.statusCode)
      console.log(JSON.parse(res.payload))
      Assert(JSON.parse(res.payload).user)
      Assert(JSON.parse(res.payload).login)

      cookie = Util.checkCookie(res)
//      userId = JSON.parse(res.payload).user.id
      done()
    })
  })
/*
    test('register client test', (done) => {
      let url = '/api/v1/admin/client'

      server.inject({
        url: url,
        method: 'POST',
        payload: client,
        headers: { cookie: 'seneca-login=' + cookie }
      }, function (res) {
        Assert.equal(200, res.statusCode)
        console.log(JSON.parse(res.payload))
        Assert(JSON.parse(res.payload).ok)
        Assert(JSON.parse(res.payload).data)

        clientId = JSON.parse(res.payload).data.id
        done()
      })
    })
*/
  test('list clients test', (done) => {
    let url = '/api/v1/admin/client'

    server.inject({
      url: url,
      method: 'GET',
      headers: { cookie: 'seneca-login=' + cookie }
    }, function (res) {
      Assert.equal(200, res.statusCode)
      // 2 clients because one is created by default - Concorda
      Assert.equal(1, JSON.parse(res.payload).data.length)
      Assert.equal(1, JSON.parse(res.payload).count)

      // clientId = JSON.parse(res.payload).data[0].id

      done()
    })
  })
/*
    test('delete client', (done) => {
      let url = '/api/v1/admin/client/' + clientId

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
      let url = '/api/v1/admin/client'

      server.inject({
        url: url,
        method: 'GET',
        headers: { cookie: 'seneca-login=' + cookie }
      }, function (res) {
        Assert.equal(200, res.statusCode)
        Assert.equal(1, JSON.parse(res.payload).data.length)
        Assert.equal(1, JSON.parse(res.payload).count)

        done()
      })
    })

    test('add client to user', (done) => {
      seneca.act('role: concorda, cmd: setUserClients', {userId: userId, clients: [clientId]}, (err, response) => {
        expect(err).to.not.exist()
        expect(response).to.exist()
        expect(response.ok).to.exist()
        expect(response.ok).to.be.true()
        expect(response.data).to.exist()
        expect(response.data.clients).to.exist()
        expect(response.data.clients).to.be.an.array()
        expect(response.data.clients).to.have.length(1)
        done()
      })
    })

    test('remove client to user', (done) => {
      seneca.act('role: concorda, cmd: setUserClients', {userId: userId, clients: []}, (err, response) => {
        expect(err).to.not.exist()
        expect(response).to.exist()
        expect(response.ok).to.exist()
        expect(response.ok).to.be.true()
        expect(response.data).to.exist()
        expect(response.data.clients).to.exist()
        expect(response.data.clients).to.be.an.array()
        expect(response.data.clients).to.have.length(0)
        done()
      })
    })
    */
})
