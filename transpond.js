var http = require("http");
var path = require("path");

module.exports = function () {
    this.transpond = function (req, res) {
        var port = req.headers.host.split(":")[1] || 80;
        delete require.cache[path.join(__dirname, "../../config.js")];
        var transRules = {
            "7676": {
                //目标服务器的ip和端口，域名也可，但注意不要被host了
                targetServer: {
                    "host": "10.46.133.242",//gcrm
                    "port": "8101"
                    // "host": "172.21.206.166",//gcrm
                    // "port": "8080"
                    // "host": "172.21.206.84",//gcrm
                    // "port": "8081"
                },
                //特殊请求转发，可选配置，内部的host、port和attachHeaders为可选参数
                regExpPath: {
                    "gcrm/" : {
                        path : "gcrm/"
                    }
                    // ,
                    // "vendor/": {
                    //     "host": "127.0.0.1",
                    //     "port": "7777",
                    //     "path": "vendor/"
                    // }
                }
            },
            "ajaxOnly": false
        };
        if (transRules.ajaxOnly && !req.headers.accept.match(/application\/json, text\/javascript/)) {
            res.writeHead("404");
            res.write("404");
            res.end();
            console.log("transpond \033[31m%s\033[m canceled, modify the config.js to transpond this.", req.headers.host + req.url);
            return false;
        }
        var transCurrent = transRules[port];
        if (!transCurrent) {
            console.error('The transponding rules of port"' + port + '" is not defined, please check the config.js!');
            return false;
        }
        var options = {
            host: transCurrent.targetServer.host,
            port: transCurrent.targetServer.port || 80
        };
        options.headers = req.headers;
        options.path = req.url;
        options.method = req.method;
        //匹配regExpPath做特殊转发
        var i;

        for (i in transCurrent.regExpPath) {
            if (req.url.match(i)) {
                options.host = transCurrent.regExpPath[i].host || options.host;
                options.port = transCurrent.regExpPath[i].port || options.port;
                options.path = req.url.replace(i, transCurrent.regExpPath[i].path);
                if (transCurrent.regExpPath[i].attachHeaders) {
                    var j;
                    for (j in transCurrent.regExpPath[i].attachHeaders) {
                        options.headers[j] = transCurrent.regExpPath[i].attachHeaders[j];
                    }
                }
                break;
            }
        }

        console.log("transpond \033[31m%s\033[m to \033[35m%s\033[m", req.headers.host + req.url, options.host + ":" + options.port + options.path);
        var serverReq = http.request(options, function (serverRes) {
            //console.log(req.url + " " + serverRes.statusCode);
            res.writeHead(serverRes.statusCode, serverRes.headers);
            serverRes.on('data', function (chunk) {
                res.write(chunk);
            });
            serverRes.on('end', function () {
                res.end();
            });
        });

        serverReq.on('error', function (e) {
            console.error('problem with request: ' + e.message);
        });

        req.addListener('data', function (chunk) {
            serverReq.write(chunk);
        });

        req.addListener('end', function () {
            serverReq.end();
        });
    };
};