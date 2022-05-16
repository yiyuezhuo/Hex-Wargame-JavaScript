function AI_box_class(){
	// this object should provide information according to the AI command setting
	this.init_map={};//init map assign
	this.pursuit_group={};
	var that=this;
	this.setup=function(command_list){
		command_list.forEach(function(command){
			switch(command[0]){
				case 'init':
					that.init_map[command[1]]=[command[2],command[3]];
					break;
			}
		})
	}
	this.unit_goal=function(unit){
		return this.init_map[unit.group];
	}
}

function AI_goal(unit){
	// this function map unit to its goal
	return AI_box.unit_goal(unit);
}

function AI_unit_move(unit){
	// this function run every single unit .
	var range=unit.move_range();
	var al=[];
	var md=[];
	var goal=AI_goal(unit);
	for (var mn in range){
		//var mnl=eval('['+mn+']');
    var mnl=mn.split(',').map(Number);
		md.push([mnl,distance(goal[0],goal[1],mnl[0],mnl[1])]);
		if (unit.zoc_map(mn)[unit.side]){
			al.push(mnl);
		}
	}
	var target;
	if (al.length>0){
		target=random.choice(al);
	}
	else if (md.length!==0){
		md.sort(function(x,y){return x[1]-y[1]});
		target=md[0][0];
	}
  
  //console.log(target);
  if(target!==undefined){
    //target=target.split(',').map(Number);
		unit_click_box.choose_unit=unit;
		unit.move_to_path(target[0],target[1]);//not tuple , what hell
	}
	else{
		console.log('I can not do anything!');
	}
}
function AI_unit_combat(unit){
	// iteration to find some enemy unit can be attacked
	battle_box.reset();
	var hex=hex_d[[unit.m,unit.n]];
	var ul=unit_l.filter(function(unit){return !unit.removed});
	if (ul.length===0){
		return;
	}
	battle_box.join(unit);// there's side effect after join. You should reset it before return 
	ul.forEach(function(ui){battle_box.join(ui)});
	if (battle_box.atk_unit_list.length===0 || battle_box.def_unit_list.length===0){
		battle_box.reset();// try join but fail case
		return;
	}
	if (battle_box.odds()<1){ // now because battle_box update list in do it time so ite don't work
		battle_box.reset();
		return;
	}
	else{
		battle_box.do_it();
    try_pursuit();
  }
}

function try_pursuit(){
  //console.log('try_pursuit');
  if (stateMap.click!=='wait_choose'){
    battle_box.reset();// return to join-to it process
    battle_box.pursuit_reset();
    //console.log('pursuit abort');
  }
  else{
    // need pursuit			
    var target_unit=random.choice(battle_box.pursuit_unit_list);
    stateMap.click='wait_hex';
    var target_hex=random.choice(battle_box.pursuit_hex_list);
    //console.log('target_unit:',target_unit,'target_hex',target_hex)
    battle_box.do_pursuit(target_unit,target_hex);
    //console.log('do pursuit');
    console.log('unit',target_unit.id,'pursuit to',target_hex.m,target_hex.n);
  }
}

function AI_run(){
	// this function possibly be call by ready phase in a turn head.
	var side=stateMap.side;
	//phase_box.next_phase();//turn to move phase
  nextPhaseEvent.trigger();
	unit_l.forEach(function(unit){
		if (!unit.removed && unit.side===side){
			AI_unit_move(unit);
		}
	});
	//phase_box.next_phase(); turn to battle phase
  nextPhaseEvent.trigger();
  hex_l.forEach(function(hex){
    var allUnit=hex.allUnit();
    if(allUnit.length>0 && allUnit[0].side!==stateMap.side){
      AI_unit_combat_hex(hex);
    }
  });
  /*
	unit_l.forEach(function(unit){
		if (!unit.removed && unit.side!==side){
			AI_unit_combat(unit);
		}
	})
  */
	//phase_box.next_phase();
  nextPhaseEvent.trigger();
}

var attackplan={
  __init__ : function(targetList){
    var that=this;
    this.isFail=false;
    var failEvent=designPattern.event();
    //var failEvent=designPattern.event();
    this.battle_matcher=Object.create(battle_matcher);
    this.battle_matcher.__init__({
      failEvent : failEvent
    });
    failEvent.register(function(){
      //console.log('attackplan fail event trigger!');
      that.isFail=true;
    });
    this.input_cache=targetList;
    this.battle_matcher.enterList(targetList);
  },
  testOne : function(unit){
    this.isFail=false;
    this.battle_matcher.enter(unit); // it may be change this.isFail value to true if failed
    if (this.isFail){
      this.battle_matcher.reset();
      this.battle_matcher.enterList(this.input_cache);
      return false;
    }
    else{
      //this.input_cache.push(unit);
      return true;
    }
  },
  testList : function(unit_list){
    var that=this;
    unit_list.forEach(function(unit){
      if(that.testOne(unit)){
        that.input_cache.push(unit);
      }
    });
  },
  output:function(){
    var isSatisfy=this.battle_matcher.isSatisfy();
    //console.log('isSatisfy',isSatisfy);
    //console.log(this.input_cache);
    if(isSatisfy){
      return this.input_cache;
    }
  },
  odds : function(){
    var atkList=[],
        defList=[];
    this.input_cache.forEach(function(unit){
      if(unit.side===stateMap.side){
        atkList.push(unit.combat);
      }
      else{
        defList.push(unit.combat);
      }
    });
    return sum(atkList)/sum(defList);
  }
}

function AI_unit_combat_hex(targetHex){
  var targetList=targetHex.allUnit();
  var plan=Object.create(attackplan);
  plan.__init__(targetList);
  plan.testList(unit_l.filter(function(unit){
    return unit.side!==targetList[0].side && !unit.removed;
  }));
  var joinList = plan.output();
  
  //console.log('joinList',joinList);
  
  if(joinList!==undefined && plan.odds()>1){
    var i;
    for(i=0;i<joinList.length;i++){
      battle_box.join(joinList[i]);
    }
    battle_box.do_it();
    try_pursuit();
  }
  else{
    battle_box.reset();
  }
}

