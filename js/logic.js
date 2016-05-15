var map_el=$('#map');
//map_el.css({'position':'absolute','left':'100px','top':'25px'});

short_edge_length=50;
hex_k=Math.cos(Math.PI/6)*2;
long_edge_length=short_edge_length*hex_k;
attach_edge=short_edge_length*1.5;
default_hex_type='tip';
counter_x=48;
counter_y=48;
stackSize=1; // test, 

var painter=domplot.Painter(map_el);

var clickHexEvent   = designPattern.event();
var highlightEvent  = designPattern.event();
var unhighlightEvent= designPattern.event();
var clickUnitEvent  = designPattern.event();
var moveEvent       = designPattern.event();
var setEvent        = designPattern.event();
var updateEvent     = designPattern.event();
var diedEvent       = designPattern.event();
var nextPhaseEvent  = designPattern.event();

var stateMap={ phase : 'init', //spciel phase only exists in first turn
               turn  : 1, 
               click : 'start',
               side  : 0};

stateSchema=function(schema,handler){
  // this is decorator
  function _handler(){
    if (all(Object.keys(schema).map(function(key){
      return schema[key]===stateMap[key];
    }))){
      return handler.apply(this,arguments);
    }
  }
  return _handler;
}

function all(l){
	return l.reduce(function(x,y){return x&&y});
}
function any(l){
	return l.reduce(function(x,y){return x||y});
}
function copy(l){
	return l.slice();
}
function equal_struct(l1,l2){
	if (typeof(l1)!=='object'){
		return l1===l2;
	}
	else{
		if (l1.length!==l2.length){
			return false;
		}
		for(var i=0;i<l1.length;i++){
			if (typeof(l1[i])!=='object'){
				if (l1[i]!==l2[i]){
					return false;
				}
			}
			else{
				if(!equal_struct(l1[i],l2[i])){
					return false;
				}
			}
		}
		return true;
	}
}
function member(atom,list){
    for(var i=0;i<list.length;i++){
		if (equal_struct(atom,list[i])){
			return true;
		}
	}
    return false;
}

function int(n){
	var m=Number(n);
	if (m%1===0){
		return m;
	}
	else{
		return Number(n)-Number(n)%1;
	}
}
function min(l,key){
	var ll;
	if (key!=undefined){
		ll=l.map(key);
	}
	else{
		ll=l;
	}
	var minv=ll[0];
	var index=0;
	for (var i=0;i<l.length;i++){
		var value=ll[i];
		if (value<minv){
			minv=value;
			index=i;
		}
	}
	return l[index];
}
function other(l,atom){
	for (var i=0;i<l.length;i++){
		if (atom!=l[i]){
			return l[i];
		}
	}
}

function sum(l){
	return l.reduce(function(x,y){return x+y});
}

function distance(x1,y1,x2,y2){
	return Math.sqrt(Math.pow(x1-x2,2)+Math.pow(y1-y2,2));
}

function hex_distance (n1,m1,n2,m2) {
  //calulate the distance between two hex
  var y1,x1,y2,x2,x,y;
  
  y1 = -n1;
  x1 = m1-Math.floor(n1/2);
  y2 = -n2;
  x2 = m2-Math.floor(n2/2);
  y  = y2-y1;
  x  = x2-x1;
  
  if (x*y <= 0){
    return Math.abs(x)+Math.abs(y);
  }
  return Math.abs(x)+Math.abs(y)-Math.min(Math.abs(x),Math.abs(y));
}


function Unit_click_box(){
	// handle event about player unit click 
	stateMap.click='start';
	this.choose_unit=undefined;
	this.unit_click=function(unit){
		// player click enter point
		var el=unit.el;
		console.log(unit.combat,unit.movement);
		switch(stateMap.phase){
			case 'move':
				console.log('enter move')
				switch(stateMap.click){
					case 'start'://now state "start","choosed" is special for phase move
						this.try_choose(unit);
						break;
					case 'choosed':
						this.try_choose(unit);
						break;
				break;
				}
			case 'combat'://there're join state purchase state
				switch(stateMap.click){
					case 'join':
						console.log('enter combat');
            if(unit.side===stateMap.side){
              battle_box.join(unit);
            }
            else{
              hex_d[[unit.m,unit.n]].allUnit().forEach(function(unit){
                battle_box.join(unit);
              })
            }
            //battle_matcher.enter(unit);
						break;
					case 'wait_choose':
						if (battle_box.pursuit_unit_able(unit)){
							this.choose_unit=unit;
							stateMap.click='wait_hex';
              
						}
						else{
							console.log('illege unit');
						}
            break;
					case 'wait_hex':
						if (battle_box.pursuit_unit_able(unit)){
							this.choose_unit=unit;
							stateMap.click='wait_hex';
						}
						else{
							console.log('illege unit');
						}
            break;
				}
		}
		console.log('click end');
	}
	this.reset_focus=function(){
		var set=this.choose_unit.move_range();
		this.remove_focus();
		for(var ss in set){
			if (set[ss]!==undefined){
				var hex=hex_d[ss];
				hex.highlight();
			}
		}
	}
	this.remove_focus=function(){
		hex_l.forEach(function(hex){
			if (hex.is_highlight){
				hex.de_highlight();
			}
		})
	}
	this.try_choose=function(unit){
		//if (phase_box.is_choose_able(unit)){
    if( unit.side===stateMap.side && stateMap.phase==='move'){
			this.choose_unit=unit;
			this.reset_focus();
			stateMap.click='choosed';// if you are in this state and you click other hex,you should move to it.
		}
		else{
			console.log('you can not choose a unit in error phase');
		}
	}
	
}

