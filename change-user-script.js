(function (document, window) {
  var div = document.createElement('div');
  div.style.position = 'fixed'
  div.style.top = '20px'
  div.style.right = '20px'
  div.style.width = '80px'
  div.style.height = '30px'
  div.style['z-index'] = 999999;
  setTimeout(function () {
    document.body.appendChild(div)
  }, 2000)
  var input = document.createElement('input')
  input.id = ''
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