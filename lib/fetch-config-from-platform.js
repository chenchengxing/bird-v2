var Promise = require('bluebird');
var request = require('request');
var _ = require('lodash');

module.exports = function fetchConfig (config) {
  var promise = new Promise(function (resolve) {
    request({
      method: 'get',
      url: config['bird-platform-url'] + 'api/environment/' + config['id']
    }, function (err, response, body) {
      // console.info(response)
      if (!err) {
        var data = JSON.parse(body);
        if (data.code === 200) {
          resolve(mapPlatformConfigToClientConfig(data.data))
        }
      }
    })
  })
  return promise;
}



function mapPlatformConfigToClientConfig (platformConfig) {
  var result = {};
  result.server = platformConfig.serverUrl;
  result.authType = platformConfig.authType;
  result.username = platformConfig.username;
  result['password_suffix'] = _.trim(platformConfig.passwordSuffix) || '';
  result['uuap_server'] = platformConfig.uuapServer;
  return result;
}