var battle_matcher=(function(){
  
  // Begin sub condition
  
  var subCondition={
    enter:function(){
      //console.log('default call enter');
      return true;
    },
    isSatisfy:function(){
      //console.log('default call isSatisfy');
      return true;
    },
    message:function(){
      //console.log('default call message');
      return {};
    },
    __init__:function(dict){
      var key,i;
      /*
      console.log('default call __init__');
      console.log('dict');
      console.log(dict);
      console.log('before bind');
      console.log(this);
      */
      if(dict){
        for (key in dict){
          /*
          console.log('key');
          console.log(key);
          console.log('value');
          console.log(dict[key]);
          */
          this[key]=dict[key];
        }
      }
      //console.log('after bind');
      //console.log(this);
    }
  }
  
  var isOnlyOneHex=Object.create(subCondition);
  isOnlyOneHex.__init__({
    
    bind_hex:undefined,
    
    checkSide:function(){
      throw new Error('null method');
    },
    
    enter:function(unit){
      if(!this.checkSide(unit)){
        return true;
      }
      if(this.bind_hex===undefined){
        this.bind_hex=[unit.m,unit.n];
        return true;
      }
      else{
        return JSON.stringify([unit.m,unit.n])===JSON.stringify(this.bind_hex);
      }
    },
    
    message:function(){
      throw new Error('null method');
    }

  });
  
  var isOnlyOneHexAtk=Object.create(isOnlyOneHex);
  isOnlyOneHexAtk.__init__({
    checkSide:function(unit){
      return unit.side===stateMap.side;
    },
    message:function(){
      return {atk_bind_hex:this.bind_hex};
    }
  });
  
  var isOnlyOneHexDef=Object.create(isOnlyOneHex);
  isOnlyOneHexDef.__init__({
    checkSide:function(unit){
      return unit.side!==stateMap.side;
    },
    message:function(){
      return {def_bind_hex:this.bind_hex};
    }
  })
  
  var isAllRangeAtk=Object.create(subCondition);
  isAllRangeAtk.__init__({
    enter:function(unit){
      if (unit.side!==stateMap.side){
        return true;
      }
      return unit.isRangeUnit();
    }
  });
  
  var isExistUnit=Object.create(subCondition);
  isExistUnit.__init__({
    checkSide:function(unit){
      throw new Error('null method');
    },
    enter:function(unit){
      if(!this.checkSide(unit)){
        return true;
      }
      this.unit_list.push(unit);
      return true;
    },
    isSatisfy:function(){
      return this.unit_list.length>0;
    },
    message:function(){
      throw new Error('null method');
    },
    __init__:function(dict){
      subCondition.__init__.call(this,dict);
      this.unit_list=[];
    }
    
  });
  
  var isExistUnitAtk=Object.create(isExistUnit);
  isExistUnitAtk.__init__({
    checkSide:function(unit){
      return unit.side===stateMap.side;
    },
    message:function(){
      return {atk_unit_list: this.unit_list};
    }
  });
  
  var isExistUnitDef=Object.create(isExistUnit);
  isExistUnitDef.__init__({
    checkSide:function(unit){
      return unit.side!==stateMap.side;
    },
    message:function(){
      return {def_unit_list: this.unit_list};
    }
  });
  
  var isNotRepeat=Object.create(subCondition);
  isNotRepeat.__init__({
    enter : function(unit){
      if(member(unit.id,this.unit_list.map(function(unit){return unit.id;}))){
        return false;
      }
      this.unit_list.push(unit);
      return true;
    },
    __init__:function(dict){
      subCondition.__init__.call(this,dict);
      this.unit_list=[];
    }
  });
  
  var isInRange=Object.create(subCondition);
  isInRange.__init__({
    _isInRangeNewAtk : function(unit){
      // atk should attack all defence unit
      var target;
      for(i=0;i<this.def_unit_list.length;i++){
        target=this.def_unit_list[i];
        if(!unit.in_range([target.m,target.n])){
          return false
        }
      }
      return true;
    },
    _isInRangeNewDef : function(unit){
      // def should attacked by all attacker unit
      var source;
      for(i=0;i<this.atk_unit_list.length;i++){
        source=this.atk_unit_list[i];
        if(!source.in_range([unit.m,unit.n])){
          return false
        }
      }
      return true;
    },
    enter : function(unit){
      var i,target;
      if(unit.side!==stateMap.side){
        this.def_unit_list.push(unit);
        return this._isInRangeNewDef(unit);
      }
      if(!this._isInRangeNewAtk(unit)){
        return false;
      }
      this.atk_unit_list.push(unit);
      return true;
    },
    __init__:function(dict){
      subCondition.__init__.call(this,dict);
      this.atk_unit_list=[];
      this.def_unit_list=[];
    }
  });
  
  var isFightNumberZeroAtk=Object.create(subCondition);
  isFightNumberZeroAtk.__init__({
    enter : function(unit){
      return unit.fight_number===0;
    }
  });
  

  // End sub condition
  
  // Begin pattern
  
  var patternPrototype={
    enter:function(input){
      return all(this.subConditionList.map(function(subCondition){
        var r=subCondition.enter(input);
        //console.log('subCondition',subCondition);
        //console.log('r',r);
        return r
      }));
    },
    isSatisfy:function(){
      return all(this.subConditionList.map(function(subCondition){
        return subCondition.isSatisfy();
      }));
    },
    message:function(){
      var rd={};
      this.subConditionList.forEach(function(subCondition){
        var key,
            subMessage=subCondition.message();
        for(key in subMessage){
          rd[key]=subMessage[key];
        }
      });
      return rd;
    },
    __init__:function(subConditionPrototypeList){
      this.subConditionList=subConditionPrototypeList.map(function(subConditionPrototype){
        var pattern=Object.create(subConditionPrototype);
        pattern.__init__();
        return pattern;
      });
    }
  };
  
  var baseCondtion=[isExistUnitAtk,isExistUnitDef,isNotRepeat,isInRange,isFightNumberZeroAtk];
  
  function patternFactory(patternPrototypeList){
    var pattern=Object.create(patternPrototype);
    pattern.__init__(baseCondtion.concat(patternPrototypeList));
    return pattern;
  }
  
  
  // End pattern 
  
  // Begin pattern matcher
  
  var matcher={
    
    _enter : function(input){
        
        var isSucc;
        //console.log('_enter:','now pointer in',this.pattern_pointer);
        if(this.pattern_pointer>=this.pattern_list.length){
            //console.log('fail');
            if(this.failEvent){
              this.failEvent.trigger();
              //console.log('fail call');
            }
            
            this._reset();
            return false;
        }
        isSucc=this.pattern_list[this.pattern_pointer].enter(input);
        //console.log('isSucc',isSucc);
        if (!isSucc){
          this.pattern_pointer+=1;
          return this._enterList(this.input_cache);
        }
        else{
          return true;
        }
    },
    
    _enterList   : function(inputList){
      
      var input,isSucc,i;
      
      //console.log('_enterList:','now pointer in',this.pattern_pointer);
      
      for(i=0;i<inputList.length;i++){
        input=inputList[i];
        isSucc=this._enter(input);
        if(!isSucc){
          return false;
        }
      }
      return true;
    },
    enter : function(input){
      //console.log('enter');
      //console.log('this.input_cache length',this.input_cache.length);
      this.input_cache.push(input);
      if(this._enter(input) && this.succEvent){
        this.succEvent.trigger(this.message());
      }
    },
    enterList :function(inputList){
      var i;
      for(i=0;i<inputList.length;i++){
        this.enter(inputList[i]);
      }
    },
    enterEnd  : function(){
      var message;
      if(this.isSatisfy()){
        /*
        message=this.message();
        console.log(message);
        return message;
        */
        return true;
      }
      else{
        this.pattern_pointer+=1;
        if(this.pattern_pointer<this.pattern_list.length && this._enterList(this.input_cache)){
          return this.enterEnd();
        }
        else{
          if(this.endFailEvent){
            this.endFailEvent.trigger();
            return false;
          }
        }
      }
    },
    isSatisfy : function(){
      return this.pattern_list[this.pattern_pointer].isSatisfy();
    },
    message : function(){
      return this.pattern_list[this.pattern_pointer].message();
    },
    _reset : function(){
      var toaw=patternFactory([isOnlyOneHexDef]);
      var oneHexVsMany=patternFactory([isOnlyOneHexAtk]);
      var bomb=patternFactory([isOnlyOneHexDef,isAllRangeAtk]);
      this.pattern_list=[bomb,oneHexVsMany,toaw];
      
      this.input_cache=[];
      this.pattern_pointer=0;
    },
    reset : function(){
      this._reset();
    },
    __init__ : function(config){
      this._reset();
      if(config.succEvent){
        this.succEvent=config.succEvent;
      }
      if(config.failEvent){
        this.failEvent=config.failEvent;
      }
      if(config.endFailEvent){
        this.endFailEvent=config.endFailEvent;
      }
    }
  }
  
  // End pattern matcher
  
  return matcher;
  
}());

