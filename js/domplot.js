/*
 * domplot.js
 * provide function to plot line and hex in DOM way.
*/

/*jslint          browser  : true,  continue  : true,
  devel  : true,  indent   : 2,     maxerr    : 50,
  newcap : true,  nomen    : true,  plusplus  : true,
  regexp : true,  sloppy   : true,  vars      : false,
  white  : true
*/
/*global domplot,jQuery */


var domplot = (function ($) {  
  var head=$('head');
  
  function addStyle(dic){
    // dic={selection1:{key1:value1,key2:value2},selection2:{...},...}
    var css_code,css_el;
    css_code = Object.keys(dic).map(function(sel_key){
      var sub_dic,sel_value;
      sub_dic    = dic[sel_key];
      sel_value = Object.keys(sub_dic).map(function(attr_key){
        var value = sub_dic[attr_key];
        return attr_key+' : '+value;
      }).join(';');
      
      return sel_key+' {'+sel_value+' } ';
    }).join('\n');
    
    css_el=$('<style>'+css_code+'</style>');
    css_el.appendTo(head);
  }
  
  function Hex(){}
  Hex.prototype.setLoc = function(){
    
  };
  Hex.prototype.setMap = function(map_el){
    this.els.appendTo(map_el);
    this.el.appendTo(map_el);// browser only response later dom event
    this.bound.appendTo(map_el);
  };
  
  function Brush(config){
    // Brush provide plot utility function, they only return pure dom object
    config = config || {};
    this.short_edge_length = config.edge_length || 50;
    this.attach_edge       = this.short_edge_length * 1.5;
    this.counter_x         = config.counter_x || this.short_edge_length * 0.96;
    this.counter_y         = config.counter_y || this.short_edge_length * 0.96;
  }
  Brush.prototype.draw_hex2 = function(left,top){
      // css version
      var short_edge_length = this.short_edge_length,
          root = $('<div></div>');
      root.addClass('hex');
      root.css({top      : top-short_edge_length/2,
                left     : left,
                position : 'absolute'}
      );
      //root.appendTo(map_el);
      ['head','center','tail'].forEach(function(cname){
        var c=$("<div></div>");
        c.addClass(cname);
        c.appendTo(root);
      });
      return root;
  };
  
  Brush.prototype.attach_hex = function(left,top){
    var short_edge_length = this.short_edge_length,
        attach_edge       = this.attach_edge,
        base      = $('<div></div>'),
        diff_left = short_edge_length*Math.cos(Math.PI/6)-attach_edge/2,
        diff_top  = (attach_edge-short_edge_length)/2;
    
    base.css({width    : attach_edge,
              height   : attach_edge,
              position : 'absolute',
              left     : left+diff_left+'px',
              top      : top-diff_top+'px'
             });
    base.addClass('attach');
    //base.appendTo(map_el);	
    return base;
  };
  Brush.prototype.create_bound = function(left,top){
    // create bound around hex
    var L   = this.short_edge_length,
        sin = Math.sin(Math.PI/6),
        cos = Math.cos(Math.PI/6),
        p1  = [left - L/2,top + L/2],
        p2  = [left + L*cos/2   - L/2,top + L   + L*sin/2],
        p3  = [left + L*cos*1.5 - L/2,top + L   + L*sin/2],
        p4  = [left + L*cos*2   - L/2,top + L/2],
        p5  = [left + L*cos*1.5 - L/2,top - L*sin/2],
        p6  = [left + L*cos/2   - L/2,top - L*sin/2],
        pl  = [p1,p2,p3,p4,p5,p6],
        ll  = [],
        degrees = [90,30,150,90,30,150],
        degree,line,i;
    for(i=0; i<6; i++){
      degree=degrees[i];
      line=$("<div class='line' style='left: "+(pl[i][0])+"px; top: "+(pl[i][1])+"px;'></div>");
      line.css({width     : L,
                height    : 3,
                position  : "absolute",
                transform : "rotate("+degree+"deg)"
               }
      );
      line.addClass('unhighlight');
      //line.appendTo(map_el);
      ll.push(line[0]); // take dom to create big jQuery selection
    }
    return $(ll);
  };
  Brush.prototype.draw_line = function(x1,y1,x2,y2){
      var dx = x2-x1,
          dy = y2-y1,
          dd = Math.sqrt(Math.pow(dx,2)+Math.pow(dy,2)),
          pi = Math.PI,
          cos_n = dx/dd,
          //sin_n = dy/dd,
          cos_c,cos_d,degree,x3,y3,line;
          //cos_c,sin_c,cos_d,sin_d,degree,x3,y3,line;
      
      if (dy > 0){
        cos_c = Math.acos(cos_n);
        //sin_c = Math.asin(sin_n);
      }
      else{
        cos_c = pi+pi-Math.acos(cos_n);
        //sin_c = pi+pi-Math.asin(sin_n)+pi;
      }
      cos_d   = cos_c/(2*pi)*360;
      //sin_d   = sin_c/(2*pi)*360;
      degree  = cos_d;
      x3      = (x1+x2)/2-dd/2;
      y3      = (y1+y2)/2;
      line = $("<div class='line' style='left: "+x3+"px; top: "+y3+"px;'></div>");
      line.css({width     : dd,
                //height    : 2,
                position  : "absolute",
                transform : "rotate("+degree+"deg)"
               }
      );
      return line;
  };
  
  function Designer(brush){
    // Designer return composite object and low-level control model
    this.brush=brush || new Brush();
  }
  
  Designer.prototype.hex = function(m,n,left,top){
    var hex   = new Hex();
    
    hex.m = m;
    hex.n = n;
    
    hex.els   = this.brush.draw_hex2(left,top);
    hex.el    = this.brush.attach_hex(left,top);
    hex.bound = this.brush.create_bound(left,top);
    
    return hex;
  };
  Designer.prototype.draw_counter = function(){
    var box,size,pad,l0,l1,l2;
      box = $('<div></div>');
      box.attr({'class':'counter'});
      size = $('<div></div>');
      size.attr({'class':'size'});
      //size.html('XX');
      size.appendTo(box);
      pad = $('<div></div>');
      pad.attr({'class':'pad'});
      pad.appendTo(box);
      l0 = $('<div></div>');
      l0.attr({'class':'l0'});
      l1 = $('<div></div>');
      l1.attr({'class':'l1'});
      l2 = $('<div></div>');
      l2.attr({'class':'l2'});
      
      l0.appendTo(box);
      l1.appendTo(box);
      l2.appendTo(box);
      return { box  : box,
               size : size,
               pad  : pad,
               l0   : l0,
               l1   : l1,
               l2   : l2
             };
  };
  Designer.prototype.unitBase = function(){
    var obj  = {};
    obj.els  = this.draw_counter();
    obj.el   = obj.els.box;
    return obj;
  };
  Designer.prototype.padMap={
      // this is bound(called) to a Designer object
     'infantry' : function(){
      var pad,line1,line2,unit;
      
      unit  = this.unitBase();
      
      pad   = unit.els.pad;
      // following code paint a cross representing infantry in NATO Joint Military Symbology
      line1 = this.brush.draw_line(0,0,26,16);
      line2 = this.brush.draw_line(0,16,26,0);
      line1.addClass('line');
      line2.addClass('line');
      line1.appendTo(pad);
      line2.appendTo(pad);
      unit.els.line=[line1,line2];
      return unit;
    },
    
    'cavalry' : function(){
      var pad,line2,unit;
      
      unit  = this.unitBase();
      
      pad   = unit.els.pad;
      line2 = this.brush.draw_line(0,16,25,0);
      line2.addClass('line');
      line2.appendTo(pad);
      unit.els.line = [line2];
      return unit;
    },
    
    'HQ' : function(){
      var pad,line1,line2,unit;
      
      unit  = this.unitBase();
      
      pad   = unit.els.pad;
      line1 = this.brush.draw_line(0,0,13,0);
      line2 = this.brush.draw_line(13,8,25,8);
      line1.css({'height':10});
      line2.css({'height':10});
      line1.addClass('line');
      line2.addClass('line');
      line1.appendTo(pad);
      line2.appendTo(pad);
      unit.els.line=[line1,line2];
      
      return unit;
    },
    
    'Artillery' : function(){
      var pad,hole,unit;
      
      unit  = this.unitBase();
      
      pad   = unit.els.pad;
      hole  = $('<div></div>');
      hole.css({width   : 5,
                height  : 5,
                'border-radius' : '6px',
                left   : '40%',
                right  : '40%',
                top    : '40%',
                bottom : '40%',
                position  : 'absolute'});
      hole.addClass('line');
      hole.appendTo(pad);
      unit.els.line=[hole];
      
      return unit;
    },
    
    'Panzer' : function(){
      var pad,hole,unit;
      
      unit  = this.unitBase();
      
      pad   = unit.els.pad;
      hole  = $('<div></div>');
      hole.css({width:14,
                height:8,
                'border-radius': '5px/5px',
                left:'4px',
                top:'3px',
                position:'absolute'});
      hole.appendTo(pad);
      unit.els.line=[hole];
      return unit;
    },
    
    'Horse Artillery' : function(){
      var pad,hole,line2,unit;
      
      unit  = this.unitBase();
      
      pad   = unit.els.pad;
      hole  = $('<div></div>');
      hole.css({ width  : 7,
                 height : 7,
                 'border-radius' : '7px',
                 left   : '9px',
                 top    : '5px',
                 position : 'absolute'});
      hole.appendTo(pad);
      line2   = this.brush.draw_line(0,16,25,0);
      line2.appendTo(pad);
      unit.els.line = [hole,line2];
      
      return unit;
    }
  };
  Designer.prototype.unit_factory = function(pad){
        var unitDom = this.padMap[pad].call(this);
        //unitDom.el.appendTo(map_el);
        return unitDom;
  };

  function Painter(map_el,config){
    
    // config include option attribute
    //   * edge_length
    //   * counter_x
    //   * counter_y
    //
    //   * map_el
    //   * designer
    //   * brush
    
    var short_edge_length,counter_x,counter_y,
        designer,brush;
    
    config            = config || {};
    short_edge_length = config.edge_length || 50;
    //attach_edge       = short_edge_length * 1.5;
    counter_x         = config.counter_x || short_edge_length * 0.96;
    counter_y         = config.counter_y || short_edge_length * 0.96;
    //default_hex_type  = config.default_hex_type || 'tip';
    //pad_length        = config.pad_length || counter_x/2;
    brush             = config.brush    || new Brush(config);
    designer          = config.designer || new Designer(brush);
    
    
    addStyle({'.hex .head'  :
                {'border-bottom-width' : short_edge_length/2+'px',
                 'border-left-width'   : short_edge_length*Math.cos(Math.PI/6)+'px',
                 'border-right-width'  : short_edge_length*Math.cos(Math.PI/6)+'px'
                },
              '.hex .center':
                {'width'  : short_edge_length*Math.cos(Math.PI/6)*2+'px',
                 'height' : short_edge_length+'px'},
              '.hex .tail'  :
                {'border-top-width'    : short_edge_length/2+'px',
                 'border-left-width'   : short_edge_length*Math.cos(Math.PI/6)+'px',
                 'border-right-width'  : short_edge_length*Math.cos(Math.PI/6)+'px'
                },
              '.counter'    :
                {
                  'width'              : counter_x+'px',
                  'height'             : counter_y+'px',
                }
    });
    
    function scale(i,j){
      var diff_i,diff_j,diff_k,left,top;
      diff_i = short_edge_length * Math.sin(Math.PI/6) + short_edge_length;
      diff_j = short_edge_length * Math.cos(Math.PI/6) * 2;
      if ((i%2) === 1){
        diff_k = short_edge_length*Math.cos(Math.PI/6);
      }
      else{
        diff_k = 0;
      }
      left=j*diff_j+diff_k;
      top=i*diff_i;
      return {left : left,
              top  : top};
    }
    
    function locUnit(m,n){
      var mat_mn,left,top;
      mat_mn  = scale(m,n);
      left = mat_mn.left + short_edge_length*Math.cos(Math.PI/6) - counter_x/2;
      top  = mat_mn.top  + short_edge_length/2 - counter_y/2;
      return {left  : left,
              top   : top};
    }
    
    function create_hexs(m,n){
      //test function
      var i,j,
          mat = [],
          row,
          left_top,
          hex;
      
      for (i = 0; i < m; i++){
        row = [];
        for(j = 0; j < n;j++){
          left_top = scale(i,j);
          hex=designer.hex(i,j,left_top.left,left_top.top);
          //hex.els.appendTo(map_el);
          //hex.el.appendTo(map_el);// browser only response later dom event
          //hex.bound.appendTo(map_el);
          hex.setMap(map_el);
          row.push(hex);
        }
        mat.push(row);
      }
      return mat;
    }
    
    function unit_factory(pad){
      var unitDom=designer.unit_factory(pad);
      unitDom.el.appendTo(map_el);
      return unitDom;
    }
        
    return {
      scale        : scale,
      locUnit      : locUnit,
      create_hexs  : create_hexs,
      unit_factory : unit_factory
    };
  }
  
  function highlight(hex){
    hex.bound.removeClass('unhighlight');
    hex.bound.addClass('highlight');
  }
  
  function de_highlight(hex){
    hex.bound.removeClass('highlight');
    hex.bound.addClass('unhighlight');

  }

  
  function Hexs(setting){
    // Hexs take a dom_el and a dictionary setting it can has these attribute:
    //   * painter - if not include this, will create new one use config attribute
    //   * dom_el - if painter is not given, dom_el will be used to create new one.
    //   * config    - a map to config hex grid shape be used when painter is not given
    //
    //   * m - rows
    //   * n - cols
    //   * clickEvent     - event new object will trigger it when their dom received DOM event.
    //   * classMap  - (i,j) -> a class 
    //   * highlightEvent - event will be register Grid method and fire it will highlight something
    //   * unhighlightEvent - as above.
    
    //// Event should has register function to hold a function this object assign to it.
    var i,j,hex,klass,m,n,painter,hexs,classCache;

    setting = setting   || {};
    m       = setting.m || 20;
    n       = setting.n || 20;
    painter = setting.painter || Painter(setting.dom_el,setting.config);
    hexs    = painter.create_hexs(setting.m || 20, setting.n || 20);
    classCache = {};
        
    function bindClick(hex,i,j){
        hex.el.click(function(){
          setting.clickEvent.trigger(i,j);
        });
    }
    
    if (setting.clickEvent){
      for (i = 0; i < m; i++){
        for(j = 0; j < n; j++){
          hex=hexs[i][j];
          bindClick(hex,i,j);
        }
      }
    }
    
    if (setting.classMap){
      for (i = 0; i < m; i++){
        for(j = 0; j < n; j++){
          hex=hexs[i][j];
          klass=setting.classMap(i,j);
          hex.els.addClass(klass);
          classCache[[i,j]]=klass;
        }
      }
    }
    
    if(setting.highlightEvent){
      setting.highlightEvent.register(function(i,j){
        highlight(hexs[i][j]);
      });
    }
    
    if(setting.unhighlightEvent){
      setting.unhighlightEvent.register(function(i,j){
        de_highlight(hexs[i][j]);
      });
    }
    
    if(setting.classUpdateEvent){
      setting.classUpdateEvent.register(function(i,j,klass){
        var _hex=hexs[i][j],
            oldClass=classCache[[i,j]];
        _hex.els.removeClass(oldClass);
        _hex.els.addClass(klass);
        classCache[[i,j]]=klass;
      });
    }
    
  }
  
  function deco(that,config){
    if (config.l0){
      that.els.l0.html(config.l0);
    }
    if (config.l1){
      that.els.l1.html(config.l1);
    }
    if (config.l2){
      that.els.l2.html(config.l2);
    }
    if (config.size){
      that.els.size.html(config.size);
    }
    if (config.color && ! that.el.hasClass(config.color)){
      that.el.addClass(config.color);
    }
  }
  
  
  
  function Counters(setting){
    // Counters take a dom_el and a dictionary setting it could hold these attributes:
    //   * painter - 
    //   * dom_el - if painter is not given, dom_el will be used to create new one.
    //   * config    - a map to config hex grid shape be used when painter is not given
    //
    //   * n - count size
    //   * unitMap - function, return dicts give information about units 
    //     * pad - indicate what pad unit hold
    //     * l0,l1,l2,size - number will be display
    //     * color - French, Kingdom etc...
    //   * clickEvent     - trigger and send id of object
    //   * moveEvent  - id,m,n,callback
    //   * setEvent   - id,m,n
    //   * updateEvent -unitMap
    //   * diedEvent - id
    //   * rollStackEvent - m,n
    //   * duration  
    //   * pattern
    //   * stackSize - 1-3 if 1 or undefined then use un-stack mode 
    //                      else add stack class state and change behavior on set and move_to
    //// Event should keep register,trigger method to hold a function this object assign to it.
    
    var unitMap,painter,domList,i,unitList,duration,pattern,
        stackSize,is_used_stack,unstackHandler,stackHandler,handler;
    
    setting       = setting || {};
    unitMap       = setting.unitMap;
    painter       = setting.painter || Painter(setting.dom_el,setting.config);
    unitList      = [];
    duration      = setting.duration || 100;
    pattern       = setting.pattern  || 'linear';
    stackSize     = setting.stackSize;
    is_used_stack = stackSize && stackSize>=2;
    
    // Begin handler switcher
    
    unstackHandler = {
      clickEvent : function(i){
        return function(){
          setting.clickEvent.trigger(i);
        };
      },
      unitInit : function(_unit){
        var unit=painter.unit_factory(_unit.pad);
        deco(unit,_unit);
        unit.el.css({display:'none'});
        return unit;
      },
      moveEvent : function(id,i,j,callback){
        var el=domList[id].el,
            loc=painter.locUnit(i,j);
            el.animate({left : loc.left,
                        top  : loc.top},
                        duration, pattern, callback);
      },
      setEvent : function(id,i,j){
        var unit  = domList[id],
            el    = unit.el,
            loc   = painter.locUnit(i,j);
            if(unit.m === undefined || unit.n === undefined){
              el.css({display : 'block'});
            }
            if(i === undefined || j === undefined){
              el.css({display : 'none'});
            }
            unit.m=i;
            unit.n=j;
            el.css({left  : loc.left,
                    top   : loc.top});
      },
      updateEvent : function(unitMap){
        domList.forEach(function(dom,i){
          deco(dom,unitMap(i));
        });
      },
      diedEvent:function(id){
        var unit=domList[id];
        unit.m   = undefined;
        unit.n   = undefined;
        unit.el.css({display : 'none'});
      }         
    };
    
    stackHandler=(function(){
      var stackMap={},// to record who units stand on hex, a empty list default for a key (i,j)
          stackClassMap={
            0 : 'stack1',
            1 : 'stack2',
            2 : 'stack3'
          };
      
      
      // Begin utility function 
      
      function removeStack(id,i,j){
        var newStack=[],
            index=0;
        stackMap[[i,j]].forEach(function(iid,i){
          if(id!==iid){
            newStack[index]=iid;
            domList[iid].el.removeClass(stackClassMap[i]);
            domList[iid].el.addClass(stackClassMap[index]);
            index+=1;
          }
          else{
            domList[iid].el.removeClass(stackClassMap[i]);
          }
        });
        stackMap[[i,j]]=newStack;
      }
      
      function pushStack(id,i,j){
        if (stackMap[[i,j]]===undefined){
          stackMap[[i,j]]=[];
        }
        domList[id].el.addClass(stackClassMap[stackMap[[i,j]].length]);
        stackMap[[i,j]].push(id);
      }
      
      function topStack(id){
        var unit=domList[id];
        removeStack(id,unit.m,unit.n);
        pushStack(id,unit.m,unit.n);
      }
      
      function rollStack(m,n){
        topStack(stackMap[[m,n]][0]);
      }
      
      // End utility function
      
      
      function clickEvent(i){
        return function(){
          topStack(i);
          setting.clickEvent.trigger(i);
        };
      }
      
      
      function unitInit(_unit){
        var unit=unstackHandler.unitInit(_unit);
        unit.m=undefined;
        unit.n=undefined;
        return unit;
      }
      
      function moveEvent(id,i,j,callback){
        var unit=domList[id],
            r;
        if(unit.m !== undefined && unit.n !== undefined ){
          removeStack(id,unit.m,unit.n);
        }
        unit.m=i;
        unit.n=j;
        r = unstackHandler.moveEvent(id,i,j,callback);
        pushStack(id,i,j);
        return r;
      }
      
      function setEvent(id,i,j){
        var unit=domList[id],r;
        if(unit.m !== undefined && unit.n !== undefined ){
          removeStack(id,unit.m,unit.n);
        }
        r = unstackHandler.setEvent(id,i,j);
        pushStack(id,i,j);
        return r;
      }
      
      function updateEvent(unitMap){
        return unstackHandler.updateEvent(unitMap);
      }
      
      function diedEvent(id){
        var unit = domList[id];
        removeStack(id,unit.m,unit.n);
        unstackHandler.diedEvent(id);
      }
      
      function rollStackEvent(m,n){
        rollStack(m,n);
      }
      
      
      return {
        clickEvent : clickEvent,
        unitInit : unitInit,
        moveEvent : moveEvent,
        setEvent  : setEvent,
        updateEvent : updateEvent,
        diedEvent : diedEvent,
        rollStackEvent : rollStackEvent
      };
    }());
    
    handler = is_used_stack ? stackHandler : unstackHandler;
    
    // End handler switcher
    
    
    
    for(i = 0; i < setting.n; i++){
      unitList.push(unitMap(i));
    }
    
    domList=unitList.map(handler.unitInit);
    
    if (setting.clickEvent){
      domList.forEach(function(dom,i){
        dom.el.click(handler.clickEvent(i));
      });
    }
    
    if(setting.moveEvent){
      setting.moveEvent.register(handler.moveEvent);
    }
    
    if(setting.setEvent){
      setting.setEvent.register(handler.setEvent);
    }
    
    if(setting.updateEvent){
      setting.updateEvent.register(handler.updateEvent);
    }
    
    if(setting.diedEvent){
      setting.diedEvent.register(handler.diedEvent);
    }
    
    if(setting.rollStackEvent){
      setting.rollStackEvent.register(handler.rollStackEvent);
    }

  }
  
  
  
  return {
    Brush    : Brush,
    Designer : Designer,
    Painter  : Painter,
    Hexs     : Hexs,
    Counters : Counters
  };
}(jQuery));