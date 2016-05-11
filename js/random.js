/*
 * random.js
 * provide random sample function
*/

/*jslint          browser  : true,  continue  : true,
  devel  : true,  indent   : 2,     maxerr    : 50,
  newcap : true,  nomen    : true,  plusplus  : true,
  regexp : true,  sloppy   : true,  vars      : false,
  white  : true
*/
/*global random */


var random=(function(){
    
	function random(){
    return Math.random();
  }
  
	function choice(list){
		var index=Math.floor(Math.random()*list.length);
		return list[index];
	}
  
	function shuffle(list){
		var list_ing   = list.slice(),
        list_build = [],
        index,i;
    
		while(list_ing.length > 0){
			index = Math.floor(Math.random()*list_ing.length);
			list_build.push(list_ing[index]);
			list_ing.splice(index,1);
		}
		for (i = 0; i < list.length; i++){
			list[i] = list_build[i];
		}
		//console.log('list_build',list_build);
	}
  
	return {random  : random,
          choice  : choice,
          shuffle : shuffle };
}());