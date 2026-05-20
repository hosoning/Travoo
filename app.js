// ═══════════════════════════════════════════════════════════════
// Travoo v9 — app.js 2026.05.20
// Fixes: date sort, chat input, wallpaper, voice btn, liquid glass
// New: journal, photo board, flight/hotel, swipe gestures, gallery
// ═══════════════════════════════════════════════════════════════
import { initializeApp }   from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import {
  getFirestore, doc, getDoc, setDoc, addDoc, updateDoc, deleteDoc,
  collection, onSnapshot, query, orderBy, limit, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

const FB_CFG = {
  apiKey:"AIzaSyCyimwLDWNx92ihDmdHTdFSw4A8g34lPWI",
  authDomain:"travoo-com.firebaseapp.com",
  projectId:"travoo-com",
  storageBucket:"travoo-com.firebasestorage.app",
  messagingSenderId:"544581218382",
  appId:"1:544581218382:web:cb0511ab135f15a252931f"
};
var fbApp,db;
if(FB_CFG.apiKey&&!FB_CFG.apiKey.startsWith('YOUR_')){
  try{ fbApp=initializeApp(FB_CFG); db=getFirestore(fbApp); }catch(e){ console.warn('[FB]',e.message); }
}

if(!localStorage.getItem('deviceId'))
  localStorage.setItem('deviceId','dev_'+Math.random().toString(36).substr(2,9)+Date.now().toString(36));
var DEVICE_ID=localStorage.getItem('deviceId');

// ── THEMES ─────────────────────────────────────────────────────
const THEMES = {
  dark:   {name:'Dark',   mode:'dark', wp:'linear-gradient(158deg,#1a1610 0%,#111318 52%,#13100f 100%)', accent:'#ffffff',aRgb:'255,255,255',swatch:'#333'},
  purple: {name:'Purple', mode:'dark', wp:'linear-gradient(158deg,#0d0011 0%,#16002a 52%,#0a0016 100%)', accent:'#BF5AF2',aRgb:'191,90,242',swatch:'#6a0dad'},
  ocean:  {name:'Ocean',  mode:'dark', wp:'linear-gradient(158deg,#001524 0%,#002030 52%,#001018 100%)', accent:'#00C7BE',aRgb:'0,199,190',swatch:'#006d6b'},
  forest: {name:'Forest', mode:'dark', wp:'linear-gradient(158deg,#001209 0%,#002015 52%,#000d08 100%)', accent:'#30D158',aRgb:'48,209,88',swatch:'#1a6b2e'},
  sunset: {name:'Sunset', mode:'dark', wp:'linear-gradient(158deg,#1a0800 0%,#2a1200 52%,#150600 100%)', accent:'#FF9F0A',aRgb:'255,159,10',swatch:'#8b4f00'},
  rose:   {name:'Rose',   mode:'dark', wp:'linear-gradient(158deg,#1a0010 0%,#2a0020 52%,#150008 100%)', accent:'#FF375F',aRgb:'255,55,95',swatch:'#8b0030'},
  indigo: {name:'Indigo', mode:'dark', wp:'linear-gradient(158deg,#00081a 0%,#001030 52%,#000818 100%)', accent:'#0A84FF',aRgb:'10,132,255',swatch:'#003080'},
  warm:   {name:'Warm',   mode:'dark', wp:'linear-gradient(158deg,#12100d 0%,#1e1a14 52%,#0e0c08 100%)', accent:'#D2A55F',aRgb:'210,165,95',swatch:'#7a5c28'},
  lsilver:{name:'Silver', mode:'light',wp:'', accent:'#5856D6',aRgb:'88,86,214',swatch:'#c8c8d4',lightKey:''},
  livory: {name:'Ivory',  mode:'light',wp:'', accent:'#FF6B35',aRgb:'255,107,53',swatch:'#d4c4a8',lightKey:'warm'},
  lsky:   {name:'Sky',    mode:'light',wp:'', accent:'#007AFF',aRgb:'0,122,255',swatch:'#a8c4d4',lightKey:'sky'},
  lmint:  {name:'Mint',   mode:'light',wp:'', accent:'#34C759',aRgb:'52,199,89',swatch:'#a8d4b4',lightKey:'mint'},
  llilac: {name:'Lilac',  mode:'light',wp:'', accent:'#AF52DE',aRgb:'175,82,222',swatch:'#c4a8d4',lightKey:'lilac'},
  auto:   {name:'Auto',   mode:'auto', wp:'', accent:'#007AFF',aRgb:'0,122,255',swatch:'linear-gradient(135deg,#222 50%,#f2f2f0 50%)'},
};
window.applyTheme=function(key){
  var th=THEMES[key]||THEMES.dark;
  var html=document.documentElement;
  html.setAttribute('data-color-mode',th.mode);
  if(th.lightKey!==undefined) html.setAttribute('data-theme-light',th.lightKey||'');
  else html.removeAttribute('data-theme-light');
  html.style.setProperty('--accent',th.accent);
  html.style.setProperty('--accent-rgb',th.aRgb);
  var wp=document.getElementById('wp');
  if(wp&&!localStorage.getItem('wallpaper')&&th.mode==='dark'){
    wp.style.background=th.wp;
    wp.style.backgroundImage='';
    wp.classList.remove('img');
  }
  var meta=document.getElementById('theme-color-meta');
  if(meta) meta.content=th.mode==='light'?'#f0f0f5':'#000000';
  localStorage.setItem('theme',key);
  S.theme=key;
};

// ── CURRENCIES ─────────────────────────────────────────────────
const CURRENCY_LIST={
  CNY:{symbol:'¥',  name:'人民币 CNY',flag:'🇨🇳',dec:2},
  HKD:{symbol:'HK$',name:'港元 HKD',  flag:'🇭🇰',dec:2},
  KRW:{symbol:'₩',  name:'韩元 KRW',  flag:'🇰🇷',dec:0},
  JPY:{symbol:'¥',  name:'日元 JPY',  flag:'🇯🇵',dec:0},
  USD:{symbol:'$',  name:'美元 USD',  flag:'🇺🇸',dec:2},
  EUR:{symbol:'€',  name:'欧元 EUR',  flag:'🇪🇺',dec:2},
  TWD:{symbol:'NT$',name:'台币 TWD',  flag:'🇹🇼',dec:0},
  SGD:{symbol:'S$', name:'新加坡元',  flag:'🇸🇬',dec:2},
  THB:{symbol:'฿',  name:'泰铢 THB',  flag:'🇹🇭',dec:2},
  GBP:{symbol:'£',  name:'英镑 GBP',  flag:'🇬🇧',dec:2},
  AUD:{symbol:'A$', name:'澳元 AUD',  flag:'🇦🇺',dec:2},
  MYR:{symbol:'RM', name:'令吉 MYR',  flag:'🇲🇾',dec:2},
};
async function fetchRates(){
  try{
    var r=await fetch('https://open.er-api.com/v6/latest/'+S.baseCurrency);
    if(!r.ok) throw new Error('HTTP '+r.status);
    var d=await r.json();
    if(d.result==='success'){ S.rates=d.rates; S.fxBase=S.baseCurrency; S.fxDate=d.time_last_update_utc||''; localStorage.setItem('fxRates',JSON.stringify(S.rates)); localStorage.setItem('fxBase',S.fxBase); localStorage.setItem('fxDate',S.fxDate); return true; }
    return false;
  }catch(e){ console.warn('[FX]',e.message); return false; }
}
function getRate(from,to){ if(from===to) return 1; var r=S.rates,b=S.fxBase; if(!r||!Object.keys(r).length) return 1; if(from===b) return r[to]||1; if(to===b) return r[from]?1/r[from]:1; if(r[from]&&r[to]) return r[to]/r[from]; return 1; }
function fmtCurrency(amount,currency){ var c=CURRENCY_LIST[currency]||{symbol:currency,dec:2}; var n=c.dec===0?Math.round(amount):parseFloat(amount).toFixed(c.dec); return c.symbol+(c.dec===0?Number(n).toLocaleString():n); }
function toBase(amount,from){ return amount*getRate(from,S.baseCurrency); }

// ── REGION / QUICK APPS ─────────────────────────────────────────
const REGION_PRESETS={
  korea:  {name:'韩国',  detect:/首尔|釜山|济州|韩国|korea|seoul|busan|jeju/i,  apps:['navermap','kakaotaxi','baemin','klook','kkday','ctrip']},
  china:  {name:'中国内地',detect:/北京|上海|广州|深圳|成都|杭州|中国|china|beijing|shanghai/i,apps:['baidu','didi','meituan','fliggy','dianping','12306']},
  hk:     {name:'香港',  detect:/香港|hong kong|hk\b|hkg/i,                    apps:['googlemaps','uber','didi','foodpanda','octopus','mtr']},
  japan:  {name:'日本',  detect:/日本|东京|大阪|京都|北海道|japan|tokyo|osaka/i, apps:['googlemaps','tablecheck','klook','ctrip']},
  sea:    {name:'东南亚',detect:/泰国|曼谷|新加坡|马来西亚|越南|thailand|singapore/i,apps:['googlemaps','grab','foodpanda','agoda','klook','kkday']},
  default:{name:'默认',  detect:null,apps:['googlemaps','uber','ctrip','agoda','klook','kkday']},
};
const ALL_APPS={
  didi:      {label:'滴滴',      en:'DiDi',       scheme:'diditaxi://', web:'https://www.didiglobal.com',icon:'car'},
  baidu:     {label:'百度地图',  en:'Baidu Maps',  scheme:'baidumap://',  web:'https://map.baidu.com',     icon:'map'},
  meituan:   {label:'美团',      en:'Meituan',     scheme:'imeituan://',  web:'https://www.meituan.com',   icon:'food'},
  dianping:  {label:'大众点评',  en:'Dianping',    scheme:'dianping://',  web:'https://m.dianping.com',    icon:'food'},
  fliggy:    {label:'飞猪',      en:'Fliggy',      scheme:'taobao://',    web:'https://www.fliggy.com',    icon:'plane'},
  '12306':   {label:'12306',     en:'12306',       scheme:'cn.12306://',  web:'https://m.12306.cn',        icon:'train'},
  googlemaps:{label:'Google地图',en:'Google Maps', scheme:'comgooglemaps://',web:'https://maps.google.com',icon:'map'},
  uber:      {label:'Uber',      en:'Uber',        scheme:'uber://',      web:'https://m.uber.com',        icon:'car'},
  foodpanda: {label:'Foodpanda', en:'Foodpanda',   scheme:'foodpanda://', web:'https://www.foodpanda.com', icon:'food'},
  grab:      {label:'Grab',      en:'Grab',        scheme:'grab://',      web:'https://www.grab.com',      icon:'car'},
  agoda:     {label:'Agoda',     en:'Agoda',       scheme:'agoda://',     web:'https://www.agoda.com',     icon:'plane'},
  airbnb:    {label:'Airbnb',    en:'Airbnb',      scheme:'airbnb://',    web:'https://www.airbnb.com',    icon:'home'},
  klook:     {label:'Klook',     en:'Klook',       scheme:'klook://',     web:'https://www.klook.com',     icon:'bag'},
  kkday:     {label:'KKday',     en:'KKday',       scheme:'kkday://',     web:'https://www.kkday.com',     icon:'bag'},
  ctrip:     {label:'携程',      en:'Trip.com',    scheme:'ctrip://',     web:'https://www.trip.com',      icon:'plane'},
  navermap:  {label:'NAVER地图', en:'Naver Maps',  scheme:'nmap://',      web:'https://map.naver.com',     icon:'map'},
  kakaotaxi: {label:'Kakao T',   en:'Kakao T',     scheme:'kakaotaxi://',  web:'https://t.kakao.com',      icon:'car'},
  baemin:    {label:'배달의민족',en:'Baemin',      scheme:'baemin://',    web:'https://www.baemin.com',    icon:'food'},
  kakaopay:  {label:'KakaoPay',  en:'KakaoPay',    scheme:'kakaolink://', web:'https://kakaopay.com',      icon:'wallet'},
  mtr:       {label:'港铁',      en:'MTR',         scheme:'mtr://',       web:'https://www.mtr.com.hk',    icon:'train'},
  octopus:   {label:'八达通',    en:'Octopus',     scheme:'octopuscard://',web:'https://www.octopus.com.hk',icon:'wallet'},
  payme:     {label:'PayMe',     en:'PayMe',       scheme:'payme://',     web:'https://payme.hsbc.com.hk', icon:'wallet'},
  tablecheck:{label:'TableCheck',en:'TableCheck',  scheme:'tablecheck://',web:'https://www.tablecheck.com',icon:'food'},
  tripadvisor:{label:'猫途鹰',  en:'Tripadvisor', scheme:'tripadvisor://',web:'https://www.tripadvisor.com',icon:'globe'},
  wechat:    {label:'微信',      en:'WeChat',      scheme:'weixin://',    web:'https://weixin.qq.com',     icon:'msg'},
  whatsapp:  {label:'WhatsApp',  en:'WhatsApp',    scheme:'whatsapp://send?text=',web:'https://api.whatsapp.com/send?text=',icon:'msg'},
  alipay:    {label:'支付宝',    en:'Alipay',      scheme:'alipay://',    web:'https://www.alipay.com',    icon:'wallet'},
  alipayhk:  {label:'AlipayHK',  en:'AlipayHK',    scheme:'alipayhk://',  web:'https://www.alipayhk.com',  icon:'wallet'},
  xiaohongshu:{label:'小红书',   en:'RedNote',     scheme:'xhsdiscover://search?keyword=',web:'https://www.xiaohongshu.com/search_result?keyword=',icon:'xhs'},
};
const MSG_APPS=['wechat','whatsapp','alipay','alipayhk','payme'];
function getAppLabel(k){ var a=ALL_APPS[k]; if(!a) return k; return S.lang==='en'?a.en:a.label; }
function detectRegion(){ var nm=(S.trip&&S.trip.name)||''; for(var r in REGION_PRESETS){ if(REGION_PRESETS[r].detect&&REGION_PRESETS[r].detect.test(nm)) return r; } return 'default'; }
function getQuickApps(){ var c=S.customApps; if(c&&c.length>=2) return c.slice(0,8); var r=detectRegion(); return (REGION_PRESETS[r]||REGION_PRESETS.default).apps.slice(0,8); }

// ── XHS POOL ───────────────────────────────────────────────────
const XHS_POOL=[
  {kw:'首尔弘大必吃美食',label:'弘大美食',region:'korea'},
  {kw:'首尔东大门购物攻略',label:'东大门',region:'korea'},
  {kw:'仁川机场免税店必买',label:'机场免税',region:'korea'},
  {kw:'首尔汗蒸幕体验',label:'汗蒸幕',region:'korea'},
  {kw:'景福宫韩服体验',label:'韩服体验',region:'korea'},
  {kw:'东京新宿购物',label:'新宿购物',region:'japan'},
  {kw:'大阪道顿堀美食',label:'大阪美食',region:'japan'},
  {kw:'香港维多利亚港夜景',label:'港岛夜景',region:'hk'},
  {kw:'香港尖沙咀美食',label:'尖沙咀',region:'hk'},
  {kw:'曼谷夜市攻略',label:'曼谷夜市',region:'sea'},
  {kw:'上海外滩打卡',label:'上海外滩',region:'china'},
  {kw:'北京故宫游览',label:'北京故宫',region:'china'},
  {kw:'旅行穿搭防晒指南',label:'旅行穿搭',region:'all'},
  {kw:'旅行摄影构图技巧',label:'拍照技巧',region:'all'},
  {kw:'旅行必备用品清单',label:'旅行清单',region:'all'},
];
var _xhsOffset=0;
function getXHSRecs(){ var region=detectRegion(); var pool=XHS_POOL.filter(x=>x.region===region||x.region==='all'); if(!pool.length) pool=XHS_POOL; var r=[]; for(var i=0;i<Math.min(6,pool.length);i++) r.push(pool[(_xhsOffset+i)%pool.length]); return r; }
window.refreshXHS=function(){ _xhsOffset=(_xhsOffset+6)%XHS_POOL.length; renderHome(); };

// ── WEATHER SVG SYSTEM ──────────────────────────────────────────
const WX_PATHS={
  sun:'<circle cx="12" cy="12" r="4.5"/><path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>',
  cloudsun:'<path d="M12 3.5a4 4 0 014 4"/><path d="M16 7.5a6.5 6.5 0 11-6.8 7.5H5a3 3 0 010-6 .9.9 0 010-.18"/><path d="M12 3.5v-1.5M7.22 5.72l-1.07-1.07M5.5 10h-1.5"/>',
  cloud:'<path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z"/>',
  rain:'<path d="M20 16.58A5 5 0 0018 7h-1.26A8 8 0 104 15.25"/><path d="M8 19v3M12 17v3M16 19v3"/>',
  drizzle:'<path d="M20 16.58A5 5 0 0018 7h-1.26A8 8 0 104 15.25"/><path d="M9 20v2M13 18v2"/>',
  snow:'<path d="M20 17.58A5 5 0 0018 8h-1.26A8 8 0 104 15.25"/><path d="M12 12v8M9 18l3-2 3 2M9 14l3 2 3-2"/>',
  thunder:'<path d="M19 16.9A5 5 0 0018 7h-1.26A8 8 0 104 15.25"/><polyline points="13 11 9 17 13 17 9 23"/>',
  fog:'<path d="M3 10h18M3 14h18M5 18h14M5 6h14"/>',
  wind:'<path d="M9.59 4.59A2 2 0 1111 8H2m10.59 11.41A2 2 0 1014 16H2m15.73-8.27A2.5 2.5 0 1119.5 12H2"/>',
};
const WMO_KEY={0:'sun',1:'sun',2:'cloudsun',3:'cloud',45:'fog',48:'fog',51:'drizzle',53:'drizzle',55:'rain',61:'rain',63:'rain',65:'rain',66:'snow',67:'snow',71:'snow',73:'snow',75:'snow',80:'rain',81:'rain',82:'rain',85:'snow',86:'snow',95:'thunder',96:'thunder',99:'thunder'};
const WX_COLORS={sun:'#FF9F0A',cloudsun:'#FF9F0A',cloud:'var(--t2)',rain:'#0A84FF',drizzle:'#60A0FF',snow:'#64D2FF',thunder:'#FF9F0A',fog:'var(--t3)',wind:'var(--t2)'};
function wxSvg(code,size){ var k=WMO_KEY[code]||'sun'; var p=WX_PATHS[k]; var col=WX_COLORS[k]||'var(--t2)'; return '<svg width="'+(size||20)+'" height="'+(size||20)+'" viewBox="0 0 24 24" fill="none" stroke="'+col+'" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+p+'</svg>'; }
const WMO_DESC={zh:{0:'晴朗',1:'基本晴',2:'部分多云',3:'阴天',45:'有雾',51:'毛毛雨',53:'小雨',55:'中雨',61:'小雨',63:'中雨',65:'大雨',71:'小雪',73:'中雪',80:'阵雨',95:'雷阵雨'},en:{0:'Clear',1:'Mainly clear',2:'Partly cloudy',3:'Overcast',45:'Fog',61:'Light rain',63:'Moderate rain',65:'Heavy rain',71:'Light snow',80:'Showers',95:'Thunderstorm'}};
function wxDesc(code){ var m=S.lang==='en'?WMO_DESC.en:WMO_DESC.zh; return m[code]||m[0]; }

// Clothing
const CLOTH_SVG={
  jacket:'<path d="M20 21v-8a2 2 0 00-.78-1.58L14 7l-2 2-2-2-5.22 4.42A2 2 0 004 13v8h4v-6h8v6z"/>',
  tshirt:'<path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.57a1 1 0 00.99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.57a2 2 0 00-1.34-2.23z"/>',
  umbrella:'<path d="M23 12a11.05 11.05 0 00-22 0zm-5 7a3 3 0 01-6 0v-7"/>',
  sunhat:'<ellipse cx="12" cy="10" rx="10" ry="3"/><path d="M12 10v4M8 17c0 1.66 2.24 3 5 3s5-1.34 5-3"/>',
  gloves:'<path d="M18 11V6a2 2 0 00-4 0v5M14 10V4a2 2 0 00-4 0v6M10 10.5V6a2 2 0 00-4 0v8a6 6 0 0012 0v-3a2 2 0 00-4 0"/>',
  scarf:'<path d="M4 6c0 0 2-2 8-2s8 2 8 2v6c0 2-3 4-8 4S4 14 4 12V6z"/><path d="M12 16v6"/>',
  sunscreen:'<rect x="8" y="2" width="8" height="20" rx="2"/><path d="M8 10h8M8 14h8"/>',
  boot:'<path d="M4 16v3a2 2 0 002 2h12a2 2 0 002-2v-1H10v-2l-2-8V4a1 1 0 011-1h5a1 1 0 011 1v7h4"/>',
};
function clothSvg(k,sz){ sz=sz||13; return '<svg width="'+sz+'" height="'+sz+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+(CLOTH_SVG[k]||CLOTH_SVG.tshirt)+'</svg>'; }
function getClothingRecs(tMax,tMin,precip,wind){
  var avg=(tMax+tMin)/2,en=S.lang==='en',recs=[];
  if(avg<0)    recs=[['jacket',en?'Heavy down':'厚羽绒服'],['gloves',en?'Gloves+scarf':'手套围巾'],['boot',en?'Winter boots':'保暖靴']];
  else if(avg<8) recs=[['jacket',en?'Down jacket':'羽绒服'],['gloves',en?'Gloves':'手套'],['scarf',en?'Scarf':'围巾']];
  else if(avg<14) recs=[['jacket',en?'Heavy coat':'厚外套'],['scarf',en?'Light scarf':'薄围巾']];
  else if(avg<20) recs=[['jacket',en?'Light jacket':'薄外套'],['tshirt',en?'Long sleeve':'长袖']];
  else if(avg<26) recs=[['tshirt',en?'T-shirt':'T恤'],['jacket',en?'Evening layer':'晚上备外套']];
  else            recs=[['tshirt',en?'Light top':'短袖'],['sunhat',en?'Sun hat':'防晒帽'],['sunscreen',en?'SPF50+':'防晒霜']];
  if(precip>40) recs.push(['umbrella',en?'Umbrella':'雨伞']);
  if(wind>30)   recs.push(['jacket',en?'Windbreaker':'防风外套']);
  return recs.slice(0,5);
}
async function fetchWeather(){ if(!S.geo) return; try{ var url='https://api.open-meteo.com/v1/forecast?latitude='+S.geo.lat+'&longitude='+S.geo.lon+'&current=temperature_2m,weathercode,windspeed_10m,relative_humidity_2m&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_mean,weathercode&timezone=auto&forecast_days=4&wind_speed_unit=kmh'; var r=await fetch(url); if(!r.ok) throw new Error('HTTP '+r.status); S.weather=await r.json(); localStorage.setItem('wxCache',JSON.stringify({data:S.weather,ts:Date.now()})); if(S.tab==='home') renderHome(); }catch(e){ console.warn('[WX]',e.message); } }
window.reqGeoWeather=function(){ requestGeo(); setTimeout(function(){ if(S.geo) fetchWeather(); else toast(t('noGeo')); },1200); };

// ── I18N ────────────────────────────────────────────────────────
const LANGS={
'zh-CN':{
  brand:'Travoo',sub:'和朋友一起记录每趟旅行',join:'加入行程',create:'创建新行程',or:'或',yourName:'你的名字',namePh:'名字',codePh:'6位行程码',
  myTrips:'我的行程',newTrip:'新建行程',today:'今天',itin:'行程',exp:'花费',ai:'管家',set:'设置',
  qa:'快捷操作',smRec:'智能提醒',xhs:'小红书',
  total:'总花费',myPaid:'我付款',cnt:'笔数',detail:'明细',settle:'结算',
  code:'行程码',members:'成员',aiCfg:'AI 配置',notif:'通知',about:'关于',leave:'退出行程',
  copy:'复制',share:'分享',lang:'语言',wp:'壁纸',themes:'主题',
  food:'餐饮',transport:'交通',attr:'景点',act:'活动',other:'其他',
  save:'保存',del:'删除',cancel:'取消',
  aiPh:'问我任何旅行问题…',aiWelcome:'Travoo 管家',aiWelcomeSub:'餐厅推荐、景点攻略、打车方式\n花费分析，随时为你解答',
  noExp:'暂无记录',noExpSub:'点击添加花费',paidBy:'付款人',splitW:'分摊成员',
  amount:'金额',desc:'描述',cat:'分类',date:'日期',
  apiEp:'API 端点',apiKey:'API Key',model:'模型',saveCfg:'保存配置',
  tokBudget:'Token 预算/次',tokUsed:'已用 Token',
  noCfg:'请先配置 AI',noCfgSub:'在设置中填入 API 端点和 Key',cfgAI:'去配置',
  msgApp:'消息应用',arrived:'我到了！',voiceHint:'按住说话',listening:'聆听中…',
  editItem:'编辑',addItem:'添加项目',todayTimeline:'今日行程',
  locationAllow:'允许位置',addExpense:'记录花费',
  offlineNote:'离线模式 — 需配置 Firebase 实现云端同步',
  codeShare:'分享此行程码给朋友加入',free:'免费',you:'你',viewFull:'查看完整行程',
  settled:'已结清',settledSub:'无待结算款项',addMember:'添加成员',logExp:'记账',
  importXlsx:'导入 Excel (.xlsx)',pasteImport:'粘贴文字导入',
  invite:'邀请',nMembers:'名成员',confirmDelItem:'确认删除此项目？',
  chatSug1:'今天有什么推荐',chatSug2:'附近怎么打车',chatSug3:'景点拍照技巧',chatSug4:'今日花费分析',chatSug5:'提醒我准时出发',
  pickFromAlbum:'从相册选取',resetDefault:'重置默认',clearChat:'清除对话',
  version:'版本',connected:'已连接',localMode:'本地模式',
  confirmLeaveTitle:'退出行程',confirmLeaveMsg:'退出后需重新输入行程码',confirmLeaveBtn:'确认退出',
  addMemberTitle:'添加成员',addMemberPh:'名字',
  timeLabel:'时间',actNameLabel:'活动名称',transLabel:'交通方式',
  spendMinLabel:'预计花费最低',spendMaxLabel:'预计花费最高',
  noteLabel:'备注/提醒',importantLabel:'重要行程',mustOnTime:'必须准时',
  addNewDay:'添加新一天',tripInfoTitle:'行程信息',tripNameLabel:'行程名称',dateRangeLabel:'日期范围',
  importDataLabel:'导入行程',importHint:'支持 Excel (.xlsx) 或粘贴表格文字',
  importHint2:'★ 推荐：Excel 全选复制粘贴，或直接导入 .xlsx',
  pasteImportTitle:'粘贴行程文字',pasteHint:'支持格式：\n① Excel 全选复制粘贴\n② 每行：2000/1/1 08:00 晚餐\n③ 日期行 + 活动行',
  aiImgImport:'图片识别 (AI)',aiImgHint:'配置 AI 后可使用',
  wallUpdated:'壁纸已更新',wallReset:'壁纸已重置',imgTooLarge:'图片过大',
  codeCopied:'行程码已复制',aiConfigSaved:'AI 配置已保存',chatCleared:'对话已清除',
  recognizing:'AI 识别中...',recognizeOk:'识别成功，请确认',recognizeFail:'识别失败',
  logged:'已记录',deleted:'已删除',importOk:'导入成功',importFail:'解析失败',addedDay:'已添加',
  transferTo:'转给',relatedApps:'相关应用',askAIBtn:'询问管家',
  notPlanned:'未有行程',countdown:'出发倒计时',tripEnded:'旅程已结束',
  loginTitle:'设备同步',history:'历史行程',editAvatar:'换头像',editNickname:'改昵称',
  xhsRefresh:'换一批',editDayTitle:'修改标题',butlerName:'Travoo 管家',
  currency:'货币',baseCurrency:'主货币（结算）',localCurrency:'旅行货币',
  rate:'汇率',rateDate:'更新时间',refreshRate:'刷新汇率',
  rateUnavailable:'汇率未加载',expCurrency:'货币',rateInfo:'换算',
  appearance:'外观与显示',appearanceDesc:'主题 · 语言 · 壁纸',
  deviceSync:'设备同步',deviceSyncDesc:'通过行程码在任意设备访问',deviceId:'设备 ID',
  confirmClearChat:'确认清除所有对话？',confirmClearChatSub:'此操作不可撤销',clearChatConfirmBtn:'确认清除',
  lists:'清单',shopping:'购物清单',todo:'待办事项',packing:'行李打包',
  addListItem:'添加项目',listPre:'出发前',listDuring:'旅行中',listPost:'回来后',
  packingAuto:'智能推荐',packingClothes:'衣物',packingDocs:'证件',packingElectronics:'电子',packingToiletries:'洗漱',
  period:'生理期',periodLastDate:'上次日期',periodCycleLen:'周期天数(默认28)',periodDuration:'持续天数(默认5)',
  periodAdd:'添加记录',periodConflict:'生理期可能与旅行重叠',periodPacking:'生理期提醒：备卫生棉/止痛药',
  customApps:'自定义应用',customAppsDesc:'选择主页显示的应用（最多8个）',regionDetected:'目的地推荐',
  exportData:'导出数据',importData:'导入数据',exportDesc:'导出 JSON 文件备份',importDesc:'选择之前导出的 JSON',importSuccess:'导入成功',
  markPaid:'标记已付',payVia:'通过',moveUp:'向前移',moveDown:'向后移',
  aiFeatures:'AI 功能',aiForPacking:'AI 打包推荐',aiForRecs:'AI 智能提醒',aiForImport:'AI 行程导入',
  notConfigured:'未配置',importNote:'点击导入或添加行程',
  noGeo:'请先允许位置权限',localWeather:'当地天气',
  // Travel docs
  travelDocs:'机票酒店',addFlight:'添加航班',addHotel:'添加酒店',addTrain:'添加火车',
  flightNo:'航班号',airline:'航空公司',from:'出发',to:'到达',depart:'出发时间',arrive:'到达时间',terminal:'航站楼',seat:'座位',
  hotelName:'酒店名称',address:'地址',checkIn:'入住日期',checkOut:'退房日期',confirmNo:'预订号',room:'房间',
  docType:'类型',flight:'航班',hotel:'酒店',train:'火车',ferry:'渡轮',
  noTravelDocs:'还没有机票/酒店信息',addFirst:'点击 + 添加',
  showAll:'全部',myOnly:'仅我的',
  // Journal
  journal:'旅行手账',journalToday:'今日手账',writeNote:'写点什么…',noJournal:'还没有手账记录',
  journalPrompt:'记录今天的旅行故事',newEntry:'新建记录',saveEntry:'保存',
  mood:'心情',moodGreat:'很棒',moodGood:'不错',moodOk:'一般',moodBad:'不好',moodAwful:'糟糕',
  private:'仅自己可见',shared:'所有人可见',visibility:'可见性',
  addPhoto:'添加照片',
  // Photo board
  photoBoard:'旅行相册',noPhotos:'还没有照片',addPhotoBoard:'添加照片',
  photoCat:'分类',catLandscape:'风景',catFood:'美食',catArchitecture:'建筑',
  catPeople:'人物',catTransport:'交通',catMisc:'其他',
  // Settings groups
  setAccount:'账户与成员',setAppearance:'外观',setTravel:'旅行设置',setData:'数据与同步',setAbout:'关于',
  // Expense
  fromCamera:'拍照',fromAlbum:'相册',
},
'zh-TW':{
  brand:'Travoo',sub:'和朋友一起記錄每趟旅行',join:'加入行程',create:'建立新行程',or:'或',yourName:'你的名字',namePh:'名字',codePh:'6位行程碼',
  myTrips:'我的行程',newTrip:'新建行程',today:'今天',itin:'行程',exp:'花費',ai:'管家',set:'設定',
  qa:'快捷操作',smRec:'智慧提醒',xhs:'小紅書',
  total:'總花費',myPaid:'我付款',cnt:'筆數',detail:'明細',settle:'結算',
  code:'行程碼',members:'成員',aiCfg:'AI 設定',notif:'通知',about:'關於',leave:'退出行程',
  copy:'複製',share:'分享',lang:'語言',wp:'桌布',themes:'主題',
  food:'餐飲',transport:'交通',attr:'景點',act:'活動',other:'其他',
  save:'儲存',del:'刪除',cancel:'取消',
  aiPh:'問我任何旅遊問題…',aiWelcome:'Travoo 管家',aiWelcomeSub:'餐廳推薦、景點攻略、叫車方式\n花費分析，隨時為你解答',
  noExp:'暫無記錄',noExpSub:'點擊添加花費',paidBy:'付款人',splitW:'分攤成員',
  amount:'金額',desc:'描述',cat:'分類',date:'日期',
  apiEp:'API 端點',apiKey:'API Key',model:'模型',saveCfg:'儲存設定',
  tokBudget:'Token 預算/次',tokUsed:'已用 Token',
  noCfg:'請先設定 AI',noCfgSub:'在設定中填入 API 端點和 Key',cfgAI:'去設定',
  msgApp:'訊息應用',arrived:'我到了！',voiceHint:'按住說話',listening:'聆聽中…',
  editItem:'編輯',addItem:'新增項目',todayTimeline:'今日行程',
  locationAllow:'允許位置',addExpense:'記錄花費',
  offlineNote:'離線模式 — 需配置 Firebase',
  codeShare:'分享此行程碼給朋友加入',free:'免費',you:'你',viewFull:'查看完整行程',
  settled:'已結清',settledSub:'無待結算款項',addMember:'添加成員',logExp:'記帳',
  importXlsx:'匯入 Excel (.xlsx)',pasteImport:'貼上文字匯入',
  invite:'邀請',nMembers:'名成員',confirmDelItem:'確認刪除此項目？',
  chatSug1:'今天有什麼推薦',chatSug2:'附近怎麼叫車',chatSug3:'景點拍照技巧',chatSug4:'今日花費分析',chatSug5:'提醒我準時出發',
  pickFromAlbum:'從相冊選取',resetDefault:'重置預設',clearChat:'清除對話',
  version:'版本',connected:'已連接',localMode:'本地模式',
  confirmLeaveTitle:'退出行程',confirmLeaveMsg:'退出後需重新輸入行程碼',confirmLeaveBtn:'確認退出',
  addMemberTitle:'添加成員',addMemberPh:'名字',
  timeLabel:'時間',actNameLabel:'活動名稱',transLabel:'交通方式',
  spendMinLabel:'預計花費最低',spendMaxLabel:'預計花費最高',
  noteLabel:'備注/提醒',importantLabel:'重要行程',mustOnTime:'必須準時',
  addNewDay:'添加新一天',tripInfoTitle:'行程資訊',tripNameLabel:'行程名稱',dateRangeLabel:'日期範圍',
  importDataLabel:'匯入行程',importHint:'支援 Excel (.xlsx) 或貼上表格文字',
  importHint2:'★ 推薦：Excel 全選複製貼上',
  pasteImportTitle:'貼上行程文字',pasteHint:'支援格式：\n① Excel 全選複製貼上\n② 每行：2000/1/1 08:00 晚餐',
  aiImgImport:'圖片識別 (AI)',aiImgHint:'設定 AI 後可使用',
  wallUpdated:'桌布已更新',wallReset:'已重置桌布',imgTooLarge:'圖片過大',
  codeCopied:'行程碼已複製',aiConfigSaved:'AI 設定已儲存',chatCleared:'對話已清除',
  recognizing:'AI 識別中...',recognizeOk:'識別成功，請確認',recognizeFail:'識別失敗',
  logged:'已記錄',deleted:'已刪除',importOk:'匯入成功',importFail:'解析失敗',addedDay:'已添加',
  transferTo:'轉給',relatedApps:'相關應用',askAIBtn:'詢問管家',
  notPlanned:'未有行程',countdown:'出發倒數',tripEnded:'旅程已結束',
  loginTitle:'設備同步',history:'歷史行程',editAvatar:'換頭像',editNickname:'改暱稱',
  xhsRefresh:'換一批',editDayTitle:'修改標題',butlerName:'Travoo 管家',
  currency:'貨幣',baseCurrency:'主貨幣（結算）',localCurrency:'旅行貨幣',
  rate:'匯率',rateDate:'更新時間',refreshRate:'重新整理匯率',
  rateUnavailable:'匯率未載入',expCurrency:'貨幣',rateInfo:'換算',
  appearance:'外觀與顯示',appearanceDesc:'主題 · 語言 · 桌布',
  deviceSync:'設備同步',deviceSyncDesc:'透過行程碼在任意設備訪問',deviceId:'設備 ID',
  confirmClearChat:'確認清除所有對話？',confirmClearChatSub:'此操作不可撤銷',clearChatConfirmBtn:'確認清除',
  lists:'清單',shopping:'購物清單',todo:'待辦事項',packing:'行李打包',
  addListItem:'添加項目',listPre:'出發前',listDuring:'旅行中',listPost:'回來後',
  packingAuto:'智慧推薦',packingClothes:'衣物',packingDocs:'證件',packingElectronics:'電子',packingToiletries:'盥洗',
  period:'生理期',periodLastDate:'上次日期',periodCycleLen:'週期天數(預設28)',periodDuration:'持續天數(預設5)',
  periodAdd:'添加記錄',periodConflict:'生理期可能與旅行重疊',periodPacking:'生理期提醒：備衛生棉/止痛藥',
  customApps:'自訂應用',customAppsDesc:'選擇主頁顯示的應用（最多8個）',regionDetected:'目的地推薦',
  exportData:'匯出資料',importData:'匯入資料',exportDesc:'匯出 JSON 備份',importDesc:'選擇之前匯出的 JSON',importSuccess:'匯入成功',
  markPaid:'標記已付',payVia:'透過',moveUp:'向前移',moveDown:'向後移',
  aiFeatures:'AI 功能',aiForPacking:'AI 打包推薦',aiForRecs:'AI 智慧提醒',aiForImport:'AI 行程導入',
  notConfigured:'未配置',importNote:'點擊導入或添加行程',
  noGeo:'請先允許位置權限',localWeather:'當地天氣',
  travelDocs:'機票酒店',addFlight:'添加航班',addHotel:'添加酒店',addTrain:'添加火車',
  flightNo:'航班號',airline:'航空公司',from:'出發',to:'到達',depart:'出發時間',arrive:'到達時間',terminal:'航站樓',seat:'座位',
  hotelName:'酒店名稱',address:'地址',checkIn:'入住日期',checkOut:'退房日期',confirmNo:'預訂號',room:'房間',
  docType:'類型',flight:'航班',hotel:'酒店',train:'火車',ferry:'渡輪',
  noTravelDocs:'還沒有機票/酒店資訊',addFirst:'點擊 + 添加',
  showAll:'全部',myOnly:'僅我的',
  journal:'旅行手帳',journalToday:'今日手帳',writeNote:'寫點什麼…',noJournal:'還沒有手帳記錄',
  journalPrompt:'記錄今天的旅行故事',newEntry:'新建記錄',saveEntry:'儲存',
  mood:'心情',moodGreat:'很棒',moodGood:'不錯',moodOk:'一般',moodBad:'不好',moodAwful:'糟糕',
  private:'僅自己可見',shared:'所有人可見',visibility:'可見性',
  addPhoto:'添加照片',
  photoBoard:'旅行相册',noPhotos:'還沒有照片',addPhotoBoard:'添加照片',
  photoCat:'分類',catLandscape:'風景',catFood:'美食',catArchitecture:'建築',catPeople:'人物',catTransport:'交通',catMisc:'其他',
  setAccount:'帳號與成員',setAppearance:'外觀',setTravel:'旅行設定',setData:'資料與同步',setAbout:'關於',
  fromCamera:'拍照',fromAlbum:'相冊',
},
'en':{
  brand:'Travoo',sub:'Plan, track & share every journey',join:'Join Trip',create:'Create New Trip',or:'or',yourName:'Your name',namePh:'Name',codePh:'6-character code',
  myTrips:'My Trips',newTrip:'New Trip',today:'Today',itin:'Itinerary',exp:'Expenses',ai:'Butler',set:'Settings',
  qa:'Quick Actions',smRec:'Smart Tips',xhs:'RedNote',
  total:'Total',myPaid:'I Paid',cnt:'Items',detail:'Details',settle:'Settle Up',
  code:'Trip Code',members:'Members',aiCfg:'AI Config',notif:'Notifications',about:'About',leave:'Leave Trip',
  copy:'Copy',share:'Share',lang:'Language',wp:'Wallpaper',themes:'Theme',
  food:'Food',transport:'Transport',attr:'Attraction',act:'Activity',other:'Other',
  save:'Save',del:'Delete',cancel:'Cancel',
  aiPh:'Ask me anything about this trip…',aiWelcome:'Travoo Butler',aiWelcomeSub:'Ask about restaurants, attractions,\ntransport, expenses and more',
  noExp:'No expenses yet',noExpSub:'Tap to add an expense',paidBy:'Paid by',splitW:'Split with',
  amount:'Amount',desc:'Description',cat:'Category',date:'Date',
  apiEp:'API Endpoint',apiKey:'API Key',model:'Model',saveCfg:'Save Config',
  tokBudget:'Token budget/msg',tokUsed:'Tokens used',
  noCfg:'AI Not Configured',noCfgSub:'Add your API endpoint and key in Settings',cfgAI:'Configure',
  msgApp:'Messaging App',arrived:"I've arrived!",voiceHint:'Hold to speak',listening:'Listening…',
  editItem:'Edit',addItem:'Add Item',todayTimeline:"Today's Plan",
  locationAllow:'Allow Location',addExpense:'Log Expense',
  offlineNote:'Offline — configure Firebase for cloud sync',
  codeShare:'Share this code with friends to join',free:'Free',you:'You',viewFull:'Full Itinerary',
  settled:'All Settled',settledSub:'No pending payments',addMember:'Add Member',logExp:'Log',
  importXlsx:'Import Excel (.xlsx)',pasteImport:'Paste Text',
  invite:'Invite',nMembers:'members',confirmDelItem:'Delete this item?',
  chatSug1:"What's on today",chatSug2:'How to get a taxi',chatSug3:'Photo tips',chatSug4:'Expense summary',chatSug5:'Remind me to depart',
  pickFromAlbum:'Pick from Album',resetDefault:'Reset',clearChat:'Clear Chat',
  version:'Version',connected:'Connected',localMode:'Local Mode',
  confirmLeaveTitle:'Leave Trip',confirmLeaveMsg:"You'll need the code to rejoin",confirmLeaveBtn:'Leave',
  addMemberTitle:'Add Member',addMemberPh:'Name',
  timeLabel:'Time',actNameLabel:'Activity',transLabel:'Transport (optional)',
  spendMinLabel:'Min Spend',spendMaxLabel:'Max Spend',
  noteLabel:'Notes',importantLabel:'Highlight',mustOnTime:'Must be on time',
  addNewDay:'Add Day',tripInfoTitle:'Trip Info',tripNameLabel:'Trip Name',dateRangeLabel:'Dates',
  importDataLabel:'Import',importHint:'Import Excel (.xlsx) or paste text',importHint2:'★ Recommended: Copy all from Excel and paste',
  pasteImportTitle:'Paste Itinerary',pasteHint:'Supported:\n① Copy all from Excel\n② Per line: 2000/1/1 08:00 Dinner',
  aiImgImport:'Image AI Import',aiImgHint:'Configure AI first',
  wallUpdated:'Wallpaper updated',wallReset:'Wallpaper reset',imgTooLarge:'Image too large',
  codeCopied:'Code copied',aiConfigSaved:'AI config saved',chatCleared:'Chat cleared',
  recognizing:'Recognizing...',recognizeOk:'Recognized, please confirm',recognizeFail:'Recognition failed',
  logged:'Logged',deleted:'Deleted',importOk:'Imported',importFail:'Parse failed',addedDay:'Added',
  transferTo:'pays',relatedApps:'Apps',askAIBtn:'Ask Butler',
  notPlanned:'Not Planned',countdown:'Countdown',tripEnded:'Trip Ended',
  loginTitle:'Device Sync',history:'Trip History',editAvatar:'Change Photo',editNickname:'Edit Name',
  xhsRefresh:'Refresh',editDayTitle:'Edit Title',butlerName:'Travoo Butler',
  currency:'Currency',baseCurrency:'Home Currency',localCurrency:'Trip Currency',
  rate:'Rate',rateDate:'Updated',refreshRate:'Refresh',
  rateUnavailable:'Rate unavailable',expCurrency:'Currency',rateInfo:'Converted',
  appearance:'Appearance',appearanceDesc:'Theme · Language · Wallpaper',
  deviceSync:'Device Sync',deviceSyncDesc:'Access trip data on any device',deviceId:'Device ID',
  confirmClearChat:'Clear all messages?',confirmClearChatSub:'Cannot be undone',clearChatConfirmBtn:'Clear',
  lists:'Lists',shopping:'Shopping',todo:'To-Do',packing:'Packing',
  addListItem:'Add item',listPre:'Before trip',listDuring:'During trip',listPost:'After trip',
  packingAuto:'Smart Suggestions',packingClothes:'Clothing',packingDocs:'Documents',packingElectronics:'Electronics',packingToiletries:'Toiletries',
  period:'Period Tracker',periodLastDate:'Last period date',periodCycleLen:'Cycle (default 28)',periodDuration:'Duration (default 5)',
  periodAdd:'Add Record',periodConflict:'Period may overlap with your trip',periodPacking:'Period reminder: pack pads/painkillers',
  customApps:'Quick Apps',customAppsDesc:'Choose apps shown on home (max 8)',regionDetected:'Recommended for destination',
  exportData:'Export',importData:'Import',exportDesc:'Export JSON backup',importDesc:'Select previously exported JSON',importSuccess:'Imported',
  markPaid:'Mark Paid',payVia:'Pay via',moveUp:'Move Earlier',moveDown:'Move Later',
  aiFeatures:'AI Features',aiForPacking:'AI Packing',aiForRecs:'AI Tips',aiForImport:'AI Import',
  notConfigured:'Not set',importNote:'Tap to import or add itinerary',
  noGeo:'Allow location first',localWeather:'Local Weather',
  travelDocs:'Flights & Hotels',addFlight:'Add Flight',addHotel:'Add Hotel',addTrain:'Add Train',
  flightNo:'Flight No.',airline:'Airline',from:'From',to:'To',depart:'Depart',arrive:'Arrive',terminal:'Terminal',seat:'Seat',
  hotelName:'Hotel Name',address:'Address',checkIn:'Check-in',checkOut:'Check-out',confirmNo:'Booking Ref',room:'Room',
  docType:'Type',flight:'Flight',hotel:'Hotel',train:'Train',ferry:'Ferry',
  noTravelDocs:'No flight/hotel info yet',addFirst:'Tap + to add',
  showAll:'All',myOnly:'Mine only',
  journal:'Journal',journalToday:"Today's Journal",writeNote:'Write something…',noJournal:'No journal entries yet',
  journalPrompt:"Record today's travel story",newEntry:'New Entry',saveEntry:'Save',
  mood:'Mood',moodGreat:'Great',moodGood:'Good',moodOk:'OK',moodBad:'Bad',moodAwful:'Awful',
  private:'Only me',shared:'Everyone',visibility:'Visibility',
  addPhoto:'Add Photo',
  photoBoard:'Photo Board',noPhotos:'No photos yet',addPhotoBoard:'Add Photo',
  photoCat:'Category',catLandscape:'Landscape',catFood:'Food',catArchitecture:'Architecture',catPeople:'People',catTransport:'Transport',catMisc:'Misc',
  setAccount:'Account & Members',setAppearance:'Appearance',setTravel:'Travel Settings',setData:'Data & Sync',setAbout:'About',
  fromCamera:'Camera',fromAlbum:'Album',
},
};
function t(k){ return (LANGS[S.lang]||LANGS['zh-CN'])[k]||k; }

// ── STATE ───────────────────────────────────────────────────────
const S={
  lang:         localStorage.getItem('lang')         ||'zh-CN',
  tripCode:     localStorage.getItem('tripCode')     ||null,
  memberId:     localStorage.getItem('memberId')     ||null,
  memberName:   localStorage.getItem('memberName')   ||null,
  trip:null,members:{},expenses:[],chatHistory:[],
  aiConfig:     JSON.parse(localStorage.getItem('aiConfig')    ||'{}'),
  tab:'home',unsubs:[],geo:null,
  tokenUsed:    +(localStorage.getItem('tokenUsed')  ||0),
  tokenBudget:  +(localStorage.getItem('tokenBudget')||4000),
  msgApp:       localStorage.getItem('msgApp')       ||'wechat',
  localTrips:   JSON.parse(localStorage.getItem('localTrips')  ||'[]'),
  theme:        localStorage.getItem('theme')        ||'dark',
  avatars:      JSON.parse(localStorage.getItem('memberAvatars')||'{}'),
  baseCurrency: localStorage.getItem('baseCurrency') ||'HKD',
  localCurrency:localStorage.getItem('localCurrency')||'KRW',
  rates:        JSON.parse(localStorage.getItem('fxRates')     ||'{}'),
  fxBase:       localStorage.getItem('fxBase')       ||'HKD',
  fxDate:       localStorage.getItem('fxDate')       ||'',
  weather:null,
  customApps:   JSON.parse(localStorage.getItem('customApps')  ||'null'),
  shoppingList: JSON.parse(localStorage.getItem('shoppingList')||'[]'),
  todoList:     JSON.parse(localStorage.getItem('todoList')    ||'{"pre":[],"during":[],"post":[]}'),
  packingList:  JSON.parse(localStorage.getItem('packingList') ||'{}'),
  periodData:   JSON.parse(localStorage.getItem('periodData')  ||'{"records":[],"cycleLen":28,"duration":5}'),
  settledRows:  JSON.parse(localStorage.getItem('settledRows') ||'{}'),
  aiToggles:    JSON.parse(localStorage.getItem('aiToggles')   ||'{"packing":true,"recs":true,"import":true}'),
  paymentApp:   localStorage.getItem('paymentApp')   ||'wechat',
  travelDocs:[],
  journal:[],
  photoBoard:[],
  _listsPane:'shopping',
  _journalTab:'today',
};
// Load weather cache
(function(){ var wc=localStorage.getItem('wxCache'); if(wc){ try{ var p=JSON.parse(wc); if(Date.now()-p.ts<3600000) S.weather=p.data; }catch(e){} } })();

const COLORS=['#0A84FF','#FF453A','#30D158','#FF9F0A','#BF5AF2','#FF375F','#00C7BE','#FF6B35'];
const CAT_COLORS={food:'#FF9F0A',transport:'#0A84FF',attr:'#30D158',act:'#BF5AF2',other:'#8E8E93'};

// ── ICONS ───────────────────────────────────────────────────────
const IC={
  home:    '<path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z"/><path d="M9 21V12h6v9"/>',
  cal:     '<rect x="3" y="4" width="18" height="18" rx="3"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  wallet:  '<path d="M21 12H15a2 2 0 000 4h6V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2v-4z"/>',
  chat:    '<path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>',
  cog:     '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33A1.65 1.65 0 0014 21v.09a2 2 0 01-4 0V21a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>',
  plus:    '<path d="M12 5v14M5 12h14"/>',
  chev:    '<path d="M9 18l6-6-6-6"/>',
  send:    '<polygon points="22 2 15 22 11 13 2 9 22 2"/>',
  mic:     '<rect x="9" y="2" width="6" height="11" rx="3"/><path d="M5 10v2a7 7 0 0014 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>',
  car:     '<path d="M5 11l1.5-4.5h11L19 11M3 17h2v2h2v-2h10v2h2v-2h2v-6H3v6z"/><circle cx="7" cy="14.5" r="1.5"/><circle cx="17" cy="14.5" r="1.5"/>',
  map:     '<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/>',
  food:    '<path d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/><path d="M6 2v6M10 2v6M14 2v6"/>',
  plane:   '<path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>',
  train:   '<rect x="4" y="2" width="16" height="17" rx="3"/><path d="M4 11h16M9 19l-1 3M15 19l1 3"/><circle cx="9" cy="15" r="1"/><circle cx="15" cy="15" r="1"/>',
  copy:    '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>',
  share:   '<path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"/>',
  user:    '<path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  bell:    '<path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>',
  trash:   '<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>',
  edit:    '<path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4z"/>',
  camera:  '<path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/>',
  check:   '<polyline points="20 6 9 17 4 12"/>',
  xhs:     '<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M9 12h6M12 9v6"/>',
  img:     '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>',
  globe:   '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/>',
  msg:     '<path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>',
  bag:     '<path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>',
  xlsx:    '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/>',
  refresh: '<path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>',
  palette: '<path d="M12 2a10 10 0 100 20c1.1 0 2-.9 2-2v-.5c0-.83.67-1.5 1.5-1.5H17a3 3 0 003-3 8 8 0 00-8-8z"/><circle cx="8" cy="10" r="1.5" fill="currentColor"/><circle cx="11" cy="7" r="1.5" fill="currentColor"/><circle cx="15" cy="7" r="1.5" fill="currentColor"/>',
  sun:     '<circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>',
  moon:    '<path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>',
  download:'<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
  upload:  '<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
  arrowup: '<polyline points="18 15 12 9 6 15"/>',
  arrowdn: '<polyline points="6 9 12 15 18 9"/>',
  search:  '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
  lock:    '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>',
  sliders: '<line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>',
  list:    '<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>',
  cart:    '<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 001.95-1.57l1.65-7.43H6"/>',
  heart:   '<path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>',
  journal: '<path d="M4 2h13a2 2 0 012 2v16a2 2 0 01-2 2H4a2 2 0 01-2-2V4a2 2 0 012-2z"/><path d="M7 8h8M7 12h8M7 16h5"/>',
  photo:   '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>',
  flight:  '<path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 00-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>',
  hotel:   '<path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
  home2:   '<path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
};
function ic(n,sz){
  var p=IC[n]||IC.plus; sz=sz||22;
  return '<svg width="'+sz+'" height="'+sz+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+p+'</svg>';
}

// ── UTILS ───────────────────────────────────────────────────────
var $=function(s,el){ return (el||document).querySelector(s); };
var $$=function(s,el){ return Array.prototype.slice.call((el||document).querySelectorAll(s)); };
function today(){ return new Date().toISOString().split('T')[0]; }
function nowH(){ return new Date().getHours(); }
function fmtMoney(n){ if(n==null) return ''; if(n===0) return t('free'); return Number.isInteger(n)?'¥'+n:'¥'+n.toFixed(1); }
function spendStr(item){ if(item.sMin==null) return ''; if(item.sMin===0&&item.sMax===0) return t('free'); if(item.sMin===item.sMax) return fmtMoney(item.sMin); return fmtMoney(item.sMin)+' – '+fmtMoney(item.sMax); }
function genCode(){ var c='ABCDEFGHJKLMNPQRSTUVWXYZ23456789',r=''; for(var i=0;i<6;i++) r+=c[Math.floor(Math.random()*c.length)]; return r; }
function getWdLabel(wd){ if(S.lang==='en'){ var m={'一':'Mon','二':'Tue','三':'Wed','四':'Thu','五':'Fri','六':'Sat','日':'Sun'}; return m[wd]||wd; } return '周'+wd; }
function memberName(id){ return id===S.memberId?t('you'):(S.members[id]?S.members[id].name:id); }
function memberAvatar(id){ return S.avatars[id]||null; }
function renderAv(id,size){
  size=size||34; var m=S.members[id]||{name:'?',color:'#8E8E93'}; var img=memberAvatar(id);
  var style='width:'+size+'px;height:'+size+'px;';
  if(img) return '<div class="av" style="'+style+'"><img src="'+img+'" alt=""></div>';
  return '<div class="av" style="'+style+'background:'+m.color+';font-size:'+(size*0.38)+'px">'+(m.name||'?')[0]+'</div>';
}
function renderMentions(text){
  if(!text) return '';
  var escaped=escHtml(text);
  Object.entries(S.members).forEach(function(entry){
    var id=entry[0],m=entry[1]; if(!m.name||m.name.length<1) return;
    var safe=m.name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    var dn=id===S.memberId?t('you'):m.name;
    var span='<span style="background:'+m.color+'22;color:'+m.color+';border-radius:4px;padding:0 3px;font-weight:600">@'+escHtml(dn)+'</span>';
    try{ escaped=escaped.replace(new RegExp(escHtml(safe),'g'),span); }catch(e){}
  });
  return escaped;
}
function getDays(){ return (S.trip&&S.trip.days)?S.trip.days:[]; }
function allItemsFlat(){ return getDays().reduce(function(a,d){ return a.concat(d.items||[]); },[]); }
function findItem(id){ return allItemsFlat().find(function(i){ return i.id===id; }); }
function escHtml(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

// ── WALLPAPER FIX ───────────────────────────────────────────────
function applyWallpaper(){
  var wp=localStorage.getItem('wallpaper');
  var el=document.getElementById('wp');
  if(!el) return;
  if(wp){
    // FIX #8: force show even in light mode when wallpaper is set
    el.style.backgroundImage='url('+wp+')';
    el.classList.add('img');
    el.style.setProperty('display','block','important');
    // dim the body bg so glass works
    document.body.style.background='transparent';
  } else {
    el.style.backgroundImage='';
    el.classList.remove('img');
    el.style.removeProperty('display');
    document.body.style.background='';
    window.applyTheme(S.theme);
  }
}

// ── IMAGE COMPRESSION ───────────────────────────────────────────
function compressImage(dataUrl,maxDim,quality){
  return new Promise(function(resolve){
    var img=new Image();
    img.onload=function(){
      var w=img.width,h=img.height,ratio=Math.min(maxDim/w,maxDim/h,1);
      var canvas=document.createElement('canvas');
      canvas.width=Math.round(w*ratio); canvas.height=Math.round(h*ratio);
      canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);
      resolve(canvas.toDataURL('image/jpeg',quality||0.75));
    };
    img.onerror=function(){ resolve(dataUrl); };
    img.src=dataUrl;
  });
}

// ── FIREBASE OPS ────────────────────────────────────────────────
async function fbLoadTrip(code){
  if(!db){ var raw=localStorage.getItem('lt_'+code); if(raw){ var d=JSON.parse(raw); S.trip=d; S.members=d.members||{}; return true; } return false; }
  try{ var snap=await getDoc(doc(db,'trips',code)); if(!snap.exists()) return false; S.trip=snap.data(); S.members=S.trip.members||{}; return true; }
  catch(e){ toast('网络错误：'+e.message); return false; }
}
async function fbCreateTrip(code,name){
  var mid='u_'+Date.now(),color=COLORS[0],members={};
  members[mid]={name:name,color:color};
  var data={code:code,name:'我的旅行',dates:'',creatorId:mid,members:members,days:[],msgApp:'wechat'};
  S.trip=data; S.members=members;
  if(db){ var fd=JSON.parse(JSON.stringify(data)); fd.createdAt=serverTimestamp(); await setDoc(doc(db,'trips',code),fd); }
  else { try{ localStorage.setItem('lt_'+code,JSON.stringify(data)); }catch(e){} }
  return {memberId:mid,color:color};
}
async function fbJoinTrip(code,name){
  var mid='u_'+Date.now(),used=Object.values(S.members||{}).map(function(m){ return m.color; }),color=COLORS.find(function(c){ return used.indexOf(c)<0; })||COLORS[0];
  S.members[mid]={name:name,color:color}; if(S.trip) S.trip.members=S.members;
  if(db){ var upd={}; upd['members.'+mid]={name:name,color:color,joinedAt:serverTimestamp()}; await updateDoc(doc(db,'trips',code),upd); }
  else { try{ if(S.trip) localStorage.setItem('lt_'+code,JSON.stringify(S.trip)); }catch(e){} }
  return {memberId:mid,color:color};
}
async function fbSaveDays(days){
  if(!S.tripCode) return; if(S.trip) S.trip.days=days;
  if(db){ await updateDoc(doc(db,'trips',S.tripCode),{days:days}); }
  else { try{ if(S.trip) localStorage.setItem('lt_'+S.tripCode,JSON.stringify(S.trip)); }catch(e){} }
}
async function fbAddExpense(data){
  var exp=Object.assign({memberId:S.memberId,createdAt:new Date().toISOString()},data);
  if(db&&S.tripCode){ await addDoc(collection(db,'trips',S.tripCode,'expenses'),Object.assign({},exp,{createdAt:serverTimestamp()})); }
  else { S.expenses.unshift(Object.assign({id:'loc_'+Date.now()},exp)); refreshExpList(); }
}
async function fbDelExpense(id){
  if(db&&S.tripCode){ await deleteDoc(doc(db,'trips',S.tripCode,'expenses',id)); }
  else { S.expenses=S.expenses.filter(function(e){ return e.id!==id; }); refreshExpList(); }
}
async function fbSaveMsg(role,content){
  if(!db||!S.tripCode||!S.memberId) return;
  try{ await addDoc(collection(db,'trips',S.tripCode,'chats',S.memberId,'messages'),{role:role,content:content,ts:serverTimestamp()}); }catch(e){}
}

// Travel docs
async function fbSaveTravelDoc(docData){
  if(db&&S.tripCode){
    var ref=await addDoc(collection(db,'trips',S.tripCode,'travelDocs'),Object.assign({memberId:S.memberId,createdAt:serverTimestamp()},docData));
    return ref.id;
  } else {
    var id='td_'+Date.now(); S.travelDocs.push(Object.assign({id:id,memberId:S.memberId},docData)); return id;
  }
}
async function fbDeleteTravelDoc(id){
  if(db&&S.tripCode){ await deleteDoc(doc(db,'trips',S.tripCode,'travelDocs',id)); }
  else { S.travelDocs=S.travelDocs.filter(function(d){ return d.id!==id; }); }
}

// Journal
async function fbSaveJournalEntry(entry){
  if(db&&S.tripCode&&entry.visibility==='shared'){
    if(entry.id&&!entry.id.startsWith('jl_')){
      await updateDoc(doc(db,'trips',S.tripCode,'journal',entry.id),entry);
    } else {
      var ref=await addDoc(collection(db,'trips',S.tripCode,'journal'),Object.assign({},entry,{createdAt:serverTimestamp()}));
      entry.id=ref.id;
    }
  }
  // Always save private locally
  var local=JSON.parse(localStorage.getItem('journal_'+S.tripCode)||'[]');
  var idx=local.findIndex(function(e){ return e.id===entry.id; });
  if(idx>=0) local[idx]=entry; else local.push(entry);
  localStorage.setItem('journal_'+S.tripCode,JSON.stringify(local));
}

// Photo board
async function fbAddPhoto(photoData){
  if(db&&S.tripCode){
    var ref=await addDoc(collection(db,'trips',S.tripCode,'photoBoard'),Object.assign({addedBy:S.memberId,createdAt:serverTimestamp()},photoData));
    S.photoBoard.unshift(Object.assign({id:ref.id},photoData));
  } else {
    var id='ph_'+Date.now(); S.photoBoard.unshift(Object.assign({id:id,addedBy:S.memberId},photoData));
  }
  if(S.tab==='home') renderHome();
}
async function fbDeletePhoto(id){
  if(db&&S.tripCode){ await deleteDoc(doc(db,'trips',S.tripCode,'photoBoard',id)); }
  S.photoBoard=S.photoBoard.filter(function(p){ return p.id!==id; });
}

function subscribeAll(code){
  if(!db) return;
  S.unsubs.push(onSnapshot(doc(db,'trips',code),function(snap){ if(!snap.exists()) return; S.trip=snap.data(); S.members=S.trip.members||{}; if(S.tab==='home') renderHome(); }));
  S.unsubs.push(onSnapshot(query(collection(db,'trips',code,'expenses'),orderBy('createdAt','desc'),limit(100)),function(snap){ S.expenses=snap.docs.map(function(d){ return Object.assign({id:d.id},d.data()); }); refreshExpList(); }));
  S.unsubs.push(onSnapshot(query(collection(db,'trips',code,'chats',S.memberId,'messages'),orderBy('ts','asc'),limit(60)),function(snap){ S.chatHistory=snap.docs.map(function(d){ return d.data(); }); refreshChatMsgs(); }));
  S.unsubs.push(onSnapshot(query(collection(db,'trips',code,'travelDocs'),orderBy('createdAt','asc')),function(snap){ S.travelDocs=snap.docs.map(function(d){ return Object.assign({id:d.id},d.data()); }); if(S.tab==='home') renderHome(); }));
  S.unsubs.push(onSnapshot(query(collection(db,'trips',code,'journal'),orderBy('createdAt','desc'),limit(30)),function(snap){ var remote=snap.docs.map(function(d){ return Object.assign({id:d.id},d.data()); }); if(S.tab==='home') renderHome(); }));
  S.unsubs.push(onSnapshot(query(collection(db,'trips',code,'photoBoard'),orderBy('createdAt','desc'),limit(50)),function(snap){ S.photoBoard=snap.docs.map(function(d){ return Object.assign({id:d.id},d.data()); }); if(S.tab==='home') renderHome(); }));
}

// ── EXPORT / IMPORT ─────────────────────────────────────────────
window.exportTripData=function(){
  var data={version:3,exported:new Date().toISOString(),tripCode:S.tripCode,memberId:S.memberId,memberName:S.memberName,trip:S.trip,members:S.members,expenses:S.expenses,localTrips:S.localTrips,shoppingList:S.shoppingList,todoList:S.todoList,packingList:S.packingList,aiConfig:S.aiConfig,aiToggles:S.aiToggles,baseCurrency:S.baseCurrency,localCurrency:S.localCurrency,theme:S.theme,lang:S.lang,msgApp:S.msgApp,customApps:S.customApps,avatars:S.avatars,travelDocs:S.travelDocs};
  var blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  var url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url; a.download='travoo_'+(S.tripCode||'backup')+'_'+today()+'.json'; a.click(); URL.revokeObjectURL(url);
  toast(S.lang==='en'?'Exported':'导出成功');
};
window.importTripData=function(){
  var inp=document.createElement('input'); inp.type='file'; inp.accept='.json';
  inp.onchange=function(){
    var f=inp.files[0]; if(!f) return;
    var rd=new FileReader(); rd.onload=function(e){
      try{
        var data=JSON.parse(e.target.result);
        if(!data.version||!data.tripCode) throw new Error('无效备份文件');
        if(data.tripCode){ S.tripCode=data.tripCode; localStorage.setItem('tripCode',data.tripCode); }
        if(data.memberId){ S.memberId=data.memberId; localStorage.setItem('memberId',data.memberId); }
        if(data.memberName){ S.memberName=data.memberName; localStorage.setItem('memberName',data.memberName); }
        if(data.trip){ S.trip=data.trip; try{ localStorage.setItem('lt_'+data.tripCode,JSON.stringify(data.trip)); }catch(e2){} }
        if(data.members) S.members=data.members;
        if(data.expenses) S.expenses=data.expenses;
        ['localTrips','shoppingList','todoList','packingList','aiConfig','aiToggles'].forEach(function(k){ if(data[k]){ S[k]=data[k]; localStorage.setItem(k,JSON.stringify(data[k])); } });
        ['baseCurrency','localCurrency','theme','lang','msgApp'].forEach(function(k){ if(data[k]){ S[k]=data[k]; localStorage.setItem(k,data[k]); } });
        if(data.customApps){ S.customApps=data.customApps; localStorage.setItem('customApps',JSON.stringify(data.customApps)); }
        if(data.avatars){ S.avatars=data.avatars; localStorage.setItem('memberAvatars',JSON.stringify(data.avatars)); }
        if(data.travelDocs) S.travelDocs=data.travelDocs;
        toast(t('importSuccess')); closeModal(); setTimeout(function(){ renderApp(); },400);
      }catch(err){ toast('导入失败：'+err.message); }
    }; rd.readAsText(f);
  };
  inp.click();
};

// ── PACKING ─────────────────────────────────────────────────────
function getPackingSuggestions(){
  var wx=S.weather,tMax=wx&&wx.daily?wx.daily.temperature_2m_max[0]:20,tMin=wx&&wx.daily?wx.daily.temperature_2m_min[0]:15,prec=wx&&wx.daily?wx.daily.precipitation_probability_mean[0]||0:0;
  var clothes=getClothingRecs(tMax,tMin,prec,0).map(function(c,i){ return {id:'cl_'+c[0],text:c[1],cat:'clothes'}; });
  var en=S.lang==='en';
  var docs=(en?['Passport','Travel insurance','Hotel confirmation','Tickets','Emergency contacts']:['护照','旅行保险','酒店确认单','机票/火车票','紧急联系人']).map(function(d,i){ return {id:'doc_'+i,text:d,cat:'docs'}; });
  var elec=(en?['Phone charger','Power bank','Adapter','Earphones']:['手机充电线','充电宝','转换插头','耳机']).map(function(d,i){ return {id:'elec_'+i,text:d,cat:'electronics'}; });
  var toil=(en?['Toothbrush','Toothpaste','Shampoo','Skincare','Sunscreen']:['牙刷牙膏','洗发水','护肤品','防晒霜','口罩']).map(function(d,i){ return {id:'toil_'+i,text:d,cat:'toiletries'}; });
  var hasSwim=allItemsFlat().some(function(i){ return /游泳|泳|swim/i.test(i.title+i.notes); });
  if(hasSwim){ var si=en?['Swimwear','Swim cap','Goggles']:['泳衣','泳帽','泳镜']; si.forEach(function(s,i){ toil.push({id:'swim_'+i,text:s,cat:'toiletries'}); }); }
  if(periodConflict()){ var pd=en?['Sanitary pads','Painkillers','Heating patch']:['卫生棉','止痛药','暖贴']; pd.forEach(function(s,i){ toil.push({id:'period_'+i,text:s,cat:'toiletries'}); }); }
  return {clothes:clothes,docs:docs,electronics:elec,toiletries:toil};
}

// ── PERIOD ──────────────────────────────────────────────────────
function periodConflict(){
  var pd=S.periodData; if(!pd.records||!pd.records.length) return false;
  var days=getDays(); if(!days.length) return false;
  var ts=new Date(days[0].date+'T00:00:00'),te=new Date(days[days.length-1].date+'T23:59:59');
  var last=new Date(pd.records[pd.records.length-1]+'T00:00:00'),cl=pd.cycleLen||28,dur=pd.duration||5;
  for(var i=0;i<3;i++){ var ps=new Date(last.getTime()+(i+1)*cl*86400000),pe=new Date(ps.getTime()+dur*86400000); if(ps<=te&&pe>=ts) return true; }
  return false;
}

// ── SETTLEMENT ──────────────────────────────────────────────────
function calcSettle(){
  var ids=Object.keys(S.members); if(ids.length<2) return [];
  var bal={}; ids.forEach(function(id){ bal[id]=0; });
  S.expenses.forEach(function(e){ var amt=Number(e.baseAmount||e.amount)||0,split=e.splitAmong||ids,share=amt/split.length; if(bal[e.paidBy]!==undefined) bal[e.paidBy]+=amt; split.forEach(function(id){ if(bal[id]!==undefined) bal[id]-=share; }); });
  var txns=[],deb=ids.filter(function(id){ return bal[id]<-0.01; }).map(function(id){ return {id:id,a:-bal[id]}; }).sort(function(a,b){ return b.a-a.a; }),crd=ids.filter(function(id){ return bal[id]>0.01; }).map(function(id){ return {id:id,a:bal[id]}; }).sort(function(a,b){ return b.a-a.a; });
  var di=0,ci=0;
  while(di<deb.length&&ci<crd.length){ var p=Math.min(deb[di].a,crd[ci].a); txns.push({from:deb[di].id,to:crd[ci].id,amount:p}); deb[di].a-=p; crd[ci].a-=p; if(deb[di].a<0.01) di++; if(crd[ci].a<0.01) ci++; }
  return txns;
}

// ── GEO ─────────────────────────────────────────────────────────
function requestGeo(){ if(!navigator.geolocation) return; navigator.geolocation.getCurrentPosition(function(pos){ S.geo={lat:pos.coords.latitude,lon:pos.coords.longitude}; fetchWeather(); },function(){}); }

// ── NOTIFICATIONS ────────────────────────────────────────────────
function checkNotifs(){
  if(localStorage.getItem('notifsEnabled')==='false') return;
  var todayDay=getDays().find(function(d){ return d.date===today(); }); if(!todayDay) return;
  var now=new Date(),shown=JSON.parse(localStorage.getItem('shownNotifs')||'[]');
  todayDay.items.forEach(function(item){
    if(!item.time||item.time==='全天') return;
    var parts=(item.time+':00').split(':'),h=parseInt(parts[0]),m=parseInt(parts[1]);
    var dt=new Date(today()+'T'+(h<10?'0':'')+h+':'+(m<10?'0':'')+m+':00'),diff=(dt-now)/60000;
    var n30='n30_'+item.id;
    if(diff>=28&&diff<=32&&shown.indexOf(n30)<0){ shown.push(n30); localStorage.setItem('shownNotifs',JSON.stringify(shown)); showNotifBanner('Travoo','30min: '+item.title,''); }
    var nN='nnow_'+item.id;
    if(diff>=-2&&diff<=3&&shown.indexOf(nN)<0){ shown.push(nN); localStorage.setItem('shownNotifs',JSON.stringify(shown)); showNotifBanner('Travoo',item.title,item.urgent?'⚠️ 必须准时':'祝旅途愉快'); }
  });
}
function showNotifBanner(app,title,body){
  var e=$('.nb'); if(e) e.remove();
  var d=document.createElement('div'); d.className='nb';
  d.innerHTML='<div class="nb-hdr"><div class="nb-icon">'+ic('bell',11)+'</div><span class="nb-app">'+escHtml(app)+'</span><span class="nb-time">现在</span></div><div class="nb-title">'+escHtml(title)+'</div>'+(body?'<div class="nb-body">'+escHtml(body)+'</div>':'');
  document.body.appendChild(d);
  d.addEventListener('click',function(){ d.classList.add('out'); setTimeout(function(){ d.remove(); },300); });
  setTimeout(function(){ d.classList.add('out'); setTimeout(function(){ d.remove(); },300); },6000);
}

// ── VOICE ────────────────────────────────────────────────────────
var recognition=null;
function startVoice(onResult){
  var SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR){ showVoiceFallback(onResult); return; }
  var finalText='',isDone=false;
  var ov=document.createElement('div'); ov.className='voice-ov';
  ov.innerHTML='<div class="voice-ring">'+ic('mic',40)+'</div><div class="voice-hint" id="vh">'+t('listening')+'</div><div class="voice-text" id="vt"></div><div style="display:flex;gap:12px;margin-top:30px"><div class="voice-cancel" id="vdone" style="background:rgba(255,255,255,.2);color:#fff;font-weight:700;padding:11px 28px">完成</div><div class="voice-cancel" id="vcancel">'+t('cancel')+'</div></div>';
  document.body.appendChild(ov);
  function finish(){ if(isDone) return; isDone=true; try{ recognition&&recognition.stop(); }catch(e){} ov.remove(); var res=finalText.trim(); if(res) onResult(res); }
  function cancel(){ isDone=true; try{ recognition&&recognition.stop(); }catch(e){} ov.remove(); }
  $('#vdone',ov).addEventListener('click',finish); $('#vcancel',ov).addEventListener('click',cancel);
  recognition=new SR(); recognition.lang=S.lang==='en'?'en-US':'cmn-Hans-CN'; recognition.continuous=true; recognition.interimResults=true;
  recognition.onresult=function(e){ var interim=''; for(var i=e.resultIndex;i<e.results.length;i++){ var seg=e.results[i][0].transcript; if(e.results[i].isFinal) finalText+=seg; else interim+=seg; } var el=$('#vt',ov); if(el) el.innerHTML='<span style="color:rgba(255,255,255,.95)">'+escHtml(finalText)+'</span>'+(interim?'<span style="color:rgba(255,255,255,.4)">'+escHtml(interim)+'</span>':''); };
  recognition.onerror=function(e){ var h=$('#vh',ov); if(h){ h.textContent='错误：'+e.error; h.style.color='rgba(255,100,80,.9)'; } if(e.error==='no-speech'&&!isDone) setTimeout(function(){ try{ recognition.start(); }catch(er){} },200); };
  recognition.onend=function(){ if(!isDone) setTimeout(function(){ try{ recognition.start(); }catch(e){ finish(); } },150); };
  try{ recognition.start(); }catch(e){ ov.remove(); showVoiceFallback(onResult); }
}
function showVoiceFallback(onResult){
  showModal('<div class="sh"></div><div class="sheet-title">输入文字</div><input class="inp" id="vf-inp" placeholder="输入内容" style="margin-bottom:14px"><button class="btn btn-p btn-full" onclick="window._vfcb&&window._vfcb($(`#vf-inp`).value.trim());closeModal()">确认</button>');
  window._vfcb=function(txt){ if(txt) onResult(txt); window._vfcb=null; };
}
function handleVoiceIntent(txt){
  var low=txt.toLowerCase();
  if(/记录|花了|消费|spent|expense/.test(low)){ var m=txt.match(/\d+(\.\d+)?/); if(m){ switchTab('exp'); setTimeout(function(){ showAddExpenseModal({amount:parseFloat(m[0]),description:txt}); },300); return; } }
  if(/叫车|打车|的士|taxi|uber|grab/.test(low)){ openApp('didi'); return; }
  switchTab('chat'); setTimeout(function(){ sendChatMsg(txt); },300);
}

// ── APP LAUNCHER ─────────────────────────────────────────────────
window.openApp=function(key,extra){
  var app=ALL_APPS[key]; if(!app) return; extra=extra||'';
  if(!app.scheme){ window.open(app.web+extra,'_blank'); return; }
  showLoad(); var opened=false,timer;
  function onHide(){ if(document.hidden){ opened=true; clearTimeout(timer); hideLoad(); } }
  document.addEventListener('visibilitychange',onHide);
  timer=setTimeout(function(){ document.removeEventListener('visibilitychange',onHide); if(!opened){ hideLoad(); window.open(app.web+extra,'_blank'); } },1800);
  try{ window.location.href=app.scheme+extra; }catch(e){ clearTimeout(timer); document.removeEventListener('visibilitychange',onHide); hideLoad(); window.open(app.web+extra,'_blank'); }
};
window.openXHS=function(kw){ openApp('xiaohongshu',encodeURIComponent(kw||'旅行')); };

// ── MODAL ────────────────────────────────────────────────────────
var _ov=null;
function showModal(html){
  closeModal();
  var d=document.createElement('div'); d.className='ov';
  d.innerHTML='<div class="sheet">'+html+'</div>';
  d.addEventListener('click',function(e){ if(e.target===d) closeModal(); });
  document.body.appendChild(d); _ov=d;
}
window.closeModal=function(){
  if(!_ov) return;
  _ov.style.animation='ovFadeIn .18s ease reverse forwards';
  var ov=_ov; _ov=null;
  setTimeout(function(){ ov.remove(); },200);
};

// ── LOAD / TOAST ─────────────────────────────────────────────────
function showLoad(){ if($('.load-ov')) return; var d=document.createElement('div'); d.className='load-ov'; d.innerHTML='<div class="spin"></div>'; document.body.appendChild(d); }
function hideLoad(){ var d=$('.load-ov'); if(d) d.remove(); }
function toast(msg,dur){
  var e=$('.toast-el'); if(e) e.remove(); if(!msg) return;
  var d=document.createElement('div'); d.className='toast-el'; d.textContent=msg;
  document.body.appendChild(d);
  var ms=(dur===undefined)?2400:dur;
  if(ms>0) setTimeout(function(){ d.style.opacity='0'; setTimeout(function(){ d.remove(); },300); },ms);
}

// ── AI ───────────────────────────────────────────────────────────
function sysPrompt(){
  var td=getDays().find(function(d){ return d.date===today(); });
  return 'You are Travoo Butler for trip "'+(S.trip&&S.trip.name||'Trip')+'". Today: '+today()+(td?' - '+td.title:'')+'. Members: '+Object.values(S.members).map(function(m){ return m.name; }).join(', ')+'. Base currency: '+(S.baseCurrency)+'. Reply in user\'s language. Be concise.';
}
async function callAI(userText){
  var cfg=S.aiConfig; if(!cfg.apiKey||!cfg.endpoint) throw new Error(t('noCfg'));
  var msgs=[{role:'system',content:sysPrompt()}];
  var hist=S.chatHistory.slice(-14); for(var i=0;i<hist.length;i++) msgs.push({role:hist[i].role,content:hist[i].content});
  msgs.push({role:'user',content:userText});
  var res=await fetch(cfg.endpoint,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+cfg.apiKey},body:JSON.stringify({model:cfg.model||'gpt-4o-mini',messages:msgs,max_tokens:S.tokenBudget||4000,temperature:0.75})});
  if(!res.ok) throw new Error('API '+res.status+': '+await res.text());
  var data=await res.json();
  var reply=(data.choices&&data.choices[0]&&data.choices[0].message&&data.choices[0].message.content)||'(no reply)';
  var used=(data.usage&&data.usage.total_tokens)||0; S.tokenUsed+=used; localStorage.setItem('tokenUsed',S.tokenUsed);
  return reply;
}

