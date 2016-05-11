/*
 * domplot.js
 * provide function plot line and hex in DOM way.
*/

/*jslint          browser  : true,  continue  : true,
  devel  : true,  indent   : 2,     maxerr    : 50,
  newcap : true,  nomen    : true,  plusplus  : true,
  regexp : true,  sloppy   : true,  vars      : false,
  white  : true
*/
/*global domplot,jQuery,random */


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

  function Painter(map_el,config){
    
    // config include option attribute
    //   * edge_length
    //   * counter_x
    //   * counter_y
    //   * default_hex_type
    
    var short_edge_length,attach_edge,counter_x,counter_y,default_hex_type;
    
    config            = config || {};
    short_edge_length = config.edge_length || 50;
    attach_edge       = short_edge_length * 1.5;
    counter_x         = config.counter_x || 48;
    counter_y         = config.counter_y || 48;
    default_hex_type  = config.default_hex_type || 'tip';
    
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
                }
    });
        
    /*
    function draw_hex(left,top,type){
      // hard code version
      var three,
          els = [];
      if (type === 'tip'){
        three = [0,60,120];
      }
      else if (type === 'lie'){
        three = [90,150,210];
      }
      three.forEach(function(degree){
        var base=$('<div></div>');
        base.css({width:long_edge_length,height:short_edge_length,
            position:'absolute',transform:"rotate("+degree+"deg)",left:left+'px',top:top+'px'});
        base.appendTo(map_el);	
        els.push(base);
      });
      return els;
    }
    */
    
    function draw_hex2(left,top){
      // css version
      var root = $('<div></div>');
      root.addClass('hex');
      root.css({top      : top-short_edge_length/2,
                left     : left,
                position : 'absolute'}
      );
      root.appendTo(map_el);
      ['head','center','tail'].forEach(function(cname){
        var c=$("<div></div>");
        c.addClass(cname);
        c.appendTo(root);
      });
      return root;
    }


    function attach_hex(left,top){
      var base      = $('<div></div>'),
          diff_left = short_edge_length*Math.cos(Math.PI/6)-attach_edge/2,
          diff_top  = (attach_edge-short_edge_length)/2;
      
      base.css({width    : attach_edge,
                height   : attach_edge,
                position : 'absolute',
                left     : left+diff_left+'px',
                top      : top-diff_top+'px'
               }
      );
      base.appendTo(map_el);	
      return base;
    }


    
    function create_bound(left,top){
      // create bound around hex
      var L   = short_edge_length,
          sin = Math.sin(Math.PI/6),
          cos = Math.cos(Math.PI/6),
          p1  = [left-short_edge_length/2,top+short_edge_length/2],
          p2  = [left+L*cos/2-L/2,top+L+L*sin/2],
          p3  = [left+L*cos*1.5-L/2,top+L+L*sin/2],
          p4  = [left+L*cos*2-L/2,top+L/2],
          p5  = [left+L*cos*1.5-L/2,top-L*sin/2],
          p6  = [left+L*cos/2-L/2,top-L*sin/2],
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
        line.appendTo(map_el);
        ll.push(line);
      }
      return ll;
    }
        
    function draw_counter(){
      var box,size,pad,l0,l1,l2;
      box = $('<div></div>');
      box.css({width     : counter_x,
               height    : counter_y,
               position  : "absolute",
               'z-index' : 1,
               'user-select':'none'
              });
      box.attr({'class':'box'});
      size = $('<div></div>');
      size.css({left     : 0,
                top      : 0,
                width    : counter_x,
                position : "absolute",
                'font-size'  :'10%',
                'text-align' :'center'
                });
      size.attr({'class':'size'});
      size.html('XX');
      size.appendTo(box);
      pad = $('<div></div>');
      pad.css({width  : 25,
               height : 17,
               left   : 9,
               top    : 14,
               position : "absolute"    
              });
      pad.attr({'class':'pad'});
      pad.appendTo(box);
      l0 = $('<div></div>');
      l0.css({left:6,top:34,position:"absolute",'font-size':'10%'});
      l0.attr({'class':'l0'});
      l1 = $('<div></div>');
      l1.css({left:18,top:34,position:"absolute",'font-size':'10%'});
      l1.attr({'class':'l1'});
      l2 = $('<div></div>');
      l2.css({left:36,top:34,position:"absolute",'font-size':'10%'});
      l2.attr({'class':'l2'});
      l0.appendTo(box);l1.appendTo(box);l2.appendTo(box);
      return { box  : box,
               size : size,
               pad  : pad,
               l0   : l0,
               l1   : l1,
               l2   : l2
             };
    }
    
    function draw_line(x1,y1,x2,y2){
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
                  height    : 2,
                  position  : "absolute",
                  transform : "rotate("+degree+"deg)"
                 }
        );
        return line;
    }
    
    function hex(x,y,left,top){
      var m,n,els,el,bound;
      m     = x;
      n     = y;// hell name for compatibel
      els   = draw_hex2(left,top,default_hex_type);
      el    = attach_hex(left,top);
      bound = create_bound(left,top);
      return {x     : x,
              y     : y,
              m     : m,
              n     : n,
              els   : els,
              el    : el,
              bound : bound};
    }
    
    function scale(i,j){
      var diff_i,diff_j,diff_k,left,top;
      diff_i = short_edge_length*Math.sin(Math.PI/6)+short_edge_length;
      diff_j = short_edge_length*Math.cos(Math.PI/6)*2;
      if ((i%2) === 1){
        diff_k = short_edge_length*Math.cos(Math.PI/6);
      }
      else{
        diff_k = 0;
      }
      left=j*diff_j+diff_k;
      top=i*diff_i;
      return {left:left,top:top};
    }
    
    function create_hexs(m,n){
      //test function
      var i,j,
          mat = [],
          line,
          left_top;
      
      for (i = 0; i < m;i++){
        line = [];
        for(j = 0; j < n;j++){
          left_top = scale(i,j);
          line.push(hex(i,j,left_top.left,left_top.top));
        }
        mat.push(line);
      }
      return mat;
    }
    
    return {
      draw_line    : draw_line,
      create_bound : create_bound,
      draw_counter : draw_counter,
      create_hexs  : create_hexs,
      draw_hex2    : draw_hex2,
      scale        : scale
    };
  }
  
	function highlight(that){
		that.bound.forEach(function(bound){
			bound.removeClass('unhighlight');
			bound.addClass('highlight');
			that.is_highlight=true;
		});
	}
  
	function de_highlight(that){
		that.bound.forEach(function(bound){
			bound.removeClass('highlight');
			bound.addClass('unhighlight');
			that.is_highlight=false;
		});
	}

  
  function Hexs(dom_el,setting){
    // Hexs take a map_el and a dictionary setting it can has these attribute:
    //   * m - rows
    //   * n - cols
    //   * config    - a map to config hex grid shape
    //   * clickEvent     - event new object will trigger it when their dom recieved DOM event.
    //   * classMap  - (i,j) -> a class 
    //   * highlightEvent - event will be register Grid method and fire it will highlight something
    //   * unhighlightEvent - as above.
    //// Event should has register function to hold a function this object assign to it.
    var i,j,hex,klass,m,n,painter,hexs;

    setting = setting   || {};
    m       = setting.m || 20;
    n       = setting.n || 20;
    painter = Painter(dom_el,setting.config);
    hexs    = painter.create_hexs(setting.m || 20, setting.n || 20);
        
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
        }
      }
    }
    
    if(setting.highlightEvent){
      setting.highlightEvent.register(function(i,j){
        highlight(hexs[i][j]);
      });
    }
    
    if(setting.unhighlightEvent){
      setting.highlightEvent.register(function(i,j){
        de_highlight(hexs[i][j]);
      });
    }
    
  }
  
  return {
    Painter : Painter,
    Hexs    : Hexs
  };
}(jQuery));