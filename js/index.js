
(function(){
  

  var inputJSONURL = document.getElementById('inputJSONURL');
  var btnJSON      = document.getElementById('btnJSON');
  btnJSON.onclick=function(){
    var url = 'game.html'+'?'+'json='+inputJSONURL.value;
    window.open(url);
  }

}());
