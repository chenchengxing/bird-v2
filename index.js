var http = require("http");
var url = require("url");
var fs = require("fs");
var path = require("path");
var mime = require("./mime").types;
var zlib = require("zlib");
var config = require("./config");
var utils = require("./utils");
var dummyjson = require('dummy-json');
var dummyHelpers = {
  dateUTC: function (min, max, options) {
    var time = dummyHelpers.timeUTC(min, max, options);
    return time - time%(24*60*60*1000);
  },
  timeUTC: function (min, max, options) {
    var minTime = NewDate(min).getTime(),
        maxTime = NewDate(max).getTime();
    return randomInt(minTime, maxTime);
  },
  animals: function(options) {
    var animals = ['cat', 'dog', 'cow', 'wolf', 'giraffe'],
        rIndex = randomInt(0, animals.length);
    return animals[rIndex];
  },
  genders: function (options) {
    var genders = ['male', 'female'],
        rIndex = randomInt(0, genders.length);
    return genders[rIndex];
  }
};
var Transpond = require("./transpond");
var transpond = new Transpond().transpond;

module.exports = {
  start: function (params, rules) {
    var servers = params || {};
    var serverList = [];
    for (var i in servers) {
      var server = http.createServer(function (req, res) {
        var port = req.headers.host.split(":")[1] || 80;
        var pathname = url.parse(req.url).pathname;
        var realPath = "";
        if (pathname.slice(-1) === "/") {
          pathname += config.Default.file;
        }
        realPath = path.join(servers[port].basePath, path.normalize(pathname.replace(/\.\./g, "")));
        //匹配忽略列表，若匹配直接抛给回调函数
        if (servers[port].ignoreRegExp && req.url.match(servers[port].ignoreRegExp)) {
          console.log("ignore request:" + req.url);
          if (typeof transpond === "function") {
            transpond(req, res, rules);
          }
          return false;
        }

        var pathHandle = function (realPath) {
          // console.log(realPath);
          fs.stat(realPath, function (err, stats) {
            if (err) {
              if (typeof transpond === "function") {
                transpond(req, res, rules);
              } else {
                //console.log(req.url + " 404");
                res.writeHead(404, {
                  "Content-Type": "text/plain"
                });
                res.write("This request URL " + pathname + " was not found on this server.");
                res.end();
              }
            } else {
              if (stats.isDirectory()) {
                realPath = path.join(realPath, "/", config.Welcome.file);
                pathHandle(realPath);
              } else {
                if ( realPath.indexOf('.json')>-1 && !realPath.match('locale') ) {
                  // fs.stat( realPath, function (err, stats) {
                  var content = fs.readFileSync(realPath, "utf-8");
                  // res.write(JSON.stringify( {
                  //     code: 200
                  // }));
                  var o = JSON.parse(content);
                  var resultJSON = generate(o);
                  res.write( JSON.stringify( resultJSON ) );
                  // res.write(JSON.stringify({
                  //   code: 200,
                  //   message: 'ok',
                  //   data: resultJSON
                  // }));
                  res.end();
                  // });
                //利用dummy-json将djson生成为random的json测试数据
                } else if (realPath.indexOf('.djson')>-1 && !realPath.match('locale')) {
                  var content = fs.readFileSync(realPath, "utf-8");
                  var resultDummy = dummyjson.parse(content, {helpers:dummyHelpers});
                  res.write( resultDummy );
                  res.end();
                } else {
                  res.setHeader('Accept-Ranges', 'bytes');
                  var ext = path.extname(realPath);
                  ext = ext ? ext.slice(1) : 'unknown';
                  var contentType = mime[ext] || "text/plain";
                  res.setHeader("Content-Type", contentType);
                  var lastModified = stats.mtime.toUTCString();
                  var ifModifiedSince = "If-Modified-Since".toLowerCase();
                  res.setHeader("Last-Modified", lastModified);
                  //jsp动态文件简单支持
                  if (ext === "jsp") {
                    var content = fs.readFileSync(realPath, "utf-8");
                    content = content.replace(/<%@ page.*|.*%>/g, "");
                    content = content.replace(/<jsp:include page="(.*)"\/>/g, function (strpath) {
                      return fs.readFileSync(path.join(path.dirname(realPath), strpath.replace(/^[^"]+"|"[^"]+$/g, "")), "utf-8");
                    });
                    res.write(content);
                    res.end();
                    return false;
                  }
                  if (ext.match(config.Expires.fileMatch)) {
                    var expires = new Date();
                    expires.setTime(expires.getTime() + config.Expires.maxAge * 1000);
                    res.setHeader("Expires", expires.toUTCString());
                    res.setHeader("Cache-Control", "max-age=" + config.Expires.maxAge);
                  }
                  if (req.headers[ifModifiedSince] && lastModified === req.headers[ifModifiedSince]) {
                    //console.log(req.url + " 304");
                    res.writeHead(304, "Not Modified");
                    res.end();
                  } else {
                    var compressHandle = function (raw, statusCode, reasonPhrase) {
                      var stream = raw;
                      var acceptEncoding = req.headers['accept-encoding'] || "";
                      var matched = ext.match(config.Compress.match);
                      if (matched && acceptEncoding.match(/\bgzip\b/)) {
                        res.setHeader("Content-Encoding", "gzip");
                        stream = raw.pipe(zlib.createGzip());
                      } else if (matched && acceptEncoding.match(/\bdeflate\b/)) {
                        res.setHeader("Content-Encoding", "deflate");
                        stream = raw.pipe(zlib.createDeflate());
                      }
                      //console.log(req.url + " " + statusCode);
                      res.writeHead(statusCode, reasonPhrase);
                      stream.pipe(res);
                    };
                    var raw = {};
                    if (req.headers["range"]) {
                      var range = utils.parseRange(req.headers["range"], stats.size);
                      if (range) {
                        res.setHeader("Content-Range", "bytes " + range.start + "-" + range.end + "/" + stats.size);
                        res.setHeader("Content-Length", (range.end - range.start + 1));
                        raw = fs.createReadStream(realPath, {
                          "start": range.start,
                          "end": range.end
                        });
                        compressHandle(raw, 206, "Partial Content");
                      } else {
                        //console.log(req.url + " 416");
                        res.removeHeader("Content-Length");
                        res.writeHead(416, "Request Range Not Satisfiable");
                        res.end();
                      }
                    } else {
                      raw = fs.createReadStream(realPath);
                      compressHandle(raw, 200, "Ok");
                    }
                  }
                }
              }
            }
          });
        };
        pathHandle(realPath);
      });

      server.listen(i);

      console.log("A server runing at port: " + i + ".");

      serverList.push(server);
    }
  }
};

