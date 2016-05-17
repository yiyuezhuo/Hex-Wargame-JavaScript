/*
 * designPattern.js
 * provide event handler and other designPattern
*/

/*jslint          browser  : true,  continue  : true,
  devel  : true,  indent   : 2,     maxerr    : 50,
  newcap : true,  nomen    : true,  plusplus  : true,
  regexp : true,  sloppy   : true,  vars      : true,
  white  : true
*/

/*global domplot,designPattern */


var designPattern=(function(){
  function event(){
    
    var callbackList=[];
    
    function register(func){
      callbackList.push(func);
    }
    
    function trigger(){
      var i,
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
  
  function _pipe(){
    var otherPipe;
    var isBlocked=false;
    var callbackList=[];
    
    function _trigger(){
      var i,
          length=callbackList.length;
      for(i=0;i<length;i++){
        if( callbackList[i].apply(this,arguments) ){
          break;
        }
      }
    }
    function register(func){
      callbackList.push(func);
    }

    function registerOtherPipe(_otherPipe){
      otherPipe = _otherPipe;
    }
    function block(){
      isBlocked=true;
    }
    function trigger(){
      if(isBlocked){
        // blocked!
        isBlocked=false; // block one times and then resume
      }
      else{
        otherPipe.block();
        _trigger.apply(this,arguments);
      }
    }
    
    return {register  : register,
            trigger   : trigger,
            block     : block,
            registerOtherPipe : registerOtherPipe};

    
  }
  
  function pipe_pair(){
    var eventC=_pipe();
    var eventD=_pipe();
    eventC.registerOtherPipe(eventD);
    eventD.registerOtherPipe(eventC);
    return {left  : eventC,
            right : eventD};
  }
  
  function event_pipe(eventA,eventB){
    // A - B
    // return [C,D] C,D are events-same,but they can only trigger 
    // A trigger will cause C trigger (set case) and then trigger B (same case) if A is not trigger by D  
    var pipe=pipe_pair();
    pipe.right.register(function(){
      eventB.trigger.apply(this,arguments);
    });
    pipe.left.register(function(){
      eventA.trigger.apply(this,arguments);
    });
    return pipe;
  }
  
  
  /*
  function iteration(func){
    
  }
  */
  
  
  return {event      : event,
          event_pipe : event_pipe};
}());