// ── RECEIPT OCR (no AI fallback with keyword extraction) ─────────
async function ocrReceipt(b64,useAI){
  if(useAI&&S.aiConfig.apiKey&&S.aiConfig.endpoint){
    try{
      var res=await fetch(S.aiConfig.endpoint,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+S.aiConfig.apiKey},body:JSON.stringify({model:S.aiConfig.model||'gpt-4o-mini',max_tokens:100,messages:[{role:'user',content:[{type:'text',text:'Extract from receipt. JSON only: {"amount":number,"description":"string","category":"food|transport|attr|act|other"}'},{type:'image_url',image_url:{url:b64}}]}]})});
      var d=await res.json(); var txt=(d.choices&&d.choices[0]&&d.choices[0].message&&d.choices[0].message.content)||''; var m=txt.match(/\{[\s\S]*\}/); if(m) return JSON.parse(m[0]);
    }catch(e){ console.warn('[OCR AI]',e); }
  }
  return null;
}
function extractReceiptText(text){
  var result={amount:null,description:'',category:'other'};
  var amtP=[/合计[：:\s]*¥?\s*(\d+(?:\.\d+)?)/,/总计[：:\s]*¥?\s*(\d+(?:\.\d+)?)/,/实付[：:\s]*¥?\s*(\d+(?:\.\d+)?)/,/¥\s*(\d+(?:\.\d+)?)/,/(\d{2,6}(?:\.\d{1,2})?)\s*元/];
  for(var i=0;i<amtP.length;i++){ var m=text.match(amtP[i]); if(m){ result.amount=parseFloat(m[1]); break; } }
  if(/餐|饭|食|午|晚|早|菜|面|饮|café|cafe|restaurant/i.test(text)) result.category='food';
  else if(/票|车|船|飞|地铁|打车|出行|taxi|train|bus/i.test(text)) result.category='transport';
  else if(/景|门票|参观|游览|attraction|museum/i.test(text)) result.category='attr';
  var lines=text.split('\n').map(function(l){ return l.trim(); }).filter(function(l){ return l; });
  result.description=lines[0]?lines[0].substring(0,30):'';
  return result;
}

