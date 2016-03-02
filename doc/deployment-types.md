Back to [TOC](./Readme.md)

# Deployment types

## Deploy as a Seneca plugin with all internal functionality

Use the following example to register as plugin

```
const Concorda = require('concorda')

module.exports = function (options) {
  var seneca = this

  seneca
    .use(Concorda, {
      local: true,
      'google-auth' : {},
      'twitter-auth': {},
      'github-auth' : {}
    })

  return {
    name: 'your-plugin'
  }
}

```

## Deploy as a Seneca plugin with all functionality provided by a Concorda microservice deployment

Use the following example to register as plugin

```
const Concorda = require('concorda')

module.exports = function (options) {
  var seneca = this

  seneca
    .use('mesh', {auto: true})
    .use(Concorda, {
      local: false
    })

  return {
    name: 'your-plugin'
  }
}

```
  

## Deploy as a microservice

```
node start.js
```
