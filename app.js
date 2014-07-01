var fileServer = require("./index");
var serverSettings = {
  "8787": {
    "basePath": "E:/baidu-svn/gcrm/src/main/webapp/front"
  },
  "7676": {
    "basePath": "E:/baidu-svn/gcrm/src/main/webapp/front"
  }
};


fileServer.start(serverSettings);