# This is bird with auth

## usage

### global

- npm install -g birdv2
- touch birdfile.js
- vi birdfile.js

```
// sample birdfile.js
module.exports = {
  name: 'ar',
  bird_port: 7676,
  staticFileRootDirPath: '../webapp',
  server: 'http://xx.xx.com:8901/ar/',
  uuap_server: 'http://xx.xx.com:8100',
  username: 'jay',
  password_suffix: ''
};
```
- bird  `or` bird  -c ../yourPath/birdfile.js

### local

- npm install -D birdv2
- touch birdfile.js
- vi birdfile.js

```
// sample birdfile.js
var config = {
  name: 'ar',
  bird_port: 7676,
  staticFileRootDirPath: '../webapp',
  server: 'http://xx.xx.com:8901/ar/',
  uuap_server: 'http://xx.xx.com:8100',
  username: 'jay',
  password_suffix: ''
};
require('bird')(config)
```

- node birdfile.js

### as middleware with mock

请参考erp-finfap

## config
- bird的配制可是一个object,也可以是一个array, eg:
```
  var config = {
    name: 'ar',
    bird_port: 7676,
    staticFileRootDirPath: '../webapp',
    server: 'http://xx.xx.com:8901/ar/',
    uuap_server: 'http://xx.xx.com:8100',
    username: 'jay',
    password_suffix: ''
  };

  `or`
  var config = [{
    name: 'ar',
    bird_port: 7676,
    staticFileRootDirPath: '../webapp',
    server: 'http://xx.xx.com:8901/ar/',
    uuap_server: 'http://xx.xx.com:8100',
    username: 'jay',
    password_suffix: ''
  }, {
    name: 'ar2',
    bird_port: 7777,
    staticFileRootDirPath: '../webapp',
    server: 'http://xx.xx.com:8902/ar/',
    uuap_server: 'http://xx.xx.com:82S00',
    username: 'jay',
    password_suffix: ''
  }]
```
- 下面是详细的配制说明，*表示必须的配制， #表示正在开发或功能不稳定的配制， 其他是可选项
  ```
  // *服务名字,本配制以ar为例
  name: 'ar',
  // *服务端口
  bird_port: 3000,
  // *静态文件目录，可以为相对路径，如：../build
  staticFileRootDirPath: '/home/zp/work/ar/src/main/webapp/resources',
  // *测试机地址，是否带`ar`看环境的context
  server: 'http://xx-xx.epc:8901/ar/',
  // *该测试机对应的uuap地址
  uuap_server: 'http://uuap_test.com:8100',
  // *你想用谁登录
  username: 'who_you_want',
  // *密码后缀，没有就留空
  password_suffix: '',
  // 是否开启dev-tools(提供切换用户等功能)default:false
  dev_tool: {
    type: 'input', // #暂时只有这一个，后续加select
    top: 20,       // 工具上边距
    right: 20      //右边距
  },
  // feapps专用登录，hard code this one. default:false
  bprouting: 'bprouting/BpFlowRouting?appindex=true',
  // 是否使用静态的cookie,录bird出问题了你还可以把cookie粘到这里，像旧版一样default:false
  cookie: 'sessionid=XXXXXXXXXXX',
  // 转发路由，你可以将本地的请求转发到指定的路径
  router: {  
      '/ar': '/ar-web' // 将http://xx-xx.epc:8901/ar/XX/XX -> http://xx-xx.epc:8901/ar-web/XX/XX 
  },
  // 登录方式，默认是使用uuap来登录，加载auths/uuap.js default:'uuap'
  auth_standalone: 'uuap',
  // #当cookie效了重新cookie，当然，你可以重启bird来手动获取.default:true
  keep_alive: true,
  // #使用本地的数据，不转发. 当服务器当了，你可以造些假数据来本地测试
  use_local_data: {
    '/ar': '/your/data/path'
  }
  ```
## extendable

- 如果你的项目不是用uuap登录的，那你需要配制auth_standalone选项, 然后在auths/目录下添加上对应的js文件，当然你可以联系我，告诉你项目的地址 及登录帐号， 让我帮你加



## browser ci api

- 打开浏览器的console,可以执行以下命令：
- birdv2.use('uuap_name') 切换到其他用户登录

## notice

- 当获取的cookie失效时，如果response是重定向到其他url,bird会自动获取新cookie,并重定向回来，用户是感觉不到这个过程的。如果response是返回一个对象，使浏览器登出，跳转到 /logout，bird会根据request->header->referer又跳转回来，因为referer不包括锚点信息，对于angular用户会发现页面跳到默认页面；同理，手动点登出也会跳回来，只是换了个cookie


## todo

- track forward history??
- forwarding local json data
