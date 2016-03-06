# Hex based wargame develope - javascript

## Introduction

This is a project that want to develope a hex based wargame (classic) by javascript.

Code is cheap ,show you the image:

![Alt image](/preview/pre.png)

<a href="http://yiyuezhuo.github.io/games/project4/index.html">play it online(GitHub page)</a>

or you can clone this repo and open `index.html` file to enjoy it.

## Customize Scenario develope

I write a Python script to integrate some `.csv` file to a `*.js` scenario file that engine can run it.

### scenario_maker.py

#### Usage

	$ python scenario_maker.py scenario_dir output.js
	
### `.csv` scenario define document structure

#### map about

* `block.csv`
* `capture.csv`
* `label.csv`
* `terrain.csv`
* `VP.csv`

For example,if `terrain.csv` `(2,3)` grid (line 2,column 3) is "open",
it mean the terrain of hex(2,3) in game map will be "open". 

#### unit setup

* `unit.csv` unit list
* `place.csv` set unit location

#### other csv file

* `AI.csv` guide AI how to attack
* `CRT.csv` combat result table 
* `player.csv` player level information
* `setting.csv` some setting
* `terrain_type.csv` terrain movement cost,moveable etc

#### other file

* `script.js` this used a special format,it lead you can trigger some event in game without dive in detail.
* `color.css` set counter and hex color etc.
