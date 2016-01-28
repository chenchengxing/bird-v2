
var config;
var url = require('url');

function mockHandle(req, res, next) {
  var urlParsed = url.parse(req.url);
  var mock = config.mock;
  var mockFile = mock && mock.map && mock.map[urlParsed.pathname]
  if (mockFile) {
    var mockFilePath = path.join(config.staticFileRootDirPath, config.mock.path, mockFile);
    var ret = require(mockFilePath);
    res.json(ret);
  } else {
    next()
  }
}

module.exports = function (_config) {
  config = _config;
  return mockHandle;
}