// config matcher and bind dom update event to deconple logic

var resetEvent=designPattern.event();

!function(){
  
  var succEvent = designPattern.event();
  var failEvent = designPattern.event();
  var endFailEvent = designPattern.event();
  
  function updateOdds(message){
    var atkHtml=message.atk_unit_list.map(function(unit){
      return '<p>'+unit.to_tag()+'</p>';
    });
    var defHtml=message.def_unit_list.map(function(unit){
      return '<p>'+unit.to_tag()+'</p>';
    });
    toolbox.battle_odds_attack.empty();
    toolbox.battle_odds_attack.html(atkHtml);
    toolbox.battle_odds_defence.empty();
    toolbox.battle_odds_defence.html(defHtml);
  }
  
  succEvent.register(function(message){
    //console.log('succEvent trigger');
    updateOdds(message);
  });
  
  failEvent.register(function(){
    //console.log('failEvent trigger');
    toolbox.battle_odds_attack.empty();
    toolbox.battle_odds_defence.empty();
  });
  
  $('#reset_a').click(function(){
    battle_matcher.reset();
    updateOdds(battle_matcher.message());
  });
  
  resetEvent.register(function(){
    battle_matcher.reset();
    updateOdds(battle_matcher.message());
  });
  
  /*
  failEvent.register(function(){
    console.log('failEvent');
  });

  endFailEvent.register(function(){
    console.log('endFailEvent');
  });  
  */
  battle_matcher.__init__({
    succEvent : succEvent,
    failEvent : failEvent,
    endFailEvent : endFailEvent
  });

  
}();




