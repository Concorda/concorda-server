var Server = require('../server')

exports.init = function (options, done) {
  Server({
    server: {
      port: 3070
    }
  }, function (err, server) {
    done(err, server ? server.seneca : null)
  })
}
