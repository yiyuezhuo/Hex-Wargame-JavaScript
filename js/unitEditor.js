
// wrap handsontable.js and provide helper API

var unitEditor= (function(){

  function renderTable(dom,df){
    dom.textContent='';
    /*
    var rowHeaderWidth=d3.max(df.index.map(function(text){
      return $.fn.textWidth(text);
    }));
    var percent=1.2;
    rowHeaderWidth=Math.max(rowHeaderWidth,32);
    rowHeaderWidth*=percent;
    console.log(rowHeaderWidth);
    */
    var table=new Handsontable(dom,{
          data:df.data,
          colHeaders:df.columns,
          rowHeaders:df.index,
          contextMenu:true,
          manualColumnResize:true
          //rowHeaderWidth:rowHeaderWidth
        });
    return table;
  }


  var _unitEditor = {
    __init__  : function(dom,columns){
      this.dom=dom;
      this.columns=columns || ['id','side','m','n','combat','movement','VP','label',
                               'pad','img','color','enter_time','group','range','size'];
      var col_id_map={};
      this.columns.forEach(function(col,i){
        col_id_map[col]=i;
      });
      this.col_id_map=col_id_map;
      this.df=undefined;
      this.table=undefined;
    },
    push_list : function(unit_dic_list){
      var columns =  this.columns;
      this.df = pd.DataFrame.createByRecords(unit_dic_list,columns);
      this.table = this._render();
    },
    _render   : function(){
      return renderTable(this.dom,this.df);
    },
    pull_list : function(){
      var data=this.table.getData();
      var columns=this.columns;
      var index=d3.range(data.length);
      this.df=new pd.DataFrame({data    : data,
                                 columns : columns,
                                 index   : index});
      return this.df.to_records();
    }
  }

  return _unitEditor;

}());