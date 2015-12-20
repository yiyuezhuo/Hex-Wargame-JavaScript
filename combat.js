//这个模块实现经典的CRT裁决，并解决UI交互以外的所有战斗相关功能函数。
/*
var CRT= (function(){
	var A1='A1';
	var AR='AR';
	var D1='D1';
	var DR='DR';
	var AE='AE';
	var DE='DE';
	var EX='EX';

	var table={
		0.25:[AE,AE,AE,AR,AR,DR],
		0.33:[AE,AE,AR,AR,AR,DR],
		0.5:[AE,AR,AR,AR,DR,DR],
		1.0:[AR,AR,AR,DR,DR,DR],
		1.5:[AR,AR,DR,DR,DR,DR],
		2.0:[AR,AR,DR,DR,DR,DE],
		3.0:[AR,DR,DR,DR,DE,DE],
		4.0:[EX,DR,DR,DE,DE,DE],
		5.0:[EX,EX,DE,DE,DE,DE],
		6.0:[DE,DE,DE,DE,DE,DE]
	}
	return table
})();
*/
var CRT=scenario_dic['CRT'];

function result_distribution(atk,def){
	//接受攻方总点数与守方总点数，映射一个结果表，这里不进行直接抽取。
	var odds;
	var odds_r=atk/def;
	var odds_c=0.25
	for (odds in CRT){
		if (odds>odds_c && odds_r>=odds){
			odds_c=odds;
		}
	}
	return CRT[odds_c];
	//return CRT()
}
function result_draw(atk,def,buff){
	if (buff===undefined){
		buff=0;
	}
	//var d6=int(random.random()*6);
	var dn=int(scenario_dic['setting']['DICE']*random.random())+1;
	//return result_distribution(atk,def)[d6];
	var point=dn+buff;
	return result_distribution(atk,def)[point];
}
function eliminate(unit_id){
	var unit=unit_d[unit_id];
	unit.destroy();
}
function routed(unit_id){
	//这个函数应该实现成让一个单位单独从其所处位置撤退，撤退只能撤向空的无敌ZOC格。否则消灭。
	var unit=unit_d[unit_id];
	var loc=hex_d[[unit.m,unit.n]];
	var ava=loc.nei.filter(function(nei_id){
		if (hex_d[nei_id].unit===null && !(unit.zoc_map(nei_id)[unit.side])){//如果该格没有其他单位并且不在敌方ZOC中
			//return true;
			//if (hex_d[nei_id])
			if (unit.movement>=terrain_d[hex_d[nei_id].terrain].base_cost){//只有正常情况下能移入才行
				return true;
			}
			else{
				return false;
			}
			//return true;
		}
		else{
			return false;
		}
	})
	if (ava.length===0){
		eliminate(unit.id);
	}
	else{
		var target=random.choice(ava);
		unit.move_to(target[0],target[1],100, "linear",'no_focus');
	}
}
function do_battle(atk_id_l,def_id_l,buff){
	if (buff===undefined){
		buff=0;
	}
	//atk_l是参与进攻的单位id列表，def_l类似，虽然一般应该只有一个单位
	var atk_l=atk_id_l.map(function(unit_id){return unit_d[unit_id];});
	var def_l=def_id_l.map(function(unit_id){return unit_d[unit_id];});
	//var ats=atk_l.reduce(function(u1,u2){return u1.combat+u2.combat;});
	if (atk_id_l.length!==0){
		var ats=sum(atk_l.map(function(unit){return unit.combat}))+buff;
	}
	else{
		var ats=buff;//纯远程攻击
	}
	var dts=sum(def_l.map(function(unit){return unit.combat}));
	//var dts=def_l.reduce(function(u1,u2){return u1.combat+u2.combat;});
	var result=result_draw(ats,dts);
	console.log('A:',ats,'buff',buff,'D:',dts,'result',result);
	result_do_list(result,atk_l,def_l);
	return result;
}
function result_do_list(result,atk_l,def_l){
	var dts=sum(def_l.map(function(unit){return unit.combat}));
	switch(result){
		case 'AE':
			atk_l.forEach(function(unit){eliminate(unit.id)});
			break;
		case 'AR':
			atk_l.forEach(function(unit){routed(unit.id)});
			break;		
		case 'DE':
			def_l.forEach(function(unit){eliminate(unit.id)});
			break;
		case 'DR':
			def_l.forEach(function(unit){routed(unit.id)});
			break;
		case 'EX':
			def_l.forEach(function(unit){eliminate(unit.id)});
			var ex_l=atk_l.slice();
			random.shuffle(ex_l);
			var exs=0;
			var ax_l;
			for(var i=0;i<ex_l.length;i++){
				exs+=ex_l[i].combat;
				if (exs>dts){
					break;
					
				}
			}
			ax_l=ex_l.slice(0,i);
			ax_l.forEach(function(unit){eliminate(unit.id)});
			break;
	}
	return result;
}