function Battle_box(){
	// this object would effect UI in toolbox
	this.atk_unit_list=[];
	this.def_unit_list=[];
	this.pursuit_hex_list=[];
	this.pursuit_unit_list=[];
	this.cache_def_loc=[];
	this.attack_type_map={};
	// map unit.id to attack mode that include melee and range. if unit range property is 1 then set melee else range. 
	//This value is handled by phase do_it
	var that=this;
  
  this.join=function(unit){
    battle_matcher.enter(unit);
  }
  
	this.do_it=function(){
		// complete handle and reset state
    
    if(battle_matcher.enterEnd()){
      var message=battle_matcher.message();
    }
    else{
      this.reset();
      return;
    }
    that.atk_unit_list=message.atk_unit_list;
    that.def_unit_list=message.def_unit_list;
    
		var atk_id_list_t=that.atk_unit_list.map(function(unit){return unit.id});
		var def_id_list=that.def_unit_list.map(function(unit){return unit.id});
		that.cache_def_loc=that.def_unit_list.map(function(unit){return hex_d[[unit.m,unit.n]]});
		that.atk_unit_list.forEach(function(unit){//update attack_type_map
			var mn=[unit.m,unit.n];
			var def_loc=that.cache_def_loc;
			if (any(def_loc.map(function(hex){return member(mn,hex.nei)}))){
				that.attack_type_map[unit.id]='melee';
			}
			else{
				that.attack_type_map[unit.id]='range';
			}
		})
		var atk_id_list_r=[];//result. join result process
		var atk_id_list_s=[];//support. add combat value but not join result process
		atk_id_list_t.forEach(function(unit_id){
			var unit=unit_d[unit_id];
			if (that.is_range_attack(unit)){
				atk_id_list_s.push(unit.id);
			}
			else{
				atk_id_list_r.push(unit.id);
			}
		});
		var buff;
		if (atk_id_list_s.length!==0){
			buff=sum(atk_id_list_s.map(function(unit_id){return unit_d[unit_id].combat}));
		}
		else{
			buff=0;
		}
		var result=do_battle(atk_id_list_r,def_id_list,buff);
		that.result_follow(result);
	}
  
	this.is_range_attack=function(unit){
		if (this.attack_type_map[unit.id]==='melee'){
			return false;
		}
		else{
			return true;
		}
	}
  
	this.result_follow=function(result){
		// result is string in the CRT as "EX"
		this.atk_unit_list.forEach(function(unit){unit.fight_number+=1;});
		this.def_unit_list.forEach(function(unit){unit.fight_number+=1;});
		// range attack unit can't pursuit
		switch(result){
			case 'DR':
				this.pursuit_hex_list=this.cache_def_loc;
				this.pursuit_unit_list=this.atk_unit_list.filter(function(unit){return !that.is_range_attack(unit)});
				break;
			case 'DE':
				this.pursuit_hex_list=this.cache_def_loc;
				this.pursuit_unit_list=this.atk_unit_list.filter(function(unit){return !that.is_range_attack(unit)});
				break;
			case 'EX':
				this.pursuit_hex_list=this.cache_def_loc;
				this.pursuit_unit_list=this.atk_unit_list.filter(function(unit){return !unit.removed});
				this.pursuit_unit_list=this.atk_unit_list.filter(function(unit){return !that.is_range_attack(unit)});
				break;
		}
		if (this.pursuit_hex_list.length>0 && this.pursuit_unit_list.length>0){
			// handle pursuit
			stateMap.click='wait_choose';
		}
		else{
			this.reset();//return to join-do it process
			this.pursuit_reset();
		}
	}
  
	this.reset=function(){
    //battle_matcher.reset();
    resetEvent.trigger();
		stateMap.click='join';
	}
  
	this.pursuit_reset=function(){
		this.pursuit_hex_list=[];
		this.pursuit_unit_list=[];
	}
  
	this.do_pursuit=function(unit,hex){
		unit.move_to(hex.m,hex.n,100, "linear",'no_focus');
		this.pursuit_reset();
		this.reset();
	}
  
	this.pursuit_unit_able=function(unit){
		return member(unit.id,this.pursuit_unit_list.map(function(unit){return unit.id}));
	}
  
	this.pursuit_hex_able=function(hex){
		console.log([hex.m,hex.n],this.pursuit_hex_list.map(function(hex){return [hex.m,hex.n]}));
		return member([hex.m,hex.n],this.pursuit_hex_list.map(function(hex){return [hex.m,hex.n]}));
	}
  
	this.odds=function(){
		var ats=sum(this.atk_unit_list.map(function(unit){return unit.combat}));
		var dts=sum(this.def_unit_list.map(function(unit){return unit.combat}));
		return ats/dts;
	}
  
}



