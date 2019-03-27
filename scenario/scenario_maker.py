# -*- coding: utf-8 -*-
"""
Created on Fri Dec 04 15:58:53 2015

@author: yiyuezhuo
"""
import json
import csv
import sys

# entities should be implemented by class,every class output a
# dictionary. Thesee dictionary finally integrate to a 
# JSON string

class Hex(object):
    def __init__(self):
        self.m=0
        self.n=0
        self.VP=0
        self.terrain='open'
        self.label=''
        self.capture=0
        #capture mean who capture this hex,used by VP account
    def to_dict(self):
        dic={'m':self.m,'n':self.n,'VP':self.VP,'terrain':self.terrain,
             'label':self.label,'capture':self.capture}
        return dic
        
        
class Unit(object):
    def __init__(self):
        self.id=0
        self.side=0
        self.m=0
        self.n=0
        self.combat=0
        self.movement=0
        self.VP=0
        self.label=''
        self.pad='infantry'
        self.img=''# Not Implemented
        self.group=0
        self.size='XX'
        #self.color={'font':(0,0,0),'box_border':(0,0,0),'box_back':(0,0,0),
        #            'pad_back':(0,0,0),'pad_line':(0,0,0)}
    def to_dict(self):
        dic={'id':self.id,'side':self.side,'m':self.m,'n':self.n,'combat':self.combat,
        'movement':self.movement,'VP':self.VP,'label':self.label,'img':self.img,'color':self.color,
        'pad':self.pad,'group':self.group,'range':self.range,'size':self.size}
        return dic
        
class Player(object):
    def __init__(self):
        self.id=0
        self.name=''
    def to_dict(self):
        dic={'id':self.id,'name':self.name}
        return dic
        
class Scenario(object):
    def __init__(self):
        self.unit_list=[]
        self.hex_list=[]
        self.player_list=[]
        self.CRT=None
        self.AI=None
        self.size=(0,0)
        self.setting=None
    def to_json(self,sort=True):
        #if sort:
        #    self.sort_id()
        if len(self.player_list)==0:
            print('you need put player information,call auto_player() or assign manualy')
        unit_dic_list=[unit.to_dict() for unit in self.unit_list]
        hex_dic_list=[hexij.to_dict() for hexij in self.hex_list]
        player_dic_list=[player.to_dict() for player in self.player_list]
        AI_list=self.AI
        CRT=self.CRT
        setting=self.setting
        script=self.script
        big_dic={'unit_dic_list':unit_dic_list,'hex_dic_list':hex_dic_list,'size':self.size,
                 'player_dic_list':player_dic_list,'AI_list':AI_list,'CRT':CRT,
                 'setting':setting,'script':script,'terrain':self.terrain_type}
        return json.dumps(big_dic)
    def to_javascript(self,out_name='output.js',obj_name='scenario_dic'):
        s=self.to_json()
        ss='var '+obj_name+'='+s+';'
        with open(out_name,'w') as f:
            f.write(ss)
    def create_hexs(self,m,n):
        for i in range(m):
            for j in range(n):
                hexij=Hex()
                hexij.m=i
                hexij.n=j
                self.hex_list.append(hexij)
    def sort_id(self):
        for i in  range(len(self.unit_list)):
            unit=self.unit_list[i]
            unit.id=i
    def add_unit(self,obj):
        self.unit_list.append(obj)
    '''
    def auto_player(self,nameA,nameB):
        playerA=Player(0)
        playerB=Player(1)
        playerA.name=nameA
        playerB.name=nameB
        self.player_list=[playerA,playerB]
    '''

'''                
class Kingdom(Unit):
    def __init__(self):
        Unit.__init__(self)
        self.side=0
        self.combat=4
        self.movement=5
        self.VP=1
        self.label='Kindom soilder'
        self.color['font']=(255,255,255)
        self.color['box_border']=(0,0,0)
        self.color['box_back']=(110,110,220)
        self.color['pad_line']=(30,30,100)
        self.color['pad_back']=(150,150,150)
        
class Empire(Unit):
    def __init__(self):
        Unit.__init__(self)
        self.side=1
        self.combat=5
        self.movement=4
        self.VP=2
        self.label='Empire soilder'
        self.color['font']=(255,255,255)
        self.color['box_border']=(10,10,10)
        self.color['box_back']=(0,0,0)
        self.color['pad_line']=(0,0,0)
        self.color['pad_back']=(255,255,255)
        
class Kingdom_p(Player):
    def __init__(self):
        self.id=0
        self.name='Kingdom'
class Empire_p(Player):
    def __init__(self):
        self.id=1
        self.name='Empire'
'''
        
