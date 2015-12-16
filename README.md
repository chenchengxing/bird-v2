# This is bird with auth

## usage

- vi demo/ar.js 调整自己的配置
- npm install & node demo/demo.js
- config请参考demo

## browser ci api

- 打开浏览器的console,可以执行以下命令：
- birdv2.use('uuap_name') 切换到其他用户登录

## notice

- 当获取的cookie失效时，如果response是重定向到其他url,bird会自动获取新cookie,并重定向回来，用户是感觉不到这个过程的。如果response是返回一个对象，使浏览器登出，跳转到 /logout，bird会根据request->header->referer又跳转回来，因为referer不包括锚点信息，对于angular用户会发现页面跳到默认页面；同理，手动点登出也会跳回来，只是换了个cookie


## todo

- track forward history??
- forwarding local json data
