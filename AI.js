function AI_box_class(){
	//该对象应该根据AI命令提供AI_goal所需的数据
	this.init_map={};//init map指定
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
	//这个函数映射单位（如果它寻求AI的帮助的话）到它的目标上，为了测试这里直接隔断。
	//return AI_box.group_map[unit.group];
	return AI_box.unit_goal(unit);
}

function AI_unit_move(unit){
	//这个函数按照unit的当前状态孤立/分治的进行操作
	var range=unit.move_range();
	var al=[];
	var md=[];
	var goal=AI_goal(unit);
	for (var mn in range){
		var mnl=eval('['+mn+']');
		md.push([mn,distance(goal[0],goal[1],mnl[0],mnl[1])]);
		//console.log('mnl:',mnl,' distance:',distance(goal[0],goal[1],mnl[0],mnl[1]))
		if (unit.zoc_map(mn)[unit.side]){
			al.push(mn);
		}
	}
	var target;
	if (al.length>0){
		target=random.choice(al);
	}
	else if (md.length!==0){
		//console.log('md');
		md.sort(function(x,y){return x[1]-y[1]});
		target=md[0];
	}
	target=eval('['+target+']')//ugly hack but i can not find a path solve it basicly.
	//console.log('target:',target,' goal:',goal,' md:',md);
	if (target!==undefined){
		unit_click_box.choose_unit=unit;
		unit.move_to_path(target[0],target[1]);//神他妈这里转成了字符串，所以就不能用这种赋值，尼玛怎么转回元组？
		//unit.move_to_path(target);
	}
	else{
		console.log('I can not do anything!');
	}
}
function AI_unit_combat(unit){
	//这个实现为对每个敌人单位搜索，看看能不能，是否值得发起攻击。在这最简单的情况中，要么全体进攻要么不进攻。
	battle_box.reset();
	var hex=hex_d[[unit.m,unit.n]];
	/*
	if (!(unit.zoc_map([unit.m,unit.n])[unit.side])){
		return;//如果甚至不在我方ZOC里，不予考虑
	}*/ 
	//远程化消除此策略，是否允许纯远程攻击？
	//var ul=hex.nei.map(function(nei_mn){return hex_d[nei_mn].unit}).filter(function(unit){return unit!==null;});
	//远程化推翻ul从nei计算的方式，转而遍历所有可用单位，这当然会削弱这种弱智AI性能并造成性能损失，然并卵
	var ul=unit_l.filter(function(unit){return !unit.removed});
	//console.log('nei:',hex.nei,'map:',hex.nei.map(function(nei_mn){return hex_d[nei_mn].unit}),'filter:',ul);
	if (ul.length===0){
		return;
	}
	battle_box.join(unit);//join之后就有副作用了，非正常return前必须reset
	ul.forEach(function(ui){battle_box.join(ui)});
	//console.log('len->ul',ul.length,'atk_unit_list',battle_box.atk_unit_list.length,'def_unit_list',battle_box.def_unit_list.length);
	if (battle_box.atk_unit_list.length===0 || battle_box.def_unit_list.length===0){
		battle_box.reset();//尝试加但加不进去情况
		return;
	}
	if (battle_box.odds()<1){
		battle_box.reset();
		return;
	}
	else{
		battle_box.do_it();
		if (unit_click_box.state!=='wait_choose'){
			battle_box.reset();//回归继续join-do it 流程
			battle_box.pursuit_reset();
		}
		else{
			//需要追击			
			var target_unit=random.choice(battle_box.pursuit_unit_list);
			unit_click_box.state='wait_hex';
			var target_hex=random.choice(battle_box.pursuit_hex_list);
			console.log('target_unit:',target_unit,'target_hex',target_hex)
			battle_box.do_pursuit(target_unit,target_hex);
		}
	}
}
function AI_run(){
	//这里假设这个函数会在一回合的起始阶段(控制权被调换时)被调用，特别是控制行调用
	var side=phase_box.state[0];
	phase_box.next_phase();//转到move阶段
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