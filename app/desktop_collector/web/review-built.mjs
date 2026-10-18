import { chromium } from '@playwright/test';
import fs from 'node:fs';
const css=fs.readFileSync('./build/assets/index-DCOj4Bz9.css','utf8');
const js=fs.readFileSync('./build/assets/index-KsZn7Wee.js','utf8');
const out='/mnt/data/astra-review'; fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
const page=await browser.newPage({viewport:{width:1440,height:900}, colorScheme:'dark'});
page.on('pageerror',e=>console.log('PAGEERROR',e.message));
page.on('console',m=>{ if(m.type()==='error') console.log('CONSOLE',m.text()); });
await page.setContent('<!doctype html><html><head></head><body><div id="root"></div></body></html>');
await page.evaluate(()=>{
  history.replaceState=()=>{};
  location.hash='api=http%3A%2F%2F127.0.0.1%3A5555&token=review';
  const devices=[
    {device_id:'left-glove',display_name:'Left glove',hand:'left',hand_label:'L',source_kind:'simulator',nominal_sample_rate_hz:100,simulated:true,state:'connected',capabilities:{flex_channels:[true,true,true,true,true],fsr:true,accelerometer:true,gyroscope:true,distance:true}},
    {device_id:'right-glove',display_name:'Right glove',hand:'right',hand_label:'R',source_kind:'simulator',nominal_sample_rate_hz:100,simulated:true,state:'connected',capabilities:{flex_channels:[true,true,true,true,true],fsr:true,accelerometer:true,gyroscope:true,distance:true}},
  ];
  const defs=[['flex_thumb','Thumb flex','ADC','flex'],['flex_index','Index flex','ADC','flex'],['flex_middle','Middle flex','ADC','flex'],['flex_ring','Ring flex','ADC','flex'],['flex_pinky','Pinky flex','ADC','flex'],['fsr','FSR force','ADC','fsr'],['accel_x','Accel X','g','accel'],['accel_y','Accel Y','g','accel'],['accel_z','Accel Z','g','accel'],['gyro_x','Gyro X','deg/s','gyro'],['gyro_y','Gyro Y','deg/s','gyro'],['gyro_z','Gyro Z','deg/s','gyro'],['distance','Distance','mm','distance']];
  const channels=defs.map(([id,label,unit,group])=>({id,label,unit,group}));
  const auth={setup_required:false,authenticated:true,user:{id:'u1',username:'review',display_name:'Review User',role:'researcher',is_active:true,must_change_password:false,created_at:'',updated_at:'',last_login_at:null}};
  const bootstrap={bridge_schema_version:'1',display_fps:30,display_fps_limits:[1,60],channels,devices,simulation:{seed:1,sample_rate_hz:100,noise_std:0.02,packet_loss_rate:0}};
  window.fetch=async (url,init={})=>{
    const p=String(url); let body={};
    if(p.includes('/api/v1/auth/status')) body=auth;
    else if(p.includes('/api/v1/bootstrap')) body=bootstrap;
    else if(p.includes('/api/v1/telemetry/snapshot')) body={type:'telemetry_snapshot',bridge_schema_version:'1',window_seconds:60,devices:[]};
    else if(p.includes('/api/v1/auth/logout')) body={authenticated:false};
    else if(p.includes('/api/v1/simulator/config')) body=bootstrap.simulation;
    else if(p.includes('/connect')) body={device_id:p.includes('left-glove')?'left-glove':'right-glove',state:'connected'};
    else if(p.includes('/disconnect')) body={device_id:p.includes('left-glove')?'left-glove':'right-glove',state:'disconnected'};
    return new Response(JSON.stringify(body),{status:200,headers:{'Content-Type':'application/json'}});
  };
  class WS {
    static OPEN=1; static CONNECTING=0; static CLOSED=3;
    constructor(url){this.url=url;this.readyState=0;this.listeners={};setTimeout(()=>{this.readyState=1;this.emit('open',{});},10)}
    addEventListener(t,cb){(this.listeners[t]??=[]).push(cb)} emit(t,e){for(const cb of this.listeners[t]??[])cb(e)} send(){} close(code=1000){this.readyState=3;this.emit('close',{code})}
  }
  window.WebSocket=WS;
});
await page.addStyleTag({content:css});
await page.addScriptTag({type:'module',content:js});
await page.waitForSelector('nav[aria-label="Application navigation"]',{timeout:10000});
await page.waitForTimeout(250);
console.log('nav',await page.locator('nav[aria-label="Application navigation"]').innerText());
await page.getByRole('navigation',{name:'Application navigation'}).getByRole('button',{name:'Studio',exact:true}).click();
await page.waitForSelector('[data-testid="studio"]');
await page.waitForTimeout(120);
await page.screenshot({path:`${out}/studio-overview-dark2-1440x900.png`});
await page.getByRole('navigation',{name:'Context sections'}).getByRole('button',{name:'MediaPipe',exact:true}).click();
await page.waitForTimeout(80);
await page.screenshot({path:`${out}/studio-mediapipe-dark2-1440x900.png`});
await page.getByRole('button',{name:'Search',exact:true}).click();
await page.waitForTimeout(100);
await page.screenshot({path:`${out}/global-search-dark2-1440x900.png`});
console.log('studio section', await page.locator('[data-testid="studio"]').getAttribute('data-section'));
console.log('dialog titles', await page.getByRole('dialog').allInnerTexts());
await browser.close();