// ── ITINERARY PARSER ─────────────────────────────────────────────
function extractDate(str){
  var wds=['日','一','二','三','四','五','六'],year=new Date().getFullYear();
  var m1=str.match(/(\d{1,2})[\/\-\.](\d{1,2})/);
  if(m1){ var mo=parseInt(m1[1]),dy=parseInt(m1[2]); if(mo>=1&&mo<=12&&dy>=1&&dy<=31){ var ds=year+'-'+(mo<10?'0':'')+mo+'-'+(dy<10?'0':'')+dy; var d=new Date(ds+'T12:00:00'); return {date:ds,month:String(mo),day:String(dy),wd:wds[d.getDay()]}; } }
  var m2=str.match(/(\d{4})[\/\-](\d{2})[\/\-](\d{2})/);
  if(m2){ var ds=m2[1]+'-'+m2[2]+'-'+m2[3]; var d=new Date(ds+'T12:00:00'); return {date:ds,month:String(parseInt(m2[2])),day:String(parseInt(m2[3])),wd:wds[d.getDay()]}; }
  return null;
}
function guessType(text){ var t2=text||''; if(/早餐|午餐|晚餐|食飯|吃饭|餐廳|咖啡|breakfast|lunch|dinner|restaurant|food/i.test(t2)) return 'food'; if(/入住|check.?in|酒店|民宿/i.test(t2)) return 'checkin'; if(/打的|打車|高鐵|高铁|火車|飛機|地鐵|taxi|train|flight|bus/i.test(t2)) return 'transport'; if(/遊覧|参观|景区|博物|公园|temple|museum|park/i.test(t2)) return 'attr'; if(/骑马|滑|体验|活动|hiking|activity/i.test(t2)) return 'act'; return 'leisure'; }
function guessApps(text){ var apps=[]; if(/打车|的士|taxi|uber/i.test(text)) apps.push('didi'); if(/地图|导航|map/i.test(text)) apps.push('googlemaps'); if(/高铁|火车|train/i.test(text)) apps.push('12306'); if(/酒店|hotel/i.test(text)) apps.push('ctrip'); if(/餐|食|dinner|restaurant/i.test(text)) apps.push('dianping'); return apps; }
function parseSpend(str){ if(!str) return {sMin:null,sMax:null}; str=str.replace(/[¥￥,，]/g,'').trim(); if(/^[—\-–]+$/.test(str)||!str) return {sMin:null,sMax:null}; var m=str.match(/(\d+(?:\.\d+)?)\s*[-~–]\s*(\d+(?:\.\d+)?)/); if(m) return {sMin:parseFloat(m[1]),sMax:parseFloat(m[2])}; var s=str.match(/(\d+(?:\.\d+)?)/); if(s) return {sMin:parseFloat(s[1]),sMax:parseFloat(s[1])}; return {sMin:null,sMax:null}; }
function parseTableFormat(lines){
  var days={},dayOrder=[],colMap={date:0,time:1,title:2,transport:3,spend:4,lodge:5,bag:6,notes:7},headerIdx=-1;
  for(var i=0;i<Math.min(lines.length,5);i++){ var cells=lines[i].split('\t'); if(/日期|时间|行程/.test(cells.join(' '))){ headerIdx=i; cells.forEach(function(c,j){ c=c.trim(); if(/日期/.test(c)) colMap.date=j; else if(/时间/.test(c)) colMap.time=j; else if(/行程|活动|内容/.test(c)) colMap.title=j; else if(/交通/.test(c)) colMap.transport=j; else if(/花费|消费|Spending|费用/.test(c)) colMap.spend=j; else if(/住宿/.test(c)) colMap.lodge=j; else if(/行李/.test(c)) colMap.bag=j; else if(/备注|notes/i.test(c)) colMap.notes=j; }); break; } }
  var cur=null,start=headerIdx>=0?headerIdx+1:0;
  for(var i=start;i<lines.length;i++){
    var cells=lines[i].split('\t'); if(cells.every(function(c){ return !c.trim(); })) continue;
    var dc=(cells[colMap.date]||'').trim(); if(dc){ var di=extractDate(dc); if(di) cur=di; }
    if(!cur) continue;
    var title=(cells[colMap.title]||'').trim(); if(!title) continue;
    var sp=parseSpend((cells[colMap.spend]||'').trim());
    if(!days[cur.date]){ days[cur.date]={date:cur.date,month:cur.month,day:cur.day,wd:cur.wd,title:cur.date,items:[]}; dayOrder.push(cur.date); }
    var dd=days[cur.date];
    dd.items.push({id:cur.date.replace(/-/g,'')+'_'+(dd.items.length+1),time:(cells[colMap.time]||'').trim()||'全天',title:title,transport:(cells[colMap.transport]||'').trim(),sMin:sp.sMin,sMax:sp.sMax,lodge:(cells[colMap.lodge]||'').trim(),bag:(cells[colMap.bag]||'').trim(),notes:(cells[colMap.notes]||'').trim(),apps:guessApps(title),type:guessType(title),hi:/高铁|包车|飞机/.test((cells[colMap.transport]||'')),urgent:false});
  }
  dayOrder.forEach(function(d){ var day=days[d]; var main=day.items.find(function(i){ return i.type==='attr'||i.type==='checkin'; })||day.items[0]; if(main) day.title=main.title.substring(0,18); });
  // FIX #4: SORT BY DATE
  return dayOrder.map(function(d){ return days[d]; }).sort(function(a,b){ return a.date.localeCompare(b.date); });
}
function parseFreeText(lines){
  var days={},dayOrder=[],cur=null;
  lines.forEach(function(line){
    line=line.trim(); if(!line||/^[-=─═]+$/.test(line)) return;
    var di=extractDate(line);
    if(di){ cur=di; if(!days[cur.date]){ var tp=line.replace(/\d{1,2}[\/\-]\d{1,2}\S*\s*/,'').replace(/\d{4}[\/\-]\d{2}[\/\-]\d{2}\s*/,'').trim(); days[cur.date]={date:cur.date,month:cur.month,day:cur.day,wd:cur.wd,title:tp||cur.date,items:[]}; dayOrder.push(cur.date); } return; }
    if(!cur) return;
    var time='全天'; var tm=line.match(/^(\d{1,2}:\d{2})/); if(tm){ time=tm[1]; line=line.substring(tm[0].length).trim(); }
    line=line.replace(/^[\s·\-]+/,''); if(!line) return;
    var dd=days[cur.date];
    dd.items.push({id:cur.date.replace(/-/g,'')+'_'+(dd.items.length+1),time:time,title:line.substring(0,40),transport:'',sMin:null,sMax:null,notes:'',apps:guessApps(line),type:guessType(line),hi:false,urgent:false,lodge:'',bag:''});
  });
  dayOrder.forEach(function(d){ var day=days[d]; if(!day.title||day.title===d){ var main=day.items.find(function(i){ return i.type!=='food'; })||day.items[0]; if(main) day.title=main.title.substring(0,18); } });
  // FIX #4: SORT BY DATE
  return dayOrder.map(function(d){ return days[d]; }).sort(function(a,b){ return a.date.localeCompare(b.date); });
}
function parseItineraryLocal(text){
  if(!text||text.length<5) return [];
  var lines=text.split(/\r?\n/).filter(function(l){ return l.trim(); });
  var isTable=lines.some(function(l){ return l.indexOf('\t')>=0; });
  var result=isTable?parseTableFormat(lines):parseFreeText(lines);
  return result.filter(function(d){ return d.items&&d.items.length>0; });
}
window.importFromXlsx=function(){
  if(typeof XLSX==='undefined'){ toast('Excel 库加载中，请刷新'); return; }
  var inp=document.createElement('input'); inp.type='file'; inp.accept='.xlsx,.xls,.csv';
  inp.onchange=function(){ var file=inp.files[0]; if(!file) return; closeModal(); showLoad(); var rd=new FileReader(); rd.onload=async function(e){ try{ var data=new Uint8Array(e.target.result); var wb=XLSX.read(data,{type:'array'}); var ws=wb.Sheets[wb.SheetNames[0]]; var tsv=XLSX.utils.sheet_to_csv(ws,{FS:'\t'}); var days=parseItineraryLocal(tsv); if(!days||!days.length) throw new Error('未识别到行程'); await fbSaveDays(days); _updateTripDates(days); hideLoad(); renderItin(); toast(t('importOk')+'：'+days.length+'天'); }catch(err){ hideLoad(); toast(t('importFail')+'：'+err.message); } }; rd.readAsArrayBuffer(file); };
  inp.click();
};
async function importItineraryFromText(text){
  var cfg=S.aiConfig; if(!cfg.apiKey||!cfg.endpoint) throw new Error(t('noCfg'));
  var res=await fetch(cfg.endpoint,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+cfg.apiKey},body:JSON.stringify({model:cfg.model||'gpt-4o-mini',max_tokens:4000,messages:[{role:'user',content:'Parse travel itinerary. Output JSON array ONLY:\n[{"date":"YYYY-MM-DD","month":"M","day":"DD","wd":"一|二|三|四|五|六|日","title":"day summary","items":[{"id":"d1_1","time":"HH:MM","title":"activity","transport":"","sMin":null,"sMax":null,"lodge":"","notes":"","apps":[],"type":"food|transport|attr|act|checkin|leisure","hi":false,"urgent":false}]}]\n\nItinerary:\n'+text}]})});
  if(!res.ok) throw new Error('API '+res.status);
  var d=await res.json(); var txt=(d.choices&&d.choices[0]&&d.choices[0].message&&d.choices[0].message.content)||''; var m=txt.match(/\[[\s\S]*\]/); if(!m) throw new Error('解析失败'); var days=JSON.parse(m[0]); if(!days||!days.length) throw new Error('未识别');
  // FIX #4: sort here too
  return days.sort(function(a,b){ return a.date.localeCompare(b.date); });
}
function _updateTripDates(days){
  if(!S.trip||!days.length) return;
  var first=days[0],last=days[days.length-1],dates=first.month+'/'+first.day+' — '+last.month+'/'+last.day;
  S.trip.dates=dates; if(db&&S.tripCode) updateDoc(doc(db,'trips',S.tripCode),{dates:dates}).catch(function(){});
  _addLocalTrip(S.tripCode,S.trip.name||'我的旅行',dates);
}

