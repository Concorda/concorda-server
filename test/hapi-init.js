var Server = require('../server')

exports.init = function (options, done) {
  Server({
    server: {
      port: 3070
    },
    db_name: 'concordatest'
  }, function (err, server) {
    if (err) {
      console.log('Error preparing Hapi: ', err)
    }
    setTimeout(function () {
      done(err, server)
    }, 5 * 1000)
  })
}

exports.checkCookie = function (res) {
  console.log(res.headers['set-cookie'])
  var cookie = res.headers['set-cookie'][0]
  cookie = cookie.match(/(?:[^\x00-\x20\(\)<>@\,;\:\\"\/\[\]\?\=\{\}\x7F]+)\s*=\s*(?:([^\x00-\x20\"\,\;\\\x7F]*))/)[1]
  return cookie
}
