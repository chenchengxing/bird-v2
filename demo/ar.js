module.exports = [{
  // 服务名字
  name: 'mdm',
  // 服务端口
  bird_port: 3000,
  // 静态文件目录，可以为相对路径，如：../build
  staticFileRootDirPath: '/Users/baidu/workspace/build',
  // 测试机地址，是否带`ar`看环境的context
  server: 'http://biqatest.baidu.com/',
  // 该测试机对应的uuap地址
  uuap_server: 'http://itebeta.baidu.com:8100',
  // 你想用谁登录
  username: 'chenliang03',
  // 密码后缀，没有就留空
  password_suffix: '',
  // 是否开启dev-tools(提供切换用户等功能)
  dev_tool: {
    type: 'input',
    top: 20,
    right: 20
  },
  // feapps专用登录，hard code this one
  //bprouting: 'bprouting/BpFlowRouting?appindex=true'
}, {
    name: 'ar-yanghao',
    bird_port: 7878,
    staticFileRootDirPath: '/home/zp/work/ar-all/ar-web/src/main/webapp/resources',
    server: 'http://172.21.216.14:8080/ar-web/',
    uuap_server: 'http://itebeta.baidu.com:8100',
    username: 'yanghao13',
    password_suffix: '',
    router: {
      'ar/': 'ar-web/',
      'discovery/': 'dis/'
    },
    cookie: 'JSESSIONID=FEDDE46AA3C61E8B3E29C785BDBE7502',
    useLocalData: {
      // 'ar/': 'home/zp/work/ar-all/ar-web/src/main/webapp/front/data',

  //   }
  // }, {
  //   name: 'ar-xuezhi',
  //   bird_port: 7879,
  //   staticFileRootDirPath: '/home/zp/work/ar-all/ar-web/src/main/webapp/resources',
  //   server: 'http://172.21.206.41:8080/ar-web/',
  //   uuap_server: 'http://itebeta.baidu.com:8100',
  //   username: 'yanghao13',
  //   password_suffix: '',
  //   router: {
  //     'ar/': 'ar-web/',
  //     'discovery/': 'dis/'
  //   },
  //   cookie: 'JSESSIONID=FF095C68CA7CD50384902B7E881ADAD1',
  //   useLocalData: {
  //     // 'ar/': 'home/zp/work/ar-all/ar-web/src/main/webapp/front/data',

    }
  }]