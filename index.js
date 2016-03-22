var express = require('express')
var request = require('request')
var colors = require('colors');
var fetchConfig = require('./lib/fetch-config-from-platform');
var _ = require('lodash');

/**
 * start bird with config
 * @param  {Object} config bird-configuration
 * @return {undefined}
 */
module.exports = function start(config) {
  // allow multiple bird instances
  if (config && Array.isArray(config)) {
    for (var i = 0; i < config.length; i++) {
      start(config[i])
    }
    return;
  }

  var jar = request.jar();  // jar to store cookies
  config = configResolver(config, jar);

  // check if config ok
  if (!config.ifOk) {
    console.info('check your configuration, pls')
    return;
  }
  // silence when not debugging 
  if (!config.debug) {
    global.console.log = function (){};
  }
  
  if (config.middleware) {
    if (config.ifAuth) {
      config.auth(config, jar);
    }
    // http://stackoverflow.com/questions/20274483/how-do-i-combine-connect-middleware-into-one-middleware
    return listAll([
      require('./lib/mock')(config),
      require('./lib/change-user')(config),
      require('./lib/proxy')(config)
    ]);
  } else {
    fetchConfig(config).then(function (platformConfig) {
      config = _.extend(config, platformConfig);
      config = configResolver(config, jar);
      if (config.ifAuth) {
        config.auth(config, jar).then(function () {
          // setup bird app
          var app = new express()
          app.all('*', require('./lib/mock')(config))
          app.all('*', require('./lib/static')(config))
          app.all('*', require('./lib/change-user')(config))
          if (config.ifProxy) {
            app.all('*', require('./lib/proxy')(config))
          }
          // go!
          app.listen(config.birdPort)
          console.info('BIRD'.rainbow, '============', config.name || '', 'RUNNING at', 'http://localhost:' + config.birdPort, '===============', 'BIRD'.rainbow);
        })
      } else {
        var app = new express()
        app.all('*', require('./lib/mock')(config))
        app.all('*', require('./lib/static')(config))
        if (config.ifProxy) {
          app.all('*', require('./lib/proxy')(config))
        }
        app.listen(config.birdPort)
        console.info('BIRD'.rainbow, '============', config.name || '', 'RUNNING at', 'http://localhost:' + config.birdPort, '===============', 'BIRD'.rainbow);
      }
    });
  }
}

function configResolver (originConfig, jar) {
  if (!originConfig || typeof originConfig !== 'object') {
    return {
      ifOk: false
    }
  }
  var config = Object.assign({}, originConfig);
  if (!config.staticFileRootDirPath) {
    config.ifOk = false;
    return config
  }
  config.ifOk = true;
  if (config.server) {
    config.ifProxy = true;
  }
  if (config.username && (config.hasOwnProperty('password') || config.hasOwnProperty('password_suffix'))) {
    config.ifAuth = true;
    config.auth = require('./auths/' + (originConfig.authType || originConfig.auth_standalone || 'uuap'));
  }
  config.birdPort = originConfig.bird_port || 8888;
  config.jar = jar;
  return config;
}

function listAll(list) {
  return function (req, res, next) {
    (function iter(i) {
      var mid = list[i]
      if (!mid) return next()
      mid(req, res, function (err) {
        if (err) return next(err)
        iter(i + 1)
      })
    }(0))
  }
}
