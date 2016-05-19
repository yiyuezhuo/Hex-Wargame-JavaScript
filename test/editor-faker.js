
// fake load process to speed test process

(function(){
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
  
  seriesLoadScripts('scenario/output.js',function(){
    scenario=Object.create(scenarioChangeAble);
    scenario.__init__(scenario_dic);
  });
}());