'use strict'

const Assert = require('assert')

const Lab = require('lab')
const lab = exports.lab = Lab.script()
const suite = lab.suite
const test = lab.test
const before = lab.before
const after = lab.after

var Util = require('./test-init.js')

suite('API endpoints should be protected tests ', () => {
  let server = null
  let seneca = null

  let urls = {
    GET: [
      '/api/v1/auth/user',
      '/api/v1/admin/client',
      '/api/v1/admin/client/something',
      '/api/v1/admin/clients',
      '/api/v1/admin/group',
      '/api/v1/admin/groups',
      '/api/v1/admin/settings',
      '/api/v1/admin/logs',
      '/api/v1/admin/user',
      '/api/v1/admin/user/something'
    ],
    POST: [
      '/api/v1/admin/client',
      '/api/v1/admin/user/something/clients',
      '/api/v1/admin/user/something/groups',
      '/api/v1/admin/settings',
      '/api/v1/admin/user/something/enable',
      '/api/v1/admin/user/something/disable',
      '/api/v1/admin/user/something/session/close',
      '/api/v1/admin/user',
      '/api/v1/admin/invite/user'
    ],
    PUT: [
      '/api/v1/admin/client',
      '/api/v1/admin/user/something/clients',
      '/api/v1/admin/user/something/groups',
      '/api/v1/admin/settings',
      '/api/v1/admin/user'
    ],
    DELETE: [
      '/api/v1/admin/client/something',
      '/api/v1/admin/user/something'
    ]
  }

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

  for (let method in urls) {
    for (let url of urls[method]) {
      test(`restrict ${method}: ${url} test`, (done) => {
        server.inject({
          url: url,
          method: method
        }, function (res) {
          Assert.equal(401, res.statusCode)
          done()
        })
      })
    }
  }
})
