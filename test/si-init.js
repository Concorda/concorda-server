var Server = require('../server')

exports.init = function (options, done) {
  Server({}, function (err, server) {
    done(err, server ? server.seneca : null)
  })
}
