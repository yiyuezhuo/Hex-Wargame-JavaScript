// this module implement CRT and provide some function used to do thing about fight result
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

function result_distribution(atk,def){
	// receive attacker total point and defender total point , map to a CRT column to draw result laterly.
	var odds;
	var odds_r=atk/def;
	var odds_c=0.25;
  var CRT=CRT=scenario_dic['CRT'];
	for (odds in CRT){
		if (odds > odds_c && odds_r>=odds){
			odds_c=odds;
		}
	}
	return CRT[odds_c];
}

function result_draw(atk,def,buff){
	if (buff===undefined){
		buff=0;
	}
	var dn=int(scenario_dic['setting']['DICE']*random.random())+1;
	var point=dn+buff;
	return result_distribution(atk,def)[point];
}

function eliminate(unit_id){
	var unit=unit_d[unit_id];
	unit.destroy();
}

function routed(unit_id){
	// a unit rout from its current location to a neibor hex. If it can't ,eliminate.
	var unit=unit_d[unit_id];
	var loc=hex_d[[unit.m,unit.n]];
	var ava=loc.nei.filter(function(nei_id){
		if (!(hex_d[nei_id].isStackFull()) && !(unit.zoc_map(nei_id)[unit.side])){
      // if the hex has null space and not be threat by enemy ZOC
			if (unit.movement>=terrain_d[hex_d[nei_id].terrain].base_cost){
				return true;
			}
			else{
				return false;
			}
		}
		else{
			return false;
		}
	});
	if (ava.length===0){
    console.log('unit',unit.id,'has not space to routed so is eliminated');
		eliminate(unit.id);
	}
	else{
		var target=random.choice(ava);
		unit.move_to(target[0],target[1],'no_focus');
    console.log('unit',unit.id,'route to',target[0],target[1]);
	}
}

function do_battle(atk_id_l,def_id_l,buff){
	if (buff===undefined){
		buff=0;
	}
	// atk_l is id list of attacker units.  def_l is this case too.
	var atk_l=atk_id_l.map(function(unit_id){return unit_d[unit_id];});
	var def_l=def_id_l.map(function(unit_id){return unit_d[unit_id];});
	if (atk_id_l.length!==0){
		var ats=sum(atk_l.map(function(unit){return unit.combat}))+buff;
	}
	else{
		var ats=buff;// pure range attack
	}
	var dts=sum(def_l.map(function(unit){return unit.combat}));
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