var fs = require('fs')
var url = require('url')
var path = require('path')
var request = require('request')
var colors = require('colors');

module.exports = function login(config, jar, cb) {
  var AUTH_URL = config.auth_url;
  var HEADERS = config.auth_server_headers || 'Content-Type: application/json';
  //保证路径完整
  var TARGET_SERVER = config.server.slice('-1') === '/' ? config.server : config.server + '/';

  var USERNAME = config.username;
  var PASSWORD_SUFFIX = config.password_suffix;
  // clearTargetServerJar(jar, TARGET_SERVER, UUAP_SERVER);
  request({
    method: 'POST',
    url: AUTH_URL,
    json: true,
    body: {
      loginName: USERNAME,
      password: USERNAME + (PASSWORD_SUFFIX || '')
    },
    jar: jar
  }, function(error, response, body) {
    (cb || function (){})()
  });
}

function clearTargetServerJar (jar, serverUrl, uuapUrl) {
  try {
    jar._jar.store.idx[url.parse(serverUrl).hostname] = undefined;
  } catch (e) {
    console.log(e)
  }
}