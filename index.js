var express = require('express')
var fs = require('fs')
var url = require('url')
var path = require('path')
var request = require('request')
// request.debug = true;
var colors = require('colors');
// var http = require('http');
var cheerio = require('cheerio')

var mime = require('mime-types');
var http = require('http-debug').http;
var https = require('http-debug').https; 
 
// http.debug = 2;

var BIRD_CHANGE_USER_PATHNAME = '/bbbbiiiirrrrdddd'


var birdAuth;


var BIRD_USER_SCRIPT = fs.readFileSync(path.join(__dirname, 'change-user-script.js'), 'utf8');
var BIRD_EXTEND_SCRIPT = fs.readFileSync(path.join(__dirname, 'bird-extend-script.js'), 'utf8');



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
    console.log('check your configuration, pls')
    return;
  }
  //session失效时的response的正则匹配表达示
  var BIRD_LOGOUT_RESP_REG = config.logout_resp_reg || /\"code\"\:208/;
  var BIRD_LOGOUT_URL_REG = config.logout_url_reg || /login/;
  var DEV_TOOL = config.dev_tool;
  var ROUTER = config.router;
  var COOKIE = config.cookie;
  //保证路径完整
  var TARGET_SERVER = config.server.slice('-1') === '/' ? config.server : config.server + '/';
  // jar to store cookies
  var jar = request.jar();
  
  birdAuth = config.auth_standalone ? require('./auths/' + config.auth_standalone) : require('./auths/uuap');
  birdAuth(config, jar);

  // setup bird app
  var app = new express()
  app.all('*', function(req, res, next) {
    var urlParsed = url.parse(req.url);
    var filePath = resolveFilePath(config.staticFileRootDirPath, urlParsed.pathname);
    if (urlParsed.pathname === BIRD_CHANGE_USER_PATHNAME) {
      var username = urlParsed.query.split('=')[1]
      config.username = username;
      birdAuth(config, jar, function () {
        console.log(TARGET_SERVER + ' user switched to ', username.black.bgWhite)
        res.write('changed')
        res.end();
      });
    } else if (urlParsed.pathname.match(/logout/)) {
      // console.log(req.headers)
      birdAuth(config, jar, function () {
        console.log(TARGET_SERVER + ' cookie timeout and get a new ', jar.getCookies(TARGET_SERVER))
        res.writeHead(302, {location: req.headers.referer || 'http://' + req.headers.host});
        res.end();
      });
      
    } else {
      fs.stat(filePath, function(err, stats) {
        if (err) {
          
          // set up forward request
          var headers = req.headers;
          headers.cookie = COOKIE || redeemCookieFromJar(jar.getCookies(TARGET_SERVER));
          // headers.host = config.host;
          // console.log("headers.cookie", headers.cookie)
          delete headers['x-requested-with'];
          var requestPath = router(urlParsed.path, ROUTER);
          var urlOptions = {
            host: url.parse(TARGET_SERVER).hostname,
            port: url.parse(TARGET_SERVER).port,
            path: requestPath,
            method: req.method,
            headers: headers,
            rejectUnauthorized: false
          };
          // console.log(headers)
          // proxy to target server
          var forwardUrl = url.resolve(TARGET_SERVER, requestPath);
          // log forwarding message
          console.log('fowarding', filePath.red, 'to', forwardUrl.cyan);
          var httpOrHttps = url.parse(TARGET_SERVER).protocol === 'http:' ? http: https;
          var forwardRequest = httpOrHttps.request(urlOptions, function(response) {
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
              res.setHeader('Content-Type', mime.lookup('.html'));
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
    }

  })
  // go!
  app.listen(config.bird_port)
  console.log('BIRD'.rainbow, '============', config.name, 'RUNNING at', 'http://localhost:' + config.bird_port, '===============', 'BIRD'.rainbow);
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

function isHtmlPage (buffer) {
  var temp = buffer.slice(0, 20);
  var reg = new RegExp('<!DOCTYPE HTML>', 'i')
  return reg.test(temp.toString('utf-8'))
}

function router (url, router) {
  var path = '';
  var reg;
  if (router) {
    for (var i in router) {
      reg = new RegExp(i)
      if (reg.test(url)) {
        path = url.replace(reg, router[i]);
      }
    }
  } else {
    path = url;
  }
  return path;
}
