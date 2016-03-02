Back to [TOC](./Readme.md)

# Installing Concorda Dashboard

### What is Concorda Dashboard

Concorda Dashboard is default UI implemented in React for Concorda system. 


### Installing Concorda Dashboard

Clone github repository for [Concorda Dashboard](https://github.com/nearform/concorda-dashboard)

```
git clone git@github.com:nearform/concorda-dashboard.git
```

then

1. Run `npm install` to install all dependencies
2. Copy `config/sample.env` to `config/production.env` or `config/development.env` and put the right configuration in there. 
3. Run `npm run build` to build the project.
4. Run `npm run start` to create a deploy and server on port `3050` in production mode
	OR
	`npm run start:dev` to create a deploy and server on port `3050` in development mode

Also you can watch the files for changes and automatically rebuild the sources by running `npm run watch`
in a different terminal.