function generate(jsonPattern) {
  try{
    var matches = jsonPattern[0].match(/{{repeat\((\d),(\d)\)}}/);
    var repeatCount = randomBetween(matches[1], matches[2]);
    var obj = {
      code: 200,
      message: 'ok',
      data: []
    };
    for (var i = 0; i < repeatCount; i++) {
      var item = {};
      var dataPattern = jsonPattern[1];
      var keys = Object.keys(dataPattern);
      for (var j = 0; j < keys.length; j++) {
        item[keys[j]] = generatePattern(dataPattern[keys[j]]);
      };
      // var item = jsonPattern[1];
      obj.data.push(item);
    };
    return obj;
  } catch ( e ){
    return jsonPattern;
    // return undefined;
  }
}

function randomBetween(a, b) {
  var random = Math.random() * (b - a + 1);
  return Math.floor(~~a + random);
}

function generatePattern(pattern) {
  // var functionString = pattern.match(/{{([\w|(|)]*)}}/)[1];
  if ( pattern.match( 'function' ) ) {
    return eval( pattern );
  } else {
    try {
      var functionString = pattern.replace(/\{\{/, '').replace(/}}/, '');
      return eval('g.' + functionString);
    } catch (e) {
      return pattern;
    }
  }
}
var g = {
  index: function () {
    return Math.floor(Math.random() * 10);
  },
  guid: function () {
    return Math.floor(Math.random() * 10);
  },
  bool: function () {
    return Math.random() > 0.5;
  },
  integer: function (a, b) {
    var random = Math.random() * (b - a + 1);
    return Math.floor(~~a + random);
  }
};
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

//解决ie new date()带参数bug问题
function NewDate(timeString) {
  var dates = timeString.split(' '),
      ymd = dates[0].split('-'),
      date = new Date();
  date.setUTCFullYear(ymd[0], ymd[1] - 1, ymd[2]);
  if (dates[1]) {
    time = dates[1] && dates[1].split(':');
    date.setUTCHours(Number(time[0]), Number(time[1]), Number(time[2]), 0);
  } else {
    date.setUTCHours(0, 0, 0, 0);
  }
  return date;
}