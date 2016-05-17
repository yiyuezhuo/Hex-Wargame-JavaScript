function selectList(dom,config){
  config = config || {};
  var _value_list=[];
  
  function _update(){
    dom.innerHTML='';
    _value_list.forEach(function(value){
      var option=document.createElement('option');
      option.value=value;
      option.innerHTML=value;
      dom.appendChild(option);
    });

  }
  
  function update(value_list){
      _value_list=value_list;
      _update();
  }
  
  function append(value){
    _value_list.push(value);
    _update();
  }
  
  function remove(value){
    _value_list=_value_list.filter(function(_value){
      return value!=_value;
    });
    _update();
  }
  
  function value(){
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
    }
  }
  
  if(config.value_list){
    update(config.value_list);
  }
  
  if(config.value){
    update(config.value);
  }
  
  return {update : update,
          value  : value,
          append : append,
          remove : remove};
}