var fs = require('fs')
var url = require('url')
var path = require('path')
var request = require('request')
var colors = require('colors');
var Promise = require('bluebird');
/*
    hi的必要配制
    name: 'hi xx',
    bird_port: 7676,
    staticFileRootDirPath: '../any',
    auth_standalone: true,
    server: 'http://10.10.88.88:8888/',
    auth_url: 'http://10.10.88.88:8888/hi/api/login/loginCS',
    username: 'admin',
    password_suffix: ''

*/
module.exports = function (config, jar) {
  var promise = new Promise(function hiLogin(resolve) {
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
      console.log(error,body);
      resolve();
    });
  });
  return promise;
}

function clearTargetServerJar (jar, serverUrl, uuapUrl) {
  try {
    jar._jar.store.idx[url.parse(serverUrl).hostname] = undefined;
  } catch (e) {
    console.log(e)
  }
}