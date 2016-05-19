
// Begin utility function
function downloadFile(fileName, content){
    var aLink = document.createElement('a');
    var blob = new Blob([content]);
    var evt = document.createEvent("HTMLEvents");
    evt.initEvent("click", false, false);
    aLink.download = fileName;
    aLink.href = URL.createObjectURL(blob);
    aLink.dispatchEvent(evt);
}
// End utility function

// Begin object model

var scenario; // Object is responsible hold and modify scenario_dic object

var scenarioChangeAble = {
  __init__ : function(scenario_dic){
    this.dic = scenario_dic;
    this.unit_d={};
    this.hex_d={};
    var that=this;
    scenario_dic.unit_dic_list.forEach(function(_unit){
      that.unit_d[_unit.id]=_unit;
    });
    scenario_dic.hex_dic_list.forEach(function(_hex){
      that.hex_d[[_hex.m,_hex.n]]=_hex;
    });
  },
  to_dict : function(){
    return this.dic;
  },
  to_json : function(){
    return JSON.stringify(this.to_dict());
  },
  download : function(name){
    var name = name || 'scenario.json';
    return downloadFile(name,this.to_json());
  },
  _new_unit: function(){
    var unit_dic_list=this.dic.unit_dic_list
    var _unit=unit_dic_list[unit_dic_list.length-1];
    var unit={};
    Object.keys(_unit).forEach(function(key){
      unit[key]=_unit[key];
    });
    unit.id=_unit.id+1;
    unit.m=undefined;
    unit.n=undefined;
    return unit;
  },
  create_unit: function(){
    // add a unit its attribute same as last one
    var unit=this._new_unit()
    this.dic.unit_dic_list.push(unit);
    this.unit_d[unit.id]=unit;
  },
  delete_unit: function(unit){
    this.unit_dic_list=this.unit_dic_list.filter(function(_unit){
      return _unit !== unit;
    });
    delete this.unit_d[unit.id];
  },
  reshape_hex:function(m,n){
    var i,j;
    // we will use _hex to create new hex as template
    var _hex=this.dic.hex_dic_list[0];
    var hex;
    var that=this;
    // reset size
    this.size=[m,n];
    // delete surplus hex
    this.dic.hex_dic_list.filter(function(hex){
      return hex.m<m && hex.n<n;
    });
    // create hex
    for(i=0;i<m;i++){
      for(j=0;j<n;j++){
        if(!(i < m && j < n)){
          hex={};
          Object.keys(_hex).forEach(function(key){
            hex[key]=_hex[key];
          });
          this.hex_dic_list.push(hex);
        }
      }
    }
    // reset hex_d
    scenario_dic.hex_dic_list.forEach(function(_hex){
      that.hex_d[[_hex.m,_hex.n]]=_hex;
    });
  },
  update:function(key,value){
    if (key in this.dic){
      this.dic[key]=value;
    }
    else{
      throw new Error('not exist key');
    }
  },
  updateSetting : function(key,value){
    if(key in this.dic.setting || key in {stackSize:true}){ // 
      this.dic.setting[key]=value;
    }
    else{
      throw new Error('not setting exist key');
    }
  }
}


// End object model

// UI init


var tabsEvents={
  tabs1 : designPattern.event(),
  tabs2 : designPattern.event(),
  tabs3 : designPattern.event(),
  tabs4 : designPattern.event()
}

var tabs=$('#tabs');
tabs.find('.tabs1')[0].__event__=tabsEvents.tabs1;
tabs.find('.tabs2')[0].__event__=tabsEvents.tabs2;
tabs.find('.tabs3')[0].__event__=tabsEvents.tabs3;
tabs.find('.tabs4')[0].__event__=tabsEvents.tabs4;
tabs.tabs({
  beforeActivate : function(event,ui){
    ui.newTab[0].__event__.trigger();
  }
});


var map_el=$('#map');

