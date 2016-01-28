(function (document, window) {
  window.birdv2 = {
    config: {},
    use: function(username) {
      var xhttp = new XMLHttpRequest();
      xhttp.onload = function (e) {
          if (xhttp.status === 200) { 
            window.location.reload();
          } else {
            console.log(this.config);
          }
      };
      xhttp.open('GET', 'bbbbiiiirrrrdddd' + '?username=' + username);
      xhttp.send();
    }
  }
  
})(document, window)

