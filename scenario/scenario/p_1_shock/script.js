[
{
	Event:['ready'],
	Condition:function(){
		//return phase_box.turn===1 && phase_box.state[0]===0;
		return stateMap.turn == 1 && stateMap.side == 0;
	},
	Action:function(){
		news_box.show('So terrible !The foolhardiness is stronger! We must take a shock to defeat it.');
	}
},
{
	Event:['ready'],
	Condition:function(){
		//return phase_box.state[0]===0 && unit_d[1].removed===true;
		return stateMap.side == 0 && unit_d[1].removed == true;
	},
	Action:function(){
		news_box.show('Princess died,the battle is failed...');
	}
}
]