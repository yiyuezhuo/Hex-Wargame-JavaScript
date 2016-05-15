var designPattern=(function(){
  function event(){
    
    var callbackList=[];
    
    function register(func){
      callbackList.push(func);
    }
    
    function trigger(){
      var i
          length=callbackList.length;
      for(i=0;i<length;i++){
        if( callbackList[i].apply(this,arguments) ){
          break;
        }
      }
      //return triget.apply(this,arguments);
    }
    
    
    return {register  : register,
            trigger   : trigger};
  }
  
  
  /*
  function iteration(func){
    
  }
  */
  
  
  return {event:event}
}());