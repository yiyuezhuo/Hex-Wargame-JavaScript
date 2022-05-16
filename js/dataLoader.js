(function(){
  
  function parseParam(){
    var url=location.search; 
    var Request = new Object(); 
    if(url.indexOf("?")!=-1) { 
      var str = url.substr(1) //remove ? char 
      strs = str.split("&"); 
    for(var i=0;i<strs.length;i++) { 
      Request[strs[i].split("=")[0]]=unescape(strs[i].split("=")[1]); 
    } 
    } 
    return Request;
  }
  
  function seriesLoadScripts(scripts,callback) {
     if(typeof(scripts) != "object") var scripts = [scripts];
     var HEAD = document.getElementsByTagName("head").item(0) || document.documentElement;
     var s = new Array(), last = scripts.length - 1, recursiveLoad = function(i) {  //recursive
         s[i] = document.createElement("script");
         s[i].setAttribute("type","text/javascript");
         s[i].onload = s[i].onreadystatechange = function() { //Attach handlers for all browsers
             if(!/*@cc_on!@*/0 || this.readyState == "loaded" || this.readyState == "complete") {
                 this.onload = this.onreadystatechange = null; this.parentNode.removeChild(this); 
                 if(i != last) recursiveLoad(i + 1); else if(typeof(callback) == "function") callback();
             }
         }
         s[i].setAttribute("src",scripts[i]);
         HEAD.appendChild(s[i]);
     };
     recursiveLoad(0);
  }
  
  function loadBoxInit($container,callback){
    var fileInput=$container.find('input')[0];
    var loadButton=$container.find('.load')[0];
    
    loadButton.onclick=function(){
      var file=fileInput.files[0];
      var reader=new FileReader();

      reader.readAsText(file);
      reader.onload=function(event){
        var content=event.target.result;
        callback(content);
      }
    };
  }
  
  var localLoderView=$('#localLoderView');
  var gameView=$('#gameView');
  var loadingView=$('#loadingView');
  
  function preload(){
    localLoderView.hide();
    gameView.hide();
  }
  
  function loaded(){
    gameView.show();
    localLoderView.hide();
    loadingView.hide();
  }
    
  var params=parseParam();
  
  console.log(params);
  
  preload();
  
  if(params.json){
    console.log('load json scenario')
    $.getJSON(params.json,function(result){
      gameInit(result);
      console.log('json loaded');
      loaded();
    });
  }
  else if(params.jsonp){
    // gameInit( ...json object... )
    console.log('load jsonp scenario')
    seriesLoadScripts([params.jsonp],function(){
      console.log('jsonp loaded')
      //gameInit(scenario_dic);
      loaded();
    });
  }
  else if(params.varp){
    // var scenario_dic = ...json object ...
    console.log('load varp scenario')
    seriesLoadScripts([params.varp],function(){
      gameInit(scenario_dic);
      console.log('varp loaded');
      loaded();
    });
  }
  else if(params.local){
    loadingView.hide();
    localLoderView.show();
    loadBoxInit(localLoderView,function(content){
      var scenario_dic = JSON.parse(content);
      gameInit(scenario_dic);
      loaded();
    });
  }
  else{
    console.log('load the default scenario');
    seriesLoadScripts(['scenario/output.js'],function(){
      gameInit(scenario_dic);
      console.log('default loaded');
      loaded();
    });
  }
  
}());