(function(){ // old phase_box and toolbox part
  
  var phaseSequence=['ready','move','combat'];
  var AI_run_a=$('#AI_run_a');
  var show_widget=$('#turn_state');
  
  AI_run_a.click(AI_run);
  
  $('#next_phase_a').click(function(){
    nextPhaseEvent.trigger();
  });
  
  function change_phase_to(side,state){
    console.log(player_d[side].name+' '+state+' phase');
		show_widget.html(player_d[side].name+' '+state+' phase');
		stateMap.phase=state;
    stateMap.side=side;
    event_box.fire(state);
  }
  
  function next_player_id(){
    return other([0,1],stateMap.side);
  }
  
  nextPhaseEvent.register(stateSchema({
    phase : 'init'
  },function(){
    change_phase_to(0,'ready');
    //next_player.ready();
    toolbox.combat_box.hide();
    AI_run_a.show();
    return true;
  }));

    
  nextPhaseEvent.register(stateSchema({
    phase : 'ready'
  },function(){
    AI_run_a.hide();
    change_phase_to(stateMap.side,'move');
    stateMap.click='start';
    return true;
  }));
  
  nextPhaseEvent.register(stateSchema({
    phase : 'move'
  },function(){
    stateMap.click='join';
    change_phase_to(stateMap.side,'combat');
    toolbox.combat_box.show();
    return true;
  }));

  nextPhaseEvent.register(stateSchema({
    phase : 'combat'
  },function(){
    var ending_player=player_d[stateMap.side];
    var next_player=player_d[next_player_id()]
    ending_player.end();
    change_phase_to(next_player.id,'ready');
    next_player.ready();
    toolbox.combat_box.hide();
    AI_run_a.show();
    stateMap.turn+=1;
    return true;
  }));

}());


function Toolbox(){
	this.el=$('#toolbox');
	//this.el.css({'z-index':20,position:'fixed','background-color': 'rgb(250, 250, 250)'});
	//var next_phase_a=$('#next_phase_a');
	//next_phase_a.click(phase_box.next_phase);
	//this.show_widget=$('#turn_state');
	this.do_it_a=$('#do_it_a');
	//this.reset_a=$('#reset_a');
	this.combat_box=$('#combat_box');
	this.battle_odds=$('#battle_odds');
	this.battle_odds_attack=$('#battle_odds_attack');
	this.battle_odds_defence=$('#battle_odds_defence');
	this.chase_a=$('#chase_a');
	//this.AI_run_a=$('#AI_run_a');
	this.do_it_a.click(battle_box.do_it);
	//this.reset_a.click(battle_box.reset);
	this.combat_box.hide();
	this.chase_a.hide();
	//this.AI_run_a.click(AI_run);
	//this.el.css({width:'100px'});
	this.description_name=$('#description_name');
	this.description_author=$('#description_author');
	this.description_name.html(scenario_dic.setting.name);
	this.description_author.html('by '+scenario_dic.setting.author);
}