// ── RENDER APP ───────────────────────────────────────────────────
function renderApp(){
  var app=document.getElementById('app');
  if(!S.tripCode||!S.memberId){ if(S.localTrips.length>0) renderTripList(); else renderOnboarding(); return; }
  app.innerHTML=
    '<div id="v-home" class="view"></div>'+
    '<div id="v-itin" class="view"></div>'+
    '<div id="v-exp"  class="view"></div>'+
    '<div id="v-chat" class="view"></div>'+
    '<div id="v-set"  class="view"></div>'+
    '<nav class="tabs">'+
      '<div class="tab" id="tb-itin" onclick="switchTab(\'itin\')"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+IC.cal+'</svg></div>'+
      '<div class="tab" id="tb-exp" onclick="switchTab(\'exp\')"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+IC.wallet+'</svg></div>'+
      '<div class="tab tab-center" id="tb-home" onclick="switchTab(\'home\')"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+IC.home+'</svg></div>'+
      '<div class="tab" id="tb-chat" onclick="switchTab(\'chat\')"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+IC.chat+'</svg></div>'+
      '<div class="tab" id="tb-set" onclick="switchTab(\'set\')"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+IC.cog+'</svg></div>'+
    '</nav>';

  // Load journal from localStorage
  if(S.tripCode){ try{ S.journal=JSON.parse(localStorage.getItem('journal_'+S.tripCode)||'[]'); }catch(e){ S.journal=[]; } }

  switchTab('home');
  subscribeAll(S.tripCode);
  setInterval(checkNotifs,60000); setTimeout(checkNotifs,2000);
  requestGeo();

  // FAB (voice - home only)
  var mf=document.createElement('button'); mf.id='gfab-mic'; mf.className='gfab'; mf.setAttribute('hidden','');
  mf.innerHTML=ic('mic',22);
  mf.addEventListener('mousedown',function(){ startVoice(handleVoiceIntent); });
  mf.addEventListener('touchstart',function(e){ e.preventDefault(); startVoice(handleVoiceIntent); },{passive:false});
  app.appendChild(mf);
}
window.switchTab=function(name,dir){
  $$('.tab,.tab-center').forEach(function(tb){ tb.classList.remove('on'); });
  $$('.view').forEach(function(v){ v.classList.remove('active','slide-left','slide-right'); });
  var tb=$('#tb-'+name),vw=$('#v-'+name);
  if(tb) tb.classList.add('on');
  if(vw){
    vw.classList.add('active');
    if(dir==='left') vw.classList.add('slide-left');
    else if(dir==='right') vw.classList.add('slide-right');
  }
  S.tab=name;
  var fn={home:renderHome,itin:renderItin,exp:renderExp,chat:renderChat,set:renderSet};
  if(fn[name]) fn[name]();

  // FIX #15: voice FAB only on home
  var mf=document.getElementById('gfab-mic');
  if(mf){ if(name==='home') mf.removeAttribute('hidden'); else mf.setAttribute('hidden',''); }
};

// ── SWIPE GESTURE ────────────────────────────────────────────────
var _swipeStartX=0,_swipeStartY=0;
document.addEventListener('touchstart',function(e){
  if(e.touches.length!==1) return;
  _swipeStartX=e.touches[0].clientX;
  _swipeStartY=e.touches[0].clientY;
},{passive:true});
document.addEventListener('touchend',function(e){
  if(!_swipeStartX) return;
  var dx=e.changedTouches[0].clientX-_swipeStartX;
  var dy=e.changedTouches[0].clientY-_swipeStartY;
  if(Math.abs(dx)<60||Math.abs(dy)>Math.abs(dx)*0.8) return;
  // Don't swipe inside horizontal scroll containers or itin-scroll
  var target=e.target; var inScroll=false;
  while(target){ if(target.classList&&(target.classList.contains('itin-scroll')||target.classList.contains('day-tabs')||target.classList.contains('xhs-strip')||target.classList.contains('smart-strip')||target.classList.contains('pbw-scroll')||target.classList.contains('sheet')||target.classList.contains('ov'))) { inScroll=true; break; } target=target.parentElement; }
  if(inScroll) return;
  var tabs=['itin','exp','home','chat','set'];
  var cur=tabs.indexOf(S.tab);
  if(dx<-60&&cur<tabs.length-1) switchTab(tabs[cur+1],'left');
  else if(dx>60&&cur>0) switchTab(tabs[cur-1],'right');
  _swipeStartX=0;
},{passive:true});

// ── ONBOARDING ───────────────────────────────────────────────────
function renderOnboarding(){
  var offline=!fbApp?'<div style="font-size:12px;color:var(--t3);text-align:center;padding:6px 0;line-height:1.5">'+t('offlineNote')+'</div>':'';
  var LL={'zh-CN':'简','zh-TW':'繁','en':'EN'};
  var langChips=['zh-CN','zh-TW','en'].map(function(l){ return '<div class="chip '+(S.lang===l?'on':'')+'" style="padding:5px 14px;font-size:13px;font-weight:600" onclick="setLang(\''+l+'\')">'+LL[l]+'</div>'; }).join('');
  document.getElementById('app').innerHTML=
    '<div id="v-ob" class="view active"><div class="ob">'+
      '<div class="ob-logo">'+ic('plane',52)+'</div>'+
      '<div class="ob-brand">'+t('brand')+'</div><div class="ob-sub">'+t('sub')+'</div>'+
      '<div class="ob-form">'+
        '<div class="inp-lbl" style="text-align:left">'+t('yourName')+'</div>'+
        '<input class="inp" id="ob-name" placeholder="'+t('namePh')+'" autocomplete="off">'+
        '<input class="code-inp" id="ob-code" maxlength="6" placeholder="'+t('codePh')+'" autocomplete="off" autocapitalize="characters">'+
        '<button class="btn btn-g btn-full" onclick="handleJoin()">'+t('join')+'</button>'+
        '<div class="ob-div">'+t('or')+'</div>'+
        '<button class="btn btn-p btn-full" onclick="handleCreate()">'+t('create')+'</button>'+
        offline+
        '<div style="display:flex;justify-content:flex-end;margin-top:4px;gap:6px">'+langChips+'</div>'+
      '</div></div></div>';
  var ci=$('#ob-code'); if(ci) ci.addEventListener('input',function(){ this.value=this.value.toUpperCase().replace(/[^A-Z0-9]/g,''); });
}
window.setLang=function(l){ S.lang=l; localStorage.setItem('lang',l); renderApp(); };
window.handleJoin=async function(){
  var code=($('#ob-code')&&$('#ob-code').value.trim().toUpperCase())||'',name=($('#ob-name')&&$('#ob-name').value.trim())||'';
  if(code.length<6){ var ci=$('#ob-code'); if(ci){ ci.classList.add('shake'); setTimeout(function(){ ci.classList.remove('shake'); },500); } return; }
  if(!name){ toast('请输入你的名字'); return; }
  var btn=$('#ob-join'); if(btn){ btn.disabled=true; btn.textContent='连接中…'; }
  try{ var ok=await fbLoadTrip(code); if(!ok){ toast('找不到此行程码'); if(btn){ btn.disabled=false; btn.textContent=t('join'); } return; } var r=await fbJoinTrip(code,name); _saveSession(code,r.memberId,name); renderApp(); }
  catch(e){ toast('错误：'+e.message); if(btn){ btn.disabled=false; btn.textContent=t('join'); } }
};
window.handleCreate=async function(){
  var name=($('#ob-name')&&$('#ob-name').value.trim())||'';
  if(!name){ toast('请先输入你的名字'); return; }
  var btn=$('#ob-create'); if(btn){ btn.disabled=true; btn.textContent='创建中…'; }
  try{ var code=genCode(); var r=await fbCreateTrip(code,name); _saveSession(code,r.memberId,name); _addLocalTrip(code,'我的旅行',''); renderApp(); setTimeout(function(){ toast('行程码：'+code); },400); }
  catch(e){ toast('错误：'+e.message); if(btn){ btn.disabled=false; btn.textContent=t('create'); } }
};
function _saveSession(code,mid,name){ S.tripCode=code; S.memberId=mid; S.memberName=name; localStorage.setItem('tripCode',code); localStorage.setItem('memberId',mid); localStorage.setItem('memberName',name); }
function _addLocalTrip(code,name,dates){ var trips=JSON.parse(localStorage.getItem('localTrips')||'[]'); if(!trips.find(function(tt){ return tt.code===code; })) trips.push({code:code,name:name,dates:dates}); localStorage.setItem('localTrips',JSON.stringify(trips)); S.localTrips=trips; }

// ── TRIP LIST ────────────────────────────────────────────────────
function renderTripList(){
  var cards=S.localTrips.map(function(tr){ return '<div class="tc" onclick="enterTrip(\''+tr.code+'\')"><div class="tc-body"><div class="tc-name">'+escHtml(tr.name||'我的旅行')+'</div><div class="tc-date">'+escHtml(tr.dates||'—')+'</div></div></div>'; }).join('');
  document.getElementById('app').innerHTML=
    '<div id="v-tl" class="view active">'+
    '<div class="nav"><div class="nav-large">'+t('myTrips')+'</div><div class="nbtn" onclick="renderOnboarding()">'+ic('plus',16)+'</div></div>'+
    '<div class="scroller"><div style="height:16px"></div>'+
    '<div class="sec li-anim">'+cards+
    '<div class="tc-empty-hint" onclick="renderOnboarding()" style="margin:8px 0 0 0">'+
      ic('plus',24)+'<div style="font-size:14px;font-weight:600;color:var(--t2)">'+t('newTrip')+'</div>'+
    '</div></div></div></div>';
}
window.enterTrip=async function(code){
  var mid=localStorage.getItem('memberId'); if(!mid){ renderOnboarding(); return; }
  S.memberId=mid; S.memberName=localStorage.getItem('memberName'); S.tripCode=code; localStorage.setItem('tripCode',code);
  showLoad(); var ok=await fbLoadTrip(code); hideLoad(); if(!ok){ toast('无法加载行程'); return; } renderApp();
};

// ── HOME ─────────────────────────────────────────────────────────
function renderHome(){
  var v=$('#v-home'); if(!v) return;
  var trip=S.trip||{name:'Travoo',dates:'',days:[]},days=trip.days||[];
  var todayDay=days.find(function(d){ return d.date===today(); }),h=nowH();
  var nowDate=new Date();
  var startDate=days.length>0?new Date(days[0].date):nowDate;
  var endDate=days.length>0?new Date(days[days.length-1].date):nowDate;
  var prog=days.length>0?Math.max(0,Math.min(100,((nowDate-startDate)/(endDate-startDate+86400000))*100)):0;

  // Hero
  var heroDay,heroTitle;
  if(!days.length){ heroDay=t('notPlanned'); heroTitle=trip.name||'Travoo'; }
  else if(todayDay){ heroDay=getWdLabel(todayDay.wd)+' · '+t('today'); heroTitle=todayDay.title; }
  else if(nowDate<startDate){ heroDay=t('countdown'); heroTitle=trip.name||'Travoo'; }
  else { heroDay=t('tripEnded'); heroTitle=trip.name||'Travoo'; }

  var mems=Object.entries(S.members),avsHtml='';
  mems.slice(0,5).forEach(function(entry){ var id=entry[0],m=entry[1]; var img=memberAvatar(id); avsHtml+=img?'<div class="hav"><img src="'+img+'" alt=""></div>':'<div class="hav" style="background:'+m.color+'">'+((m.name||'?')[0])+'</div>'; });
  if(mems.length>5) avsHtml+='<div class="hav" style="background:var(--glass-bg3)">+'+(mems.length-5)+'</div>';
  var memRow=mems.length>0?'<div class="hero-members"><div style="display:flex">'+avsHtml+'</div><span class="hero-mem-info">'+mems.length+' '+t('nMembers')+'</span><div class="hero-share-btn" onclick="showTripCodeModal()">'+ic('share',13)+' '+t('invite')+'</div></div>':'';

  var heroHtml='<div class="hero-card scale-in"><div class="hero-inner">'+
    '<div class="hero-day">'+heroDay+'</div>'+
    '<div class="hero-title">'+escHtml(heroTitle)+'</div>'+
    '<div class="hero-prog"><div class="hero-fill" style="width:'+prog+'%"></div></div>'+
    memRow+'</div></div>';

  // Weather (compact)
  var wxHtml=renderWeatherMini();

  // Travel docs widget
  var tdHtml=renderTravelDocsWidget();

  // Rate bar
  var lc=CURRENCY_LIST[S.localCurrency]||{flag:'',symbol:S.localCurrency};
  var bc=CURRENCY_LIST[S.baseCurrency]||{flag:'',symbol:S.baseCurrency};
  var rateVal=getRate(S.localCurrency,S.baseCurrency);
  var rateStr=Object.keys(S.rates).length>0?('1 '+S.localCurrency+' = '+fmtCurrency(rateVal,S.baseCurrency)):t('rateUnavailable');
  var rateHtml='<div class="rate-bar" onclick="switchTab(\'set\')">'+
    '<div style="font-size:16px">'+lc.flag+'</div><div style="font-size:13px;color:var(--t3)">→</div><div style="font-size:16px">'+bc.flag+'</div>'+
    '<div style="flex:1"><div style="font-size:13px;font-weight:600;color:var(--t1)">'+escHtml(rateStr)+'</div>'+
      (S.fxDate?'<div style="font-size:10px;color:var(--t3)">'+S.fxDate.substring(0,16)+'</div>':'')+'</div>'+
    '<div onclick="event.stopPropagation();doFetchRates()" style="padding:6px 12px;background:var(--glass-bg2);border:0.5px solid var(--glass-border);border-radius:10px;font-size:12px;color:var(--t2);display:flex;align-items:center;gap:4px;cursor:pointer;transition:all .15s">'+ic('refresh',12)+'</div>'+
  '</div>';

  // Quick actions
  var qaApps=getQuickApps();
  var qaHtml='';
  qaApps.forEach(function(key){
    var app=ALL_APPS[key]; if(!app) return;
    var customIcon=S.customAppIcons&&S.customAppIcons[key];
    var iconHtml=customIcon?'<img src="'+customIcon+'" alt="">':('<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+IC[app.icon||'globe']+'</svg>');
    qaHtml+='<div class="qa" onclick="openApp(\''+key+'\')">'+
      '<div class="qa-icon">'+iconHtml+'</div>'+
      '<div class="qa-lbl">'+escHtml(getAppLabel(key))+'</div></div>';
  });

  // Photo board widget
  var pbHtml=renderPhotoBoardWidget();

  // Journal widget
  var jHtml=renderJournalWidget();

  // Smart recs
  var recs=buildSmartRecs(todayDay,h),recsHtml='';
  if(recs.length){
    recsHtml='<div style="margin-bottom:18px"><div class="sec-ttl" style="padding:0 16px;margin-bottom:8px">'+t('smRec')+'</div><div class="smart-strip">';
    recs.forEach(function(r){ recsHtml+='<div class="smart-pill" onclick="'+(r.action||'')+'"><div class="smart-tag">'+escHtml(r.type)+'</div><div class="smart-ttl">'+escHtml(r.title)+'</div><div class="smart-desc">'+escHtml(r.desc)+'</div></div>'; });
    recsHtml+='</div></div>';
  }

  // XHS
  var xhsRecs=getXHSRecs();
  var xhsHtml='<div style="margin-bottom:18px">'+
    '<div style="display:flex;align-items:center;padding:0 16px;margin-bottom:8px">'+
      '<div class="sec-ttl" style="margin-bottom:0;flex:1">'+t('xhs')+'</div>'+
      '<div onclick="refreshXHS()" style="display:flex;align-items:center;gap:4px;font-size:12px;color:var(--t3);cursor:pointer;padding:4px 8px;border-radius:10px;border:0.5px solid var(--glass-border)">'+ic('refresh',11)+' '+t('xhsRefresh')+'</div>'+
    '</div><div class="xhs-strip">';
  xhsRecs.forEach(function(r){
    xhsHtml+='<div class="xhs-card" onclick="openXHS(\''+encodeURIComponent(r.kw)+'\')">'+
      '<div class="xhs-card-top"><div class="xhs-card-icon">'+ic('search',14)+'</div><div class="xhs-card-label">'+escHtml(r.label)+'</div></div>'+
      '<div class="xhs-body"><div class="xhs-ttl">'+escHtml(r.kw)+'</div><div class="xhs-go">'+ic('search',9)+' '+(S.lang==='en'?'Search on RedNote':'在小红书搜索')+'</div></div></div>';
  });
  xhsHtml+='</div></div>';

  // Today timeline
  var bottomHtml='';
  if(todayDay&&todayDay.items.length){
    bottomHtml='<div class="sec"><div class="sec-ttl">'+t('todayTimeline')+'</div><div class="list li-anim">';
    todayDay.items.forEach(function(item){
      var sp=spendStr(item);
      bottomHtml+='<div class="lr" onclick="showActDetail(\''+item.id+'\')">'+
        '<div style="width:44px;flex-shrink:0;font-size:12px;font-weight:700;color:var(--t2)">'+escHtml(item.time)+'</div>'+
        '<div style="flex:1"><div style="font-size:15px;font-weight:600;color:var(--t1)">'+renderMentions(item.title)+'</div>'+
          (sp?'<div style="font-size:12px;color:var(--orange)">'+escHtml(sp)+'</div>':'')+
        '</div>'+
        (item.urgent?'<div style="width:6px;height:6px;border-radius:50%;background:var(--red);flex-shrink:0"></div>':'')+
      '</div>';
    });
    bottomHtml+='</div><button class="btn btn-g btn-full" style="margin-top:10px" onclick="switchTab(\'itin\')">'+t('viewFull')+'</button></div>';
  }

  v.innerHTML=
    '<div class="nav" style="padding-top:calc(var(--sai)+6px)">'+
      '<div style="font-size:13px;font-weight:500;color:var(--t2);flex:1">'+escHtml(trip.name||'')+'</div>'+
      '<div class="nbtn" onclick="showTripCodeModal()">'+ic('share',15)+'</div>'+
    '</div>'+
    '<div class="scroller" style="padding-top:8px">'+
      heroHtml+
      wxHtml+
      tdHtml+
      rateHtml+
      '<div class="sec">'+
        '<div style="display:flex;align-items:center;margin-bottom:8px">'+
          '<div class="sec-ttl" style="margin-bottom:0;flex:1">'+t('qa')+'</div>'+
          '<div onclick="showCustomAppsModal()" style="font-size:11px;color:var(--t3);cursor:pointer;padding:3px 9px;border-radius:8px;border:0.5px solid var(--glass-border);display:flex;align-items:center;gap:4px">'+ic('edit',11)+' '+t('customApps')+'</div>'+
        '</div>'+
        '<div class="qa-grid">'+qaHtml+'</div>'+
      '</div>'+
      pbHtml+
      jHtml+
      recsHtml+
      xhsHtml+
      bottomHtml+
    '</div>';
}
window.doFetchRates=async function(){ toast('获取汇率中…',0); var ok=await fetchRates(); toast(ok?'汇率已更新':'获取失败'); if(S.tab==='home') renderHome(); else if(S.tab==='set') renderSet(); };
function buildSmartRecs(todayDay,h){
  var recs=[],en=S.lang==='en';
  if(!todayDay) return recs;
  if(h>=7&&h<=9) recs.push({type:en?'Breakfast':'早餐',title:en?'Nearby breakfast':'附近早餐',desc:en?'Check reviews':'查看评分',action:"openApp('dianping')"});
  if(h>=11&&h<=13) recs.push({type:en?'Lunch':'午餐',title:en?'Local lunch':'当地特色',desc:en?'Search nearby':'搜索附近好评',action:"openApp('dianping')"});
  var hasCar=todayDay.items.some(function(i){ return i.apps&&i.apps.indexOf('didi')>=0; });
  if(hasCar) recs.push({type:en?'Transport':'出行',title:en?'Book taxi early':'提前叫车',desc:en?'5-10 mins ahead':'高峰期建议提前',action:"openApp('didi')"});
  return recs.slice(0,3);
}

// ── WEATHER MINI WIDGET ──────────────────────────────────────────
function renderWeatherMini(){
  var en=S.lang==='en';
  if(!S.geo){
    return '<div class="wx-mini" onclick="reqGeoWeather()">'+
      '<div class="wx-mini-row">'+
        '<div>'+wxSvg(2,28)+'</div>'+
        '<div style="flex:1">'+
          '<div class="wx-mini-temp">--°C</div>'+
          '<div class="wx-mini-desc">'+(en?'Tap to enable weather':'点击开启天气')+'</div>'+
        '</div>'+
        '<div style="font-size:12px;color:var(--blue);font-weight:600">'+(en?'Allow':'允许')+'</div>'+
      '</div></div>';
  }
  if(!S.weather){
    return '<div class="wx-mini shimmer" style="height:60px;border-radius:var(--r2);margin:0 16px 14px"></div>';
  }
  var cur=S.weather.current,daily=S.weather.daily;
  var temp=Math.round(cur.temperature_2m),desc=wxDesc(cur.weathercode);
  var hum=cur.relative_humidity_2m,wind=Math.round(cur.windspeed_10m);
  var wdsEN=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],wdsZH=['日','一','二','三','四','五','六'];
  var fHtml='';
  for(var i=0;i<Math.min(4,daily.time.length);i++){
    var d=new Date(daily.time[i]+'T12:00:00');
    var dl=i===0?(en?'Today':'今天'):(en?wdsEN[d.getDay()]:'周'+wdsZH[d.getDay()]);
    var pr=daily.precipitation_probability_mean[i]||0;
    fHtml+='<div class="wx-mini-day">'+
      '<div class="wx-mini-day-lbl">'+dl+'</div>'+
      '<div class="wx-mini-day-icon">'+wxSvg(daily.weathercode[i],14)+'</div>'+
      '<div class="wx-mini-day-temp">'+Math.round(daily.temperature_2m_max[i])+'°</div>'+
      (pr>20?'<div style="font-size:9px;color:#60a0ff">'+pr+'%</div>':'')+
    '</div>';
  }
  var tMax=daily.temperature_2m_max[0],tMin=daily.temperature_2m_min[0],prec0=daily.precipitation_probability_mean[0]||0;
  var clothes=getClothingRecs(tMax,tMin,prec0,wind);
  var cHtml=clothes.map(function(c){ return '<div class="wx-pill">'+clothSvg(c[0],11)+' '+escHtml(c[1])+'</div>'; }).join('');
  return '<div class="wx-mini" onclick="showWeatherDetail()">'+
    '<div class="wx-mini-row">'+
      '<div>'+wxSvg(cur.weathercode,32)+'</div>'+
      '<div style="flex:1">'+
        '<div class="wx-mini-temp">'+temp+'°C</div>'+
        '<div class="wx-mini-desc">'+escHtml(desc)+' · '+hum+'% · '+wind+'km/h</div>'+
      '</div>'+
      '<div class="wx-mini-forecast" style="display:flex;gap:10px">'+fHtml+'</div>'+
    '</div>'+
    (cHtml?'<div class="wx-mini-clothes">'+cHtml+'</div>':'')+
  '</div>';
}
window.showWeatherDetail=function(){
  if(!S.weather) return;
  var cur=S.weather.current,daily=S.weather.daily,en=S.lang==='en';
  var temp=Math.round(cur.temperature_2m),wind=Math.round(cur.windspeed_10m);
  var tMax=daily.temperature_2m_max[0],tMin=daily.temperature_2m_min[0],prec0=daily.precipitation_probability_mean[0]||0;
  var clothes=getClothingRecs(tMax,tMin,prec0,wind);
  var wdsEN=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],wdsZH=['日','一','二','三','四','五','六'];
  var fRows='';
  for(var i=0;i<daily.time.length;i++){
    var d=new Date(daily.time[i]+'T12:00:00');
    var dl=i===0?(en?'Today':'今天'):(en?wdsEN[d.getDay()]:'周'+wdsZH[d.getDay()]);
    fRows+='<div class="lr" style="cursor:default">'+wxSvg(daily.weathercode[i],22)+'<span class="lr-lbl" style="font-size:14px">'+dl+'</span><span class="lr-val">'+Math.round(daily.temperature_2m_min[i])+'° – '+Math.round(daily.temperature_2m_max[i])+'°</span><span style="font-size:12px;color:#60a0ff;margin-left:6px">'+(daily.precipitation_probability_mean[i]||0)+'%</span></div>';
  }
  var cDiv=clothes.map(function(c){ return '<div style="display:flex;align-items:center;gap:8px;padding:7px 11px;background:var(--glass-bg2);border:0.5px solid var(--glass-border);border-radius:10px;font-size:13px;color:var(--t1)">'+clothSvg(c[0],14)+' '+escHtml(c[1])+'</div>'; }).join('');
  showModal(
    '<div class="sh"></div>'+
    '<div style="text-align:center;padding:8px 0 18px">'+
      '<div style="width:64px;height:64px;background:var(--glass-bg2);border-radius:20px;display:flex;align-items:center;justify-content:center;margin:0 auto 10px">'+wxSvg(cur.weathercode,34)+'</div>'+
      '<div style="font-size:40px;font-weight:800;color:var(--t1);letter-spacing:-1px">'+temp+'°C</div>'+
      '<div style="font-size:15px;color:var(--t2);margin-top:4px">'+wxDesc(cur.weathercode)+'</div>'+
      '<div style="font-size:12px;color:var(--t3);margin-top:3px">'+cur.relative_humidity_2m+'% · '+wind+'km/h</div>'+
    '</div>'+
    '<div class="sec-ttl" style="padding:0 2px 8px">'+(en?'Forecast':'天气预报')+'</div>'+
    '<div class="list" style="margin-bottom:16px">'+fRows+'</div>'+
    '<div class="sec-ttl" style="padding:0 2px 8px">'+(en?'What to wear today':'今日穿搭建议')+'</div>'+
    '<div style="display:flex;flex-wrap:wrap;gap:8px">'+cDiv+'</div>'
  );
};

