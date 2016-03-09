var config;
var http = require('http-debug').http;
var https = require('http-debug').https; 
var fs = require('fs')
var url = require('url')
var path = require('path')

function proxy (req, res, next) {
  var ROUTER = config.router;
  var COOKIE = config.cookie;
  // var AUTO_INDEX = config.autoIndex ? config.autoIndex.split(/\x20+/) : ['index.html']
  //保证路径完整
  var TARGET_SERVER = config.server.slice('-1') === '/' ? config.server : config.server + '/';
  var urlParsed = url.parse(req.url);
  var filePath = resolveFilePath(config.staticFileRootDirPath, urlParsed.pathname);
  if (true) {
    // set up forward request
    var headers = req.headers;
    headers.cookie = COOKIE || redeemCookieFromJar(config.jar.getCookies(TARGET_SERVER));
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
  }
}

module.exports = function (_config) {
  config = _config;
  return proxy;
}

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
