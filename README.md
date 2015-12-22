# This is bird with auth

## usage

### global

- npm install -g bird-v2
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

- bird

### local

- npm install -D bird-v2
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


## browser ci api

- 打开浏览器的console,可以执行以下命令：
- birdv2.use('uuap_name') 切换到其他用户登录

## notice

- 当获取的cookie失效时，如果response是重定向到其他url,bird会自动获取新cookie,并重定向回来，用户是感觉不到这个过程的。如果response是返回一个对象，使浏览器登出，跳转到 /logout，bird会根据request->header->referer又跳转回来，因为referer不包括锚点信息，对于angular用户会发现页面跳到默认页面；同理，手动点登出也会跳回来，只是换了个cookie


## todo

- track forward history??
- forwarding local json data
