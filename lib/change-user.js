
var config;
var url = require('url');
var BIRD_CHANGE_USER_PATHNAME = '/bbbbiiiirrrrdddd'

function changeUser(req, res, next) {
  var urlParsed = url.parse(req.url);
  if (urlParsed.pathname === BIRD_CHANGE_USER_PATHNAME) {
    var username = urlParsed.query.split('=')[1]
    config.username = username;
    config.auth(config, config.jar).then(function () {
      console.info(config.server + ' user switched to ', username.black.bgWhite)
      res.write('changed')
      res.end();
    })
  } else {
    next()
  }
}

module.exports = function (_config) {
  config = _config;
  return changeUser;
}