// ── TRAVEL DOCS WIDGET ───────────────────────────────────────────
function renderTravelDocsWidget(){
  var en=S.lang==='en';
  var docs=S.travelDocs||[];
  var html='<div class="travel-docs-widget">'+
    '<div class="tdw-header" onclick="showTravelDocsModal()">'+
      '<div style="width:28px;height:28px;background:rgba(var(--blue-rgb),0.15);border-radius:8px;display:flex;align-items:center;justify-content:center">'+
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+IC.flight+'</svg>'+
      '</div>'+
      '<div style="flex:1;font-size:14px;font-weight:600;color:var(--t1)">'+t('travelDocs')+'</div>'+
      '<div class="nbtn" style="width:28px;height:28px" onclick="event.stopPropagation();showAddTravelDoc()">'+ic('plus',13)+'</div>'+
    '</div>';
  if(!docs.length){
    html+='<div class="tdw-empty"><div class="tdw-empty-text">'+t('noTravelDocs')+'</div>'+
      '<button class="btn btn-g" style="padding:7px 16px;font-size:13px" onclick="showAddTravelDoc()">'+ic('plus',13)+' '+t('addFirst')+'</button></div>';
  } else {
    // Show first 3
    docs.slice(0,3).forEach(function(doc){
      var typeColor={flight:'#0A84FF',hotel:'#30D158',train:'#FF9F0A',ferry:'#BF5AF2'}[doc.type]||'#8E8E93';
      var typeLbl={flight:t('flight'),hotel:t('hotel'),train:t('train'),ferry:t('ferry')}[doc.type]||doc.type;
      var iconN={flight:'flight',hotel:'hotel2',train:'train',ferry:'globe'}[doc.type]||'globe';
      var main='',sub='';
      if(doc.type==='flight'){ main=escHtml((doc.airline||'')+' '+doc.flightNo); sub=escHtml((doc.from||'')+'→'+(doc.to||'')+' '+((doc.depart||'').substring(0,16))); }
      else if(doc.type==='hotel'){ main=escHtml(doc.hotelName||''); sub=escHtml(t('checkIn')+' '+doc.checkIn+' · '+t('checkOut')+' '+doc.checkOut); }
      else if(doc.type==='train'){ main=escHtml((doc.trainNo||'')); sub=escHtml((doc.from||'')+'→'+(doc.to||'')+' '+(doc.depart||'').substring(0,16)); }
      else { main=escHtml(doc.title||typeLbl); sub=''; }
      // Member tags
      var memDoc=S.members[doc.memberId];
      var tagColor=memDoc?memDoc.color:typeColor;
      var tagName=doc.memberId===S.memberId?t('you'):(memDoc?memDoc.name:'?');
      html+='<div class="tdw-doc" onclick="showTravelDocDetail(\''+doc.id+'\')">'+
        '<div class="tdw-doc-icon" style="background:'+typeColor+'22">'+
          '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="'+typeColor+'" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+IC[iconN||'plane']+'</svg>'+
        '</div>'+
        '<div class="tdw-doc-info">'+
          '<div class="tdw-doc-title">'+main+'</div>'+
          (sub?'<div class="tdw-doc-sub">'+sub+'</div>':'')+
          '<div class="tdw-members"><span class="tdw-member-tag" style="background:'+tagColor+'">'+escHtml(tagName)+'</span></div>'+
        '</div>'+
      '</div>';
    });
    if(docs.length>3) html+='<div style="padding:10px 14px;font-size:13px;color:var(--t3);cursor:pointer;text-align:center" onclick="showTravelDocsModal()">'+t('showAll')+' ('+docs.length+') →</div>';
  }
  html+='</div>';
  return html;
}
window.showTravelDocsModal=function(){
  var docs=S.travelDocs||[],en=S.lang==='en';
  var docsHtml='';
  docs.forEach(function(doc){
    var typeColor={flight:'#0A84FF',hotel:'#30D158',train:'#FF9F0A',ferry:'#BF5AF2'}[doc.type]||'#8E8E93';
    var typeLbl={flight:t('flight'),hotel:t('hotel'),train:t('train'),ferry:t('ferry')}[doc.type]||doc.type;
    var main='',sub='';
    if(doc.type==='flight'){ main=(doc.airline||'')+' '+doc.flightNo; sub=(doc.from||'')+'→'+(doc.to||'')+' '+((doc.depart||'').substring(0,16)); }
    else if(doc.type==='hotel'){ main=doc.hotelName||''; sub=t('checkIn')+' '+doc.checkIn+' – '+t('checkOut')+' '+doc.checkOut; }
    else { main=doc.title||typeLbl; sub=''; }
    var mem=S.members[doc.memberId]; var memName=doc.memberId===S.memberId?t('you'):(mem?mem.name:'?');
    docsHtml+='<div class="lr">'+
      '<div style="width:10px;height:10px;border-radius:50%;background:'+typeColor+';flex-shrink:0"></div>'+
      '<div style="flex:1"><div style="font-size:15px;font-weight:600;color:var(--t1)">'+escHtml(main)+'</div>'+
        (sub?'<div style="font-size:12px;color:var(--t2)">'+escHtml(sub)+'</div>':'')+
        '<div style="font-size:11px;color:var(--t3)">'+escHtml(memName)+'</div>'+
      '</div>'+
      '<div class="nbtn" style="width:28px;height:28px;flex-shrink:0" onclick="deleteTravelDoc(\''+doc.id+'\')">'+ic('trash',12)+'</div>'+
    '</div>';
  });
  showModal('<div class="sh"></div>'+
    '<div style="display:flex;align-items:center;margin-bottom:16px"><div class="sheet-title" style="margin-bottom:0;flex:1">'+t('travelDocs')+'</div><div class="nbtn" onclick="closeModal();setTimeout(showAddTravelDoc,200)">'+ic('plus',16)+'</div></div>'+
    (docsHtml?'<div class="list" style="margin-bottom:14px">'+docsHtml+'</div>':'<div style="text-align:center;padding:30px;color:var(--t3)">'+t('noTravelDocs')+'</div>')+
    '<button class="btn btn-p btn-full" onclick="closeModal();setTimeout(showAddTravelDoc,200)">'+ic('plus',15)+' '+t('addFlight')+'/'+t('addHotel')+'</button>');
};
window.showAddTravelDoc=function(){
  var typeOpts=['flight','hotel','train','ferry'].map(function(tp){ return '<option value="'+tp+'">'+t(tp)+'</option>'; }).join('');
  var memOpts=Object.entries(S.members).map(function(entry){ var id=entry[0],m=entry[1]; return '<option value="'+id+'"'+(id===S.memberId?' selected':'')+'>'+escHtml(m.name+(id===S.memberId?' ('+t('you')+')':''))+'</option>'; }).join('');
  showModal('<div class="sh"></div><div class="sheet-title">'+t('travelDocs')+'</div>'+
    '<div class="inp-lbl">'+t('docType')+'</div>'+
    '<select class="inp" id="td-type" style="margin-bottom:10px" onchange="updateTravelDocForm()">'+typeOpts+'</select>'+
    '<div class="inp-lbl">'+t('members')+'</div>'+
    '<select class="inp" id="td-mem" style="margin-bottom:10px">'+memOpts+'</select>'+
    '<div id="td-form"></div>'+
    '<button class="btn btn-p btn-full" onclick="submitTravelDoc()" style="margin-top:4px">'+t('save')+'</button>');
  updateTravelDocForm();
};
window.updateTravelDocForm=function(){
  var tp=$('#td-type')&&$('#td-type').value;
  var fm=$('#td-form'); if(!fm) return;
  if(tp==='flight') fm.innerHTML=
    '<div class="inp-lbl">'+t('flightNo')+'</div><input class="inp" id="td-flightno" placeholder="CX234" style="margin-bottom:10px">'+
    '<div class="inp-lbl">'+t('airline')+'</div><input class="inp" id="td-airline" placeholder="Cathay Pacific" style="margin-bottom:10px">'+
    '<div style="display:flex;gap:8px;margin-bottom:10px"><div style="flex:1"><div class="inp-lbl">'+t('from')+'</div><input class="inp" id="td-from" placeholder="HKG"></div><div style="flex:1"><div class="inp-lbl">'+t('to')+'</div><input class="inp" id="td-to" placeholder="ICN"></div></div>'+
    '<div class="inp-lbl">'+t('depart')+'</div><input class="inp" id="td-depart" type="datetime-local" style="margin-bottom:10px">'+
    '<div class="inp-lbl">'+t('arrive')+'</div><input class="inp" id="td-arrive" type="datetime-local" style="margin-bottom:10px">'+
    '<div style="display:flex;gap:8px;margin-bottom:10px"><div style="flex:1"><div class="inp-lbl">'+t('terminal')+'</div><input class="inp" id="td-terminal" placeholder="T1"></div><div style="flex:1"><div class="inp-lbl">'+t('seat')+'</div><input class="inp" id="td-seat" placeholder="12A"></div></div>';
  else if(tp==='hotel') fm.innerHTML=
    '<div class="inp-lbl">'+t('hotelName')+'</div><input class="inp" id="td-hotelname" style="margin-bottom:10px">'+
    '<div class="inp-lbl">'+t('address')+'</div><input class="inp" id="td-address" style="margin-bottom:10px">'+
    '<div style="display:flex;gap:8px;margin-bottom:10px"><div style="flex:1"><div class="inp-lbl">'+t('checkIn')+'</div><input class="inp" id="td-checkin" type="date"></div><div style="flex:1"><div class="inp-lbl">'+t('checkOut')+'</div><input class="inp" id="td-checkout" type="date"></div></div>'+
    '<div style="display:flex;gap:8px;margin-bottom:10px"><div style="flex:1"><div class="inp-lbl">'+t('confirmNo')+'</div><input class="inp" id="td-confirm" placeholder="ABC123"></div><div style="flex:1"><div class="inp-lbl">'+t('room')+'</div><input class="inp" id="td-room" placeholder="302"></div></div>';
  else fm.innerHTML='<div class="inp-lbl">'+t('desc')+'</div><input class="inp" id="td-title" style="margin-bottom:10px">'+
    '<div class="inp-lbl">'+t('depart')+'</div><input class="inp" id="td-depart" type="datetime-local" style="margin-bottom:10px">'+
    '<div class="inp-lbl">'+t('from')+'</div><input class="inp" id="td-from" placeholder="出发" style="margin-bottom:10px">'+
    '<div class="inp-lbl">'+t('to')+'</div><input class="inp" id="td-to" placeholder="到达" style="margin-bottom:10px">';
};
window.submitTravelDoc=async function(){
  var tp=$('#td-type')&&$('#td-type').value,mem=$('#td-mem')&&$('#td-mem').value;
  var data={type:tp,memberId:mem};
  if(tp==='flight'){ Object.assign(data,{flightNo:$('#td-flightno')&&$('#td-flightno').value,airline:$('#td-airline')&&$('#td-airline').value,from:$('#td-from')&&$('#td-from').value,to:$('#td-to')&&$('#td-to').value,depart:$('#td-depart')&&$('#td-depart').value,arrive:$('#td-arrive')&&$('#td-arrive').value,terminal:$('#td-terminal')&&$('#td-terminal').value,seat:$('#td-seat')&&$('#td-seat').value}); }
  else if(tp==='hotel'){ Object.assign(data,{hotelName:$('#td-hotelname')&&$('#td-hotelname').value,address:$('#td-address')&&$('#td-address').value,checkIn:$('#td-checkin')&&$('#td-checkin').value,checkOut:$('#td-checkout')&&$('#td-checkout').value,confirmNo:$('#td-confirm')&&$('#td-confirm').value,room:$('#td-room')&&$('#td-room').value}); }
  else { Object.assign(data,{title:$('#td-title')&&$('#td-title').value,from:$('#td-from')&&$('#td-from').value,to:$('#td-to')&&$('#td-to').value,depart:$('#td-depart')&&$('#td-depart').value}); }
  showLoad(); await fbSaveTravelDoc(data); hideLoad(); closeModal(); renderHome(); toast(t('save'));
};
window.deleteTravelDoc=async function(id){ if(!confirm(t('del')+'?')) return; showLoad(); await fbDeleteTravelDoc(id); hideLoad(); closeModal(); renderHome(); };
window.showTravelDocDetail=function(id){
  var doc=S.travelDocs.find(function(d){ return d.id===id; }); if(!doc) return;
  var rows=''; Object.keys(doc).forEach(function(k){ if(k==='id'||k==='type'||k==='memberId'||!doc[k]) return; var lbl=t(k)||k; rows+='<div class="lr" style="cursor:default"><span class="lr-lbl">'+escHtml(lbl)+'</span><span class="lr-val" style="max-width:200px;word-break:break-all">'+escHtml(String(doc[k]))+'</span></div>'; });
  showModal('<div class="sh"></div><div style="font-size:20px;font-weight:700;margin-bottom:14px;color:var(--t1)">'+t(doc.type||'flight')+'</div>'+
    '<div class="list" style="margin-bottom:14px">'+rows+'</div>'+
    '<button class="btn btn-d btn-full" onclick="deleteTravelDoc(\''+id+'\');closeModal()">'+ic('trash',15)+' '+t('del')+'</button>');
};

// ── PHOTO BOARD WIDGET ───────────────────────────────────────────
function renderPhotoBoardWidget(){
  var en=S.lang==='en';
  var photos=S.photoBoard||[];
  var html='<div class="photo-board-widget">'+
    '<div class="pbw-header">'+
      '<div class="sec-ttl" style="margin-bottom:0;flex:1">'+t('photoBoard')+'</div>'+
      '<div onclick="showPhotoGallery()" style="font-size:12px;color:var(--t3);cursor:pointer;padding:3px 9px;border-radius:8px;border:0.5px solid var(--glass-border);display:flex;align-items:center;gap:4px">'+ic('img',11)+' '+(en?'All':'全部')+'</div>'+
    '</div>'+
    '<div class="pbw-scroll">';
  html+='<div class="pbw-add" onclick="addPhotoToBoard()">'+ic('plus',22)+'<div style="font-size:11px;color:var(--t3)">'+(en?'Add':'添加')+'</div></div>';
  photos.slice(0,10).forEach(function(photo,i){
    html+='<div class="pbw-photo" onclick="showPhotoGallery('+i+')">'+
      (photo.url?'<img src="'+photo.url+'" alt="">':'<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center">'+ic('img',24)+'</div>')+
      (photo.category?'<div class="pbw-photo-cat">'+escHtml(photo.category)+'</div>':'')+
    '</div>';
  });
  html+='</div></div>';
  return html;
}
window.addPhotoToBoard=function(){
  var en=S.lang==='en';
  var cats=[t('catLandscape'),t('catFood'),t('catArchitecture'),t('catPeople'),t('catTransport'),t('catMisc')];
  var catChips=cats.map(function(c,i){ return '<div class="chip '+(i===0?'on':'')+'" data-c="'+c+'" onclick="$$(\'.pb-cat.chip\').forEach(function(cc){cc.classList.remove(\'on\')});this.classList.add(\'on\')" class="chip pb-cat">'+c+'</div>'; }).join('');
  showModal('<div class="sh"></div><div class="sheet-title">'+t('addPhotoBoard')+'</div>'+
    '<div id="pb-preview" style="margin-bottom:10px"></div>'+
    '<div style="display:flex;gap:8px;margin-bottom:12px">'+
      '<button class="btn btn-g" style="flex:1;padding:11px" onclick="pickPhotoBoard(\'camera\')">'+ic('camera',15)+' '+t('fromCamera')+'</button>'+
      '<button class="btn btn-g" style="flex:1;padding:11px" onclick="pickPhotoBoard(\'album\')">'+ic('img',15)+' '+t('fromAlbum')+'</button>'+
    '</div>'+
    '<div class="inp-lbl">'+t('photoCat')+'</div>'+
    '<div class="chips" style="margin-bottom:12px" id="pb-cats">'+catChips+'</div>'+
    '<div class="inp-lbl">Caption</div>'+
    '<input class="inp" id="pb-cap" placeholder="'+(en?'Write a caption…':'写个说明…')+'" style="margin-bottom:14px">'+
    '<button class="btn btn-p btn-full" id="pb-submit" disabled onclick="submitPhotoBoard()">'+t('save')+'</button>');
};
window.pickPhotoBoard=function(src){
  var inp=document.createElement('input'); inp.type='file'; inp.accept='image/*';
  if(src==='camera') inp.capture='environment';
  inp.onchange=async function(){
    var f=inp.files[0]; if(!f) return;
    showLoad();
    var rd=new FileReader(); rd.onload=async function(e){
      var compressed=await compressImage(e.target.result,800,0.75);
      hideLoad();
      var prev=$('#pb-preview'); if(prev) prev.innerHTML='<img src="'+compressed+'" style="width:100%;border-radius:var(--r2);max-height:180px;object-fit:cover;margin-bottom:4px">';
      var btn=$('#pb-submit'); if(btn) btn.disabled=false;
      window._pbImage=compressed;
    }; rd.readAsDataURL(f);
  };
  inp.click();
};
window.submitPhotoBoard=async function(){
  if(!window._pbImage){ toast('请先选择图片'); return; }
  var cat=$('.pb-cat.chip.on')&&$('.pb-cat.chip.on').dataset.c||t('catMisc');
  var cap=$('#pb-cap')&&$('#pb-cap').value.trim()||'';
  showLoad();
  await fbAddPhoto({url:window._pbImage,category:cat,caption:cap});
  window._pbImage=null; hideLoad(); closeModal(); toast(t('save'));
};
window.showPhotoGallery=function(startIdx){
  var photos=S.photoBoard||[]; startIdx=startIdx||0;
  if(!photos.length){ toast(t('noPhotos')); return; }
  var curr=startIdx;
  var ov=document.createElement('div'); ov.className='gallery-ov';
  function render(){
    var p=photos[curr]||{};
    var thumbs=photos.map(function(ph,i){ return '<div class="gallery-thumb '+(i===curr?'on':'')+'" onclick="window._galleryGo('+i+')">'+
      (ph.url?'<img src="'+ph.url+'" alt="">':'<div style="width:100%;height:100%;background:var(--glass-bg2)"></div>')+
    '</div>'; }).join('');
    ov.innerHTML='<div class="gallery-nav">'+
      '<div class="nbtn" onclick="document.querySelector(\'.gallery-ov\').remove()">'+ic('chev',16)+'</div>'+
      '<div style="flex:1;text-align:center;font-size:13px;color:rgba(255,255,255,.7)">'+(curr+1)+'/'+photos.length+(p.caption?': '+escHtml(p.caption):'')+'</div>'+
      '<div class="nbtn" onclick="if(confirm(\'Delete?\')) { fbDeletePhoto(\''+p.id+'\'); window._gallery.close(); }">'+ic('trash',14)+'</div>'+
    '</div>'+
    '<div class="gallery-img-wrap" id="gimg">'+
      (p.url?'<img src="'+p.url+'" alt="" id="gmain">':'<div style="color:rgba(255,255,255,.3)">No image</div>')+
    '</div>'+
    '<div class="gallery-strip">'+thumbs+'</div>';
    // Touch swipe
    var img=ov.querySelector('#gimg');
    var sx=0;
    if(img){ img.addEventListener('touchstart',function(e){ sx=e.touches[0].clientX; },{passive:true}); img.addEventListener('touchend',function(e){ var dx=e.changedTouches[0].clientX-sx; if(Math.abs(dx)>50){ if(dx<0&&curr<photos.length-1){ curr++; render(); } else if(dx>0&&curr>0){ curr--; render(); } } },{passive:true}); }
  }
  render();
  window._galleryGo=function(i){ curr=i; render(); };
  window._gallery={close:function(){ ov.remove(); S.photoBoard=S.photoBoard.filter(function(p){ return p.id!==photos[curr].id; }); if(S.tab==='home') renderHome(); }};
  document.body.appendChild(ov);
};

// ── JOURNAL WIDGET ───────────────────────────────────────────────
function renderJournalWidget(){
  var en=S.lang==='en';
  var todayEntry=S.journal.find(function(e){ return e.date===today()&&(e.ownerId===S.memberId||e.visibility==='shared'); });
  var moods=['😶','😢','😐','😊','🤩'];
  return '<div class="journal-widget" onclick="showJournalModal()">'+
    '<div class="journal-header">'+
      '<div style="width:28px;height:28px;background:rgba(var(--purple),0.15);border-radius:8px;display:flex;align-items:center;justify-content:center;background:rgba(191,90,242,0.15)">'+
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#BF5AF2" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+IC.journal+'</svg>'+
      '</div>'+
      '<div style="flex:1;font-size:14px;font-weight:600;color:var(--t1)">'+t('journal')+'</div>'+
      '<div style="font-size:12px;color:var(--t3)">'+ic('chev',14)+'</div>'+
    '</div>'+
    '<div class="journal-preview">'+
      (todayEntry?
        '<div class="journal-preview-text">'+escHtml(todayEntry.content||'')+'</div>'+
        '<div class="journal-date">'+today()+'</div>':
        '<div class="journal-empty-text">'+t('journalPrompt')+'</div>')+
    '</div>'+
  '</div>';
}
window.showJournalModal=function(){
  renderJournalSheet();
};
function renderJournalSheet(){
  var entries=S.journal.filter(function(e){ return e.ownerId===S.memberId||(e.visibility==='shared'); });
  var en=S.lang==='en';
  var todayEntry=entries.find(function(e){ return e.date===today(); });
  var otherEntries=entries.filter(function(e){ return e.date!==today(); }).sort(function(a,b){ return b.date.localeCompare(a.date); });
  var html='<div class="sh"></div>'+
    '<div style="display:flex;align-items:center;margin-bottom:16px">'+
      '<div class="sheet-title" style="margin-bottom:0;flex:1">'+t('journal')+'</div>'+
      '<div class="nbtn" onclick="showNewJournalEntry()">'+ic('plus',16)+'</div>'+
    '</div>';
  // Today entry
  html+='<div style="font-size:12px;font-weight:600;color:var(--t3);letter-spacing:.5px;text-transform:uppercase;margin-bottom:8px">'+t('today')+'</div>';
  if(todayEntry){
    html+='<div class="journal-entry-card" onclick="editJournalEntry(\''+todayEntry.id+'\')">'+
      '<div class="journal-entry-header">'+
        '<div class="journal-mood-icon">'+(todayEntry.mood?['😶','😢','😐','😊','🤩'][todayEntry.mood-1]:'✏️')+'</div>'+
        '<div style="flex:1;font-size:12px;color:var(--t3)">'+todayEntry.date+(todayEntry.visibility==='shared'?' · '+t('shared'):'')+'</div>'+
      '</div>'+
      '<div class="journal-entry-body"><div class="journal-entry-text">'+escHtml(todayEntry.content||'')+'</div></div>'+
    '</div>';
  } else {
    html+='<button class="btn btn-g btn-full" style="margin-bottom:14px" onclick="closeModal();setTimeout(showNewJournalEntry,200)">'+ic('edit',15)+' '+t('writeNote')+'</button>';
  }
  // Other entries
  if(otherEntries.length){
    html+='<div style="font-size:12px;font-weight:600;color:var(--t3);letter-spacing:.5px;text-transform:uppercase;margin:14px 0 8px">'+t('history')+'</div>';
    otherEntries.slice(0,10).forEach(function(e){
      html+='<div class="journal-entry-card" onclick="editJournalEntry(\''+e.id+'\')">'+
        '<div class="journal-entry-header">'+
          '<div class="journal-mood-icon">'+(e.mood?['😶','😢','😐','😊','🤩'][e.mood-1]:'✏️')+'</div>'+
          '<div style="flex:1;font-size:12px;color:var(--t3)">'+e.date+(e.visibility==='shared'?' · '+t('shared'):'')+'</div>'+
        '</div>'+
        '<div class="journal-entry-body"><div class="journal-entry-text">'+escHtml(e.content||'')+'</div></div>'+
        (e.photos&&e.photos.length?'<div class="journal-photos-strip">'+e.photos.map(function(p){ return '<div class="journal-photo-thumb"><img src="'+p+'" alt=""></div>'; }).join('')+'</div>':'')+
      '</div>';
    });
  }
  if(!entries.length) html+='<div style="text-align:center;padding:30px;color:var(--t3)">'+t('noJournal')+'</div>';
  showModal(html);
}
window.showNewJournalEntry=function(){
  var d=today(),moods=[1,2,3,4,5];
  var moodEmojis=['😶','😢','😐','😊','🤩'];
  var moodLabels=[t('moodBad'),t('moodBad'),t('moodOk'),t('moodGood'),t('moodGreat')];
  var moodHtml=moods.map(function(m,i){ return '<div style="text-align:center;cursor:pointer;padding:6px;border-radius:10px;transition:all .15s" id="mood-'+m+'" onclick="selectJMood('+m+')" class="jmood">'+moodEmojis[i]+'<div style="font-size:10px;color:var(--t3);margin-top:2px">'+moodLabels[i]+'</div></div>'; }).join('');
  showModal('<div class="sh"></div><div class="sheet-title">'+t('newEntry')+'</div>'+
    '<div class="inp-lbl">'+today()+'</div>'+
    '<div style="display:flex;justify-content:space-around;margin-bottom:14px;padding:8px;background:var(--glass-bg);border:0.5px solid var(--glass-border);border-radius:var(--r2)">'+moodHtml+'</div>'+
    '<textarea class="inp" id="je-content" placeholder="'+t('writeNote')+'" style="min-height:160px;margin-bottom:10px"></textarea>'+
    '<div style="display:flex;align-items:center;margin-bottom:14px">'+
      '<span style="font-size:14px;font-weight:500;color:var(--t1);flex:1">'+t('visibility')+'</span>'+
      '<select class="inp" id="je-vis" style="width:auto;padding:7px 12px">'+
        '<option value="private">'+t('private')+'</option>'+
        '<option value="shared">'+t('shared')+'</option>'+
      '</select>'+
    '</div>'+
    '<div style="display:flex;gap:8px;margin-bottom:14px">'+
      '<button class="btn btn-g" style="flex:1;padding:10px" onclick="addJournalPhoto()">'+ic('camera',14)+' '+t('addPhoto')+'</button>'+
    '</div>'+
    '<div id="je-photos" style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px"></div>'+
    '<button class="btn btn-p btn-full" onclick="submitJournalEntry()">'+t('saveEntry')+'</button>');
  window._jMood=3; window._jPhotos=[];
  selectJMood(3);
};
window.selectJMood=function(m){
  window._jMood=m;
  $$('.jmood').forEach(function(el){ el.style.background=''; el.style.opacity='0.5'; });
  var el=$('#mood-'+m); if(el){ el.style.background='var(--glass-bg2)'; el.style.opacity='1'; }
};
window.addJournalPhoto=function(){
  var inp=document.createElement('input'); inp.type='file'; inp.accept='image/*';
  inp.onchange=async function(){
    var f=inp.files[0]; if(!f) return; showLoad();
    var rd=new FileReader(); rd.onload=async function(e){
      var compressed=await compressImage(e.target.result,600,0.7); hideLoad();
      window._jPhotos=window._jPhotos||[]; window._jPhotos.push(compressed);
      var pDiv=$('#je-photos'); if(pDiv){
        pDiv.innerHTML=window._jPhotos.map(function(p,i){ return '<div style="width:72px;height:72px;border-radius:8px;overflow:hidden;position:relative;cursor:pointer" onclick="window._jPhotos.splice('+i+',1);addJournalPhoto()"><img src="'+p+'" style="width:100%;height:100%;object-fit:cover"></div>'; }).join('');
      }
    }; rd.readAsDataURL(f);
  }; inp.click();
};
window.submitJournalEntry=async function(){
  var content=$('#je-content')&&$('#je-content').value.trim();
  var vis=$('#je-vis')&&$('#je-vis').value||'private';
  if(!content){ toast('请输入内容'); return; }
  var entry={id:'jl_'+Date.now(),date:today(),ownerId:S.memberId,content:content,mood:window._jMood||3,photos:window._jPhotos||[],visibility:vis,createdAt:new Date().toISOString()};
  showLoad(); await fbSaveJournalEntry(entry);
  S.journal=JSON.parse(localStorage.getItem('journal_'+S.tripCode)||'[]');
  hideLoad(); closeModal(); toast(t('save')); if(S.tab==='home') renderHome();
};
window.editJournalEntry=function(id){
  var entry=S.journal.find(function(e){ return e.id===id; }); if(!entry) return;
  showModal('<div class="sh"></div><div class="sheet-title">'+t('editItem')+'</div>'+
    '<textarea class="inp" id="eje-content" style="min-height:160px;margin-bottom:14px">'+escHtml(entry.content||'')+'</textarea>'+
    '<button class="btn btn-p btn-full" onclick="submitEditJournalEntry(\''+id+'\')" style="margin-bottom:8px">'+t('save')+'</button>'+
    '<button class="btn btn-d btn-full" onclick="deleteJournalEntry(\''+id+'\')">'+ic('trash',15)+' '+t('del')+'</button>');
};
window.submitEditJournalEntry=async function(id){
  var content=$('#eje-content')&&$('#eje-content').value.trim(); if(!content) return;
  var entry=S.journal.find(function(e){ return e.id===id; }); if(!entry) return;
  entry.content=content;
  showLoad(); await fbSaveJournalEntry(entry);
  S.journal=JSON.parse(localStorage.getItem('journal_'+S.tripCode)||'[]');
  hideLoad(); closeModal(); toast(t('save')); if(S.tab==='home') renderHome();
};
window.deleteJournalEntry=function(id){
  if(!confirm(t('del')+'?')) return;
  S.journal=S.journal.filter(function(e){ return e.id!==id; });
  localStorage.setItem('journal_'+S.tripCode,JSON.stringify(S.journal));
  closeModal(); if(S.tab==='home') renderHome();
};

