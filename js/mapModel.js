/*
 * mapModel.js
 * provide object model to control map logic
*/

/*jslint          browser  : true,  continue  : true,
  devel  : true,  indent   : 2,     maxerr    : 50,
  newcap : true,  nomen    : true,  plusplus  : true,
  regexp : true,  sloppy   : true,  vars      : true,
  white  : true
*/

/*global domplot,designPattern */

var mapModel=(function(){
  
  function any(l){
    return l.reduce(function(x,y){
      return x||y;
    });
  }
  
  function hex_distance (n1,m1,n2,m2) {
    // calculate the distance between two hexes
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
  
  function whilefunc(condition,body){
    while(condition()){
      body();
    }
  }


  function _mapModel(map_el,scenario_dic,events){
    
    // events :
    //  clickHexEvent
    //  clickUnitEvent
    //  hexClassUpdateEvent
    //
    // but they pass Unit or Hex object instead of their id in domplot.js
    // basic wrap it
    
    events = events || {};
    
    //var map_el=$('#map');
    var painter=domplot.Painter(map_el);
    
    
    var clickHexEvent   = designPattern.event();
    var clickUnitEvent  = designPattern.event();
    var highlightEvent  = designPattern.event();
    var unhighlightEvent= designPattern.event();
    var moveEvent       = designPattern.event();
    var setEvent        = designPattern.event();
    var updateUnitEvent = designPattern.event();
    var diedEvent       = designPattern.event();
    var hexClassUpdateEvent = designPattern.event();
    var resetFocusEvent = designPattern.event();
    

    
    
    
    
    
    var unit_l=[];
    var unit_d={};
    var hex_l=[];
    var hex_d={};//key is coordinate of the hex
    var player_l=[];
    var player_d={};
    var terrain_d=scenario_dic.terrain;
    var stackSize=scenario_dic.setting.stackSize || 1;


    
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
    };
    
    Hex.prototype.de_highlight=function(){
      this.is_highlight=false;
      unhighlightEvent.trigger(this.m,this.n);
    };
    
    Hex.prototype.cal_nei=function(){
      var tran,
          that=this,
          nei_a;
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
        return    0      <= nei[0] 
               && nei[0] <  scenario_dic.size[0] 
               && 0      <= nei[1] 
               && nei[1] <  scenario_dic.size[1];
      });
    };
    
    Hex.prototype.isStackEmpty=function(){
      return this.stack.length === 0;
    };
    
    Hex.prototype.isStackFull=function(){
      return this.stack.length >= stackSize;
    };
    
    Hex.prototype.isPassAble=function(unit){
      return this.isStackEmpty() || (this.stack[0].side === unit.side );
    };
    
    Hex.prototype.isMovetoAble=function(){ // now unit is not effect result
      return (! this.isStackFull()) && this.isPassAble();
    };
    
    Hex.prototype.isSideFriend=function(id){
      return this.isStackEmpty() || (this.stack[0].side === id );
    };
    
    Hex.prototype.enter=function(unit){
      this.stack.push(unit);
    };
    
    Hex.prototype.exit=function(unit){
      this.stack=this.stack.filter(function(_unit){
        return unit!==_unit;
      });
    };
    
    Hex.prototype.allUnit=function(){
      return this.stack.slice(); // I debug this for a long time goto hell the reference list!
    };

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

      //var that=this;
      this.mp=0;
      this.short_path={};//  this value is set by find way method
      this.surplus_map={};
      this.removed = _unit.m === undefined || _unit.n === undefined ? true : false;
      this.fight_number=0;// fight time in this turn 
      // this.combat_range=1;
    }

    Unit.prototype.ready=function(){
      this.mp=this.movement;
      this.fight_number=0;
    };

    Unit.prototype.end=function(){
      this.mp=this.movement;
      this.fight_number=0;
    };

    Unit.prototype.set_hex=function(m,n){
      this.hex_move(this.m,this.n,m,n);
      setEvent.trigger(this.domId,m,n);
      this.m      = m;
      this.n      = n;
    };

    Unit.prototype.move_to=function(m,n,focus_mode,pass){
      if (pass===undefined){
        this.hex_move(this.m,this.n,m,n);
      }
      if (focus_mode==='no_focus'){
        moveEvent.trigger(this.domId,m,n);
      }
      else{
        moveEvent.trigger(this.domId,m,n,function(){
                          resetFocusEvent.trigger();
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
    
    Unit.prototype.enter_to=function(m,n){
      this.m=m;
      this.n=n;
      setEvent.trigger(this.domId,m,n);
      hex_d[[m,n]].enter(this);
      this.removed=false;
    }
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
      if (this.short_path[[target_m,target_n]]!==undefined){
        path=this.short_path[[target_m,target_n]].slice(1);
      }
      else{
        console.log('No path cal to that');
        return;
      }
      
      path.forEach(function(node){
        that.move_to(node[0],node[1],'focus','pass');
      });
      this.hex_move(ing_m,ing_n,target_m,target_n);
      this.mp=this.surplus_map[[target_m,target_n]];
    };

    Unit.prototype.zoc_map=function(mn){
      var hex=hex_d[mn];
      var map={};
      //var that=this;
      player_l.forEach(function(player){
        map[player.id]=! (hex.isStackEmpty() || hex.isSideFriend(player.id)) 
                       || any(hex.nei.map(function(nei_id){
          // Is threat exist by special neibor hex ? ( if exist then return true)
          var nei= hex_d[nei_id];
          if (nei.isStackEmpty() || nei.isSideFriend(player.id)){
            return false;
          }
          return true;
          
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
          set={},
          activate_list=[[this.m,this.n]],
          activate_list_b,
          try_s,
          build_path,
          act,
          r_set={};
      this.short_path={};// map to node list in best path searched by current
      this.short_path[[this.m,this.n]] = [[this.m,this.n]];// best path include start point
      //var mp_s=this.mp;
      //var set={};// map to best cost in best path in current find state
      set[[this.m,this.n]] = this.mp;
      //var activate_list=[[this.m,this.n]];
      whilefunc(function(){return activate_list.length !== 0;},function(){
        activate_list_b = [];
        activate_list.forEach(function(act_mn){
          act=hex_d[act_mn];
          act.nei.forEach(function(try_mn){
            try_s=set[act_mn] - that.move_cost(try_mn,set[act_mn]);
            if ((set[try_mn] === undefined && try_s >= 0) || 
                (set[try_mn] !== undefined && set[try_mn] < try_s)){
              set[try_mn] = try_s;
              build_path = that.short_path[act_mn].slice();
              build_path.push(try_mn);
              that.short_path[try_mn] = build_path;
              if (try_s > 0){
                activate_list_b.push(try_mn);
              }
            }
          });
        });
        activate_list=activate_list_b;
      });
      //while (activate_list.length !== 0){
      //}
      // unit can't move to its self location
      Object.keys(set).forEach(function(key){
        if(! hex_d[key].isStackFull()){
          r_set[key] = set[key];
        }
      });
      this.surplus_map = r_set;
      return r_set;
    };

    Unit.prototype.destroy=function(){
      this.removed=true;
      diedEvent.trigger(this.domId);
      //hex_d[[this.m,this.n]].unit=null;
      hex_d[[this.m,this.n]].exit(this);
      this.m=undefined;
      this.n=undefined;
    };

    Unit.prototype.to_tag=function(){
      // this function return a introduction string to insert item odds to display
      return this.label+':'+this.combat;
    };

    Unit.prototype.in_range=function(mn){
      // to judge whether this hex can be attacked to its range. Range is description by unit.csv, for "melee" unit ,is 1 .
      return hex_distance(this.m,this.n,mn[0],mn[1])<=this.combat_range;
    };

    Unit.prototype.isRangeUnit=function(){
      return this.combat_range>=2;
    };
    
    function Player(side_id){
      //player level state manager
      this.side=side_id;
      this.id=side_id;
    }
    
    Player.prototype.all_unit=function(){
      var l=[],
          that=this;
      unit_l.forEach(function(unit){
        if (unit.side===that.side){
          l.push(unit);
        }
      });
      return l;
    };
    
    Player.prototype.ready=function(){
      this.all_unit().forEach(function(unit){
        unit.ready();
      });
    };
    
    Player.prototype.end=function(){
      this.all_unit().forEach(function(unit){
        unit.end();
      });
    };

    
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
      };
      
      var unitList=scenario_dic.unit_dic_list.map(function(_unit,i){
        var unit = new Unit(_unit);
        unit.domId=i;
        //_unit.domId=i;
        return unit;
      });
      
      
      domplot.Counters({painter     : painter,
                        n           : n,
                        unitMap     : unitMap,
                        clickEvent  : clickUnitEvent,
                        moveEvent   : moveEvent,
                        setEvent    : setEvent,
                        updateEvent : updateUnitEvent,
                        diedEvent   : diedEvent,//});
                        stackSize   : stackSize});
      return unitList;
    }

    function create_hexs(scenario_dic){
      var m=scenario_dic.size[0],
          n=scenario_dic.size[1],
          mat=[],
          i;
      for(i=0;i<m;i++){
        //mat.push(new Array(n
        mat.push([]);
      }
      scenario_dic.hex_dic_list.forEach(function(_hex){
        var hex=new Hex(_hex);
        hex.domM=_hex.m;
        hex.domN=_hex.n;
        mat[_hex.m][_hex.n]=hex;
        //mat[_hex.m][_hex.n]=_hex;
      });
      
      function classMap(i,j){
        return mat[i][j].terrain;
      }
      
      domplot.Hexs({ painter  : painter,
                     m : m,
                     n : n,
                     clickEvent : clickHexEvent,
                     classMap   : classMap,
                     highlightEvent   : highlightEvent,
                     unhighlightEvent : unhighlightEvent,
                     classUpdateEvent : hexClassUpdateEvent});

      return mat;
    }

    var mat=create_hexs(scenario_dic);
    
    

    scenario_dic.hex_dic_list.forEach(function(_hex){
      var hex=mat[_hex.m][_hex.n];
      hex_l.push(hex);
      hex_d[[hex.m,hex.n]]=hex;
    });

    unit_l=create_units(scenario_dic);

    unit_l.forEach(function(unit){
      if (unit.m !== undefined && unit.n !== undefined){
        unit.set_hex(unit.m,unit.n);
      }
      else{
        unit.removed=true;
        //diedEvent.trigger(this.domId);
      }
      unit.ready();
      
      //unit_l.push(unit);
      unit_d[unit.id]=unit;
    });

    scenario_dic.player_dic_list.forEach(function(_player){
      var player=new Player(_player.id);
      player.name=_player.name;
      
      player_l.push(player);
      player_d[_player.id]=player;
    });
    
    
    if(events.clickUnitEvent){
      (function(){
        var pipe=designPattern.event_pipe(events.clickUnitEvent,clickUnitEvent);
        
        events.clickUnitEvent.register(function(unit){
          console.log('events.clickUnitEvent.register');
          pipe.right.trigger(unit.domId);
        });
        clickUnitEvent.register(function(id){
          console.log('clickUnitEvent.register');
          pipe.left.trigger(unit_l[id]);
        });
      }());
    }
    
    
    if(events.clickHexEvent){
      (function(){
        var pipe=designPattern.event_pipe(events.clickHexEvent,clickHexEvent);
        
        events.clickHexEvent.register(function(hex){
          //console.log('events.clickHexEvent.register');
          pipe.right.trigger(hex.domM,hex.domN);
        });
        clickHexEvent.register(function(i,j){
          //console.log('clickHexEvent.register');
          pipe.left.trigger(mat[i][j]);
        });
      }());
    }
    
    if(events.hexClassUpdateEvent){
      (function(){
        var pipe=designPattern.event_pipe(events.hexClassUpdateEvent,hexClassUpdateEvent);
        
        events.hexClassUpdateEvent.register(function(hex,type){
          console.log('events.hexClassUpdateEvent.register');
          pipe.right.trigger(hex.domM,hex.domN,type);
        });
        hexClassUpdateEvent.register(function(i,j,type){
          console.log('hexClassUpdateEvent.register');
          pipe.left.trigger(mat[i][j],type);
        });
      }());
    }
    
    return {
      unit_l : unit_l,
      unit_d : unit_d,
      hex_l  : hex_l,
      hex_d  : hex_d,
      player_l : player_l,
      player_d : player_d,
      mat      : mat
    };
    
  }
  
  return _mapModel;

}());