Back to [TOC](./Readme.md)

# Demo system with fuge

## Requirements

The basic tools are:

   * [Node.js 4](http://nodejs.org)
   * [Docker 1.8](http://docker.com)

Install these before getting started.

## How to use this code

You can clone these branches directly - for example:

```sh
$ git clone https://github.com/vidi-insights/vidi-dashboard concorda-client
$ git clone https://github.com/nearform/concorda
$ git clone https://github.com/nearform/concorda-fuge
```

To save your own work, it is better to first fork the repository on github.com, and then clone them locally

In each repository, you always need to

```sh
$ npm install
```

to get the dependent Node.js modules.
This must be done each time a branch is changed for each micro-service.

## How to start

You can start demo system by using the [fuge](https://github.com/apparatus/fuge) commands.
from inside concorda-fuge folder

```sh
$ fuge shell system.yml
? fuge> start all
```
