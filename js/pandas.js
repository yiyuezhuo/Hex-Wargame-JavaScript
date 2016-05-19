
var pd=(function(){
  
  
	function parseCSV(csvString,delimiter){
		delimiter=delimiter || ',';
		//var table=csvString.split('\n').map(function(s){return s.split(delimiter)});
		var table=csvString.split('\n')
		table=table.slice(0,table.length-1).map(function(line){
			var i;
			var wordList=[];
			var word='';
			var quote=false;
			for(i=0;i<line.length;i++){
				if (!quote){
					if(line[i]===delimiter){
						wordList.push(word);
						word='';
					}
					else if(line[i]==='"'){
						quote=true;
					}
					else{
						word=word+line[i];
					}
				}
				else{
					if(line[i]==='"'){
						quote=false;
					}
					else{
						word=word+line[i];
					}
				}
			}
			return wordList;
		})
		var data=[];
		var colHeaders=table[0].slice(1);
		var rowHeaders=[];
		table.slice(1).forEach(function(record){
			rowHeaders.push(record[0]);
			data.push(record.slice(1));
		})
		return {data:data,columns:colHeaders,index:rowHeaders};
	}
	
	function typePure(basicTable){
		var i,j,k;
		var data=basicTable.data;
		var typeList=[];
		for(i=0;i<data[0].length;i++){
			var flag=true;
			for(j=0;j<data.length;j++){
				var num=Number(data[j][i]);
				if(isNaN(num)){
					console.log(data[j][i],num);
					flag=false;
					break;
				}
				else{
					data[j][i]=num;
				}
			}
			if(!flag){
				typeList.push('string');
				for(k=0;k<j;k++){
					data[j][i]=String(data[j][i]);
				}
			}
			else{
				typeList.push('number');
			}
		}
		basicTable.typeList=typeList;
		return basicTable;
	}
	
	function DataFrame(basicTable){
		// basicTable=Object has key [data,colHeaders,rowHeaders]
		//basicTable=typePure(basicTable);
		this.data=basicTable.data;
		//this.colHeaders=basicTable.colHeaders;
		//this.rowHeaders=basicTable.rowHeaders;
		this.columns=basicTable.columns;
		this.index=basicTable.index;
		this.typeList=basicTable.typeList;
	}
	
	DataFrame.prototype.get=function(key){
		var colId=this.columns.indexOf(key);
		var series=this.data.map(function(row){
			return row[colId];
		});
		series.name=key;
		return series;
	}
	DataFrame.prototype.ix=function(key){
		var rowId=this.index.indexOf(key);
		return this.data[rowId];
	}
	DataFrame.prototype.describe=function(){
		var that=this;
		var columns=this.columns.filter(function(key,i){
			return that.typeList[i]==='number';
		});
		var records=columns.map(function(key){
			var col=that.get(key).sort();
			return {count:col.length,
						mean:d3.mean(col),
						std:d3.deviation(col),
						min:d3.min(col),
						'25%':d3.quantile(col,0.25),
						'50%':d3.quantile(col,0.5),
						'75%':d3.quantile(col,0.75),
						max:d3.max(col)};
		})
		var df=DataFrame.createByRecords(records,['count','mean','std','min','25%','50%','75%','max']);
		df.index=columns;
		return df;
	}
  DataFrame.prototype.to_records=function(){
    var data=this.data;
    var columns=this.columns;
    var records=data.map(function(record){
      var rd={};
      columns.forEach(function(key,i){
        rd[key]=record[i];
      });
      return rd;
    });
    return records;
  }

	
	DataFrame.createByCSV=function(csvString,delimiter){
		//csvString is string loaded by other source
		var basicTable=parseCSV(csvString,delimiter);
		return new DataFrame(basicTable)
	}
  
	DataFrame.createByRecords=function(records,columns){
		//records=[{name:"yyz",age:21},{name:'rat',age:1},...]
		columns=columns || Object.keys(records[0]);
		var index=d3.range(records.length);
		var data=[];
		records.forEach(function(record){
			var row=columns.map(function(key){
				return record[key];
			});
			data.push(row);
		})
		return new DataFrame({data:data,index:index,columns:columns});
	}
	DataFrame.createByDict=function(dict,keyList){
		keyList=keyList || Object.keys(dict);
		var _data=keyList.map(function(key){
			return dict[key];
		});
		var index=d3.range(_data[0].length);
		var columns=keyList;
		return new DataFrame({data:_data.T(),index:index,columns:columns})	
	}
	
	//window.pd={DataFrame:DataFrame};
  return {DataFrame : DataFrame};
	
}());