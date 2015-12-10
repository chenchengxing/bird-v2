var express = require('express')
var fs = require('fs')
var url = require('url')
var path = require('path')
var request = require('request')
// request.debug = true;
var colors = require('colors');
// var http = require('http');
var cheerio = require('cheerio')

module.exports = function login(config, jar, cb) {
  var UUAP_SERVER = config.uuap_server;
  var TARGET_SERVER = config.server;
  var PASSWORD_SUFFIX = config.password_suffix;
  var USERNAME = config.username;
  clearTargetServerJar(jar, TARGET_SERVER, UUAP_SERVER);
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
    var password = USERNAME + (PASSWORD_SUFFIX || '');

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
      // erp feapps need addition routing policy...
      var toUrl = TARGET_SERVER + (config.bprouting || + '')
      request({
        url: toUrl,
        jar: jar
      }, function(error, response, body) {
        // do nothing, jar record the session automatically
        // var cookies = jar.getCookies(TARGET_SERVER);
        // console.log(jar);
        (cb || function (){})()
      })
    })


  });
}

function clearTargetServerJar (jar, serverUrl, uuapUrl) {
  try {
    jar._jar.store.idx[url.parse(serverUrl).hostname] = undefined;
    jar._jar.store.idx[url.parse(uuapUrl).hostname] = undefined;
    // jar._jar.store.removeCookies('cq01-ite-ar-test01.epc', '/ar');
  } catch (e) {
    console.log(e)
  }
}