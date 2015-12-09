module.exports = {
  // 服务名字
  name: 'ar',
  // 服务端口
  bird_port: 3000,
  // 静态文件目录，可以为相对路径，如：../build
  staticFileRootDirPath: '/Users/ccx/workspace/ar/ar/src/main/webapp/resources',
  // 测试机地址，是否带`ar`看环境的context
  server: 'http://cq01-ite-ar-test01.epc:8901/ar/',
  // 该测试机对应的uuap地址
  uuap_server: 'http://itebeta.baidu.com:8100',
  // 你想用谁登录
  username: 'songlanying',
  // 密码后缀，没有就留空
  password_suffix: '',
  // feapps专用登录，hard code this one
  bprouting: 'bprouting/BpFlowRouting?appindex=true'
}