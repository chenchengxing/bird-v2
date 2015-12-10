(function (document, window) {
  var config = window.birdv2.config.dev_tool 
  var defaultConfig = {type:'input', top: 20, right: 20, width: 80, height: 30}
  var div = document.createElement('div');
  div.style.position = 'fixed'
  div.style.top = (config.top || defaultConfig.top) + 'px'
  div.style.right = (config.right || defaultConfig.right) + 'px'
  div.style.width = (config.width || defaultConfig.width) + 'px'
  div.style.height = (config.height || defaultConfig.height) + 'px'
  div.style['z-index'] = 999999;
  setTimeout(function () {
    document.body.appendChild(div)
  }, 2000)
  var input = document.createElement('input')
  input.id = 'birdv2-tool'
  input.style.width = '80px'
  input.setAttribute('placeholder', 'change user')
  var button = document.createElement('button')
  button.innerHTML = 'Go & Reload!'
  button.onclick = function (e) {
      if (!input.value.trim().length) return;
      var xhttp = new XMLHttpRequest();
      xhttp.onload = function (e) {
          if (xhttp.status === 200) { 
            window.location.reload();
          }
      };
      xhttp.open('GET', 'bbbbiiiirrrrdddd' + '?username=' + input.value.trim());
      //xhttp.responseType = 'json';
      xhttp.send();
   
  }
  div.appendChild(input)
  div.appendChild(button)
  
})(document, window)