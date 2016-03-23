var path = require('path');
var config;
var url = require('url');
var request = require('request');

function mockHandle(req, res, next) {
  var urlParsed = url.parse(req.url);
  var mock = config.mock;
  console.log(mock, urlParsed.pathname)
  var mockFile = mock && mock.map && mock.map[urlParsed.pathname]
  if (mockFile) {
    var mockFilePath = path.join(config.staticFileRootDirPath, config.mock.path, mockFile);
    var ret = require(mockFilePath);
    res.json(ret);
  } else if (mock && mock.map && mock.map.hasOwnProperty(urlParsed.pathname)) {
    // mock from platform now
    request({
      method: 'post',
      url: config['bird-platform-url'] + 'mocking',
      headers: {
        bpid: config.id,
        bpmockurl: urlParsed.pathname
      }
    }, function (err, response, body) {
      console.log(err, response)
      res.json(JSON.parse(body));
    })
  } else {
    next()
  }
}

module.exports = function (_config) {
  config = _config;
  return mockHandle;
}