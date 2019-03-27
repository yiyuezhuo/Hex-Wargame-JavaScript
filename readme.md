# Classic hex based wargame project - javascript

## Introduction

This is a project that want to develope a classic hex based wargame by javascript.

Code is cheap ,show me the image:

![Alt image](/preview/p.gif)

<a href="http://yiyuezhuo.github.io/Hex-Wargame-JavaScript/">play it online(GitHub page)</a>

or you can clone this repo and open `index.html` file to enjoy it.

## Customized scenario development by editor (under development)

<a href="http://yiyuezhuo.github.io/Hex-Wargame-JavaScript/editor.html">Editor</a>

## Customized scenario development by script

I write a Python script to merge some `.csv` file into a `*.js` scenario file so that engine can run it.

However I found `.csv` file can be used to edit data in visualization table software (eg. Excel) very easily. It's familiar with 
program newbie and a lot of wargame player who want to develop their unique game.

### scenario_maker.py

#### Usage

	$ python scenario_maker.py scenario_dir output.js

### `.csv` scenario define document structure

#### Map configuration

* `block.csv`
* `capture.csv`
* `label.csv`
* `terrain.csv`
* `VP.csv`

For example,if ,in `terrain.csv` , grid of `(2,3)` (line 2,column 3) is "open",
it mean that the terrain of hex(2,3) in game map will be "open". 

The style is motivated by HPS & JT games.

#### Unit setup

* `unit.csv` Unit list
* `place.csv` Set unit location

#### Other csv file

* `AI.csv` Guide AI how to attack
* `CRT.csv` Combat result table 
* `player.csv` Player level information.
* `setting.csv` Some setting.
* `terrain_type.csv` Attributions of terrain movement cost, moveable etc.

#### Other configure file

* `script.js` This use a special format. Allowing you trigger some event in game without dive in detail. But some knowledge about intrinsic system will be helpful.
* `unit.css` Set counter color .
* `hex.css` Set hex and color .

The configurations handled by two `*.css` files was handled by `*.csv` files in old version, but those style configure being in `*.css` will be more reasonable since you can dynamic modify them without running the python script again and again to see the final effect of new art.

## Advanced configuration

### Counter shape

`domplot.js`: The counter is plotted by pure DOM. For example, infantry symbol, a pair of cross lines in NOTA notations, is plotted by:

```javascript
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

```

