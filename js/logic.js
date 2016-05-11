var map_el=$('#map');
//map_el.css({'position':'absolute','left':'100px','top':'25px'});

short_edge_length=50;
hex_k=Math.cos(Math.PI/6)*2;
long_edge_length=short_edge_length*hex_k;
attach_edge=short_edge_length*1.5;
default_hex_type='tip';
counter_x=48;
counter_y=48;

var painter=domplot.Painter();


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
	// deal event about player unit click 
	this.state='start';
	this.choose_unit=undefined;
	this.unit_click=function(unit){
		// player click enter point
		var el=unit.el;
		console.log(unit.combat,unit.movement);
		switch(phase_box.state[1]){
			case 'move':
				console.log('enter move')
				switch(this.state){
					case 'start'://now state "start","choosed" is special for phase move
						this.try_choose(unit);
						break;
					case 'choosed':
						this.try_choose(unit);
						break;
				break;
				}
			case 'combat'://there're join state purchase state
				switch(this.state){
					case 'join':
						console.log('enter combat');
						battle_box.join(unit);
						break;
					case 'wait_choose':
						if (battle_box.pursuit_unit_able(unit)){
							this.choose_unit=unit;
							this.state='wait_hex';
						}
						else{
							console.log('illege unit');
						}
					case 'wait_hex':
						if (battle_box.pursuit_unit_able(unit)){
							this.choose_unit=unit;
							this.state='wait_hex';
						}
						else{
							console.log('illege unit');
						}
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
		if (phase_box.is_choose_able(unit)){
			this.choose_unit=unit;
			this.reset_focus();
			this.state='choosed';// if you are in this state and you click other hex,you should move to it.
		}
		else{
			console.log('you can not choose a unit in error phase');
		}
	}
	
}
function Hex_click_box(){
	this.hex_click=function(hex){
		var el=hex.el;
		console.log('hex:',hex.x,hex.y);
		switch(phase_box.state[1]){
			case 'move':
				switch(unit_click_box.state){
					case 'start':
						console.log('can not do anything');
						break;
					case 'choosed':
						if (unit_click_box.choose_unit.move_range()[[hex.m,hex.n]]!==undefined){
							unit_click_box.choose_unit.move_to_path(hex.x,hex.y);
						}
						else{
							unit_click_box.state='start';
							unit_click_box.remove_focus();
							console.log('Too long to move');
						}
						break;
				}
				break;
			case 'combat':
				switch(unit_click_box.state){
					case 'join':
						console.log('nothing to do for the hex in join state');
						break;
					case 'wait_choose':
						console.log('nothing to do for the hex in wait choose state');
						break;
					case 'wait_hex':
						if (battle_box.pursuit_hex_able(hex)){
							battle_box.do_pursuit(unit_click_box.choose_unit,hex);
							console.log('I can do that!');
						}
						else{
							console.log('illege hex');
						}
						break;
				}
		}
	}
}
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
	this.join_able=function(unit){
		// whether unit is valid to join the fight is judged by this function. Notice no way to set "join who".
		// It's permit for many vs one or one vs many,but not many vs many.
		// A attack declare should start by ( to click ) a defender unit.
		var atk_unit_list=this.atk_unit_list;
		var def_unit_list=this.def_unit_list;
		if (unit.fight_number>0){//no unit can do successive battle 
			return false;
		}
		if (member(unit.id,this.atk_unit_list.map(function(unit){return unit.id}))||
			member(unit.id,this.def_unit_list.map(function(unit){return unit.id}))){
				return false;// it's impossible appears two times
		}
		if(unit.side===phase_box.state[0]){
			// select units who are "self" for player who is playing
			if (def_unit_list.length===0){
				return false;
			}
			else{
				if(atk_unit_list.length>=1 && def_unit_list.length>1){
					return false;
				}
				else{
					var def=def_unit_list[0];
					var nei=hex_d[[def.m,def.n]].nei;
					return unit.in_range([def.m,def.n]);// range attack deal
				}
			}
		}
		else{
			// select units are "enemy" for player who is playing
			if (atk_unit_list.length>1){
				return false;
			}
			else if(atk_unit_list.length===0 && def_unit_list.length===0){
				return true;
			}
			else if(atk_unit_list.length===0 && def_unit_list.length>0){
				return false;
			}
			else{
				var atk=atk_unit_list[0];
				var nei=hex_d[[atk.m,atk.n]].nei;
				return unit.in_range([atk.m,atk.n]);//range attack deal
			}
		}
	}
	this.join=function(unit){
		if (this.join_able(unit)){
			if (unit.side===phase_box.state[0]){
				this.atk_unit_list.push(unit);
				toolbox.battle_odds_attack.append($('<p>'+unit.to_tag()+'</p>'));
				console.log('join atk');
			}
			else{
				this.def_unit_list.push(unit);
				toolbox.battle_odds_defence.append($('<p>'+unit.to_tag()+'</p>'));
				console.log('join def');
			}
		}
		else{
			console.log('join fail');
		}
	}
	this.do_it=function(){
		// complete deal and reset state
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
			// deal pursuit
			unit_click_box.state='wait_choose';
		}
		else{
			this.reset();//return to join-do it process
			this.pursuit_reset();
		}
	}
	this.reset=function(){
		that.atk_unit_list=[];
		that.def_unit_list=[];
		toolbox.battle_odds_attack.empty();
		toolbox.battle_odds_defence.empty();
		that.cache_def_loc=[];
		unit_click_box.state='join';
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
function Phase_box(){
	// this static object should handle logic about phase and turn shift
	this.turn=1;
	this.state=[0,'ready'];
	var that=this;
	
	this.next_phase=function(){// the callback function bind on next_phase <a> tag
		unit_click_box.remove_focus();
		switch (that.state[1]){
			case 'ready':
				toolbox.AI_run_a.hide();
				that.change_phase_to(that.state[0],'move');
				unit_click_box.state='start';
				break;
			case 'move':
				unit_click_box.state='join';
				that.change_phase_to(that.state[0],'combat');
				toolbox.combat_box.show();
				break;
			case 'combat':
				var ending_player=player_d[that.state[0]];
				var next_player=player_d[that.next_player_id()]
				ending_player.end();
				that.change_phase_to(next_player.id,'ready');
				next_player.ready();
				toolbox.combat_box.hide();
				toolbox.AI_run_a.show();
				that.turn+=1;
				break;
		}
	}
	this.change_phase_to=function(side,state){
		console.log(player_d[side].name+' '+state+' phase');
		toolbox.show_widget.html(player_d[side].name+' '+state+' phase');
		this.state=[side,state];
		switch(state){
			case 'ready':
				event_box.fire('ready');
				break;
			case 'move':
				event_box.fire('move');
				break;
			case 'combat':
				event_box.fire('combat');
				break;
		}
		return ;
	}
	this.next_player_id=function(){
		return other([0,1],this.state[0]);
	}
	this.is_choose_able=function(unit){
		return unit.side===this.state[0] && this.state[1]==='move';
	}
}
function Toolbox(){
	this.el=$('#toolbox');
	//this.el.css({'z-index':20,position:'fixed','background-color': 'rgb(250, 250, 250)'});
	var next_phase_a=$('#next_phase_a');
	next_phase_a.click(phase_box.next_phase);
	this.show_widget=$('#turn_state');
	this.do_it_a=$('#do_it_a');
	this.reset_a=$('#reset_a');
	this.combat_box=$('#combat_box');
	this.battle_odds=$('#battle_odds');
	this.battle_odds_attack=$('#battle_odds_attack');
	this.battle_odds_defence=$('#battle_odds_defence');
	this.chase_a=$('#chase_a');
	this.AI_run_a=$('#AI_run_a');
	this.do_it_a.click(battle_box.do_it);
	this.reset_a.click(battle_box.reset);
	this.combat_box.hide();
	this.chase_a.hide();
	this.AI_run_a.click(AI_run);
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


function set_color(el,rgb,key){
	if (key===undefined){
		key='color';
	}
	var r=rgb[0];var g=rgb[1];var b=rgb[2];
	var dic={};
	dic[key]='rgb('+r+','+g+','+b+')';
	el.css(dic);
}


function Unit(id){
	var that=this;
	this.id=id;
	this.els=painter.draw_counter();
	this.el=this.els.box;
	this.combat=0;
	this.movement=0;
	this.mp=0;
	this.short_path={};//  this value is set by find way method
	this.surplus_map={};
	this.removed=false;
	this.fight_number=0;// fight time in this turn 
	this.combat_range=1;
	this.deco=function(){
		this.els.l0.html(this.combat);
		this.els.l2.html(this.movement);
	}
	this.ready=function(){
		this.mp=this.movement;
		this.fight_number=0;
	}
	this.end=function(){
		this.mp=this.movement;
		this.fight_number=0;
	}
	this.set_hex=function(m,n){
		this.hex_move(this.m,this.n,m,n);
    var mat_mn  = painter.scale(m,n);
		var left    = mat_mn.left+short_edge_length*Math.cos(Math.PI/6)-counter_x/2;
		var top     = mat_mn.top+short_edge_length/2-counter_y/2;
		this.el.css({left:left,top:top});
		this.m      = m;
		this.n      = n;
	}
	this.move_to=function(m,n,duration,pattern,mode,pass){
		if (pass===undefined){
			this.hex_move(this.m,this.n,m,n);
		}
    var mat_mn  = painter.scale(m,n);
		var left=mat_mn.left+short_edge_length*Math.cos(Math.PI/6)-counter_x/2;
		var top=mat_mn.top+short_edge_length/2-counter_y/2;
		if (mode==='no_focus'){
			this.el.animate({left:left,top:top},duration,pattern);
		}
		else{
			this.el.animate({left:left,top:top},
                      duration,
                      pattern,
                      function(){
                        console.log('wuyu');
                        unit_click_box.reset_focus();
                      });
		}
		this.m=m;
		this.n=n;
	}
	this.el.click(function(){
		unit_click_box.unit_click(that);
	});
	map_el.append(this.el);
	this.set_font_color=function(rgb){
		set_color(this.els.size,rgb);
		set_color(this.els.l0,rgb);
		set_color(this.els.l1,rgb);
		set_color(this.els.l2,rgb);
	};
	this.set_box_color=function(rgb){
		set_color(this.els.box,rgb,'background-color');
	};
	this.set_box_border_color=function(rgb){
		var r=rgb[0];var g=rgb[1];var b=rgb[2];
		this.els.box.css({border:'2px solid'+' rgb('+r+','+g+','+b+')'});
	}
	this.set_pad_color=function(rgb){
		set_color(this.els.pad,rgb,'background-color');
	}
	this.set_pad_line_color=function(rgb){
		var r=rgb[0];var g=rgb[1];var b=rgb[2];
		var rgbs='rgb('+r+','+g+','+b+')';
		this.els.pad.css({border:'2px solid'+' rgb('+r+','+g+','+b+')'});
		this.els.line.forEach(function(line){
			set_color(line,rgb,'background-color');
		})
	}
	this.hex_move=function(m1,n1,m2,n2){
		hex_d[[m1,n1]].unit=null;
		hex_d[[m2,n2]].unit=this;
	}
	this.hex_pass=function(m1,n1,m2,n2){
		hex_d[[m1,n1]].pass=null;
		hex_d[[m2,n2]].pass=this;
	}
	this.move_to_path=function(target_m,target_n){
		var ing_m=this.m;
		var ing_n=this.n;
		var path=[];
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
	}
	this.zoc_map=function(mn){
		var hex=hex_d[mn];
		var map={}
		var that=this;
		player_l.forEach(function(player){
			map[player.id]=any(hex.nei.map(function(nei_id){
				var nei= hex_d[nei_id];
				if (nei.unit===null || nei.unit.side===player.id){
					return false;
				}
				else{
					return true;
				}
			}))
		})
		return map;
	}
	this.move_cost=function(mn,surplus){
			var hex=hex_d[mn];
			var base_cost=terrain_d[hex.terrain].base_cost;
			if (hex.unit!==null && hex.unit.side!==this.side){
				return Math.max(surplus+1,1);// trick way to ban move
			}
			if (this.zoc_map(mn)[this.side]){
				return Math.max(surplus,base_cost);
			}
			return base_cost;
	};

	this.move_range=function(){
		// this method should return feasible space and shortest path in all hex in feasible space. 
		var that=this;
		this.short_path={};// map to node list in best path searched by current
		this.short_path[[this.m,this.n]]=[[this.m,this.n]];// best path include start point
		var mp_s=this.mp;
		var set={};// map to best cost in best path in current find
		set[[this.m,this.n]]=this.mp;
		var activate_list=[[this.m,this.n]];
		while (activate_list.length!==0){
			var activate_list_b=[];
			activate_list.forEach(function(act_mn){
				var act=hex_d[act_mn];
				act.nei.forEach(function(try_mn){
					var try_s=set[act_mn]-that.move_cost(try_mn,set[act_mn]);
					if ((set[try_mn]===undefined && try_s>=0)||(set[try_mn]!==undefined && set[try_mn]<try_s)){
						set[try_mn]=try_s;
						var build_path=copy(that.short_path[act_mn]);
						build_path.push(try_mn);
						that.short_path[try_mn]=build_path;
						if (try_s>0){
							activate_list_b.push(try_mn);
						}
					}
				})
			})
			activate_list=activate_list_b;
		}
		// unit can't move to its self location
		var r_set={}
		for (var key in set){
			if(hex_d[key].unit===null){
				r_set[key]=set[key];
			}
		}
		this.surplus_map=r_set;
		return r_set;
	}
	this.destroy=function(){
		this.removed=true;
		this.el.hide();
		hex_d[[this.m,this.n]].unit=null;
	}
	this.to_tag=function(){
		// this function return a introduction string to insert item odds to display
		return this.label+':'+this.combat;
	};
	this.in_range=function(mn){
		// to judge whether this hex can be attacked to its range. Range is description by unit.csv, for "melee" unit ,is 1 .
		return hex_distance(this.m,this.n,mn[0],mn[1])<=this.combat_range;
	}

}
function Inf(id){
	Unit.call(this,id);
	var pad=this.els.pad;
	// following code paint a cross represent infantry in NATO military note system
	var line1=painter.draw_line(0,0,25,16);
	var line2=painter.draw_line(0,16,25,0);
	line1.addClass('line');
	line2.addClass('line');
	line1.appendTo(pad);
	line2.appendTo(pad);
	this.els['line']=[line1,line2];
}
function Cav(id){
	Unit.call(this,id);
	var pad=this.els.pad;
	var line2=painter.draw_line(0,16,25,0);
	line2.addClass('line');
	line2.appendTo(pad);
	this.els['line']=[line2];
}
function HQ(id){
	Unit.call(this,id);
	var pad=this.els.pad;
	var line1=painter.draw_line(0,0,13,0);
	var line2=painter.draw_line(13,8,25,8);
	line1.css({'height':10});
	line2.css({'height':10});
	line1.addClass('line');
	line2.addClass('line');
	line1.appendTo(pad);
	line2.appendTo(pad);
	this.els['line']=[line1,line2];
}
function Art(id){
	Unit.call(this,id);
	var pad=this.els.pad;
	var hole=$('<div></div>');
	hole.css({width:7,height:7,'border-radius': '7px',left:'9px',top:'5px',position:'absolute'});
	hole.addClass('line');
	hole.appendTo(pad);
	this.els['line']=[hole];
}
function Panzer(id){
	Unit.call(this,id);
	var pad=this.els.pad;
	var hole=$('<div></div>');
	hole.css({width:14,height:8,'border-radius': '5px/5px',left:'4px',top:'3px',position:'absolute'});
	hole.appendTo(pad);
	this.els['line']=[hole];
	// rewrite set_pad_line_color method because it is not fit ordinary plot model
	this.set_pad_line_color=function(rgb){
		var r=rgb[0];var g=rgb[1];var b=rgb[2];
		var rgbs='rgb('+r+','+g+','+b+')';
		this.els.pad.addClass('pad');
		this.els.line.forEach(function(line){
			line.css({'background-color':'transparent',border:'2px '+rgbs+' solid'});
		})
	}
}
function Horse_Artillery(id){
	Unit.call(this,id);
	var pad=this.els.pad;
	var hole=$('<div></div>');
	hole.css({width:7,height:7,'border-radius': '7px',left:'9px',top:'5px',position:'absolute'});
	hole.appendTo(pad);
	var line2=painter.draw_line(0,16,25,0);
	line2.appendTo(pad);
	this.els['line']=[hole,line2];
}

var unit_click_box=new Unit_click_box();
var hex_click_box=new Hex_click_box();
var phase_box=new Phase_box();
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

var clickEvent=designPattern.event();
var highlightEvent=designPattern.event();
var unhighlightEvent=designPattern.event();

function Hex(_hex){
	this.m=_hex.m;
	this.x=_hex.m;
	this.n=_hex.n;
	this.y=_hex.n;
	this.label=_hex.label;
	this.VP=_hex.VP;
	this.terrain=_hex.terrain;
	this.capture=_hex.capture;
	this.unit=null;// the unit is locate in this hex
	this.pass=null;// the units is passing the hex
  this.nei=this.cal_nei();
}
Hex.prototype.highlight=function(){
  highlightEvent.trigger(this.m,this.n);
}
Hex.prototype.de_highlight=function(){
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
  
  domplot.Hexs(map_el,{m : m,
                       n : n,
                       clickEvent : clickEvent,
                       classMap   : classMap,
                       highlightEvent   : highlightEvent,
                       unhighlightEvent : unhighlightEvent})
  return mat;
}

var mat=create_hexs(scenario_dic);

scenario_dic['hex_dic_list'].forEach(function(_hex){
	var hex=mat[_hex.m][_hex.n];
	hex_l.push(hex);
	hex_d[[hex.m,hex.n]]=hex;
});

scenario_dic['unit_dic_list'].forEach(function(_unit){
	var unit;
	switch(_unit.pad){
		case 'infantry':// pad determine unit type ... However it is motivated by TOAW3
			unit=new Inf(_unit.id);
			break;
		case 'cavalry':
			unit=new Cav(_unit.id);
			break;
		case 'HQ':
			unit=new HQ(_unit.id);
			break;
		case 'Artillery':
			unit=new Art(_unit.id);	
			break;
		case 'Panzer':
			unit=new Panzer(_unit.id);
			break;
		case 'Horse Artillery':
			unit=new Horse_Artillery(_unit.id);
			break;
	}
	unit.id=_unit.id;
	unit.side=_unit.side;
	unit.combat=_unit.combat;
	unit.movement=_unit.movement;
	unit.m=_unit.m;
	unit.n=_unit.n;
	unit.VP=_unit.VP;
	unit.label=_unit.label;
	unit.img=_unit.img;
	unit.group=_unit.group;
	unit.combat_range=_unit.range;
	
	unit.el.addClass(_unit.color);
		
	unit.els.size.html(_unit.size);
	unit.deco();
	unit.set_hex(unit.m,unit.n);
	unit.ready();
	
	unit_l.push(unit);
	unit_d[unit.id]=unit;
});
scenario_dic['player_dic_list'].forEach(function(_player){
	var player=new Player(_player.id);
	player.name=_player.name;
	
	player_l.push(player);
	player_d[_player['id']]=player;
})

phase_box.change_phase_to(0,'ready');
event_box.fire('ready');
//sphase_box.next_phase();

var unit=unit_l[0];