var btnResetAllUnit       = document.getElementById('btnResetAllUnit');
var buttonExport          = document.getElementById('buttonExport');
var btnChangeHexClass     = document.getElementById('btnChangeHexClass');
var btnChangeUnitLocation = document.getElementById('btnChangeUnitLocation');
var btnEnterUnit          = document.getElementById('btnEnterUnit');
var btnExitUnit           = document.getElementById('btnExitUnit');
var divSetting            = document.getElementById('divSetting');

var divUnitList           = document.getElementById('divUnitList');
var divUnitListHelper     = document.getElementById('divUnitListHelper');


// Begin init tab 1

(function(){
  
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
  
  loadBoxInit($('#FullScenarioLoader'),function(content){
    var scenario_dic=JSON.parse(content);
    //renderMap(scenario_dic); // TODO : lazy load needed
    scenario=Object.create(scenarioChangeAble);
    scenario.__init__(scenario_dic);
  });

  var mapReshapeDiv=$('#mapReshapeDiv');
  var mapReshapeDivM=mapReshapeDiv.find('.m');
  var mapReshapeDivN=mapReshapeDiv.find('.n');
  var mapReshapeDivBtn=mapReshapeDiv.find('.reset');
  mapReshapeDivBtn.on('click',function(){
    var m=Number(mapReshapeDivM[0].value);
    var n=Number(mapReshapeDivN[0].value);
    if(scenario){
      scenario.reshape_hex(m,n);
    }
    else{
      console.log('scenario is not loaded!')
    }
  });
  
  buttonExport.onclick=function(){
    scenario.download();
  }

}());

// End init tab 1




// Begin init tab2

tabsEvents.tabs2.register(function(){
  if(scenario){
    console.log('tabs-2 click');
    renderMap(scenario.to_dict());
  }
  else{
    console.log('scenario is not load!');
  }
});

// End init tab2

// Begin init tab3

unitEditor.__init__(divUnitList);

tabsEvents.tabs3.register(function(){
  if(scenario){
    console.log('tabs-3 click');
    renderUnitEditor(scenario.to_dict());
  }
  else{
    console.log('scenario is not load!');
  }
});

$(divUnitListHelper).find('.create').on('click',function(){
  //console.log('divUnitList create stub function');
  console.log('bind create');
  scenario.create_unit();
  renderUnitEditor(scenario.to_dict());
});

$(divUnitListHelper).find('.save').on('click',function(){
  console.log('bind save');
  scenario.update('unit_dic_list',unitEditor.pull_list());
});


// End init tab3

// Begin init tab4


tabsEvents.tabs4.register(function(){
  if(scenario){
    console.log('tabs-4 click');
    renderOtherSetting(scenario.to_dict());
  }
  else{
    console.log('scenario is not load!');
  }
});

(function(){
  var $Setting=$(divSetting);
  var key_list=['name','author','stackSize','DICE'];
  var dom_list=key_list.map(function(key){
    return $Setting.find('input.'+key)[0];
  });
  var type_list=[undefined,undefined,Number,Number];
  
  
  
  $Setting.find('button.save').on('click',function(){
    dom_list.forEach(function(dom,i){
      var value= type_list[i] === undefined ? dom.value : type_list[i](dom.value);
      var key=key_list[i];
      scenario.updateSetting(key,value);
    });
  });
  
}());

// End init tab4


function renderUnitEditor(scenario_dic){
  unitEditor.push_list(scenario_dic.unit_dic_list);
}

function renderOtherSetting(scenario_dic){
  console.log('stub function');
}

