Back to [TOC](./Readme.md)

# Using Concorda client plugin

## Loading client plugin

A client application should simply load the [Concorda-client](https://github.com/nearform/concorda-client) plugin in order to use Concorda authentication services. 

Use the following example to register the plugin

```
seneca.use('concorda-client', options)
```

## Options

The Concorda client plugin require following options:

 - ```concordaProtocol``` - protocol used by Concorda server  
 - ```concordaHost``` - host used by Concorda server  
 - ```concordaPort``` - port used by Concorda server  
 - ```protocol``` - protocol for current client application - *will be deprecated in the future*  
 - ```host``` - host for current client application - *will be deprecated in the future*  
 - ```port``` - port for current client application - *will be deprecated in the future*  


Default options:

```
const defaultOptions = {
  concordaProtocol: 'http',
  concordaHost: 'localhost',
  concordaPort: 3050,
  protocol: 'http',
  host: 'localhost',
  port: 3000
}
```