function News_box(){
	this.el=$('#news_box');
	this.news_text=$('#news_text');
	this.news_exit_a=$('#news_exit_a');
	//this.el.css({'position':'fixed','z-index':15,'background-color':'rgb(0, 0, 50)',left:'200px',color:'rgb(255,255,255)'});
	var that=this;
	this.write=function(text){
		this.news_text.html(this.news_text.html()+text);
	}
	this.reset=function(){
		this.news_text.empty();
	}
	this.show=function(text){
		if(text===undefined){
			text='';
		}
		this.reset();
		this.write(text);
		this.el.show();
	}
	this.hide=function(){
		that.el.hide();
	}
	this.news_exit_a.click(this.hide);
	this.el.hide();
}

function Player(side_id){
	//player level state manager
	this.side=side_id;
	this.id=side_id;
	var that=this;
	this.all_unit=function(){
		var l=[];
		unit_l.forEach(function(unit){
			if (unit.side===that.side){
				l.push(unit);
			}
		})
		return l;
	}
	this.ready=function(){
		this.all_unit().forEach(function(unit){
			unit.ready();
		})
	}
	this.end=function(){
		this.all_unit().forEach(function(unit){
			unit.end();
		})
	}
	
}


function Unit(_unit){
  
	this.id=_unit.id;
	this.side=_unit.side;
	this.combat=_unit.combat;
	this.movement=_unit.movement;
	this.m=_unit.m;
	this.n=_unit.n;
	this.VP=_unit.VP;
	this.label=_unit.label;
	this.img=_unit.img;
	this.group=_unit.group;
	this.combat_range=_unit.range;

	var that=this;
	this.mp=0;
	this.short_path={};//  this value is set by find way method
	this.surplus_map={};
	this.removed=false;
	this.fight_number=0;// fight time in this turn 
	this.combat_range=1;
}

Unit.prototype.ready=function(){
  this.mp=this.movement;
  this.fight_number=0;
}

Unit.prototype.end=function(){
  this.mp=this.movement;
  this.fight_number=0;
}

Unit.prototype.set_hex=function(m,n){
  this.hex_move(this.m,this.n,m,n);
  setEvent.trigger(this.domId,m,n);
  this.m      = m;
  this.n      = n;
}

Unit.prototype.move_to=function(m,n,duration,pattern,mode,pass){
  if (pass===undefined){
    this.hex_move(this.m,this.n,m,n);
  }
  if (mode==='no_focus'){
    moveEvent.trigger(this.domId,m,n);
  }
  else{
    moveEvent.trigger(this.domId,m,n,function(){
                      //console.log('wuyu');
                      unit_click_box.reset_focus();
                    });
  }
  this.m=m;
  this.n=n;
};

Unit.prototype.hex_move=function(m1,n1,m2,n2){
  //hex_d[[m1,n1]].unit=null;
  hex_d[[m1,n1]].exit(this);
  //hex_d[[m2,n2]].unit=this;
  hex_d[[m2,n2]].enter(this);
};
/*
Unit.prototype.hex_pass=function(m1,n1,m2,n2){
  hex_d[[m1,n1]].pass=null;
  hex_d[[m2,n2]].pass=this;
};
*/
Unit.prototype.move_to_path=function(target_m,target_n){
  var ing_m=this.m;
  var ing_n=this.n;
  var path=[];
  var that=this;
  if (this.short_path[[target_m,target_n]]!==undefined)
    path=this.short_path[[target_m,target_n]].slice(1);
  else{
    console.log('No path cal to that');
    return;
  }
  
  path.forEach(function(node){
    that.move_to(node[0],node[1],100, "linear",'focus','pass');
  })
  this.hex_move(ing_m,ing_n,target_m,target_n);
  this.mp=this.surplus_map[[target_m,target_n]];
};

Unit.prototype.zoc_map=function(mn){
  var hex=hex_d[mn];
  var map={}
  var that=this;
  player_l.forEach(function(player){
    map[player.id]=! (hex.isStackEmpty() || hex.isSideFriend(player.id)) 
                   || any(hex.nei.map(function(nei_id){
      // Is threat exist by special neibor hex ? ( if exist then return true)
      var nei= hex_d[nei_id];
      if (nei.isStackEmpty() || nei.isSideFriend(player.id)){
        return false;
      }
      else{
        return true;
      }
    }));
  });
  return map;
};

Unit.prototype.move_cost=function(mn,surplus){
    var hex=hex_d[mn];
    var base_cost=terrain_d[hex.terrain].base_cost;
    //if (hex.unit!==null && hex.unit.side!==this.side){
    if (! hex.isPassAble(this)){
      return Math.max(surplus+1,1);// trick way to ban move
    }
    if (this.zoc_map(mn)[this.side]){
      return Math.max(surplus,base_cost);
    }
    return base_cost;
};

