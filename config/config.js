var Path = require('path')

module.exports = function () {
  function mailConfig () {
    return {
      folder: Path.join(Path.resolve(__dirname), '/../server/email-templates'),
      mail: {
        from: 'no-reply@concorda.com'
      },
      config: {
        host: process.env.MAIL_HOST,
        port: process.env.MAIL_PORT,
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASS,
          ignoreTLS: true
        }
      }
    }
  }

  function googleLoginConfig () {
    return {
      provider: 'google',
      password: process.env.GOOGLE_PASS,
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      isSecure: false
    }
  }

  function githubLoginConfig () {
    return {
      provider: 'github',
      password: process.env.GITHUB_PASS,
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      isSecure: false
    }
  }

  function twitterLoginConfig () {
    return {
      provider: 'twitter',
      password: process.env.TWITTER_PASS,
      clientId: process.env.TWITTER_CLIENT_ID,
      clientSecret: process.env.TWITTER_CLIENT_SECRET,
      isSecure: false
    }
  }

  function adminDataConfig () {
    return {
      name: process.env.USER_NAME || 'Admin',
      email: process.env.USER_EMAIL || 'admin@concorda.com',
      password: process.env.USER_PASS || 'concorda'
    }
  }

  function Concorda () {
    return {
      external_api: process.env.EXTERNAL_API || false,
      external_core: process.env.EXTERNAL_CORE || false
    }
  }

  return {
    'mail': mailConfig(),
    'google-auth': googleLoginConfig(),
    'github-auth': githubLoginConfig(),
    'twitter-auth': twitterLoginConfig(),
    'adminData': adminDataConfig(),
    'concorda': Concorda()
  }
}