// ── CUSTOM APPS MODAL ────────────────────────────────────────────
window.showCustomAppsModal=function(){
  var current=getQuickApps();
  var allKeys=Object.keys(ALL_APPS);
  var region=detectRegion(),preset=REGION_PRESETS[region]||REGION_PRESETS.default;
  var html='<div class="sh"></div>'+
    '<div style="display:flex;align-items:center;margin-bottom:4px">'+
      '<div class="nbtn" onclick="closeModal()">'+ic('chev',16)+'</div>'+
      '<div class="sheet-title" style="margin-bottom:0;flex:1;text-align:center">'+t('customApps')+'</div>'+
      '<div class="nbtn" onclick="resetCustomApps()">'+ic('refresh',14)+'</div>'+
    '</div>'+
    '<div style="font-size:12px;color:var(--t3);margin-bottom:12px;text-align:center">'+t('customAppsDesc')+' · '+t('regionDetected')+': '+preset.name+'</div>';
  // List style (like screenshot)
  html+='<div class="list">';
  allKeys.forEach(function(key){
    var app=ALL_APPS[key]; if(!app) return;
    var on=current.indexOf(key)>=0;
    var customIcon=S.customAppIcons&&S.customAppIcons[key];
    var iconHtml=customIcon?
      '<div style="width:32px;height:32px;border-radius:8px;overflow:hidden"><img src="'+customIcon+'" style="width:100%;height:100%;object-fit:cover"></div>':
      '<div style="width:32px;height:32px;border-radius:8px;background:var(--glass-bg2);display:flex;align-items:center;justify-content:center"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--t2)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+IC[app.icon||'globe']+'</svg></div>';
    html+='<div class="lr '+(on?'':'')+'">'+
      iconHtml+
      '<span class="lr-lbl">'+escHtml(getAppLabel(key))+'</span>'+
      // Custom icon upload
      '<div class="nbtn" style="width:26px;height:26px;margin-right:6px;opacity:0.5" onclick="uploadAppIcon(\''+key+'\')">'+ic('camera',11)+'</div>'+
      '<div style="width:30px;height:30px;border-radius:50%;border:1.5px solid '+(on?'var(--green)':'var(--glass-border2)')+';background:'+(on?'rgba(var(--green-rgb),0.15)':'var(--glass-bg)')+';display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;transition:all .18s var(--spring)" id="qa-chip-'+key+'" onclick="toggleQAApp(\''+key+'\')">'+
        (on?ic('check',13):'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--t3)" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>')+
      '</div>'+
    '</div>';
  });
  html+='</div>'+
    '<button class="btn btn-p btn-full" onclick="saveCustomApps()" style="margin-top:14px">'+t('save')+'</button>';
  showModal(html);
};
window.uploadAppIcon=function(key){
  var inp=document.createElement('input'); inp.type='file'; inp.accept='image/*';
  inp.onchange=async function(){
    var f=inp.files[0]; if(!f) return; showLoad();
    var rd=new FileReader(); rd.onload=async function(e){
      var compressed=await compressImage(e.target.result,80,0.8); hideLoad();
      if(!S.customAppIcons) S.customAppIcons={};
      S.customAppIcons[key]=compressed;
      localStorage.setItem('customAppIcons',JSON.stringify(S.customAppIcons));
      closeModal(); setTimeout(showCustomAppsModal,200);
    }; rd.readAsDataURL(f);
  }; inp.click();
};
window.toggleQAApp=function(key){
  var current=getQuickApps();
  var idx=current.indexOf(key);
  if(idx>=0){ current.splice(idx,1); }
  else { if(current.length>=8){ toast('最多选8个'); return; } current.push(key); }
  S.customApps=current;
  var btn=$('#qa-chip-'+key); if(!btn) return;
  var on=current.indexOf(key)>=0;
  btn.style.border='1.5px solid '+(on?'var(--green)':'var(--glass-border2)');
  btn.style.background=on?'rgba(var(--green-rgb),0.15)':'var(--glass-bg)';
  btn.innerHTML=on?ic('check',13):'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--t3)" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>';
};
window.saveCustomApps=function(){ localStorage.setItem('customApps',JSON.stringify(S.customApps)); closeModal(); renderHome(); toast(t('save')); };
window.resetCustomApps=function(){ S.customApps=null; localStorage.removeItem('customApps'); closeModal(); renderHome(); };

// ── TRIP CODE MODAL ──────────────────────────────────────────────
window.showTripCodeModal=function(){
  showModal('<div class="sh"></div><div style="font-size:20px;font-weight:700;margin-bottom:14px">'+t('code')+'</div><div class="code-disp" style="margin-bottom:14px">'+(S.tripCode||'------')+'</div><div style="font-size:13px;color:var(--t2);text-align:center;margin-bottom:16px;line-height:1.6">'+t('codeShare')+'</div><div style="display:flex;gap:8px"><button class="btn btn-g" style="flex:1" onclick="copyCode()">'+ic('copy',15)+' '+t('copy')+'</button><button class="btn btn-p" style="flex:1" onclick="shareCode()">'+ic('share',15)+' '+t('share')+'</button></div>');
};
window.copyCode=function(){ if(navigator.clipboard) navigator.clipboard.writeText(S.tripCode||'').then(function(){ toast(t('codeCopied')); }); };
window.shareCode=function(){ if(navigator.share) navigator.share({title:'Travoo',text:'行程码 '+S.tripCode,url:location.href}); else copyCode(); };

