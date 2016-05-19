/*
 * selectList.js
 * maintain select widget
*/

/*jslint          browser  : true,  continue  : true,
  devel  : true,  indent   : 2,     maxerr    : 50,
  newcap : true,  nomen    : true,  plusplus  : true,
  regexp : true,  sloppy   : true,  vars      : true,
  white  : true
*/



function selectList(dom,config){
  
  
  config = config || {};
  var _value_list = [];
  var _html_list  = [];
  
  function _update(){
    dom.innerHTML='';
    _value_list.forEach(function(value,i){
      var option=document.createElement('option');
      option.value=value;
      option.innerHTML=_html_list[i] || value;
      dom.appendChild(option);
    });

  }
  
  function update(values){
    // values can be ['a','b','c',...] or {value_list:[1,2,3,...],html_list:['a','b','c',...]}
      if (Array.isArray(values)){
        _value_list=values;
      }
      else{
        _value_list=values.value_list;
        _html_list=values.html_list;
      }
      _update();
  }
  
  function append(value){
    if(value.value === undefined){
      _value_list.push(value);
    }
    else{
      _value_list.push(value.value);
      _html_list.push(value.html);
    }
    _update();
  }
  
  function remove(value){
    var new_value_list = [];
    var new_html_list  = [];
    
    //console.log('value',value);
    //console.log('_value_list')
    //console.log(_value_list);
    
    var i;
    for(i=0;i<_value_list.length;i++){
      if(value!==_value_list[i]){
        new_value_list.push(_value_list[i]);
        if(_html_list[i]!==undefined){
          new_html_list.push(_html_list[i]);
        }
      }
    }
    _value_list=new_value_list;
    _html_list=new_html_list;
    
    //console.log('new_value_list');
    //console.log(new_value_list);
        
    _update();
  }
  
  function value(){
    console.log('value : _value_list');
    console.log(_value_list);
    return dom.value;
  }
    
  if(config.updateEvent){
    config.updateEvent.register(function(value_list){
      update(value_list);
    });
  }
  
  if(config.changeEvent){
    dom.onchange=function(){
      config.changeEvent.trigger(this.value);
    };
  }
  
  if(config.value_list){
    update(config.value_list);
  }
  
  if(config.value){
    update(config.value);
  }
  
  _update();
  
  return {update : update,
          value  : value,
          append : append,
          remove : remove};
}