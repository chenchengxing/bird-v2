module.exports = [{
  // 服务名字
  name: 'ar',
  // 服务端口
  bird_port: 3000,
  // 静态文件目录，可以为相对路径，如：../build
  staticFileRootDirPath: '/home/zp/work/ar/src/main/webapp/resources',
  // 测试机地址，是否带`ar`看环境的context
  server: 'http://cq01-ite-ar-test01.epc:8901/ar/',
  // 该测试机对应的uuap地址
  uuap_server: 'http://itebeta.baidu.com:8100',
  // 你想用谁登录
  username: 'songlanying',
  // 密码后缀，没有就留空
  password_suffix: '',
  // 是否开启dev-tools(提供切换用户等功能)
  dev_tool: {
    type: 'input',
    top: 20,
    right: 20
  },
  // feapps专用登录，hard code this one
  bprouting: 'bprouting/BpFlowRouting?appindex=true'
}, {
  // 服务名字
  name: 'ar2',
  // 服务端口
  bird_port: 7676,
  // 静态文件目录，可以为相对路径，如：../build
  staticFileRootDirPath: '/home/zp/work/ar/src/main/webapp/resources',
  // 测试机地址，是否带`ar`看环境的context
  server: 'http://cq01-ite-ar-test01.epc:8901/ar/',
  // 该测试机对应的uuap地址
  uuap_server: 'http://itebeta.baidu.com:8100',
  // 你想用谁登录
  username: 'zhangpeng38',
  // 密码后缀，没有就留空
  password_suffix: '',
  // 是否开启dev-tools(提供切换用户等功能)
  dev_tool: false,
  // feapps专用登录，hard code this one
  bprouting: 'bprouting/BpFlowRouting?appindex=true'
}, {
    name: 'ar-yanghao',
    bird_port: 7878,
    staticFileRootDirPath: '/home/zp/work/ar-all/ar-web/src/main/webapp/resources',
    server: 'http://172.21.216.19:8080/ar-web/',
    uuap_server: 'http://itebeta.baidu.com:8100',
    username: 'yanghao13',
    password_suffix: '',
    router: {
      'ar/': 'ar-web/',
      'discovery/': 'dis/'
    },
    useLocalData: {
      // 'ar/': 'home/zp/work/ar-all/ar-web/src/main/webapp/front/data',

    }
  }]