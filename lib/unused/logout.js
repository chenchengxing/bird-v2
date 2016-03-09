
var config;
var url = require('url');

function logout(req, res, next) {
  var urlParsed = url.parse(req.url);
  if (urlParsed.pathname.match(/logout/)) {
    config.auth(config, config.jar).then(function () {
      console.info(config.server + ' cookie timeout and get a new ', jar.getCookies(config.server))
      res.writeHead(302, {location: req.headers.referer || 'http://' + req.headers.host});
      res.end();
    });
  } else {
    next()
  }
}

module.exports = function (_config) {
  config = _config;
  return logout;
}