// ── ITINERARY ────────────────────────────────────────────────────
var _itinDay=0;
function renderItin(){
  var v=$('#v-itin'); if(!v) return;
  var days=getDays(),todayIdx=days.findIndex(function(d){ return d.date===today(); });
  _itinDay=todayIdx>=0?todayIdx:0;
  var tabsHtml='';
  days.forEach(function(d,i){
    var cls='dtab'+(i===_itinDay?' on':'')+(d.date===today()?' today':'');
    tabsHtml+='<div class="'+cls+'" id="dtab-'+i+'" onclick="jumpToDay('+i+')">'+
      '<div class="dtab-wd">'+getWdLabel(d.wd)+'</div>'+
      '<div class="dtab-d">'+d.day+'</div></div>';
  });
  var pagesHtml='';
  days.forEach(function(day,di){
    var itemsHtml=''; day.items.forEach(function(item){ itemsHtml+=renderActCard(item); });
    var canUp=di>0,canDown=di<days.length-1;
    pagesHtml+='<div class="itin-page" id="ipg-'+di+'">'+
      '<div class="day-hdr">'+
        '<div class="day-hdr-title" onclick="editDayTitle('+di+')">'+escHtml(day.title)+'</div>'+
        '<div class="day-hdr-sub">'+day.month+'/'+day.day+' '+getWdLabel(day.wd)+'</div>'+
        '<div class="day-reorder">'+
          (canUp?'<div class="day-reorder-btn" onclick="reorderDay('+di+',-1)">'+ic('arrowup',12)+'</div>':'<div style="width:28px"></div>')+
          (canDown?'<div class="day-reorder-btn" onclick="reorderDay('+di+',1)">'+ic('arrowdn',12)+'</div>':'<div style="width:28px"></div>')+
        '</div>'+
      '</div>'+
      '<div class="li-anim">'+itemsHtml+'</div>'+
      '<div style="margin:4px 16px 10px"><button class="btn btn-g btn-full" style="padding:10px;font-size:13px" onclick="showAddItemModal('+di+')">'+ic('plus',14)+' '+t('addItem')+'</button></div>'+
    '</div>';
  });
  // FIX #18: Empty tap to import
  var emptyHtml=days.length===0?
    '<div class="empty" style="min-height:60dvh;cursor:pointer" onclick="showTripEditModal()">'+
      '<svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="var(--t1)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">'+IC.cal+'</svg>'+
      '<div class="empty-ttl">'+t('notPlanned')+'</div>'+
      '<div class="empty-sub">'+t('importNote')+'</div>'+
      '<button class="btn btn-g" style="margin-top:16px;padding:12px 24px" onclick="event.stopPropagation();showTripEditModal()">'+ic('upload',15)+' '+t('importDataLabel')+'</button>'+
    '</div>':'';
  // FIX #11: Removed prev/next buttons, only edit and add
  v.innerHTML=
    '<div class="nav">'+
      '<div class="nbtn" onclick="showTripEditModal()">'+ic('edit',15)+'</div>'+
      '<div class="nav-title">'+escHtml((S.trip&&S.trip.name)||t('itin'))+'</div>'+
      '<div class="nbtn" onclick="showAddDayModal()">'+ic('plus',15)+'</div>'+
    '</div>'+
    (days.length>0?
      '<div class="day-tabs" id="dtabs">'+tabsHtml+'</div>'+
      '<div class="itin-scroll" id="itin-sl">'+pagesHtml+'</div>':
      emptyHtml);
  var sl=$('#itin-sl');
  if(sl&&_itinDay>0) setTimeout(function(){ sl.scrollTo({left:_itinDay*sl.offsetWidth,behavior:'instant'}); },50);
  if(sl){ sl.addEventListener('scroll',function(){ var idx=Math.round(sl.scrollLeft/sl.offsetWidth); if(idx!==_itinDay){ _itinDay=idx; $$('.dtab').forEach(function(d,i){ d.classList.toggle('on',i===idx); d.classList.toggle('today',getDays()[i]&&getDays()[i].date===today()); }); var tab=$('#dtab-'+idx); if(tab) tab.scrollIntoView({behavior:'smooth',block:'nearest',inline:'center'}); } },{passive:true}); }
}
window.reorderDay=async function(di,dir){ var days=JSON.parse(JSON.stringify(getDays())); var ni=di+dir; if(ni<0||ni>=days.length) return; var tmp=days[di]; days[di]=days[ni]; days[ni]=tmp; showLoad(); await fbSaveDays(days); hideLoad(); renderItin(); };
window.editDayTitle=function(di){ var days=getDays(); if(!days[di]) return; showModal('<div class="sh"></div><div class="sheet-title">'+t('editDayTitle')+'</div><input class="inp" id="edt-t" value="'+escHtml(days[di].title||'')+'" style="margin-bottom:14px"><button class="btn btn-p btn-full" onclick="submitEditDayTitle('+di+')">'+t('save')+'</button>'); };
window.submitEditDayTitle=async function(di){ var title=$('#edt-t')&&$('#edt-t').value.trim(); if(!title) return; var days=JSON.parse(JSON.stringify(getDays())); days[di].title=title; closeModal(); showLoad(); await fbSaveDays(days); hideLoad(); renderItin(); };
function renderActCard(item){
  var spend=spendStr(item),isHi=item.hi&&item.transport;
  var chips=''; if(item.transport&&!isHi) chips+='<span class="act-chip">'+ic('car',10)+' '+escHtml(item.transport)+'</span>'; if(item.lodge) chips+='<span class="act-chip">'+ic('map',10)+' '+escHtml(item.lodge)+'</span>';
  var apps=''; if(item.apps&&item.apps.length) item.apps.forEach(function(a){ if(!ALL_APPS[a]) return; apps+='<div class="act-app" onclick="event.stopPropagation();openApp(\''+a+'\')"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+IC[ALL_APPS[a].icon||'globe']+'</svg> '+escHtml(getAppLabel(a))+'</div>'; });
  return '<div class="act'+(item.urgent?' urgent':'')+'" onclick="showActDetail(\''+item.id+'\')">'+
    '<div class="act-row"><div class="act-tc"><div class="act-time">'+escHtml(item.time)+'</div></div>'+
    '<div class="act-body">'+
      '<div class="act-title">'+renderMentions(item.title)+'</div>'+
      (chips?'<div class="act-meta">'+chips+'</div>':'')+
      (isHi?'<div class="act-ttag"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+IC.train+'</svg> '+escHtml(item.transport)+'</div>':'')+
      (spend?'<div class="act-spend">'+escHtml(spend)+'</div>':'')+
      (item.notes?'<div class="act-note">'+escHtml(item.notes)+'</div>':'')+
      (item.urgent?'<div class="act-note urg">'+ic('bell',11)+' 必须准时离开</div>':'')+
      (apps?'<div class="act-apps">'+apps+'</div>':'')+
    '</div></div>'+
    '<div class="act-edit" onclick="event.stopPropagation();showEditItemModal(\''+item.id+'\')">'+ic('edit',12)+' '+t('editItem')+'</div></div>';
}
window.jumpToDay=function(idx){ _itinDay=idx; var sl=$('#itin-sl'); if(sl) sl.scrollTo({left:idx*sl.offsetWidth,behavior:'smooth'}); $$('.dtab').forEach(function(d,i){ d.classList.toggle('on',i===idx); }); };
window.showActDetail=function(id){
  var item=findItem(id); if(!item) return; var spend=spendStr(item);
  var rows='';
  if(item.transport) rows+='<div class="lr" style="cursor:default;background:var(--glass-bg)"><span class="lr-lbl">'+t('transLabel')+'</span><span class="lr-val">'+escHtml(item.transport)+'</span></div>';
  if(spend) rows+='<div class="lr" style="cursor:default;background:var(--glass-bg)"><span class="lr-lbl">'+t('amount')+'</span><span class="lr-val" style="color:var(--orange);font-weight:700">'+escHtml(spend)+'</span></div>';
  if(item.notes) rows+='<div style="padding:10px 12px;background:rgba(var(--orange-rgb),0.07);border-left:2px solid rgba(var(--orange-rgb),0.4);border-radius:0 8px 8px 0;margin-bottom:8px;font-size:14px;line-height:1.55;color:var(--t1)">'+escHtml(item.notes)+'</div>';
  var appBtns=''; if(item.apps&&item.apps.length){ var btns=''; item.apps.forEach(function(a){ if(!ALL_APPS[a]) return; btns+='<button class="btn btn-g" style="flex:1;min-width:80px;padding:10px;font-size:13px" onclick="openApp(\''+a+'\');closeModal()">'+escHtml(getAppLabel(a))+'</button>'; }); if(btns) appBtns='<div style="margin-top:10px;margin-bottom:12px"><div style="font-size:12px;color:var(--t3);font-weight:600;margin-bottom:8px">'+t('relatedApps')+'</div><div style="display:flex;flex-wrap:wrap;gap:8px">'+btns+'</div></div>'; }
  var safe=item.title.replace(/'/g,"\\'");
  showModal('<div class="sh"></div>'+
    '<div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;color:var(--t3);margin-bottom:6px">'+item.type+'</div>'+
    '<div style="font-size:22px;font-weight:700;line-height:1.35;margin-bottom:14px;color:var(--t1)">'+renderMentions(item.title)+'</div>'+
    (rows?'<div class="list" style="margin-bottom:12px">'+rows+'</div>':'')+
    appBtns+
    '<button class="btn btn-g btn-full" onclick="askAIAbout(\''+safe+'\');closeModal()" style="margin-bottom:8px">'+t('askAIBtn')+'</button>'+
    '<button class="btn btn-g btn-full" onclick="closeModal();showEditItemModal(\''+item.id+'\')">'+ic('edit',15)+' '+t('editItem')+'</button>');
};
window.showEditItemModal=function(id){
  var item=findItem(id); if(!item) return;
  showModal('<div class="sh"></div><div class="sheet-title">'+t('editItem')+'</div>'+
    '<div class="inp-lbl">'+t('timeLabel')+'</div><input class="inp" id="ei-time" value="'+escHtml(item.time||'')+'" placeholder="HH:MM" style="margin-bottom:10px">'+
    '<div class="inp-lbl">'+t('actNameLabel')+'</div><input class="inp" id="ei-title" value="'+escHtml(item.title||'')+'" style="margin-bottom:10px">'+
    '<div class="inp-lbl">'+t('transLabel')+'</div><input class="inp" id="ei-trans" value="'+escHtml(item.transport||'')+'" style="margin-bottom:10px">'+
    '<div style="display:flex;gap:8px;margin-bottom:10px"><div style="flex:1"><div class="inp-lbl">'+t('spendMinLabel')+'</div><input class="inp" id="ei-smin" type="number" value="'+(item.sMin!=null?item.sMin:'')+'"></div><div style="flex:1"><div class="inp-lbl">'+t('spendMaxLabel')+'</div><input class="inp" id="ei-smax" type="number" value="'+(item.sMax!=null?item.sMax:'')+'"></div></div>'+
    '<div class="inp-lbl">'+t('noteLabel')+'</div><textarea class="inp" id="ei-notes" style="margin-bottom:10px">'+escHtml(item.notes||'')+'</textarea>'+
    '<div style="display:flex;gap:8px;margin-bottom:14px">'+
      '<label class="lr" style="flex:1;cursor:pointer;border-radius:var(--r2);background:var(--glass-bg)"><span class="lr-lbl" style="font-size:14px">'+t('importantLabel')+'</span><input type="checkbox" id="ei-hi" '+(item.hi?'checked':'')+' style="width:18px;height:18px"></label>'+
      '<label class="lr" style="flex:1;cursor:pointer;border-radius:var(--r2);background:rgba(var(--red-rgb),0.06)"><span class="lr-lbl" style="font-size:14px;color:var(--red)">'+t('mustOnTime')+'</span><input type="checkbox" id="ei-urg" '+(item.urgent?'checked':'')+' style="width:18px;height:18px"></label>'+
    '</div>'+
    '<button class="btn btn-p btn-full" onclick="submitEditItem(\''+id+'\')" style="margin-bottom:8px">'+t('save')+'</button>'+
    '<button class="btn btn-d btn-full" onclick="deleteItem(\''+id+'\')">'+ic('trash',15)+' '+t('del')+'</button>');
};
window.submitEditItem=async function(id){
  var days=JSON.parse(JSON.stringify(getDays()));
  for(var di=0;di<days.length;di++){ var idx=days[di].items.findIndex(function(i){ return i.id===id; }); if(idx<0) continue; var it=days[di].items[idx]; it.time=($('#ei-time')&&$('#ei-time').value.trim())||it.time; it.title=($('#ei-title')&&$('#ei-title').value.trim())||it.title; it.transport=($('#ei-trans')&&$('#ei-trans').value.trim())||''; it.sMin=($('#ei-smin')&&$('#ei-smin').value!=='')?parseFloat($('#ei-smin').value):null; it.sMax=($('#ei-smax')&&$('#ei-smax').value!=='')?parseFloat($('#ei-smax').value):null; it.notes=($('#ei-notes')&&$('#ei-notes').value.trim())||''; it.hi=!!($('#ei-hi')&&$('#ei-hi').checked); it.urgent=!!($('#ei-urg')&&$('#ei-urg').checked); days[di].items[idx]=it; break; }
  closeModal(); showLoad(); await fbSaveDays(days); hideLoad(); toast(t('save')); renderItin();
};
window.deleteItem=async function(id){ if(!confirm(t('confirmDelItem'))) return; var days=JSON.parse(JSON.stringify(getDays())); for(var di=0;di<days.length;di++){ var idx=days[di].items.findIndex(function(i){ return i.id===id; }); if(idx>=0){ days[di].items.splice(idx,1); break; } } closeModal(); showLoad(); await fbSaveDays(days); hideLoad(); renderItin(); };
window.showAddItemModal=function(dayIdx){
  showModal('<div class="sh"></div><div class="sheet-title">'+t('addItem')+'</div>'+
    '<div class="inp-lbl">'+t('timeLabel')+'</div><input class="inp" id="ai-time" placeholder="HH:MM" style="margin-bottom:10px">'+
    '<div class="inp-lbl">'+t('actNameLabel')+'</div><input class="inp" id="ai-title" style="margin-bottom:10px">'+
    '<div class="inp-lbl">'+t('transLabel')+'</div><input class="inp" id="ai-trans" style="margin-bottom:10px">'+
    '<div class="inp-lbl">'+t('spendMinLabel')+'</div><input class="inp" id="ai-spend" type="number" style="margin-bottom:10px">'+
    '<div class="inp-lbl">'+t('noteLabel')+'</div><textarea class="inp" id="ai-notes" style="margin-bottom:14px"></textarea>'+
    '<button class="btn btn-p btn-full" onclick="submitAddItem('+dayIdx+')">'+t('save')+'</button>');
};
window.submitAddItem=async function(di){
  var title=$('#ai-title')&&$('#ai-title').value.trim(); if(!title){ toast('请输入活动名称'); return; }
  var days=JSON.parse(JSON.stringify(getDays())); var spend=($('#ai-spend')&&$('#ai-spend').value!=='')?parseFloat($('#ai-spend').value):null;
  days[di].items.push({id:'u_'+Date.now(),time:($('#ai-time')&&$('#ai-time').value.trim())||'',title:title,transport:($('#ai-trans')&&$('#ai-trans').value.trim())||'',sMin:spend,sMax:spend,notes:($('#ai-notes')&&$('#ai-notes').value.trim())||'',apps:[],type:guessType(title),hi:false,urgent:false,lodge:'',bag:''});
  closeModal(); showLoad(); await fbSaveDays(days); hideLoad(); renderItin(); toast(t('save'));
};
window.showAddDayModal=function(){
  showModal('<div class="sh"></div><div class="sheet-title">'+t('addNewDay')+'</div>'+
    '<div class="inp-lbl">'+t('date')+'</div><input class="inp" id="ad-date" type="date" style="margin-bottom:10px">'+
    '<div class="inp-lbl">'+t('desc')+'</div><input class="inp" id="ad-title" placeholder="Seoul Day 1" style="margin-bottom:14px">'+
    '<button class="btn btn-p btn-full" onclick="submitAddDay()">'+t('save')+'</button>');
};
window.submitAddDay=async function(){
  var date=$('#ad-date')&&$('#ad-date').value; var title=($('#ad-title')&&$('#ad-title').value.trim())||'新的一天';
  if(!date){ toast('请选择日期'); return; }
  var days=JSON.parse(JSON.stringify(getDays())); var d=new Date(date+'T12:00:00'); var wds=['日','一','二','三','四','五','六'];
  days.push({date:date,month:String(d.getMonth()+1),day:String(d.getDate()),wd:wds[d.getDay()],title:title,items:[]});
  days.sort(function(a,b){ return a.date.localeCompare(b.date); }); // FIX #4
  closeModal(); showLoad(); await fbSaveDays(days); hideLoad(); renderItin(); toast(t('addedDay'));
};
window.showTripEditModal=function(){
  var trip=S.trip||{},hasCfg=!!(S.aiConfig.apiKey&&S.aiConfig.endpoint);
  showModal('<div class="sh"></div><div class="sheet-title">'+t('tripInfoTitle')+'</div>'+
    '<div class="inp-lbl">'+t('tripNameLabel')+'</div><input class="inp" id="te-name" value="'+escHtml(trip.name||'')+'" style="margin-bottom:10px">'+
    '<div class="inp-lbl">'+t('dateRangeLabel')+'</div><input class="inp" id="te-dates" value="'+escHtml(trip.dates||'')+'" style="margin-bottom:16px">'+
    '<div style="font-size:13px;font-weight:600;color:var(--t2);margin-bottom:8px">'+t('importDataLabel')+'</div>'+
    '<div style="padding:14px;background:var(--glass-bg);border:0.5px solid var(--glass-border);border-radius:var(--r2);margin-bottom:14px">'+
      '<div style="font-size:12px;color:var(--t3);margin-bottom:10px;line-height:1.6">'+t('importHint')+'<br><span style="color:var(--orange);font-weight:600">'+t('importHint2')+'</span></div>'+
      '<button class="btn btn-g btn-full" style="padding:11px;margin-bottom:8px" onclick="importFromXlsx()">'+ic('xlsx',15)+' '+t('importXlsx')+'</button>'+
      '<button class="btn btn-g btn-full" style="padding:11px;margin-bottom:'+(hasCfg?'8':'0')+'px" onclick="showPasteImport()">'+ic('edit',15)+' '+t('pasteImport')+'</button>'+
      (hasCfg?'<button class="btn btn-g btn-full" style="padding:11px" onclick="importFromImage()">'+ic('camera',15)+' '+t('aiImgImport')+'</button>':'')+
    '</div>'+
    '<button class="btn btn-p btn-full" onclick="saveTripInfo()">'+t('save')+'</button>');
};
window.showPasteImport=function(){
  closeModal(); setTimeout(function(){
    showModal('<div class="sh"></div><div class="sheet-title">'+t('pasteImportTitle')+'</div>'+
      '<div style="font-size:13px;color:var(--t2);margin-bottom:12px;line-height:1.6;white-space:pre-line">'+t('pasteHint')+'</div>'+
      '<textarea class="inp" id="paste-txt" style="min-height:180px;font-size:13px;margin-bottom:14px" placeholder="2000/1/1（一）&#10;08:00  抵达仁川"></textarea>'+
      '<button class="btn btn-p btn-full" onclick="submitPasteImport()" style="margin-bottom:8px">解析导入</button>'+
      '<button class="btn btn-g btn-full" onclick="closeModal()">'+t('cancel')+'</button>');
  },280);
};
window.submitPasteImport=async function(){
  var el=$('#paste-txt'),txt=el?el.value.trim():''; if(!txt||txt.length<5){ toast('请先粘贴行程'); return; }
  closeModal(); showLoad();
  try{
    var days=parseItineraryLocal(txt);
    if((!days||!days.length)&&S.aiConfig.apiKey&&S.aiConfig.endpoint&&S.aiToggles.import){ try{ days=await importItineraryFromText(txt); }catch(e){ console.warn(e); } }
    if(!days||!days.length) throw new Error('未识别到行程');
    await fbSaveDays(days); _updateTripDates(days); hideLoad(); renderItin();
    toast(t('importOk')+'：'+days.length+'天');
  }catch(e){ hideLoad(); toast(t('importFail')+'：'+e.message); }
};
window.saveTripInfo=async function(){
  var name=($('#te-name')&&$('#te-name').value.trim())||''; var dates=($('#te-dates')&&$('#te-dates').value.trim())||'';
  if(!S.trip) return; S.trip.name=name; S.trip.dates=dates;
  if(db&&S.tripCode) await updateDoc(doc(db,'trips',S.tripCode),{name:name,dates:dates});
  _addLocalTrip(S.tripCode,name,dates); closeModal(); toast(t('save')); renderHome();
};
window.importFromImage=function(){
  var inp=document.createElement('input'); inp.type='file'; inp.accept='image/*,application/pdf';
  inp.onchange=async function(){ var f=inp.files[0]; if(!f) return; closeModal(); showLoad(); var rd=new FileReader(); rd.onload=async function(e){ try{ var days=await (async function(b64){ var cfg=S.aiConfig; var res=await fetch(cfg.endpoint,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+cfg.apiKey},body:JSON.stringify({model:cfg.model||'gpt-4o',max_tokens:4000,messages:[{role:'user',content:[{type:'text',text:'Parse travel itinerary from image. Output JSON array ONLY:\n[{"date":"YYYY-MM-DD","month":"M","day":"DD","wd":"一二三四五六日","title":"day summary","items":[{"id":"d1_1","time":"HH:MM","title":"activity","transport":"","sMin":null,"sMax":null,"notes":"","apps":[],"type":"food|transport|attr|act|checkin|leisure","hi":false,"urgent":false}]}]'},{type:'image_url',image_url:{url:b64,detail:'high'}}]}]})}); if(!res.ok) throw new Error('API '+res.status); var d=await res.json(); var txt=(d.choices&&d.choices[0]&&d.choices[0].message&&d.choices[0].message.content)||''; var m=txt.match(/\[[\s\S]*\]/); if(!m) throw new Error('解析失败'); return JSON.parse(m[0]); })(e.target.result); if(!days||!days.length) throw new Error('无法识别'); await fbSaveDays(days); _updateTripDates(days); hideLoad(); renderItin(); toast(t('importOk')+'，'+days.length+'天'); }catch(err){ hideLoad(); toast(t('importFail')+'：'+err.message); } }; rd.readAsDataURL(f); };
  inp.click();
};

// ── EXPENSES ─────────────────────────────────────────────────────
function renderExp(){
  var v=$('#v-exp'); if(!v) return;
  v.innerHTML='<div class="nav"><div class="nav-title">'+t('exp')+'</div></div>'+
    '<div class="scroller"><div style="height:14px"></div><div class="sec">'+
      '<div id="exp-summary"></div>'+
      '<div class="ptabs" style="margin-bottom:14px"><div class="ptab on" onclick="switchExpTab(\'list\',this)">'+t('detail')+'</div><div class="ptab" onclick="switchExpTab(\'settle\',this)">'+t('settle')+'</div></div>'+
      '<div id="exp-list-pane"><div id="exp-list" class="list"></div></div>'+
      '<div id="exp-settle-pane" style="display:none"><div id="exp-settle" class="list"></div></div>'+
    '</div></div>';
  // Add FAB
  var af=document.getElementById('gfab-add'); if(af) af.remove();
  var addFab=document.createElement('button'); addFab.id='gfab-add'; addFab.className='gfab';
  addFab.innerHTML=ic('plus',22);
  addFab.addEventListener('click',function(){ showAddExpenseModal(); });
  document.getElementById('app').appendChild(addFab);
  refreshExpList();
}
window.switchExpTab=function(tab,el){ $$('.ptab').forEach(function(tb){ tb.classList.remove('on'); }); el.classList.add('on'); var lp=$('#exp-list-pane'),sp=$('#exp-settle-pane'); if(lp) lp.style.display=tab==='list'?'block':'none'; if(sp) sp.style.display=tab==='settle'?'block':'none'; if(tab==='settle') renderSettle(); };
function catLabel(c){ return {food:t('food'),transport:t('transport'),attr:t('attr'),act:t('act')}[c]||t('other'); }
function catIcon(c){ return {food:'food',transport:'car',attr:'map',act:'wallet'}[c]||'wallet'; }
function refreshExpList(){
  var sum=$('#exp-summary'),list=$('#exp-list'); if(!sum||!list) return;
  var tot=S.expenses.reduce(function(a,e){ return a+(Number(e.baseAmount||e.amount)||0); },0);
  var myP=S.expenses.filter(function(e){ return e.memberId===S.memberId; }).reduce(function(a,e){ return a+(Number(e.baseAmount||e.amount)||0); },0);
  var bc=CURRENCY_LIST[S.baseCurrency]||{symbol:'¥'};
  sum.innerHTML='<div class="exp-sum"><div class="estat"><div class="estat-lbl">'+t('total')+'</div><div class="estat-val" style="color:var(--red)">'+bc.symbol+tot.toFixed(0)+'</div></div><div class="estat"><div class="estat-lbl">'+t('myPaid')+'</div><div class="estat-val" style="color:var(--orange)">'+bc.symbol+myP.toFixed(0)+'</div></div><div class="estat"><div class="estat-lbl">'+t('cnt')+'</div><div class="estat-val">'+S.expenses.length+'</div></div></div>';
  if(!S.expenses.length){ list.innerHTML='<div class="empty" style="cursor:pointer" onclick="showAddExpenseModal()"><svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="var(--t1)" stroke-width="1.5" stroke-linecap="round">'+IC.wallet+'</svg><div class="empty-ttl">'+t('noExp')+'</div><div class="empty-sub">'+t('noExpSub')+'</div></div>'; return; }
  list.innerHTML=S.expenses.map(function(e){ var cc=CAT_COLORS[e.category]||CAT_COLORS.other,expCur=e.currency||S.localCurrency; var dispAmt=fmtCurrency(Number(e.amount)||0,expCur); var convHtml=expCur!==S.baseCurrency&&e.baseAmount?'<div style="font-size:10px;color:var(--t3)">≈ '+fmtCurrency(e.baseAmount,S.baseCurrency)+'</div>':''; return '<div class="ei" onclick="showExpDetail(\''+e.id+'\')"><div class="ei-ic" style="background:'+cc+'">'+ic(catIcon(e.category),20)+'</div><div class="ei-d"><div class="ei-name">'+escHtml(e.description||t('other'))+'</div><div class="ei-sub">'+escHtml(memberName(e.paidBy))+' · '+catLabel(e.category)+' · '+escHtml(e.date||'')+'</div></div><div style="text-align:right"><div class="ei-amt" style="color:'+cc+'">'+dispAmt+'</div>'+convHtml+'</div></div>'; }).join('');
}
function renderSettle(){
  var el=$('#exp-settle'); if(!el) return; var txns=calcSettle();
  if(!txns.length){ el.innerHTML='<div class="empty"><svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="var(--t1)" stroke-width="1.5" stroke-linecap="round">'+IC.check+'</svg><div class="empty-ttl">'+t('settled')+'</div><div class="empty-sub">'+t('settledSub')+'</div></div>'; return; }
  el.innerHTML=txns.map(function(tx){ var key=tx.from+'_'+tx.to,isPaid=!!S.settledRows[key]; var payBtns=MSG_APPS.slice(0,4).map(function(k){ var a=ALL_APPS[k]; if(!a) return ''; return '<div class="pay-btn" onclick="payVia(\''+k+'\',\''+tx.from+'\',\''+tx.to+'\','+tx.amount+')">'+ic('phone',11)+' '+escHtml(getAppLabel(k))+'</div>'; }).join(''); return '<div class="srow"><div class="srow-main"><div class="srow-from"><div class="srow-name" style="'+(isPaid?'text-decoration:line-through;opacity:.5':'')+'">'+escHtml(memberName(tx.from))+'</div><div class="srow-to">'+t('transferTo')+' '+escHtml(memberName(tx.to))+'</div></div><div class="srow-amt" style="'+(isPaid?'text-decoration:line-through;opacity:.5':'')+'">'+fmtCurrency(tx.amount,S.baseCurrency)+'</div><div class="srow-done'+(isPaid?' paid':'')+'" onclick="markSettled(\''+key+'\')">'+ic('check',11)+' '+(isPaid?'已付':t('markPaid'))+'</div></div>'+(isPaid?'':'<div class="pay-btns">'+payBtns+'</div>')+'</div>'; }).join('');
}
window.payVia=function(appKey,fromId,toId,amount){ var msg='[Travoo] '+memberName(fromId)+' → '+memberName(toId)+': '+fmtCurrency(amount,S.baseCurrency); openApp(appKey,encodeURIComponent(msg)); };
window.markSettled=function(key){ S.settledRows[key]=!S.settledRows[key]; localStorage.setItem('settledRows',JSON.stringify(S.settledRows)); renderSettle(); };
window.showExpDetail=function(id){
  var e=S.expenses.find(function(x){ return x.id===id; }); if(!e) return;
  var ids=e.splitAmong||Object.keys(S.members),expCur=e.currency||S.localCurrency;
  showModal('<div class="sh"></div>'+
    '<div style="font-size:20px;font-weight:700;margin-bottom:4px;color:var(--t1)">'+escHtml(e.description||t('other'))+'</div>'+
    '<div style="font-size:36px;font-weight:800;color:var(--red);margin:10px 0">'+fmtCurrency(Number(e.amount)||0,expCur)+'</div>'+
    '<div class="list" style="margin-bottom:14px">'+
      '<div class="lr" style="cursor:default"><span class="lr-lbl">'+t('paidBy')+'</span><span class="lr-val">'+escHtml(memberName(e.paidBy))+'</span></div>'+
      '<div class="lr" style="cursor:default"><span class="lr-lbl">'+t('splitW')+'</span><span class="lr-val">'+escHtml(ids.map(memberName).join('、'))+'</span></div>'+
      (expCur!==S.baseCurrency&&e.baseAmount?'<div class="lr" style="cursor:default"><span class="lr-lbl">'+t('rateInfo')+'</span><span class="lr-val">≈ '+fmtCurrency(e.baseAmount,S.baseCurrency)+'</span></div>':'')+
    '</div>'+
    '<button class="btn btn-d btn-full" onclick="fbDelExpense(\''+e.id+'\');closeModal();toast(t(\'deleted\'))">'+ic('trash',15)+' '+t('del')+'</button>');
};
window.showAddExpenseModal=function(prefill){
  prefill=prefill||{};
  var memOpts=Object.entries(S.members).map(function(entry){ var mid=entry[0],m=entry[1]; return '<option value="'+mid+'"'+(mid===S.memberId?' selected':'')+'>'+escHtml(m.name+(mid===S.memberId?' ('+t('you')+')':''))+'</option>'; }).join('');
  var memCBs=Object.entries(S.members).map(function(entry){ var mid=entry[0],m=entry[1]; return '<label style="display:flex;align-items:center;gap:8px;padding:7px 0;cursor:pointer"><input type="checkbox" id="sp-'+mid+'" checked style="width:18px;height:18px;flex-shrink:0">'+renderAv(mid,28)+escHtml(m.name+(mid===S.memberId?' ('+t('you')+')':''))+'</label>'; }).join('');
  var catChips=['food','transport','attr','act','other'].map(function(c,i){ return '<div class="chip '+(i===0?'on':'')+'" data-c="'+c+'" onclick="pickCat(this)">'+catLabel(c)+'</div>'; }).join('');
  var curOpts=Object.keys(CURRENCY_LIST).map(function(k){ return '<option value="'+k+'"'+(k===S.localCurrency?' selected':'')+'>'+CURRENCY_LIST[k].flag+' '+CURRENCY_LIST[k].name+'</option>'; }).join('');
  var rateHint=Object.keys(S.rates).length>0?'1 '+S.localCurrency+' = '+fmtCurrency(getRate(S.localCurrency,S.baseCurrency),S.baseCurrency):'';
  showModal('<div class="sh"></div><div class="sheet-title">'+t('addExpense')+'</div>'+
    '<div id="receipt-prev"></div>'+
    // FIX #5: Camera AND Album
    '<div style="display:flex;gap:8px;margin-bottom:12px">'+
      '<button class="btn btn-g" style="flex:1;padding:10px;font-size:13px" onclick="captureReceipt(\'camera\')">'+ic('camera',14)+' '+t('fromCamera')+'</button>'+
      '<button class="btn btn-g" style="flex:1;padding:10px;font-size:13px" onclick="captureReceipt(\'album\')">'+ic('img',14)+' '+t('fromAlbum')+'</button>'+
    '</div>'+
    '<div style="display:flex;gap:8px;margin-bottom:6px"><div style="flex:1"><div class="inp-lbl">'+t('amount')+'</div><input class="inp" id="ex-amt" type="number" placeholder="0" value="'+(prefill.amount!=null?prefill.amount:'')+'" style="font-size:22px;font-weight:700" oninput="updateExpConv()"></div><div style="min-width:120px"><div class="inp-lbl">'+t('expCurrency')+'</div><select class="inp" id="ex-cur" onchange="updateExpConv()">'+curOpts+'</select></div></div>'+
    '<div id="exp-conv-hint" style="font-size:12px;color:var(--t3);margin-bottom:10px;min-height:16px">'+escHtml(rateHint)+'</div>'+
    '<div class="inp-lbl">'+t('desc')+'</div><input class="inp" id="ex-desc" placeholder="Dinner" value="'+(prefill.description?escHtml(prefill.description):'')+'" style="margin-bottom:10px">'+
    '<div class="inp-lbl">'+t('cat')+'</div><div class="chips" id="cat-chips" style="margin-bottom:10px">'+catChips+'</div>'+
    '<div class="inp-lbl">'+t('paidBy')+'</div><select class="inp" id="ex-payer" style="margin-bottom:10px">'+memOpts+'</select>'+
    '<div class="inp-lbl">'+t('splitW')+'</div><div style="margin-bottom:14px">'+memCBs+'</div>'+
    '<button class="btn btn-p btn-full" onclick="submitExpense()">'+t('save')+'</button>');
};
window.updateExpConv=function(){ var ae=$('#ex-amt'),ce=$('#ex-cur'),hint=$('#exp-conv-hint'); if(!ae||!ce||!hint) return; var amt=parseFloat(ae.value)||0,cur=ce.value; if(cur!==S.baseCurrency&&amt>0&&Object.keys(S.rates).length>0){ hint.textContent='≈ '+fmtCurrency(toBase(amt,cur),S.baseCurrency); }else hint.textContent=Object.keys(S.rates).length>0?'1 '+S.localCurrency+' = '+fmtCurrency(getRate(S.localCurrency,S.baseCurrency),S.baseCurrency):''; };
window.pickCat=function(el){ $$('#cat-chips .chip').forEach(function(c){ c.classList.remove('on'); }); el.classList.add('on'); };
// FIX #5: both camera and album, with text-based OCR fallback
window.captureReceipt=function(src){
  var inp=document.createElement('input'); inp.type='file'; inp.accept='image/*';
  if(src==='camera') inp.capture='environment';
  inp.onchange=async function(){
    var f=inp.files[0]; if(!f) return;
    var hasCfg=!!(S.aiConfig.apiKey&&S.aiConfig.endpoint);
    if(hasCfg) toast(t('recognizing'),0);
    var rd=new FileReader(); rd.onload=async function(e){
      var b64=e.target.result;
      var prev=$('#receipt-prev'); if(prev) prev.innerHTML='<img src="'+b64+'" style="width:100%;border-radius:var(--r2);margin-bottom:10px;max-height:180px;object-fit:cover">';
      var r=null;
      if(hasCfg) r=await ocrReceipt(b64,true);
      toast('');
      if(r){
        var ae=$('#ex-amt'); if(ae&&r.amount) ae.value=r.amount;
        var de=$('#ex-desc'); if(de&&r.description) de.value=r.description;
        if(r.category) $$('#cat-chips .chip').forEach(function(c){ c.classList.toggle('on',c.dataset.c===r.category); });
        toast(t('recognizeOk')); updateExpConv();
      } else {
        // Try text-based fallback (no AI)
        // For now just show the image and let user fill in manually
        if(!hasCfg) toast('请手动填写金额');
        else toast(t('recognizeFail'));
      }
    }; rd.readAsDataURL(f);
  };
  inp.click();
};
window.submitExpense=function(){
  var amtEl=$('#ex-amt'),dscEl=$('#ex-desc'),payEl=$('#ex-payer'),curEl=$('#ex-cur');
  var amt=amtEl?parseFloat(amtEl.value):0,desc=dscEl?dscEl.value.trim():'';
  var cat=($('#cat-chips .chip.on')&&$('#cat-chips .chip.on').dataset.c)||'other';
  var paidBy=payEl?payEl.value:S.memberId,currency=curEl?curEl.value:S.localCurrency;
  var split=Object.keys(S.members).filter(function(id){ var cb=$('#sp-'+id); return cb&&cb.checked; });
  if(!amt||amt<=0){ toast('请输入正确金额'); return; }
  fbAddExpense({amount:amt,currency:currency,baseAmount:toBase(amt,currency),baseCurrency:S.baseCurrency,description:desc||t('other'),category:cat,paidBy:paidBy,splitAmong:split,date:today()});
  closeModal(); toast(t('logged'));
};

// ── CHAT ─────────────────────────────────────────────────────────
function renderChat(){
  var v=$('#v-chat'); if(!v) return;
  var hasCfg=!!(S.aiConfig.apiKey&&S.aiConfig.endpoint);
  var sugs=[t('chatSug1'),t('chatSug2'),t('chatSug3'),t('chatSug4'),t('chatSug5')];
  var noBanner=''; if(!hasCfg){ noBanner='<div style="margin:0 16px 12px;padding:14px;background:rgba(var(--orange-rgb),0.08);border:0.5px solid rgba(var(--orange-rgb),0.25);border-radius:var(--r2)"><div style="font-size:14px;font-weight:700;color:var(--orange);margin-bottom:4px">'+t('noCfg')+'</div><div style="font-size:13px;color:var(--t2);margin-bottom:10px">'+t('noCfgSub')+'</div><button class="btn btn-g" style="padding:8px 16px;font-size:13px" onclick="showAIConfig()">'+t('cfgAI')+'</button></div>'; }
  var welcome=S.chatHistory.length===0?
    '<div style="text-align:center;padding:30px 20px">'+
      '<div style="width:64px;height:64px;background:var(--glass-bg2);border:0.5px solid var(--glass-border);border-radius:20px;display:flex;align-items:center;justify-content:center;margin:0 auto 14px">'+ic('chat',28)+'</div>'+
      '<div style="font-size:17px;font-weight:600;margin-bottom:6px;color:var(--t1)">'+t('aiWelcome')+'</div>'+
      '<div style="font-size:14px;color:var(--t2);line-height:1.65;white-space:pre-line">'+t('aiWelcomeSub')+'</div>'+
    '</div>'
    :S.chatHistory.map(renderMsg).join('');
  var sugHtml=sugs.map(function(s){ return '<div class="csug" onclick="sendSug(\''+s.replace(/'/g,"\\'")+'\')">'+escHtml(s)+'</div>'; }).join('');

  // FIX #17: centered title, settings icon right, spacer left for balance
  // FIX #6: chat-outer wraps body+sugs+bar for proper flex layout
  v.innerHTML=
    '<div class="nav">'+
      '<div style="width:34px;flex-shrink:0"></div>'+
      '<div class="nav-title" style="position:static;transform:none;flex:1;text-align:center">'+t('butlerName')+'</div>'+
      '<div class="nbtn" onclick="showAIConfig()">'+ic('cog',15)+'</div>'+
    '</div>'+
    noBanner+
    '<div class="chat-outer">'+
      '<div class="chat-body" id="chat-body">'+welcome+'</div>'+
      '<div class="csug-wrap" id="csug-wrap">'+sugHtml+'</div>'+
      '<div class="chat-bar">'+
        '<button class="cvbtn" onmousedown="startVoice(handleVoiceIntent)" ontouchstart="event.preventDefault();startVoice(handleVoiceIntent)" style="-webkit-user-select:none">'+ic('mic',18)+'</button>'+
        '<textarea class="chat-inp-el" id="chat-inp" rows="1" placeholder="'+t('aiPh')+'" onkeydown="if(event.key===\'Enter\'&&!event.shiftKey){event.preventDefault();sendChatMsg()}" oninput="this.style.height=\'auto\';this.style.height=Math.min(this.scrollHeight,120)+\'px\'"></textarea>'+
        '<button class="csend" id="csend" onclick="sendChatMsg()"><svg width="18" height="18" viewBox="0 0 24 24" fill="none">'+IC.send+'</svg></button>'+
      '</div>'+
    '</div>';
  scrollChat();
}
function renderMsg(m){ var isU=m.role==='user'; var time=''; if(m.ts&&m.ts.toDate) time=m.ts.toDate().toLocaleTimeString('zh',{hour:'2-digit',minute:'2-digit'}); return '<div class="msg '+(isU?'msg-u':'msg-a')+'"><div class="mbubble">'+(m.content||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>')+'</div>'+(time?'<div class="mmeta">'+time+'</div>':'')+'</div>'; }
function refreshChatMsgs(){ var body=$('#chat-body'); if(!body) return; if(S.chatHistory.length) body.innerHTML=S.chatHistory.map(renderMsg).join(''); scrollChat(); }
function scrollChat(){ var b=$('#chat-body'); if(b) setTimeout(function(){ b.scrollTop=b.scrollHeight; },80); }
window.sendSug=function(txt){ var inp=$('#chat-inp'); if(inp){ inp.value=txt; sendChatMsg(); } };
window.askAIAbout=function(title){ switchTab('chat'); setTimeout(function(){ sendChatMsg('关于"'+title+'"，给我建议和注意事项'); },300); };
window.sendChatMsg=async function(forceTxt){
  var inp=$('#chat-inp'),btn=$('#csend'),body=$('#chat-body');
  var txt=forceTxt||(inp?inp.value.trim():''); if(!txt) return;
  if(inp){ inp.value=''; inp.style.height='auto'; } if(btn) btn.disabled=true;
  var uEl=document.createElement('div'); uEl.className='msg msg-u'; uEl.innerHTML='<div class="mbubble">'+txt.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/\n/g,'<br>')+'</div>'; if(body) body.appendChild(uEl); scrollChat();
  await fbSaveMsg('user',txt);
  var typEl=document.createElement('div'); typEl.className='typing-wrap'; typEl.innerHTML='<div class="typing-bub"><div class="tdot"></div><div class="tdot"></div><div class="tdot"></div></div>'; if(body) body.appendChild(typEl); scrollChat();
  var sw=$('#csug-wrap'); if(sw) sw.style.display='none';
  try{ var reply=await callAI(txt); typEl.remove(); var aEl=document.createElement('div'); aEl.className='msg msg-a'; aEl.innerHTML='<div class="mbubble">'+reply.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/\n/g,'<br>')+'</div>'; if(body) body.appendChild(aEl); await fbSaveMsg('assistant',reply); scrollChat(); }
  catch(e){ typEl.remove(); var errEl=document.createElement('div'); errEl.className='msg msg-a'; errEl.innerHTML='<div class="mbubble" style="color:var(--red)">'+escHtml(e.message)+'</div>'; if(body) body.appendChild(errEl); scrollChat(); if(e.message===t('noCfg')) setTimeout(showAIConfig,600); }
  if(btn) btn.disabled=false;
};
window.showAIConfig=function(){
  var cfg=S.aiConfig;
  showModal('<div class="sh"></div><div class="sheet-title">'+t('aiCfg')+'</div>'+
    '<div style="display:flex;gap:6px;margin-bottom:14px"><div class="chip" onclick="presetAI(\'openai\',this)">OpenAI</div><div class="chip" onclick="presetAI(\'poe\',this)">Poe</div><div class="chip" onclick="presetAI(\'custom\',this)">Custom</div></div>'+
    '<div class="inp-lbl">'+t('apiEp')+'</div><input class="inp" id="cfg-ep" value="'+escHtml(cfg.endpoint||'')+'" placeholder="https://api.openai.com/v1/chat/completions" style="margin-bottom:10px">'+
    '<div class="inp-lbl">'+t('apiKey')+'</div><input class="inp" id="cfg-key" type="password" value="'+escHtml(cfg.apiKey||'')+'" placeholder="sk-..." style="margin-bottom:10px">'+
    '<div class="inp-lbl">'+t('model')+'</div><input class="inp" id="cfg-model" value="'+escHtml(cfg.model||'gpt-4o-mini')+'" style="margin-bottom:14px">'+
    '<div class="sec-ttl" style="margin-bottom:8px">'+t('aiFeatures')+'</div>'+
    '<div class="list" style="margin-bottom:14px">'+
      ['packing','recs','import'].map(function(k){ return '<div class="lr" style="cursor:default"><span class="lr-lbl" style="font-size:14px">'+t('aiFor'+k.charAt(0).toUpperCase()+k.slice(1))+'</span><label class="toggle"><input type="checkbox" '+(S.aiToggles[k]?'checked':'')+' onchange="S.aiToggles[\''+k+'\']=this.checked;localStorage.setItem(\'aiToggles\',JSON.stringify(S.aiToggles))"><span class="tsl"></span></label></div>'; }).join('')+
    '</div>'+
    '<button class="btn btn-p btn-full" onclick="saveAICfg()" style="margin-bottom:8px">'+t('saveCfg')+'</button>'+
    (cfg.apiKey?'<button class="btn btn-g btn-full" onclick="S.aiConfig={};localStorage.removeItem(\'aiConfig\');closeModal();renderChat()">清除配置</button>':'')+
    '<div style="font-size:11px;color:var(--t4);text-align:center;margin-top:12px">API Key 仅存本设备，不上传</div>');
};
window.presetAI=function(p,el){ $$('.sheet .chip').forEach(function(c){ c.classList.remove('on'); }); el.classList.add('on'); var ep=$('#cfg-ep'),md=$('#cfg-model'); if(p==='openai'&&ep&&md){ ep.value='https://api.openai.com/v1/chat/completions'; md.value='gpt-4o-mini'; } if(p==='poe'&&ep&&md){ ep.value='https://api.poe.com/v1/chat/completions'; md.value='GPT-4o-mini'; } };
window.saveAICfg=function(){ var ep=($('#cfg-ep')&&$('#cfg-ep').value.trim())||'',key=($('#cfg-key')&&$('#cfg-key').value.trim())||'',model=($('#cfg-model')&&$('#cfg-model').value.trim())||'gpt-4o-mini'; if(!ep||!key){ toast('请填写端点和 Key'); return; } S.aiConfig={endpoint:ep,apiKey:key,model:model}; localStorage.setItem('aiConfig',JSON.stringify(S.aiConfig)); closeModal(); toast(t('aiConfigSaved')); renderChat(); };
window.confirmClearChat=function(){ showModal('<div class="sh"></div><div style="text-align:center;padding:10px 0"><div style="font-size:18px;font-weight:700;color:var(--t1);margin-bottom:8px">'+t('confirmClearChat')+'</div><div style="font-size:14px;color:var(--t2);margin-bottom:22px">'+t('confirmClearChatSub')+'</div><button class="btn btn-d btn-full" onclick="S.chatHistory=[];toast(t(\'chatCleared\'));closeModal()" style="margin-bottom:10px">'+t('clearChatConfirmBtn')+'</button><button class="btn btn-g btn-full" onclick="closeModal()">'+t('cancel')+'</button></div>'); };

// ── LISTS ────────────────────────────────────────────────────────
window.showListsModal=function(){ S._listsPane='shopping'; renderListsView(); };
function renderListsView(){
  var pane=S._listsPane||'shopping';
  var tabs=['shopping','todo','packing'].map(function(k){ return '<div class="ptab '+(pane===k?'on':'')+'" onclick="switchListPane(\''+k+'\')">'+t(k)+'</div>'; }).join('');
  var content=pane==='shopping'?renderShoppingPane():pane==='todo'?renderTodoPane():renderPackingPane();
  showModal('<div class="sh"></div><div class="ptabs" style="margin-bottom:14px">'+tabs+'</div><div id="lists-content">'+content+'</div>');
}
window.switchListPane=function(p){ S._listsPane=p; var lc=$('#lists-content'); if(lc){ lc.innerHTML=p==='shopping'?renderShoppingPane():p==='todo'?renderTodoPane():renderPackingPane(); } else renderListsView(); };
function renderShoppingPane(){
  var items=S.shoppingList,en=S.lang==='en';
  var html='<div style="display:flex;gap:8px;margin-bottom:12px"><input class="inp" id="shop-inp" placeholder="'+(en?'Item… @name to share':'物品… @名字可分享')+'" style="flex:1"><button class="btn btn-p" style="padding:10px 14px" onclick="addShoppingItem()">'+ic('plus',15)+'</button></div>';
  var visible=items.filter(function(i){ return i.ownerId===S.memberId||(i.sharedWith&&i.sharedWith.indexOf(S.memberId)>=0); });
  if(!visible.length) html+='<div style="text-align:center;padding:24px;color:var(--t3)">'+(en?'No items yet':'暂无物品')+'</div>';
  else html+='<div class="list">'+visible.map(function(item,i){ return '<div class="list-item'+(item.done?' done':'')+'"><div class="list-check'+(item.done?' checked':'')+'" onclick="toggleShoppingItem(\''+item.id+'\')"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12" stroke="#fff"/></svg></div><span class="list-item-text">'+renderMentions(item.text)+'</span>'+( item.ownerId!==S.memberId?'<span style="font-size:10px;color:var(--t4)">'+escHtml(memberName(item.ownerId))+'</span>':'')+' <div class="list-item-del" onclick="removeShoppingItem(\''+item.id+'\')">'+ic('trash',13)+'</div></div>'; }).join('')+'</div>';
  return html;
}
window.addShoppingItem=function(){
  var inp=$('#shop-inp'); if(!inp) return; var text=inp.value.trim(); if(!text) return;
  var sharedWith=[]; Object.entries(S.members).forEach(function(entry){ var id=entry[0],m=entry[1]; if(text.indexOf('@'+m.name)>=0&&id!==S.memberId) sharedWith.push(id); });
  S.shoppingList.push({id:'s_'+Date.now(),text:text,done:false,ownerId:S.memberId,sharedWith:sharedWith}); localStorage.setItem('shoppingList',JSON.stringify(S.shoppingList)); inp.value=''; var lc=$('#lists-content'); if(lc) lc.innerHTML=renderShoppingPane();
};
window.toggleShoppingItem=function(id){ var item=S.shoppingList.find(function(i){ return i.id===id; }); if(item) item.done=!item.done; localStorage.setItem('shoppingList',JSON.stringify(S.shoppingList)); var lc=$('#lists-content'); if(lc) lc.innerHTML=renderShoppingPane(); };
window.removeShoppingItem=function(id){ S.shoppingList=S.shoppingList.filter(function(i){ return i.id!==id; }); localStorage.setItem('shoppingList',JSON.stringify(S.shoppingList)); var lc=$('#lists-content'); if(lc) lc.innerHTML=renderShoppingPane(); };
function renderTodoPane(){
  var phases=['pre','during','post'],pLbl={'pre':t('listPre'),'during':t('listDuring'),'post':t('listPost')};
  var html='<div style="display:flex;gap:8px;margin-bottom:12px"><input class="inp" id="todo-inp" placeholder="'+(S.lang==='en'?'Task…':'任务…')+'" style="flex:1"><select class="inp" id="todo-ph" style="width:90px">'+phases.map(function(p){ return '<option value="'+p+'">'+pLbl[p]+'</option>'; }).join('')+'</select><button class="btn btn-p" style="padding:10px 12px" onclick="addTodoItem()">'+ic('plus',13)+'</button></div>';
  phases.forEach(function(ph){ var items=(S.todoList[ph]||[]).filter(function(i){ return i.ownerId===S.memberId||(i.sharedWith&&i.sharedWith.indexOf(S.memberId)>=0); }); if(!items.length) return; html+='<div class="sec-ttl" style="padding:0 2px;margin-bottom:6px">'+pLbl[ph]+'</div><div class="list" style="margin-bottom:10px">'+items.map(function(i){ return '<div class="list-item'+(i.done?' done':'')+'"><div class="list-check'+(i.done?' checked':'')+'" onclick="toggleTodoItem(\''+ph+'\',\''+i.id+'\')"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12" stroke="#fff"/></svg></div><span class="list-item-text">'+renderMentions(i.text)+'</span><div class="list-item-del" onclick="removeTodoItem(\''+ph+'\',\''+i.id+'\')">'+ic('trash',13)+'</div></div>'; }).join('')+'</div>'; });
  if(phases.every(function(ph){ return !(S.todoList[ph]||[]).length; })) html+='<div style="text-align:center;padding:24px;color:var(--t3)">'+(S.lang==='en'?'No tasks yet':'暂无待办')+'</div>';
  return html;
}
window.addTodoItem=function(){ var inp=$('#todo-inp'),ph=$('#todo-ph'); if(!inp||!ph) return; var text=inp.value.trim(); if(!text) return; var phase=ph.value; var sw=[]; Object.entries(S.members).forEach(function(entry){ var id=entry[0],m=entry[1]; if(text.indexOf('@'+m.name)>=0&&id!==S.memberId) sw.push(id); }); if(!S.todoList[phase]) S.todoList[phase]=[]; S.todoList[phase].push({id:'t_'+Date.now(),text:text,done:false,ownerId:S.memberId,sharedWith:sw}); localStorage.setItem('todoList',JSON.stringify(S.todoList)); inp.value=''; var lc=$('#lists-content'); if(lc) lc.innerHTML=renderTodoPane(); };
window.toggleTodoItem=function(ph,id){ var items=S.todoList[ph]||[]; var item=items.find(function(i){ return i.id===id; }); if(item) item.done=!item.done; localStorage.setItem('todoList',JSON.stringify(S.todoList)); var lc=$('#lists-content'); if(lc) lc.innerHTML=renderTodoPane(); };
window.removeTodoItem=function(ph,id){ S.todoList[ph]=(S.todoList[ph]||[]).filter(function(i){ return i.id!==id; }); localStorage.setItem('todoList',JSON.stringify(S.todoList)); var lc=$('#lists-content'); if(lc) lc.innerHTML=renderTodoPane(); };
function renderPackingPane(){
  var sugg=getPackingSuggestions(),cats=['clothes','docs','electronics','toiletries'];
  var catLbls={clothes:t('packingClothes'),docs:t('packingDocs'),electronics:t('packingElectronics'),toiletries:t('packingToiletries')};
  var html='<div style="font-size:12px;color:var(--t3);margin-bottom:10px;line-height:1.55">'+t('packingAuto')+'</div>';
  cats.forEach(function(cat){ var items=sugg[cat]||[]; if(!items.length) return; html+='<div class="packing-cat">'+catLbls[cat]+'</div><div class="list" style="margin-bottom:10px">'+items.map(function(item){ var done=S.packingList[item.id]||false; return '<div class="list-item'+(done?' done':'')+'"><div class="list-check'+(done?' checked':'')+'" onclick="togglePacking(\''+item.id+'\')"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12" stroke="#fff"/></svg></div><span class="list-item-text">'+escHtml(item.text)+'</span></div>'; }).join('')+'</div>'; });
  if(periodConflict()) html+='<div class="period-warning" style="margin-top:8px">'+ic('bell',14)+' '+t('periodPacking')+'</div>';
  return html;
}
window.togglePacking=function(id){ S.packingList[id]=!S.packingList[id]; localStorage.setItem('packingList',JSON.stringify(S.packingList)); var lc=$('#lists-content'); if(lc) lc.innerHTML=renderPackingPane(); };

// ── SETTINGS (RedNote style) ─────────────────────────────────────
function renderSet(){
  var v=$('#v-set'); if(!v) return;

  // Remove expense FAB when on settings
  var af=document.getElementById('gfab-add'); if(af) af.remove();

  var notifsChk=localStorage.getItem('notifsEnabled')!=='false'?'checked':'';
  var geoStatus=S.geo?t('geoObtained'):t('geoNotObtained');
  var lc=CURRENCY_LIST[S.localCurrency]||{flag:'',name:S.localCurrency};
  var bc=CURRENCY_LIST[S.baseCurrency]||{flag:'',name:S.baseCurrency};
  var rateVal=getRate(S.localCurrency,S.baseCurrency);
  var rateStr=Object.keys(S.rates).length>0?'1 '+S.localCurrency+' = '+fmtCurrency(rateVal,S.baseCurrency):t('rateUnavailable');
  var curOpts=Object.keys(CURRENCY_LIST).map(function(k){ return '<option value="'+k+'">'+CURRENCY_LIST[k].flag+' '+CURRENCY_LIST[k].name+'</option>'; }).join('');
  var histSection=''; if(S.localTrips.length>0){ histSection='<div class="set-ttl">'+t('history')+'</div><div class="set-group">'+S.localTrips.map(function(tr){ return '<div class="set-row" onclick="enterTrip(\''+tr.code+'\')"><div style="flex:1"><div style="font-size:15px;color:var(--t1)">'+escHtml(tr.name||'—')+'</div><div style="font-size:12px;color:var(--t3)">'+escHtml(tr.dates||'—')+'</div></div><span class="set-chev"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+IC.chev+'</svg></span></div>'; }).join('')+'</div>'; }

  // Member list
  var memHtml=Object.entries(S.members).map(function(entry){
    var id=entry[0],m=entry[1],img=memberAvatar(id),isYou=id===S.memberId;
    return '<div class="set-row" onclick="showMemberEdit(\''+id+'\')">'+
      (img?'<div style="width:32px;height:32px;border-radius:50%;overflow:hidden;flex-shrink:0"><img src="'+img+'" style="width:100%;height:100%;object-fit:cover"></div>':'<div style="width:32px;height:32px;border-radius:50%;background:'+m.color+';display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;color:#fff;flex-shrink:0">'+((m.name||'?')[0])+'</div>')+
      '<span class="set-lbl">'+escHtml(m.name)+'</span>'+
      (isYou?'<span class="you-tag">'+t('you')+'</span>':'')+
      '<span class="set-chev"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+IC.chev+'</svg></span>'+
    '</div>';
  }).join('');

  v.innerHTML=
    '<div class="nav"><div class="nav-large">'+t('set')+'</div></div>'+
    '<div class="scroller"><div style="height:12px"></div>'+

    // Trip code
    '<div class="set-ttl">'+t('code')+'</div>'+
    '<div class="set-group"><div class="set-row" style="cursor:default"><div class="set-icon">'+ic('lock',16)+'</div><div class="set-lbl" style="font-family:monospace;letter-spacing:2px;font-weight:700">'+escHtml(S.tripCode||'——')+'</div><div style="display:flex;gap:6px"><div class="nbtn" style="width:28px;height:28px" onclick="copyCode()">'+ic('copy',12)+'</div><div class="nbtn" style="width:28px;height:28px" onclick="shareCode()">'+ic('share',12)+'</div></div></div></div>'+

    // Members
    '<div class="set-ttl">'+t('members')+'</div>'+
    '<div class="set-group">'+memHtml+'<div class="set-row" onclick="showAddMember()"><div class="set-icon">'+ic('plus',14)+'</div><span class="set-lbl">'+t('addMember')+'</span></div></div>'+

    // Appearance
    '<div class="set-ttl">'+t('setAppearance')+'</div>'+
    '<div class="set-group">'+
      '<div class="set-row" onclick="showAppearanceModal()"><div class="set-icon">'+ic('palette',15)+'</div><div class="set-lbl">'+t('appearance')+'</div><span class="set-val">'+t('appearanceDesc')+'</span><span class="set-chev"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+IC.chev+'</svg></span></div>'+
    '</div>'+

    // Travel settings
    '<div class="set-ttl">'+t('setTravel')+'</div>'+
    '<div class="set-group">'+
      '<div class="set-row" onclick="showCurrencyModal()"><div class="set-icon">'+ic('wallet',15)+'</div><div class="set-lbl">'+t('currency')+'</div><span class="set-val">'+lc.flag+' → '+bc.flag+'</span><span class="set-chev"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+IC.chev+'</svg></span></div>'+
      '<div class="set-row" onclick="showMsgAppModal()"><div class="set-icon">'+ic('msg',15)+'</div><div class="set-lbl">'+t('msgApp')+'</div><span class="set-val">'+escHtml(getAppLabel(S.msgApp))+'</span><span class="set-chev"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+IC.chev+'</svg></span></div>'+
      '<div class="set-row" onclick="showPeriodModal()"><div class="set-icon">'+ic('heart',15)+'</div><div class="set-lbl">'+t('period')+'</div><span class="set-val" style="'+(periodConflict()?'color:var(--red)':'')+'">'+(periodConflict()?(S.lang==='en'?'Conflict!':'注意重叠'):(S.lang==='en'?'OK':'无重叠'))+'</span><span class="set-chev"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+IC.chev+'</svg></span></div>'+
    '</div>'+

    // Notifications
    '<div class="set-ttl">'+t('notif')+'</div>'+
    '<div class="set-group">'+
      '<div class="set-row" style="cursor:default"><div class="set-icon">'+ic('bell',15)+'</div><span class="set-lbl">'+(S.lang==='en'?'Trip Reminders':'行程提醒')+'</span><label class="toggle"><input type="checkbox" '+notifsChk+' onchange="localStorage.setItem(\'notifsEnabled\',this.checked)"><span class="tsl"></span></label></div>'+
      '<div class="set-row" onclick="requestGeo();toast(t(\'locationAllow\'))"><div class="set-icon">'+ic('map',15)+'</div><span class="set-lbl">'+t('locationAllow')+'</span><span class="set-val">'+geoStatus+'</span></div>'+
    '</div>'+

    // AI
    '<div class="set-ttl">'+t('aiCfg')+'</div>'+
    '<div class="set-group">'+
      '<div class="set-row" onclick="showAIConfig()"><div class="set-icon">'+ic('sliders',15)+'</div><span class="set-lbl">'+t('aiCfg')+'</span><span class="set-val">'+escHtml(S.aiConfig.model||t('notConfigured'))+'</span><span class="set-chev"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+IC.chev+'</svg></span></div>'+
      '<div class="set-row" onclick="confirmClearChat()"><div class="set-icon">'+ic('trash',15)+'</div><span class="set-lbl">'+t('clearChat')+'</span></div>'+
    '</div>'+

    // Data
    '<div class="set-ttl">'+t('setData')+'</div>'+
    '<div class="set-group">'+
      '<div class="set-row" onclick="exportTripData()"><div class="set-icon">'+ic('download',15)+'</div><span class="set-lbl">'+t('exportData')+'</span><span class="set-val">JSON</span></div>'+
      '<div class="set-row" onclick="importTripData()"><div class="set-icon">'+ic('upload',15)+'</div><span class="set-lbl">'+t('importData')+'</span></div>'+
      '<div class="set-row" style="cursor:default"><div class="set-icon">'+ic('lock',15)+'</div><span class="set-lbl">'+t('deviceId')+'</span><span class="set-val" style="font-size:11px;font-family:monospace">'+DEVICE_ID.substring(0,12)+'…</span></div>'+
    '</div>'+

    histSection+

    // About
    '<div class="set-ttl">'+t('setAbout')+'</div>'+
    '<div class="set-group">'+
      '<div class="set-row" style="cursor:default"><div class="set-icon">'+ic('globe',15)+'</div><span class="set-lbl">'+t('version')+'</span><span class="set-val">5.1.0</span></div>'+
      '<div class="set-row" style="cursor:default"><div class="set-icon">'+ic('check',15)+'</div><span class="set-lbl">Firebase</span><span class="set-val">'+(fbApp?t('connected'):t('localMode'))+'</span></div>'+
    '</div>'+

    '<div class="sec" style="padding:0 16px 20px">'+
      '<button class="btn btn-d btn-full" onclick="confirmLeave()" style="margin-top:8px">'+t('leave')+'</button>'+
    '</div>'+
    '</div>';
}

window.showCurrencyModal=function(){
  var curOpts=Object.keys(CURRENCY_LIST).map(function(k){ return '<option value="'+k+'">'+CURRENCY_LIST[k].flag+' '+CURRENCY_LIST[k].name+'</option>'; }).join('');
  var lc=CURRENCY_LIST[S.localCurrency]||{};
  var bc=CURRENCY_LIST[S.baseCurrency]||{};
  var rateVal=getRate(S.localCurrency,S.baseCurrency);
  var rateStr=Object.keys(S.rates).length>0?'1 '+S.localCurrency+' = '+fmtCurrency(rateVal,S.baseCurrency):t('rateUnavailable');
  showModal('<div class="sh"></div><div class="sheet-title">'+t('currency')+'</div>'+
    '<div style="display:flex;gap:8px;margin-bottom:10px">'+
      '<div style="flex:1"><div class="inp-lbl">'+t('baseCurrency')+'</div><select class="inp" id="set-base" onchange="onCurrencyChange()">'+curOpts+'</select></div>'+
      '<div style="flex:1"><div class="inp-lbl">'+t('localCurrency')+'</div><select class="inp" id="set-local" onchange="onCurrencyChange()">'+curOpts+'</select></div>'+
    '</div>'+
    '<div style="padding:12px 14px;background:var(--glass-bg);border:0.5px solid var(--glass-border);border-radius:var(--r2);display:flex;align-items:center;gap:10px;margin-bottom:14px">'+
      '<div style="flex:1"><div style="font-size:14px;font-weight:600;color:var(--t1)">'+escHtml(rateStr)+'</div>'+
        (S.fxDate?'<div style="font-size:11px;color:var(--t3)">'+S.fxDate.substring(0,16)+'</div>':'')+
      '</div>'+
      '<button class="btn btn-g" style="padding:7px 12px;font-size:13px" onclick="doFetchRates()">'+ic('refresh',12)+' '+t('refreshRate')+'</button>'+
    '</div>'+
    '<button class="btn btn-p btn-full" onclick="saveCurrencySettings()">'+t('save')+'</button>');
  var sb=$('#set-base'),sl=$('#set-local'); if(sb) sb.value=S.baseCurrency; if(sl) sl.value=S.localCurrency;
};
window.onCurrencyChange=function(){ var sb=$('#set-base'),sl=$('#set-local'); if(!sb||!sl) return; S.baseCurrency=sb.value; S.localCurrency=sl.value; };
window.saveCurrencySettings=function(){ localStorage.setItem('baseCurrency',S.baseCurrency); localStorage.setItem('localCurrency',S.localCurrency); if(S.fxBase!==S.baseCurrency){ S.rates={}; S.fxDate=''; } closeModal(); renderSet(); };
window.showMsgAppModal=function(){ showModal('<div class="sh"></div><div class="sheet-title">'+t('msgApp')+'</div><div class="list">'+MSG_APPS.map(function(a){ var app=ALL_APPS[a]; if(!app) return ''; return '<div class="lr" onclick="setMsgApp(\''+a+'\')">'+ic(app.icon||'msg',18)+'<span class="lr-lbl">'+escHtml(getAppLabel(a))+'</span>'+(S.msgApp===a?'<span style="color:var(--green)">'+ic('check',16)+'</span>':'')+'</div>'; }).join('')+'</div>'); };
window.setMsgApp=function(a){ S.msgApp=a; localStorage.setItem('msgApp',a); closeModal(); renderSet(); };
window.showAppearanceModal=function(){
  var LL={'zh-CN':'简','zh-TW':'繁','en':'EN'};
  var langChips=['zh-CN','zh-TW','en'].map(function(l){ return '<div class="chip '+(S.lang===l?'on':'')+'" style="font-weight:600" onclick="setLang(\''+l+'\')" id="lc-'+l+'">'+LL[l]+'</div>'; }).join('');
  var swatches='<div class="theme-grid">';
  Object.entries(THEMES).forEach(function(entry){
    var k=entry[0],th=entry[1];
    var sty=typeof th.swatch==='string'&&th.swatch.startsWith('linear')?'background:'+th.swatch:'background:'+th.swatch;
    swatches+='<div class="theme-swatch'+(S.theme===k?' on':'')+'" style="'+sty+'" title="'+th.name+'" onclick="window.applyTheme(\''+k+'\');$$(\'.theme-swatch\').forEach(function(s){s.classList.remove(\'on\')});this.classList.add(\'on\')"></div>';
  });
  swatches+='</div>';
  showModal('<div class="sh"></div><div class="sheet-title">'+t('appearance')+'</div>'+
    '<div class="sec-ttl">'+t('lang')+'</div><div class="chips" style="margin-bottom:18px">'+langChips+'</div>'+
    '<div class="sec-ttl">'+t('themes')+'</div>'+
    '<div style="font-size:12px;color:var(--t3);margin-bottom:8px">深色 / 浅色 / 跟随系统</div>'+
    swatches+
    '<div style="margin-top:18px"><div class="sec-ttl">'+t('wp')+'</div>'+
    '<div style="display:flex;gap:8px;margin-top:6px">'+
      '<button class="btn btn-g" style="flex:1" onclick="pickWallpaper()">'+ic('img',14)+' '+t('pickFromAlbum')+'</button>'+
      '<button class="btn btn-g" style="flex:1" onclick="clearWallpaper()">'+t('resetDefault')+'</button>'+
    '</div></div>');
};
window.showPeriodModal=function(){
  var pd=S.periodData,preds=getPeriodPredictions();
  var days=getDays();
  var tripStart=days.length?days[0].date:'',tripEnd=days.length?days[days.length-1].date:'';
  var conflict=periodConflict();
  var predHtml='';
  preds.forEach(function(p,i){
    var start=new Date(p.start),end=new Date(start.getTime()+p.days*86400000);
    var overlap=tripStart&&tripEnd&&start<=new Date(tripEnd+'T23:59:59')&&end>=new Date(tripStart+'T00:00:00');
    predHtml+='<div class="lr" style="cursor:default;border-radius:var(--r2);background:var(--glass-bg);margin-bottom:6px;'+(overlap?'border-left:2px solid var(--red)':'')+'">'+
      '<span class="lr-lbl" style="font-size:14px">'+(S.lang==='en'?'Cycle '+(i+1):'第'+(i+1)+'次')+'</span>'+
      '<span class="lr-val" style="'+(overlap?'color:var(--red)':'')+'">'+(p.start)+' – '+(end.toISOString().split('T')[0])+'</span>'+
    '</div>';
  });
  var recordList=pd.records.slice(-3).map(function(r,i){ return '<div class="lr" style="cursor:default"><span class="lr-lbl">'+r+'</span><div class="nbtn" style="width:26px;height:26px" onclick="removePeriodRecord('+i+')">'+ic('trash',10)+'</div></div>'; }).join('');
  showModal('<div class="sh"></div><div class="sheet-title">'+t('period')+'</div>'+
    (conflict?'<div class="period-warning" style="margin-bottom:14px">'+ic('bell',13)+' '+t('periodConflict')+'</div>':'')+
    (predHtml?'<div class="sec-ttl" style="margin-bottom:8px">'+(S.lang==='en'?'Predictions':'预测')+'</div>'+predHtml:'')+ 
    '<div class="inp-lbl" style="margin-top:10px">'+t('periodLastDate')+'</div><input class="inp" id="period-date" type="date" style="margin-bottom:10px">'+
    '<div style="display:flex;gap:8px;margin-bottom:14px"><div style="flex:1"><div class="inp-lbl">'+t('periodCycleLen')+'</div><input class="inp" id="period-cycle" type="number" value="'+(pd.cycleLen||28)+'"></div><div style="flex:1"><div class="inp-lbl">'+t('periodDuration')+'</div><input class="inp" id="period-dur" type="number" value="'+(pd.duration||5)+'"></div></div>'+
    (recordList?'<div class="list" style="margin-bottom:14px">'+recordList+'</div>':'')+
    '<button class="btn btn-p btn-full" onclick="addPeriodRecord()">'+ic('plus',15)+' '+t('periodAdd')+'</button>');
};
function getPeriodPredictions(){ var pd=S.periodData; if(!pd.records||!pd.records.length) return []; var last=new Date(pd.records[pd.records.length-1]+'T00:00:00'),cl=pd.cycleLen||28,dur=pd.duration||5,r=[]; for(var i=0;i<3;i++){ var ps=new Date(last.getTime()+(i+1)*cl*86400000); r.push({start:ps.toISOString().split('T')[0],days:dur}); } return r; }
window.addPeriodRecord=function(){ var d=$('#period-date')&&$('#period-date').value,cy=parseInt($('#period-cycle')&&$('#period-cycle').value)||28,du=parseInt($('#period-dur')&&$('#period-dur').value)||5; if(!d){ toast('请选择日期'); return; } S.periodData.records.push(d); S.periodData.records.sort(); S.periodData.cycleLen=cy; S.periodData.duration=du; localStorage.setItem('periodData',JSON.stringify(S.periodData)); closeModal(); setTimeout(showPeriodModal,200); };
window.removePeriodRecord=function(i){ S.periodData.records.splice(i,1); localStorage.setItem('periodData',JSON.stringify(S.periodData)); closeModal(); setTimeout(showPeriodModal,200); };
window.showMemberEdit=function(id){
  var m=S.members[id]; if(!m) return; var img=memberAvatar(id),isYou=id===S.memberId;
  showModal('<div class="sh"></div><div style="display:flex;flex-direction:column;align-items:center;gap:10px;margin-bottom:20px">'+
    '<div onclick="changeMemberAvatar(\''+id+'\')" style="cursor:pointer;position:relative">'+
      (img?'<div style="width:72px;height:72px;border-radius:50%;overflow:hidden"><img src="'+img+'" style="width:100%;height:100%;object-fit:cover"></div>':'<div style="width:72px;height:72px;border-radius:50%;background:'+m.color+';display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:700;color:#fff">'+((m.name||'?')[0])+'</div>')+
      '<div style="position:absolute;bottom:0;right:0;width:22px;height:22px;background:var(--blue);border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid var(--bg)">'+ic('camera',10)+'</div>'+
    '</div>'+
    '<div style="font-size:16px;font-weight:600;color:var(--t1)">'+escHtml(m.name)+(isYou?' ('+t('you')+')':'')+'</div>'+
  '</div>'+
  '<div class="inp-lbl">'+t('editNickname')+'</div><input class="inp" id="mem-name" value="'+escHtml(m.name)+'" style="margin-bottom:14px">'+
  '<button class="btn btn-p btn-full" style="margin-bottom:8px" onclick="submitMemberEdit(\''+id+'\')">'+t('save')+'</button>'+
  '<button class="btn btn-g btn-full" onclick="changeMemberAvatar(\''+id+'\')">'+ic('camera',14)+' '+t('editAvatar')+'</button>');
};
window.changeMemberAvatar=function(id){
  var inp=document.createElement('input'); inp.type='file'; inp.accept='image/*';
  inp.onchange=async function(){ var f=inp.files[0]; if(!f) return; showLoad(); var rd=new FileReader(); rd.onload=async function(e){ try{ var img=new Image(); img.onload=function(){ var canvas=document.createElement('canvas'),sz=Math.min(img.width,img.height,120); canvas.width=sz; canvas.height=sz; canvas.getContext('2d').drawImage(img,(img.width-sz)/2,(img.height-sz)/2,sz,sz,0,0,sz,sz); S.avatars[id]=canvas.toDataURL('image/jpeg',0.7); localStorage.setItem('memberAvatars',JSON.stringify(S.avatars)); hideLoad(); closeModal(); renderSet(); toast(t('wallUpdated')); }; img.src=e.target.result; }catch(err){ hideLoad(); toast(t('imgTooLarge')); } }; rd.readAsDataURL(f); };
  inp.click();
};
window.submitMemberEdit=async function(id){ var name=$('#mem-name')&&$('#mem-name').value.trim(); if(!name) return; S.members[id].name=name; if(id===S.memberId){ S.memberName=name; localStorage.setItem('memberName',name); } if(db&&S.tripCode){ var upd={}; upd['members.'+id+'.name']=name; await updateDoc(doc(db,'trips',S.tripCode),upd); } closeModal(); renderSet(); toast(t('save')); };
window.pickWallpaper=function(){ var inp=document.createElement('input'); inp.type='file'; inp.accept='image/*'; inp.onchange=function(){ var f=inp.files[0]; if(!f) return; var rd=new FileReader(); rd.onload=function(e){ try{ localStorage.setItem('wallpaper',e.target.result); }catch(err){ toast(t('imgTooLarge')); return; } applyWallpaper(); closeModal(); toast(t('wallUpdated')); }; rd.readAsDataURL(f); }; inp.click(); };
window.clearWallpaper=function(){ localStorage.removeItem('wallpaper'); applyWallpaper(); toast(t('wallReset')); };
window.showAddMember=function(){ showModal('<div class="sh"></div><div class="sheet-title">'+t('addMember')+'</div><input class="inp" id="nm-name" placeholder="'+t('addMemberPh')+'" style="margin-bottom:14px"><button class="btn btn-p btn-full" onclick="submitAddMember()">'+t('addMember')+'</button>'); };
window.submitAddMember=async function(){ var name=$('#nm-name')&&$('#nm-name').value.trim(); if(!name){ toast('请输入名字'); return; } var id='u_'+Date.now(),used=Object.values(S.members).map(function(m){ return m.color; }),color=COLORS.find(function(c){ return used.indexOf(c)<0; })||COLORS[0]; if(db&&S.tripCode){ var upd={}; upd['members.'+id]={name:name,color:color,joinedAt:serverTimestamp()}; await updateDoc(doc(db,'trips',S.tripCode),upd); } S.members[id]={name:name,color:color}; closeModal(); renderSet(); toast('已添加：'+name); };
window.confirmLeave=function(){ showModal('<div class="sh"></div><div class="sheet-title">'+t('confirmLeaveTitle')+'</div><div style="font-size:14px;color:var(--t2);margin-bottom:18px">'+t('confirmLeaveMsg')+'</div><button class="btn btn-d btn-full" onclick="leaveTrip()" style="margin-bottom:8px">'+t('confirmLeaveBtn')+'</button><button class="btn btn-g btn-full" onclick="closeModal()">'+t('cancel')+'</button>'); };
window.leaveTrip=function(){ S.unsubs.forEach(function(u){ u(); }); S.unsubs=[]; ['tripCode','memberId','memberName'].forEach(function(k){ localStorage.removeItem(k); }); S.tripCode=null; S.memberId=null; S.memberName=null; S.trip=null; S.members={}; S.expenses=[]; S.chatHistory=[]; closeModal(); var af=document.getElementById('gfab-add'); if(af) af.remove(); var mf=document.getElementById('gfab-mic'); if(mf) mf.remove(); renderApp(); };

// ── INIT ─────────────────────────────────────────────────────────
async function init(){
  if('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(function(e){ console.warn('[SW]',e); });

  // Load custom app icons
  var ci=localStorage.getItem('customAppIcons'); if(ci){ try{ S.customAppIcons=JSON.parse(ci); }catch(e){} }

  window.applyTheme(S.theme);
  applyWallpaper();

  if(S.tripCode&&S.memberId){
    showLoad();
    await fbLoadTrip(S.tripCode);
    // Load journal
    try{ S.journal=JSON.parse(localStorage.getItem('journal_'+S.tripCode)||'[]'); }catch(e){ S.journal=[]; }
    hideLoad();
  }

  renderApp();
  requestGeo();

  if(S.baseCurrency){
    var fxTs=S.fxDate?new Date(S.fxDate).getTime():0;
    if(Date.now()-fxTs>4*3600*1000) fetchRates().then(function(){ if(S.tab==='home') renderHome(); });
  }

  if('Notification' in window&&localStorage.getItem('notifsEnabled')!=='false'){
    if(Notification.permission==='default') Notification.requestPermission();
  }
}
init();
