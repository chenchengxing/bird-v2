var express = require('express')
var fs = require('fs')
var url = require('url')
var path = require('path')
var request = require('request')
var colors = require('colors');
var http = require('http-debug').http;
var https = require('http-debug').https; 

/**
 * start bird with config
 * @param  {Object} config bird-configuration
 * @return {undefined}
 */
module.exports = function start(config) {
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

  if (!config.debug /* silence when not debugging */) {
    global.console.log = function (){};
  }

  var ROUTER = config.router;
  var COOKIE = config.cookie;
  // var AUTO_INDEX = config.autoIndex ? config.autoIndex.split(/\x20+/) : ['index.html']
  //保证路径完整
  var TARGET_SERVER = config.server.slice('-1') === '/' ? config.server : config.server + '/';
  var jar = request.jar();  // jar to store cookies
  config = configResolver(config, jar);
  var auth = config.auth;
  auth(config, jar).then(function () {
    if (config.middleware) {
      function compose(middleware) {
        return function (req, res, next) {
          connect.apply(null, middleware.concat(next.bind(null, null))).call(null, req, res)
        }
      }
      // http://stackoverflow.com/questions/20274483/how-do-i-combine-connect-middleware-into-one-middleware
      return compose([proxy, require('./lib/mock')(config), require('./lib/change-user')(config), require('./lib/logout')(config)]);
    } else {
      // setup bird app
      var app = new express()
      app.all('*', require('./lib/mock')(config))
      app.all('*', require('./lib/static')(config))
      app.all('*', require('./lib/change-user')(config))
      app.all('*', require('./lib/logout')(config))
      app.all('*', proxy)
      // go!
      app.listen(config.bird_port)
      console.info('BIRD'.rainbow, '============', config.name, 'RUNNING at', 'http://localhost:' + config.bird_port, '===============', 'BIRD'.rainbow);
    }
  })

  function configResolver (originConfig, jar) {
    var config = Object.assign({}, originConfig);
    config.auth = require('./auths/' + (originConfig.authType || originConfig.auth_standalone || 'uuap'));
    config.birdPort = originConfig.bird_port;
    config.jar = jar;
    return config;
  }
  
  function proxy (req, res, next) {
    var urlParsed = url.parse(req.url);
    var filePath = resolveFilePath(config.staticFileRootDirPath, urlParsed.pathname);
    if (true) {
      // set up forward request
      var headers = req.headers;
      headers.cookie = COOKIE || redeemCookieFromJar(jar.getCookies(TARGET_SERVER));
      // headers.host = config.host;
      // console.info("headers.cookie", headers.cookie)
      delete headers['x-requested-with'];
      var requestPath = router(urlParsed.path, ROUTER);
      // console.info('requestPath:', requestPath);
      var urlOptions = {
        host: url.parse(TARGET_SERVER).hostname,
        port: url.parse(TARGET_SERVER).port,
        path: requestPath,
        method: req.method,
        headers: headers,
        rejectUnauthorized: false
      };
      console.log('headers', headers);
      // proxy to target server
      var forwardUrl = url.resolve(TARGET_SERVER, requestPath);
      // log forwarding message
      console.info('fowarding', filePath.red, 'to', forwardUrl.cyan);
      var httpOrHttps = url.parse(TARGET_SERVER).protocol === 'http:' ? http : https;
      var forwardRequest = httpOrHttps.request(urlOptions, function(response) {
        // set headers to the headers in origin request
        res.writeHead(response.statusCode, response.headers);
        response.on('data', function(chunk) {
          // body += chunk;
          res.write(chunk);
        });

        response.on('end', function() {
          // console.info(body)
          res.end();
        });
      });
      forwardRequest.on('error', function(e) {
        console.error('problem with request: ' + e.message);
      });

      req.addListener('data', function(chunk) {
        forwardRequest.write(chunk);
      });

      var mockFilePath = path.join(config.staticFileRootDirPath, config.mock.path, mockFile);
      var ret = require(mockFilePath);
      res.json(ret);

    } else {
      fs.stat(filePath, function(err, stats) {
        if (err) {
          // set up forward request
          var headers = req.headers;
          headers.cookie = COOKIE || redeemCookieFromJar(jar.getCookies(TARGET_SERVER));
          // console.log("headers.cookie", headers.cookie)
          delete headers['x-requested-with'];
          var requestPath = router(urlParsed.path, ROUTER);
          // console.log('requestPath:', requestPath);
          var urlOptions = {
            host: url.parse(TARGET_SERVER).hostname,
            port: url.parse(TARGET_SERVER).port,
            path: requestPath,
            method: req.method,
            headers: headers
          };
          // proxy to target server
          var forwardUrl = url.resolve(TARGET_SERVER, requestPath);
          // log forwarding message
          console.log('fowarding', filePath.red, 'to', forwardUrl.cyan);
          var forwardRequest = http.request(urlOptions, function(response) {
            // var body = '---'
            //check if cookie is timeout
            if (response.headers.location && response.headers.location.match(BIRD_LOGOUT_URL_REG)) {
               birdAuth(config, jar, function () {
                 console.log(TARGET_SERVER + '302 cookie timeout and get a new ', jar.getCookies(TARGET_SERVER))
                 response.headers.location = urlParsed.path;
                 res.writeHead(response.statusCode, response.headers);
                 res.end();
               });
             } else{
              // set headers to the headers in origin request
              res.writeHead(response.statusCode, response.headers);
              response.on('data', function(chunk) {
                // body += chunk;
                res.write(chunk);
              });
             }

            response.on('end', function() {
              // console.log(body)
              res.end();
            });
          });
          forwardRequest.on('error', function(e) {
            console.error('problem with request: ' + e.message);
          });

          req.addListener('data', function(chunk) {
            forwardRequest.write(chunk);
          });

          req.addListener('end', function() {
            forwardRequest.end();
          });
        } else {
          // server as static file
          fs.readFile(filePath, function(err, buffer) {
            if (isHtmlPage(buffer)) {
              // add something nasty in it, that's where bird dev-tool exists
              var $ = cheerio.load(buffer.toString('utf-8'));
              $('head').append('<script type="text/javascript">' + BIRD_EXTEND_SCRIPT + '</script>')
              $('head').append('<script type="text/javascript">window.birdv2.config=' + JSON.stringify(config) + '</script>')
              if (DEV_TOOL) {
                $('head').append('<script type="text/javascript">' + BIRD_USER_SCRIPT + '</script>')
                // console.log($.html())
              }
              res.write($.html())
              res.end();
            } else {
              var mimeType = mime.lookup(path.extname(filePath));
              res.setHeader('Content-Type', mimeType);
              res.write(buffer);
              res.end();
            }
          })
        }
      })
      var mockFilePath = path.join(config.staticFileRootDirPath, config.mock.path, mockFile);
      var ret = require(mockFilePath);
      res.json(ret);

    } else {
      fs.stat(filePath, function(err, stats) {
        if (err) {
          // set up forward request
          var headers = req.headers;
          headers.cookie = COOKIE || redeemCookieFromJar(jar.getCookies(TARGET_SERVER));
          // console.log("headers.cookie", headers.cookie)
          delete headers['x-requested-with'];
          var requestPath = router(urlParsed.path, ROUTER);
          // console.log('requestPath:', requestPath);
          var urlOptions = {
            host: url.parse(TARGET_SERVER).hostname,
            port: url.parse(TARGET_SERVER).port,
            path: requestPath,
            method: req.method,
            headers: headers
          };
          // proxy to target server
          var forwardUrl = url.resolve(TARGET_SERVER, requestPath);
          // log forwarding message
          console.log('fowarding', filePath.red, 'to', forwardUrl.cyan);
          var forwardRequest = http.request(urlOptions, function(response) {
            // var body = '---'
            //check if cookie is timeout
            if (response.headers.location && response.headers.location.match(BIRD_LOGOUT_URL_REG)) {
               birdAuth(config, jar, function () {
                 console.log(TARGET_SERVER + '302 cookie timeout and get a new ', jar.getCookies(TARGET_SERVER))
                 response.headers.location = urlParsed.path;
                 res.writeHead(response.statusCode, response.headers);
                 res.end();
               });
             } else{
              // set headers to the headers in origin request
              res.writeHead(response.statusCode, response.headers);
              response.on('data', function(chunk) {
                // body += chunk;
                res.write(chunk);
              });
             }

            response.on('end', function() {
              // console.log(body)
              res.end();
            });
          });

          if (req._body) {
            forwardRequest.write(JSON.stringify(req.body))
          }

          forwardRequest.on('error', function(e) {
            console.error('problem with request: ' + e.message);
          });

          req.addListener('data', function(chunk) {
            forwardRequest.write(chunk);
          });

          req.addListener('end', function() {
            forwardRequest.end();
          });
        } else {
          // server as static file
          fs.readFile(filePath, function(err, buffer) {
            if (isHtmlPage(buffer)) {
              // add something nasty in it, that's where bird dev-tool exists
              var $ = cheerio.load(buffer.toString('utf-8'));
              $('head').append('<script type="text/javascript">' + BIRD_EXTEND_SCRIPT + '</script>')
              $('head').append('<script type="text/javascript">window.birdv2.config=' + JSON.stringify(config) + '</script>')
              if (DEV_TOOL) {
                $('head').append('<script type="text/javascript">' + BIRD_USER_SCRIPT + '</script>')
                // console.log($.html())
              }
              res.write($.html())
              res.end();
            } else {
              var mimeType = mime.lookup(path.extname(filePath));
              res.setHeader('Content-Type', mimeType);
              res.write(buffer);
              res.end();
            }
          })
        }
      })
      req.addListener('end', function() {
        forwardRequest.end();
      });
    }
  }
};

/**
 * resolve static file path,, take care of welcome file
 * @param  {String} staticFileRootDirPath
 * @param  {String} pathname
 * @return {String} working path
 */
function resolveFilePath (staticFileRootDirPath, pathname) {
  if (pathname === '/') { // resolve welcome file
    return path.join(staticFileRootDirPath, 'index.html')
  }
  return path.join(staticFileRootDirPath, pathname);
}

/**
 * get the normalized cookie from jar
 * @param  {Array} cookieArray
 * @return {String} cookie string used in headers
 */
function redeemCookieFromJar (cookieArray) {
  var result = '';
  for (var i = 0; i < cookieArray.length; i++) {
    result += cookieArray[i].key + '=' + cookieArray[i].value + ';';
    if (i !== cookieArray.length - 1) {
      result += ' ';
    }
  }
  return result;
}

function router (url, router) {
  var path = '';
  var reg;
  if (router) {
    for (var i in router) {
      reg = new RegExp(i)
      if (reg.test(url)) {
        path = url.replace(reg, router[i]);
        console.log('special route mapping found! converting...', url, 'to', path)
      }
    }
  } else {
    path = url;
  }
  return path;
}

