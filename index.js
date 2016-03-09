var express = require('express')
var request = require('request')
var colors = require('colors');


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

  if (!config || !config.staticFileRootDirPath || !config.server || !config.username) {
    console.info('check your configuration, pls')
    return;
  }
  /* silence when not debugging */
  if (!config.debug) {
    global.console.log = function (){};
  }

  var jar = request.jar();  // jar to store cookies
  config = configResolver(config, jar);
  var auth = config.auth;
  if (config.middleware) {
    auth(config, jar);
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
    // http://stackoverflow.com/questions/20274483/how-do-i-combine-connect-middleware-into-one-middleware
    return listAll([
      require('./lib/mock')(config),
      require('./lib/change-user')(config),
      require('./lib/proxy')(config)
    ]);
  } else {
    auth(config, jar).then(function () {
      // setup bird app
      var app = new express()
      app.all('*', require('./lib/mock')(config))
      app.all('*', require('./lib/static')(config))
      app.all('*', require('./lib/change-user')(config))
      app.all('*', require('./lib/proxy')(config))
      // go!
      app.listen(config.bird_port)
      console.info('BIRD'.rainbow, '============', config.name, 'RUNNING at', 'http://localhost:' + config.bird_port, '===============', 'BIRD'.rainbow);
    })
  }

  
  
  
}

function configResolver (originConfig, jar) {
  // if (!originConfig || typeof originConfig !== 'object') {
  //   return {
  //     ok: false
  //   }
  // }
  var config = Object.assign({}, originConfig);
  // if (!config.staticFileRootDirPath) {
  //   config.ok = false;
  //   return config
  // }
  // if ()
  config.auth = require('./auths/' + (originConfig.authType || originConfig.auth_standalone || 'uuap'));
  config.birdPort = originConfig.bird_port;
  config.jar = jar;
  return config;
}