Unit.prototype.move_range=function(){
  // this method should return feasible space and shortest path in all hex in feasible space. 
  var that=this,
      mp_s=this.mp,
      set={},
      activate_list=[[this.m,this.n]],
      activate_list_b,
      try_s,
      build_path,
      act,
      r_set={},
      key;
  this.short_path={};// map to node list in best path searched by current
  this.short_path[[this.m,this.n]] = [[this.m,this.n]];// best path include start point
  //var mp_s=this.mp;
  //var set={};// map to best cost in best path in current find state
  set[[this.m,this.n]] = this.mp;
  //var activate_list=[[this.m,this.n]];
  while (activate_list.length !== 0){
    activate_list_b = [];
    activate_list.forEach(function(act_mn){
      act=hex_d[act_mn];
      act.nei.forEach(function(try_mn){
        try_s=set[act_mn] - that.move_cost(try_mn,set[act_mn]);
        if ((set[try_mn] === undefined && try_s >= 0) || 
            (set[try_mn] !== undefined && set[try_mn] < try_s)){
          set[try_mn] = try_s;
          build_path = copy(that.short_path[act_mn]);
          build_path.push(try_mn);
          that.short_path[try_mn] = build_path;
          if (try_s > 0){
            activate_list_b.push(try_mn);
          }
        }
      });
    });
    activate_list=activate_list_b;
  }
  // unit can't move to its self location
  for (key in set){
    //if(hex_d[key].unit === null){
    if(! hex_d[key].isStackFull()){
      r_set[key] = set[key];
    }
  }
  this.surplus_map = r_set;
  return r_set;
}

Unit.prototype.destroy=function(){
  this.removed=true;
  diedEvent.trigger(this.domId);
  //hex_d[[this.m,this.n]].unit=null;
  hex_d[[this.m,this.n]].exit(this);
};

Unit.prototype.to_tag=function(){
  // this function return a introduction string to insert item odds to display
  return this.label+':'+this.combat;
};

Unit.prototype.in_range=function(mn){
  // to judge whether this hex can be attacked to its range. Range is description by unit.csv, for "melee" unit ,is 1 .
  return hex_distance(this.m,this.n,mn[0],mn[1])<=this.combat_range;
}

Unit.prototype.isRangeUnit=function(){
  return this.combat_range>=2;
}




var unit_click_box=new Unit_click_box();
//var hex_click_box=new Hex_click_box();
//var phase_box=new Phase_box();
var battle_box=new Battle_box();

var news_box=new News_box();
var toolbox=new Toolbox();

var event_box=new Event_box();
var AI_box= new AI_box_class()
AI_box.setup(scenario_dic.AI_list);


var unit_l=[];
var unit_d={};
var hex_l=[];
var hex_d={};//key is coordinate of the hex
var player_l=[];
var player_d={};
var terrain_d=scenario_dic.terrain;

//var mat=create_hexs(scenario_dic['size'][0],scenario_dic['size'][1]);


function Hex(_hex){
	this.m=_hex.m;
	this.x=_hex.m;
	this.n=_hex.n;
	this.y=_hex.n;
	this.label=_hex.label;
	this.VP=_hex.VP;
	this.terrain=_hex.terrain;
	this.capture=_hex.capture;
  this.stack=[];
  
	//this.unit=null;// the unit is locate in this hex
	//this.pass=null;// the units is passing the hex
  this.nei=this.cal_nei();
  
  this.is_highlight=false;
}
Hex.prototype.highlight=function(){
  this.is_highlight=true;
  highlightEvent.trigger(this.m,this.n);
}
Hex.prototype.de_highlight=function(){
  this.is_highlight=false;
  unhighlightEvent.trigger(this.m,this.n);
}
Hex.prototype.cal_nei=function(){
  var tran,
      that=this;
	if (this.m%2===0){
		tran=[[-1,-1],[-1,0],[0,1],[1,0],[1,-1],[0,-1]];
	}
	else{
		tran=[[-1, 0],[-1,1],[0,1],[1,1],[1, 0],[0,-1]];
	}
	nei_a=tran.map(function(mn){
		return [ mn[0]+that.m,mn[1]+that.n];
	});
	return nei_a.filter(function(nei){
		return 0<=nei[0] 
           && nei[0]<scenario_dic['size'][0] 
           && 0<=nei[1] 
           && nei[1]<scenario_dic['size'][1];
	});
}
Hex.prototype.isStackEmpty=function(){
  return this.stack.length === 0;
}
Hex.prototype.isStackFull=function(){
  return this.stack.length >= stackSize;
}
Hex.prototype.isPassAble=function(unit){
  return this.isStackEmpty() || (this.stack[0].side === unit.side );
}
Hex.prototype.isMovetoAble=function(unit){
  return (! this.isStackFull()) && this.isPassAble();
}
Hex.prototype.isSideFriend=function(id){
  return this.isStackEmpty() || (this.stack[0].side === id );
}
Hex.prototype.enter=function(unit){
  
  //var t1,t2;
  //t1=this.stack.length;
  this.stack.push(unit);
  //t2=this.stack.length;
  //console.log('enter',t1,'->',t2);
}
Hex.prototype.exit=function(unit){
  //console.log('exit');
  //var t1,t2;
  //t1=this.stack.length;
  this.stack=this.stack.filter(function(_unit){
    return unit!==_unit;
  });
  //t2=this.stack.length;
  //console.log('exit',t1,'->',t2);
}
Hex.prototype.allUnit=function(){
  return this.stack.slice(); // I debug this for a long time goto hell the reference list!
}


