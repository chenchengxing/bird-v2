var express = require('express')
var fs = require('fs')
var url = require('url')
var path = require('path')
var request = require('request')

var colors = require('colors');
var http = require('http');
var cheerio = require('cheerio')


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
  if (!config || !config.staticFileRootDirPath || !config.server || !config.uuap_server || !config.username) {
    console.log('check your configuration, pls')
    return;
  }
  var UUAP_SERVER = config.uuap_server;
  var TARGET_SERVER = config.server;
  var PASSWORD_SUFFIX = config.password_suffix;
  var USERNAME = config.username;
  // jar to store cookies
  var jar = request.jar();
  request({
    url: UUAP_SERVER,
    jar: jar
  }, function(error, response, body) {
    // use cheerio to parse dom
    var $ = cheerio.load(body);
    var hiddenInputs = $('#fm1 input[type=hidden]');

    var lt = $(hiddenInputs.get(0)).val();
    var execution = $(hiddenInputs.get(1)).val();
    var type = 1;
    var _eventId = 'submit';
    var rememberMe = 'on';
    var username = USERNAME;
    var password = USERNAME + PASSWORD_SUFFIX;

    var sessionId = response.headers['set-cookie'][0].split(';')[0];
    // mimic uuap login
    request.post({
      url: UUAP_SERVER + '/login',
      form: {
        username: username,
        password: password,
        rememberMe: rememberMe,
        _eventId: _eventId,
        type: type,
        execution: execution,
        lt: lt
      },
      jar: jar
    }, function(err, httpResponse, body) {
      // request the logined uuap again, and let it redirect for us
      var toUrl = UUAP_SERVER + '/login?service=' + encodeURIComponent(TARGET_SERVER);
      request({
        url: toUrl,
        jar: jar
      }, function(error, response, body) {
        // do nothing, jar record the session automatically
        // var cookies = jar.getCookies(TARGET_SERVER);
      })
    })
  });

  // setup bird app
  var app = new express()
  app.all('*', function(req, res, next) {
    var urlParsed = url.parse(req.url);
    var filePath = resolveFilePath(config.staticFileRootDirPath, urlParsed.pathname);
    fs.stat(filePath, function(err, stats) {
      if (err) {
        // proxy to target server
        var forwardUrl = url.resolve(config.server, urlParsed.path);
        // log forwarding message
        console.log('fowarding', filePath.red, 'to', forwardUrl.cyan);
        // set up forward request
        var headers = req.headers;
        headers.cookie = jar.getCookies(TARGET_SERVER);
        var urlOptions = {
          host: url.parse(TARGET_SERVER).hostname,
          port: url.parse(TARGET_SERVER).port,
          path: urlParsed.path,
          method: req.method,
          headers: headers
        };
        var forwardRequest = http.request(urlOptions, function(response) {
          // set headers to the headers in origin request
          res.writeHead(response.statusCode, response.headers);
          response.on('data', function(chunk) {
            res.write(chunk);
          });
          response.on('end', function() {
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
        fs.readFile(filePath, function(err, content) {
          res.write(content);
          res.end();
        })
      }
    })

  })
  // go!
  app.listen(config.bird_port)
  console.log('============', 'BIRD-SERVER'.rainbow, 'RUNNING at', config.bird_port, '===============');
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