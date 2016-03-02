'use strict'

const Lab = require('lab')
const lab = exports.lab = Lab.script()
const suite = lab.suite
const test = lab.test
const before = lab.before
var Code = require('code')
var expect = Code.expect

const Init = require('./si-init')

suite('Tags test suite ', () => {
  var seneca
  var userId
  var tagId

  before({}, function (done) {
    Init.init({}, function (err, si) {
      expect(err).to.not.exist()
      expect(si).to.exist()

      seneca = si
      done()
    })
  })

  test('add tag', (done) => {
    seneca.act('role: concorda, cmd: addTag', {data: {name: 'Concorda'}}, (err, response) => {
      expect(err).to.not.exist()
      expect(response).to.exist()
      expect(response.ok).to.exist()
      expect(response.ok).to.be.true()
      expect(response.data.name).to.exist()
      expect(response.data.name).to.equal('Concorda')
      tagId = response.data.id
      expect(tagId).to.exist()

      done()
    })
  })

  test('list tag', (done) => {
    seneca.act('role: concorda, cmd: listTags', (err, response) => {
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
    seneca.act('role: concorda, cmd: createUser', {data: {nick: 'u1', password: 'u1', email: 'some@email.com', firstName: 'John'}}, (err, response) => {
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

  test('add tag to user', (done) => {
    seneca.act('role: concorda, cmd: setUserTags', {userId: userId, tag: [tagId]}, (err, response) => {
      expect(err).to.not.exist()
      expect(response).to.exist()
      expect(response.ok).to.exist()
      expect(response.ok).to.be.true()
      expect(response.data).to.exist()
      expect(response.data.tags).to.exist()
      expect(response.data.tags).to.be.an.array()
      expect(response.data.tags).to.have.length(1)
      done()
    })
  })

  test('remove tag to user', (done) => {
    seneca.act('role: concorda, cmd: setUserTags', {userId: userId, tags: []}, (err, response) => {
      expect(err).to.not.exist()
      expect(response).to.exist()
      expect(response.ok).to.exist()
      expect(response.ok).to.be.true()
      expect(response.data).to.exist()
      expect(response.data.tags).to.exist()
      expect(response.data.tags).to.be.an.array()
      expect(response.data.tags).to.have.length(0)
      done()
    })
  })
})
