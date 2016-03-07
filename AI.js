function AI_box_class(){
	// this object should provide infromatiom by AI command setting
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
		var mnl=eval('['+mn+']');
		md.push([mn,distance(goal[0],goal[1],mnl[0],mnl[1])]);
		if (unit.zoc_map(mn)[unit.side]){
			al.push(mn);
		}
	}
	var target;
	if (al.length>0){
		target=random.choice(al);
	}
	else if (md.length!==0){
		md.sort(function(x,y){return x[1]-y[1]});
		target=md[0];
	}
	target=eval('['+target+']')//ugly hack but i can not find a path solve it basicly.
	if (target!==undefined){
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
	if (battle_box.odds()<1){
		battle_box.reset();
		return;
	}
	else{
		battle_box.do_it();
		if (unit_click_box.state!=='wait_choose'){
			battle_box.reset();// return to join-to it process
			battle_box.pursuit_reset();
		}
		else{
			// need pursuit			
			var target_unit=random.choice(battle_box.pursuit_unit_list);
			unit_click_box.state='wait_hex';
			var target_hex=random.choice(battle_box.pursuit_hex_list);
			console.log('target_unit:',target_unit,'target_hex',target_hex)
			battle_box.do_pursuit(target_unit,target_hex);
		}
	}
}
function AI_run(){
	// this function possibly be call by ready phase in a turn head.
	var side=phase_box.state[0];
	phase_box.next_phase();//turn to phase move
	unit_l.forEach(function(unit){
		if (!unit.removed && unit.side===side){
			AI_unit_move(unit);
		}
	})
	phase_box.next_phase();
	unit_l.forEach(function(unit){
		if (!unit.removed && unit.side!==side){
			AI_unit_combat(unit);
		}
	})
	phase_box.next_phase();
}