function renderMap(scenario_dic){
  
  map_el.empty(); // redraw

  var stateMap={change             : undefined,
                chooseHexType      : undefined,
                chooseEnteredUnit  : undefined,
                //chooseExitedUnit : undefined,
                chooseUnitClass    : undefined};
                
  
  
  btnResetAllUnit.onclick=function(){
    map_model.unit_l.forEach(function(unit){
      exitUnit(unit);
    });
  };
  
  btnChangeHexClass.onclick=function(){
    stateMap.change='changeHexClass';
  }
  
  btnChangeUnitLocation.onclick=function(){
    stateMap.change='changeUnitLocation';
  }
  
  btnEnterUnit.onclick=function(){
    stateMap.change='enterUnit';
  }

  btnExitUnit.onclick=function(){
    stateMap.change='exitUnit';
  }

  

  // Begin init selectTerrain
  
  
  var selectTerrain = document.getElementById('selectTerrain');
  
  var selectTerrainUpdateEvent=designPattern.event();
  var selectTerrainChangeEvent=designPattern.event();
  
  selectList(selectTerrain,{
    value : Object.keys(scenario_dic.terrain),
    updateEvent : selectTerrainUpdateEvent,
    changeEvent : selectTerrainChangeEvent
  });
  
  selectTerrainChangeEvent.register(function(value){
    console.log('selectTerrainChangeEvent',value);
    stateMap.chooseHexType=value;
    stateMap.change='changeHexClass';
  });
  
  // End init selectTerrain
  
  // Begin init selectUnit
  
  
  var selectUnit = document.getElementById('selectUnit');
  
  var selectUnitUpdateEvent=designPattern.event();
  var selectUnitChangeEvent=designPattern.event();
  
  var selectUnitList=selectList(selectUnit,{
    updateEvent : selectUnitUpdateEvent,
    changeEvent : selectUnitChangeEvent
  });
  
  selectUnitUpdateEvent.register(function(value){
    console.log('selectUnitUpdateEvent',value);
    stateMap.chooseExitedUnit=map_model.unit_d[value];
    stateMap.change='enterUnit';
  });
  
  
  
  // End init selectTerrain
  
  // // //
  
  
  var hexClassUpdateEvent = designPattern.event();
  var clickHexEvent       = designPattern.event();
  var clickUnitEvent      = designPattern.event();
  
  var map_model=mapModel(map_el,scenario_dic,{
      hexClassUpdateEvent : hexClassUpdateEvent,
      clickHexEvent       : clickHexEvent,
      clickUnitEvent      : clickUnitEvent
  });
  
  map_model.unit_l.forEach(function(unit){
    if(unit.removed){
      selectUnitList.append({value: unit.id,html: unit.label });
    }
  });
  
  function changeUnitLocation(unit,hex){
    var _unit=scenario.unit_d[unit.id];
    _unit.m=hex.m;
    _unit.n=hex.n;
    unit.set_hex(hex.m,hex.n);
  }
  
  function enterUnit(unit,hex){
    var _unit=scenario.unit_d[unit.id];
    _unit.m=hex.m;
    _unit.n=hex.n;
    unit.enter_to(hex.m,hex.n);
    selectUnitList.remove(unit.id);
  }
  
  function exitUnit(unit){
    var _unit=scenario.unit_d[unit.id];
    _unit.m=undefined;
    _unit.n=undefined;
    unit.destroy();
    selectUnitList.append({value: unit.id,html: unit.label });
  }
  
  function changeHexClass(hex,klass){
    var _hex=scenario.hex_d[[hex.m,hex.n]];
    _hex.terrain=klass;
    hexClassUpdateEvent.trigger(hex,stateMap.chooseHexType);
  }
  
    
  
  clickHexEvent.register(function(hex){
    if(stateMap.change==='changeUnitLocation'){
      changeUnitLocation(stateMap.chooseEnteredUnit,hex);
    }
  });
  
  clickUnitEvent.register(function(unit){
    if(stateMap.change==='changeUnitLocation'){
      stateMap.chooseEnteredUnit=unit;
    }
  });
  
  clickHexEvent.register(function(hex){
    if(stateMap.change==='changeHexClass'){
      console.log('chooseHexType',stateMap.chooseHexType);
      changeHexClass(hex,stateMap.chooseHexType);
    }
  });
  
  clickUnitEvent.register(function(unit){
    if(stateMap.change==='exitUnit'){
      exitUnit(unit);
    }
  });
  
  clickHexEvent.register(function(hex){
    if(stateMap.change==='enterUnit'){
      enterUnit(map_model.unit_d[Number(selectUnitList.value())],hex);
    }
  });
  
}