class CSV_model(object):
    def __init__(self,scenario=None):
        self.path=None
        self.register=['AI.csv','block.csv','capture.csv',
                       'label.csv','player.csv','terrain.csv','terrain_type.csv',
                       'unit.csv','VP.csv','CRT.csv','setting.csv','place.csv']
        self.raw_register=['script.js']
        # the files in raw don't use csv module to load
        self.csv={}
        self.raw={}
        self.root=''
        self.mark={}#place result
        self.id_unit_dic={}
        if scenario!=None:
            self.scenario=scenario
        else:
            self.scenario=Scenario()
    def clean(self,csv_l):
        mat=[]
        for i in csv_l:
            line=[]
            for j in i:
                line.append(int(j) if j.isdigit() else j)
            mat.append(line)
        return mat
    def load(self,root):
        self.root=root
        for reg in self.register:
            print('load '+reg)
            path=root+'\\'+reg
            #f=open(path,'rb')
            #self.csv[reg]=list(csv.reader(f))
            with open(path) as f:
                self.csv[reg]=self.clean(list(csv.reader(f)))
        for reg in self.raw_register:
            print('load '+reg)
            path=root+'\\'+reg
            with open(path) as f:
                self.raw[reg]=f.read()
    def parse_AI(self):
        # remove comment item only
        self.scenario.AI=[line for line in self.csv['AI.csv'] if line[0]!='#']
    def parse_map(self):
        '''parse block.csv,capture.csv,label.csv,terrain.csv,VP.csv at the same time'''
        block=self.csv['block.csv']
        capture=self.csv['capture.csv']
        label=self.csv['label.csv']
        terrain=self.csv['terrain.csv']
        VP=self.csv['VP.csv']
        place=self.csv['place.csv']
        for i in range(len(block)):
            for j in range(len(block[0])):
                if block[i][j]==1:
                    hex_ij=Hex()
                    hex_ij.m=i
                    hex_ij.n=j
                    hex_ij.capture=capture[i][j]
                    hex_ij.label=label[i][j]
                    hex_ij.terrain=terrain[i][j]
                    hex_ij.VP=VP[i][j]
                    hex_ij.capture=capture[i][j]
                    self.scenario.hex_list.append(hex_ij)
                    if type(place[i][j])==int:
                        self.mark[place[i][j]]=[i,j]
        ml,nl=zip(*[[hex_.m,hex_.n] for hex_ in self.scenario.hex_list])
        ms,ns=set(ml),set(nl)
        self.scenario.size=(max(ms)+1,max(ns)+1)
    def place_rewrite(self):
        for unit_id in self.mark.keys():
            unit=self.id_unit_dic[unit_id]
            unit.m,unit.n=self.mark[unit_id]
    def pick_from_head(self,csv_list):
        # map a csv table to dictionary as records. First line is variable nam
        head=csv_list[0]
        id_dic={i:head[i] for i in range(len(head))}
        body=csv_list[1:]
        content=[{id_dic[i]:line[i] for i in range(len(line))} for line in body]
        return content
    def parse_unit(self):
        unit_l=self.pick_from_head(self.csv['unit.csv'])
        for unit_i in unit_l:
            unit=Unit()
            unit.id=unit_i['id']
            unit.side=unit_i['side']
            unit.m=unit_i['m']
            unit.n=unit_i['n']
            unit.combat=unit_i['combat']
            unit.movement=unit_i['movement']
            unit.VP=unit_i['VP']
            unit.label=unit_i['label']
            unit.pad=unit_i['pad']
            unit.img=unit_i['img']
            unit.color=unit_i['color']
            unit.group=unit_i['group']
            unit.range=unit_i['range']
            unit.size=unit_i['size']
            self.scenario.unit_list.append(unit)
            self.id_unit_dic[unit.id]=unit
    def parse_player(self):
        player_l=self.pick_from_head(self.csv['player.csv'])
        for player_i in player_l:
            player=Player()
            player.id=player_i['id']
            player.name=player_i['name']
            player.AI=player_i['AI']
            self.scenario.player_list.append(player)
    def parse_CRT(self):
        CRT=self.csv['CRT.csv']
        CRT_T=list(zip(*CRT))
        dice=CRT_T[0]
        odds=CRT_T[1:]
        dic={odd[0]:{}  for odd in odds}
        for i in range(1,len(dice)):
            for odd in odds:
                dic[odd[0]][dice[i]]=odd[i]
        dic_r={}
        for key,item in dic.items():
            if key[0]=='p':
                a,b=key[1:].split(':')
                dic_r[float(a)/float(b)]=item
        self.scenario.CRT=dic_r
    def parse_terrain_type(self):
        terrain_type=self.pick_from_head(self.csv['terrain_type.csv'])
        self.scenario.terrain_type={record['name']:record for record in terrain_type}
    def parse_setting(self):
        setting=self.pick_from_head(self.csv['setting.csv'])[0]
        self.scenario.setting=setting
    def parse_script(self):
        # script will be pass to frontend to eval
        self.scenario.script=self.raw['script.js']
    def parse(self,place=False):
        self.parse_AI()
        self.parse_CRT()
        self.parse_map()
        self.parse_unit()
        self.parse_player()
        self.parse_terrain_type()
        self.parse_setting()
        self.parse_script()
        if place:
            self.place_rewrite()
    def to_javascript(self,out_name='output.js',obj_name='scenario_dic'):
        self.scenario.to_javascript(out_name,obj_name)
        
def trans(path,out_name='output.js',place=False):
    model=CSV_model()
    model.load(path)
    model.parse(place=place)
    model.to_javascript(out_name=out_name)
    print('fin')

if __name__ == '__main__':
    if len(sys.argv)==1: #test
        model=CSV_model()
        model.load('scenario\\Battle_of_Assaye')
        model.parse(place=True)
        model.to_javascript()
        print('fin')
    else:
        path=sys.argv[1]
        place='place' in sys.argv
        print('place',place)
        trans(path,place=place)
    
        