function create_hexs(scenario_dic){
  var m=scenario_dic['size'][0],
      n=scenario_dic['size'][1],
      mat=[],
      i;
  for(i=0;i<m;i++){
    mat.push(new Array(n));
  }
  scenario_dic['hex_dic_list'].forEach(function(_hex){
    mat[_hex.m][_hex.n]=new Hex(_hex);
  })
  
  function classMap(i,j){
    return mat[i][j].terrain;
  }
  
  
  domplot.Hexs({ painter  : painter,
                 m : m,
                 n : n,
                 clickEvent : clickHexEvent,
                 classMap   : classMap,
                 highlightEvent   : highlightEvent,
                 unhighlightEvent : unhighlightEvent})
  return mat;
}

var mat=create_hexs(scenario_dic);

clickHexEvent.register(stateSchema(
            {phase : 'move',
             click : 'start'},
            function(i,j){
              console.log(i,j,'can not do anything');
            }));
            
clickHexEvent.register(stateSchema(
            {phase : 'move',
             click : 'choosed'},
            function(i,j){
              var hex=mat[i][j];
              if (unit_click_box.choose_unit.move_range()[[hex.m,hex.n]]!==undefined){
                unit_click_box.choose_unit.move_to_path(hex.x,hex.y);
              }
              else{
                stateMap.click='start';
                unit_click_box.remove_focus();
                console.log(i,j,'Too long to move');
              }
            }));
            
clickHexEvent.register(stateSchema(
            {phase : 'combat',
             click : 'join'},
            function(i,j){
              console.log(i,j,'nothing to do for the hex in join state');
            }));

clickHexEvent.register(stateSchema(
            {phase : 'combat',
             click : 'wait_choose'},
            function(i,j){
              console.log(i,j,'wait_choose');
            }));

clickHexEvent.register(stateSchema(
            {phase : 'combat',
             click : 'wait_hex'},
            function(i,j){
              var hex=mat[i][j];
              if (battle_box.pursuit_hex_able(hex)){
                battle_box.do_pursuit(unit_click_box.choose_unit,hex);
                console.log('I can do that!');
              }
              else{
                console.log(i,j,'illege hex');
              }
            }));
           

function create_units(scenario_dic){
  var n=scenario_dic.unit_dic_list.length;
  function attrUnit(_unit){
    return {
      size  : _unit.size,
      pad   : _unit.pad,
      l0    : _unit.combat,
      l2    : _unit.movement,
      color : _unit.color
    };
  }
  var unitMap=function(id){
    return attrUnit(scenario_dic.unit_dic_list[id]);
  }
  var unitList=scenario_dic.unit_dic_list.map(function(_unit,i){
    var unit=new Unit(_unit);
    unit.domId=i;
    return unit;
  })
  clickUnitEvent.register(function(id){
    unit_click_box.unit_click(unitList[id]);
  });
  domplot.Counters({painter     : painter,
                    n           : n,
                    unitMap     : unitMap,
                    clickEvent  : clickUnitEvent,
                    moveEvent   : moveEvent,
                    setEvent    : setEvent,
                    updateEvent : updateEvent,
                    diedEvent   : diedEvent,//});
                    stackSize   : stackSize});
  return unitList;
}

scenario_dic['hex_dic_list'].forEach(function(_hex){
	var hex=mat[_hex.m][_hex.n];
	hex_l.push(hex);
	hex_d[[hex.m,hex.n]]=hex;
});

unit_l=create_units(scenario_dic);

unit_l.forEach(function(unit){
	unit.set_hex(unit.m,unit.n);
	unit.ready();
	
	//unit_l.push(unit);
	unit_d[unit.id]=unit;
});

scenario_dic['player_dic_list'].forEach(function(_player){
	var player=new Player(_player.id);
	player.name=_player.name;
	
	player_l.push(player);
	player_d[_player['id']]=player;
})

nextPhaseEvent.trigger(); // init -> ready

//phase_box.change_phase_to(0,'ready');
//event_box.fire('ready');
//sphase_box.next_phase();

//var unit=unit_l[0];
