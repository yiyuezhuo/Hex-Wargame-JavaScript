function Event_box(){
	this.events=eval(scenario_dic['script']);
	this.fire=function(event_name){
		this.events.forEach(function(check_event){
			if (member(event_name,check_event.Event)){
				if (check_event.Condition()){
					check_event.Action();
				}
			}
		});
	}
}