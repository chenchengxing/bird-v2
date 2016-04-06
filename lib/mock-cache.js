var fs = require('fs');
var path = require('path');
var request = require('request');

/**
 *
 * 这坨代码用来防止交叉写文件
 */
var cbs = [];
var process = true;
function processStack(){
    if (process) {
        process = false;
        var first = cbs.shift();
        if (first && typeof first === 'function') {
            first(function () {
                processStack();
                process = true;
            });
        }
    }
    

}
/**
 *
 * mock 缓存功能,在配置中打开mock_cache设置为__dirname,
 * 则在转发接口时将接口数据缓存mock文件夹中,并且重写birdfile.js
 * @param config
 * @param url
 * @param filePath
 * @returns {boolean}
 */
function mock_cache (config, url, filePath) {
    if (filePath.match('.html')) {
        return false;
    }
    var reWriteBirdFile;
    var cache_filePath = filePath.replace(config.staticFileRootDirPath, '');
    var cache_fileName = cache_filePath.replace(/\//g, '_').substr(1);
    var cache_path = path.join(config.staticFileRootDirPath, config.mock.path, cache_fileName + '.js');
    cbs.push(function (callback) {
        fs.readFile(config.mock_cache + '/birdfile.js', 'utf-8', function (err,data) {
            if (!data) {
                console.info('warn: 操作太频繁!');
                return false;
            }
            var mapStringIndex = data.indexOf('map');
            var mapData = data.substring(data.indexOf('{', mapStringIndex), data.indexOf('}', mapStringIndex) + 1)
            if (!mapData.match(cache_fileName)) {
                var newMapData = mapData.replace('}',"// '" + cache_filePath + "': '" + cache_fileName + "',\r\n\t}");
                reWriteBirdFile = data.replace(mapData, newMapData);
                fs.writeFile(config.mock_cache + '/birdfile.js', reWriteBirdFile, [{encoding: 'utf8'}], function (){

                    callback();
                })
            } else {
                callback();
            }
        });
    });
    processStack();
    request({
        url: url,
        jar: config.jar,
        headers: {
            'cookie': config.cookie
        }
    },function(error, response, body) {
        var contentType = response.headers['content-type'];
        if (contentType.match('json')) {
            var data = 'module.exports=' + JSON.stringify(JSON.parse(body), null, 4);
            fs.writeFile(cache_path, data, [{encoding: 'utf8'}], function (){

            })
        }

    })
};
module.exports = mock_cache;