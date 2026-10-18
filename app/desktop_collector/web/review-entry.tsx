import ReactDOM from 'react-dom/client';
import 'uplot/dist/uPlot.min.css';
import { App } from './src/App';
import './src/styles.css';

const devices = [
  {device_id:'left-glove', display_name:'Left glove', hand:'left', hand_label:'L', source_kind:'simulator', nominal_sample_rate_hz:100, simulated:true, state:'connected', capabilities:{flex_channels:[true,true,true,true,true],fsr:true,accelerometer:true,gyroscope:true,distance:true}},
  {device_id:'right-glove', display_name:'Right glove', hand:'right', hand_label:'R', source_kind:'simulator', nominal_sample_rate_hz:100, simulated:true, state:'connected', capabilities:{flex_channels:[true,true,true,true,true],fsr:true,accelerometer:true,gyroscope:true,distance:true}},
] as any;
const channels = [
  ['flex_thumb','Thumb flex','ADC','flex'],['flex_index','Index flex','ADC','flex'],['flex_middle','Middle flex','ADC','flex'],['flex_ring','Ring flex','ADC','flex'],['flex_pinky','Pinky flex','ADC','flex'],['fsr','FSR force','ADC','fsr'],['accel_x','Accel X','g','accel'],['accel_y','Accel Y','g','accel'],['accel_z','Accel Z','g','accel'],['gyro_x','Gyro X','deg/s','gyro'],['gyro_y','Gyro Y','deg/s','gyro'],['gyro_z','Gyro Z','deg/s','gyro'],['distance','Distance','mm','distance'],
].map(([id,label,unit,group])=>({id,label,unit,group})) as any;
class FakeBridge {
  authStatus(){ return Promise.resolve({setup_required:false,authenticated:true,user:{id:'u1',username:'review',display_name:'Review User',role:'researcher',is_active:true,must_change_password:false,created_at:'',updated_at:'',last_login_at:null}} as any); }
  onAuthInvalidated(){ return ()=>{}; }
  bootstrap(){ return Promise.resolve({bridge_schema_version:'1',display_fps:30,display_fps_limits:[1,60],channels,devices,simulation:{seed:1,sample_rate_hz:100,noise_std:0.02,packet_loss_rate:0}} as any); }
  openTelemetry(_onMessage:any,onStatus:any){ onStatus('connecting'); setTimeout(()=>onStatus('open'),0); return ()=>{}; }
  closeTelemetry(){}
  dispose(){}
  setDisplayFps(){}
  snapshot(){ return Promise.resolve({type:'telemetry_snapshot',bridge_schema_version:'1',window_seconds:60,devices:[]} as any); }
  setConnected(id:string,connect:boolean){ return Promise.resolve({device_id:id,state:connect?'connected':'disconnected'} as any); }
  configureSimulator(config:any){ return Promise.resolve(config); }
  logout(){ return Promise.resolve({authenticated:false} as any); }
}
ReactDOM.createRoot(document.getElementById('root')!).render(<App bridge={new FakeBridge() as any}/>);
