var Seneca = require('seneca')

exports.init = function (options, done) {
  const seneca = Seneca({log: 'silent'})
  seneca
    .use(require('seneca-user'))
    .use(require('../lib/impl/services/user'))
    .use(require('../lib/impl/services/client'))
    .use(require('../lib/impl/services/tag'))
  seneca.ready(() => {
    done(null, seneca)
  })
}
