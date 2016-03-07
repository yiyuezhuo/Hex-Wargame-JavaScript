# Classic hex based wargame project - javascript

## Introduction

This is a project that want to develope a classic hex based wargame by javascript.

Code is cheap ,show me the image:

![Alt image](/preview/p.gif)

<a href="http://yiyuezhuo.github.io/games/project4/index.html">play it online(GitHub page)</a>

or you can clone this repo and open `index.html` file to enjoy it.

## Customize Scenario develope

I write a Python script to integrate some `.csv` file to a `*.js` scenario file that engine can run it.

However I found `.csv` file can be used edit data in visualization table software (eg. Excel) very easily. It's be familiar with 
unprogramer and a lot of wargame player want to develope their single game.

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

#### other configure file

* `script.js` this used a special format,it lead you can trigger some event in game without dive in detail.
* `unit.css` set counter color .
* `hex.css` set hex and color .