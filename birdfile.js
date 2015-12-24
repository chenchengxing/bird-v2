
require('./index')({
    name: 'hi xx',
    bird_port: 7676,
    staticFileRootDirPath: '../any',
    auth_standalone: true,
    server: 'http://10.44.88.50:8888/',
    auth_url: 'http://10.44.88.50:8888/hi/api/login/loginCS',
    username: 'admin',
    password_suffix: ''
})

