'use strict'

const Lab = require('lab')
const lab = exports.lab = Lab.script()
const suite = lab.suite
const test = lab.test
const before = lab.before
var Code = require('code')
var expect = Code.expect

const Init = require('./hapi-init')

suite('Groups test suite ', () => {
  var seneca
  var userId
  var groupId

  before({}, function (done) {
    Init.init({}, function (err, server) {
      expect(err).to.not.exist()
      expect(server).to.exist()

      seneca = server.seneca
      done()
    })
  })

  test('add group', (done) => {
    seneca.act('role: concorda, cmd: addGroup', {data: {name: 'Concorda'}}, (err, response) => {
      expect(err).to.not.exist()
      expect(response).to.exist()
      expect(response.ok).to.exist()
      expect(response.ok).to.be.true()
      expect(response.data.name).to.exist()
      expect(response.data.name).to.equal('Concorda')
      groupId = response.data.id
      expect(groupId).to.exist()

      done()
    })
  })

  test('list group', (done) => {
    seneca.act('role: concorda, cmd: listGroups', (err, response) => {
      expect(err).to.not.exist()
      expect(response).to.exist()
      expect(response.ok).to.exist()
      expect(response.ok).to.be.true()
      expect(response.data).to.be.an.array()
      expect(response.data).to.have.length(1)
      done()
    })
  })

  test('add user', (done) => {
    seneca.act('role: concorda, cmd: createUser', {data: {password: '123123123aZ', email: 'john@some.com', repeat: '123123123aZ', name: 'John'}}, (err, response) => {
      expect(err).to.not.exist()
      expect(response).to.exist()
      expect(response.ok).to.exist()
      expect(response.ok).to.be.true()
      expect(response.data).to.exist()
      userId = response.data.id
      expect(userId).to.exist()
      done()
    })
  })

  test('add group to user', (done) => {
    seneca.act('role: concorda, cmd: setUserGroups', {userId: userId, groups: [groupId]}, (err, response) => {
      expect(err).to.not.exist()
      expect(response).to.exist()
      expect(response.ok).to.exist()
      expect(response.ok).to.be.true()
      expect(response.data).to.exist()
      expect(response.data.groups).to.exist()
      expect(response.data.groups).to.be.an.array()
      expect(response.data.groups).to.have.length(1)
      done()
    })
  })

  test('remove group to user', (done) => {
    seneca.act('role: concorda, cmd: setUserGroups', {userId: userId, groups: []}, (err, response) => {
      expect(err).to.not.exist()
      expect(response).to.exist()
      expect(response.ok).to.exist()
      expect(response.ok).to.be.true()
      expect(response.data).to.exist()
      expect(response.data.groups).to.exist()
      expect(response.data.groups).to.be.an.array()
      expect(response.data.groups).to.have.length(0)
      done()
    })
  })
})
