var fs = require('fs');
var path = require('path');
var request = require('request');

function mock_cache (config, url, filePath) {
    var reWriteBirdFile;
    var cache_filePath = filePath.replace(config.staticFileRootDirPath, '');
    var cache_fileName = cache_filePath.replace(/\//g, '_').substr(1);
    var cache_path = path.join(config.staticFileRootDirPath, config.mock.path, cache_fileName + '.js');
    fs.readFile(config.mock_cache + '/birdfile.js', 'utf-8', function (err,data) {
        var mapStringIndex = data.indexOf('map');
        var mapData = data.substring(data.indexOf('{', mapStringIndex), data.indexOf('}', mapStringIndex) + 1)
        if (!mapData.match(cache_fileName)) {
            var newMapData = mapData.replace('}',"// '" + cache_filePath + "': '" + cache_fileName + "',\r\n\t}");
            reWriteBirdFile = data.replace(mapData, newMapData);
            fs.writeFile(config.mock_cache + '/birdfile.js', reWriteBirdFile, [{encoding: 'utf8'}], function (){

            })
        }
    });
    request({
        url: url,
        jar: config.jar
    },function(error, response, body) {
        var data = 'module.exports=' + body;
        fs.writeFile(cache_path, data, [{encoding: 'utf8'}], function (){

        })
    })
}
module.exports = mock_cache;