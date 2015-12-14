# This is bird with auth

## usage

- vi demo/ar.js 调整自己的配置
- npm install & node demo/demo.js

## browser ci api

- 打开浏览器的console,可以执行以下命令：
- birdv2.use('uuap_name') 切换到其他用户登录

## notice

- 当获取的cookie失效时，浏览器会跳转到 /logout ，但bird会根据request->header->referer又跳转回来，因为referer不包括锚点信息，对于angular用户会发现页面莫名其妙的跳到默认页面，代码实现如下
```{r}
    else if (urlParsed.pathname.match(/logout/)) {
      birdAuth(config, jar, function () {
        console.log(TARGET_SERVER + ' cookie timeout and get a new ', jar.getCookies(TARGET_SERVER))
        res.writeHead(302, {location:req.headers.referer});
        res.end();
      });
      
    } 
```
 此用户体验不好，有待改进

## todo

- track forward history??