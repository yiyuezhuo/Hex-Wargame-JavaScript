# -*- coding: utf-8 -*-
"""
Created on Fri Dec 04 15:58:53 2015

@author: yiyuezhuo
"""
import json
import csv
import sys

#实体们应该用类实现，然后各对象1输出字典格式，最后统一转成json由javascript读取

class Hex(object):
    def __init__(self):
        self.m=0
        self.n=0
        self.VP=0
        self.terrain='open'
        self.label=''
        self.capture=0#capture是谁占领着这个地区，一般只有VP点这个参数才有用。
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
        self.img=''#这个应该是个静态地址，暂时不启用
        self.group=0
        self.color={'font':(0,0,0),'box_border':(0,0,0),'box_back':(0,0,0),
                    'pad_back':(0,0,0),'pad_line':(0,0,0)}
    def to_dict(self):
        dic={'id':self.id,'side':self.side,'m':self.m,'n':self.n,'combat':self.combat,
        'movement':self.movement,'VP':self.VP,'label':self.label,'img':self.img,'color':self.color,
        'pad':self.pad,'group':self.group,'range':self.range}
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
            print 'you need put player information,call auto_player() or assign manualy'
        unit_dic_list=[unit.to_dict() for unit in self.unit_list]
        hex_dic_list=[hexij.to_dict() for hexij in self.hex_list]
        player_dic_list=[player.to_dict() for player in self.player_list]
        AI_list=self.AI
        CRT=self.CRT
        setting=self.setting
        script=self.script
        big_dic={'unit_dic_list':unit_dic_list,'hex_dic_list':hex_dic_list,'size':self.size,
                 'player_dic_list':player_dic_list,'AI_list':AI_list,'CRT':CRT,
                 'setting':setting,'script':script}
        return json.dumps(big_dic)
    def to_javascript(self,out_name='output.js',obj_name='scenario_dic'):
        s=self.to_json()
        ss='var '+obj_name+'='+s+';'
        f=open(out_name,'w')
        f.write(ss)
        f.close()
    def create_hexs(self,m,n):
        for i in range(m):
            for j in range(n):
                hexij=Hex()
                hexij.m=i
                hexij.n=j
                self.hex_list.append(hexij)
    def sort_id(self):
        #有这个方法就可以不用手工声明id了
        for i in  range(len(self.unit_list)):
            unit=self.unit_list[i]
            unit.id=i
    def add_unit(self,obj):
        self.unit_list.append(obj)
    def auto_player(self,nameA,nameB):
        playerA=Player(0)
        playerB=Player(1)
        playerA.name=nameA
        playerB.name=nameB
        self.player_list=[playerA,playerB]
                
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
        
class CSV_model(object):
    def __init__(self,scenario=None):
        self.path=None
        self.register=['AI.csv','block.csv','capture.csv','color.csv',
                       'label.csv','player.csv','terrain.csv','unit.csv',
                       'VP.csv','CRT.csv','setting.csv','place.csv']
        self.raw_register=['script.js']#raw里的文件不使用csv模块进行装载
        self.csv={}
        self.raw={}
        self.root=''
        self.mark={}#place的结果
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
            print 'load '+reg
            path=root+'\\'+reg
            f=open(path,'rb')
            #self.csv[reg]=list(csv.reader(f))
            self.csv[reg]=self.clean(list(csv.reader(f)))
            f.close()
        for reg in self.raw_register:
            print 'load '+reg
            path=root+'\\'+reg
            f=open(path,'rb')
            #self.csv[reg]=list(csv.reader(f))
            self.raw[reg]=f.read()
            f.close()
    def parse_AI(self):
        #AI这里只移除注释行，剩余内容直接传入
        self.scenario.AI=[line for line in self.csv['AI.csv'] if line[0]!='#']
    def parse_map(self):
        '''这里同时解析block.csv,capture.csv,label.csv,terrain.csv,VP.csv'''
        block=self.csv['block.csv']
        capture=self.csv['capture.csv']
        label=self.csv['label.csv']
        terrain=self.csv['terrain.csv']
        VP=self.csv['VP.csv']
        place=self.csv['place.csv']#该文件应该由terrain.csv复制生成，可以保留原来的地形名称，只要id是数字就行
        #暂时削弱block的能力，使其只能屏蔽左上角以外的东西，因为不好实现
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
                    #if place[i][j].isdigit():已经clean过了如果真是数字
                    if type(place[i][j])==int:
                        self.mark[place[i][j]]=[i,j]
        ml,nl=zip(*[[hex_.m,hex_.n] for hex_ in self.scenario.hex_list])
        ms,ns=set(ml),set(nl)
        self.scenario.size=(max(ms)+1,max(ns)+1)
    def place_rewrite(self):
        #利用place.csv信息或者self.mark信息重写mn，若不调用这个方法就不会发生
        for unit_id in self.mark.keys():
            unit=self.id_unit_dic[unit_id]
            unit.m,unit.n=self.mark[unit_id]
    def pick_from_head(self,csv_list):
        #这个应该解析一个CSV表成一个字典，当第一行是标记行时
        head=csv_list[0]
        id_dic={i:head[i] for i in range(len(head))}
        body=csv_list[1:]
        content=[{id_dic[i]:line[i] for i in range(len(line))} for line in body]
        return content
    def parse_unit(self):
        '''这里同时解析unit.csv color.csv'''
        unit_l=self.pick_from_head(self.csv['unit.csv'])
        color_r=self.pick_from_head(self.csv['color.csv'])
        color={l['type']:{} for l in color_r}
        for c in color_r:
            for t in ['font','box_border','box_back','pad_line','pad_back']:
                rgb=(c[t+'_r'],c[t+'_g'],c[t+'_b'])
                color[c['type']][t]=rgb
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
            unit.color=color[unit_i['color']]
            unit.group=unit_i['group']
            unit.range=unit_i['range']
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
        #虽然这里进行解析，但先不实现将CRT加入实际转化中
        CRT=self.csv['CRT.csv']
        CRT_T=zip(*CRT)
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
    def parse_setting(self):
        setting=self.pick_from_head(self.csv['setting.csv'])[0]
        self.scenario.setting=setting
    def parse_script(self):
        #script并不进行进一步处理，直接传给前端eval，当然如此性能就坑了
        self.scenario.script=self.raw['script.js']
    def parse(self,place=False):
        self.parse_AI()
        self.parse_CRT()
        self.parse_map()
        self.parse_unit()
        self.parse_player()
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
    print 'fin'

if __name__ == '__main__':
    if len(sys.argv)==1:#从spyder启动
        model=CSV_model()
        model.load('scenario\\p_3_inner')
        model.parse(place=True)
        model.to_javascript()
        print 'fin'
    else:
        path=sys.argv[1]
        place='place' in sys.argv
        print 'place',place
        trans(path,place=place)
    
        
