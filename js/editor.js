
var tabs=$('#tabs');
tabs.tabs();

function downloadFile(fileName, content){
    var aLink = document.createElement('a');
    var blob = new Blob([content]);
    var evt = document.createEvent("HTMLEvents");
    evt.initEvent("click", false, false);
    aLink.download = fileName;
    aLink.href = URL.createObjectURL(blob);
    aLink.dispatchEvent(evt);
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

loadBoxInit($('#FullScenarioLoader'),function(content){
  var scenario_dic=JSON.parse(content);
  renderMap(scenario_dic);
});

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
}

function renderMap(scenario_dic){
  
  
  var stateMap={change            : undefined,
                chooseHexType     : undefined,
                chooseEnteredUnit : undefined,
                //chooseExitedUnit  : undefined,
                chooseUnitClass   : undefined};
  
  var buttonExport=document.getElementById('buttonExport');
  var btnChangeHexClass=document.getElementById('btnChangeHexClass');
  var btnChangeUnitLocation=document.getElementById('btnChangeUnitLocation');
  var btnEnterUnit=document.getElementById('btnEnterUnit');
  var btnExitUnit=document.getElementById('btnExitUnit');
  
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
  
  // Begin init selectTerrain
  
  
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
  
  var map_el=$('#map');
  var map_model=mapModel(map_el,scenario_dic,{
      hexClassUpdateEvent : hexClassUpdateEvent,
      clickHexEvent       : clickHexEvent,
      clickUnitEvent      : clickUnitEvent
  });
  
  var scenario=Object.create(scenarioChangeAble);
  scenario.__init__(scenario_dic);
  buttonExport.onclick=function(){
    scenario.download();
  }
  
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
    selectUnitList.append(unit.id);
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