var fileServer = require("./index");
var serverSettings = {
  "8787": {
    "basePath": "E:/baidu-svn/gcrm/src/main/webapp/front"
  },
  "7676": {
    "basePath": "E:/baidu-svn/gcrm/src/main/webapp/front"
  }
};
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

fileServer.start(serverSettings, transRules);