var Promise = require('bluebird');
var request = require('request');

module.exports = function fetchConfig (config) {
  var promise = new Promise(function (resolve) {
    request({
      method: 'get',
      url: config['bird-platform-url'] + config['id']
    }, function (err, response, body) {
      // console.info(response)
      // if (!err) {
        resolve(response)
      // }
    })
  })
  return promise;
}