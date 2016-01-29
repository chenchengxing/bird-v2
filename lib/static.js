var config;
var url = require('url');
var path = require('path')
var fs = require('fs');
var mime = require('mime-types');
var cheerio = require('cheerio')
var BIRD_USER_SCRIPT = fs.readFileSync(path.join(__dirname, '../devtools/change-user-script.js'), 'utf8');
var BIRD_EXTEND_SCRIPT = fs.readFileSync(path.join(__dirname, '../devtools/bird-extend-script.js'), 'utf8');

function staticHandle(req, res, next) {
  var urlParsed = url.parse(req.url);
  var filePath = path.join(config.staticFileRootDirPath, urlParsed.pathname === '/' ? 'index.html' :  urlParsed.pathname)
  fs.stat(filePath, function (err, stats) {
    if (err) {
      next()
    } else if (stats.isFile() /* file */) {
      // server as static file
      fs.readFile(filePath, function(err, buffer) {
        if (isHtmlPage(buffer)) {
          // add something nasty in it, that's where bird dev-tool exists
          var $ = cheerio.load(buffer.toString('utf-8'));
          $('head').append('<script type="text/javascript">' + BIRD_EXTEND_SCRIPT + '</script>')
          $('head').append('<script type="text/javascript">window.birdv2.config=' + JSON.stringify(config) + '</script>')
          if (config.dev_tool) {
            $('head').append('<script type="text/javascript">' + BIRD_USER_SCRIPT + '</script>')
            // console.log($.html())
          }
          res.setHeader('Content-Type', mime.lookup('.html'));
          res.write($.html())
          res.end();
        } else {
          var mimeType = mime.lookup(path.extname(filePath));
          res.setHeader('Content-Type', mimeType);
          res.write(buffer);
          res.end();
        }
      })
    } else if (stats.isDirectory() /* directory */) {
      var AUTO_INDEX; 
      if (Array.isArray(config.autoIndex)) {
        AUTO_INDEX = config.autoIndex
      } else {
        AUTO_INDEX = config.autoIndex ? config.autoIndex.split(/\x20+/) : ['index.html']
      }
      if (AUTO_INDEX) {
        var fp;
        for (var i = 0; i < AUTO_INDEX.length; i++) {
          fp = path.join(filePath, AUTO_INDEX[i]);
          if (isFile(fp)) {
            filePath = fp;
            fs.readFile(filePath, function(err, buffer) {
              var mimeType = mime.lookup(path.extname(filePath));
              res.setHeader('Content-Type', mimeType);
              res.write(buffer);
              res.end();
            });
            break;
          }
        }
        // if (!isFile(filePath)) {
        //   emptyPage(res, filePath);
        // }
      }
    } else {
      // shit happens
      next()
    }
  })
}

module.exports = function (_config) {
  config = _config;
  return staticHandle;
}

function exists(p) {
  return fs.existsSync(p);
}

function isFile(p) {
  return exists(p) && fs.statSync(p).isFile();
}

function isDir(p) {
  return exists(p) && fs.statSync(p).isDirectory();
}

function emptyPage(res, fp) {
  console.info('Local', fp.red, 'not exists'.cyan);
  res.status(404).send('Not found' + (fp ? ' "' + fp + '"' : '') + '!');
  res.end();
}

function isHtmlPage (buffer) {
  var temp = buffer.slice(0, 20);
  var reg = new RegExp('<!DOCTYPE HTML>', 'i')
  return reg.test(temp.toString('utf-8'))
}