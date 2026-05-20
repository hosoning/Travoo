// ═══════════════════════════════════════════════════════
// Travoo v10 — app.js
// ═══════════════════════════════════════════════════════
import { initializeApp }   from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import {
  getFirestore, doc, getDoc, setDoc, addDoc, updateDoc, deleteDoc,
  deleteField, collection, onSnapshot, query, orderBy, limit, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

const FB_CFG={apiKey:"AIzaSyCyimwLDWNx92ihDmdHTdFSw4A8g34lPWI",authDomain:"travoo-com.firebaseapp.com",projectId:"travoo-com",storageBucket:"travoo-com.firebasestorage.app",messagingSenderId:"544581218382",appId:"1:544581218382:web:cb0511ab135f15a252931f"};
var fbApp,db;
try{if(FB_CFG.apiKey){fbApp=initializeApp(FB_CFG);db=getFirestore(fbApp);}}catch(e){console.warn('[FB]',e.message);}
if(!localStorage.getItem('deviceId')) localStorage.setItem('deviceId','dev_'+Math.random().toString(36).substr(2,9)+Date.now().toString(36));
var DEVICE_ID=localStorage.getItem('deviceId');

// ── THEMES ────────────────────────────────────────────
const THEMES={
  dark:   {n:'Dark',   mode:'dark', wp:'linear-gradient(158deg,#1a1610 0%,#111318 52%,#13100f 100%)', accent:'#ffffff',aRgb:'255,255,255',swatch:'#333'},
  purple: {n:'Purple', mode:'dark', wp:'linear-gradient(158deg,#0d0011 0%,#16002a 52%,#0a0016 100%)', accent:'#BF5AF2',aRgb:'191,90,242',swatch:'#6a0dad'},
  ocean:  {n:'Ocean',  mode:'dark', wp:'linear-gradient(158deg,#001524 0%,#002030 52%,#001018 100%)', accent:'#00C7BE',aRgb:'0,199,190',swatch:'#006d6b'},
  forest: {n:'Forest', mode:'dark', wp:'linear-gradient(158deg,#001209 0%,#002015 52%,#000d08 100%)', accent:'#30D158',aRgb:'48,209,88',swatch:'#1a6b2e'},
  sunset: {n:'Sunset', mode:'dark', wp:'linear-gradient(158deg,#1a0800 0%,#2a1200 52%,#150600 100%)', accent:'#FF9F0A',aRgb:'255,159,10',swatch:'#8b4f00'},
  rose:   {n:'Rose',   mode:'dark', wp:'linear-gradient(158deg,#1a0010 0%,#2a0020 52%,#150008 100%)', accent:'#FF375F',aRgb:'255,55,95',swatch:'#8b0030'},
  indigo: {n:'Indigo', mode:'dark', wp:'linear-gradient(158deg,#00081a 0%,#001030 52%,#000818 100%)', accent:'#0A84FF',aRgb:'10,132,255',swatch:'#003080'},
  lsilver:{n:'Silver', mode:'light',wp:'', accent:'#5856D6',aRgb:'88,86,214',swatch:'#c8c8d4',lk:''},
  livory: {n:'Ivory',  mode:'light',wp:'', accent:'#FF6B35',aRgb:'255,107,53',swatch:'#d4c4a8',lk:'warm'},
  lsky:   {n:'Sky',    mode:'light',wp:'', accent:'#007AFF',aRgb:'0,122,255',swatch:'#a8c4d4',lk:'sky'},
  lmint:  {n:'Mint',   mode:'light',wp:'', accent:'#34C759',aRgb:'52,199,89',swatch:'#a8d4b4',lk:'mint'},
  auto:   {n:'Auto',   mode:'auto', wp:'', accent:'#007AFF',aRgb:'0,122,255',swatch:'linear-gradient(135deg,#222 50%,#f2f2f0 50%)'},
};
window.applyTheme=function(key){
  var th=THEMES[key]||THEMES.dark,html=document.documentElement;
  html.setAttribute('data-color-mode',th.mode);
  if(th.lk!==undefined) html.setAttribute('data-theme-light',th.lk||''); else html.removeAttribute('data-theme-light');
  html.style.setProperty('--accent',th.accent);
  html.style.setProperty('--accent-rgb',th.aRgb);
  var wp=document.getElementById('wp');
  if(wp&&!localStorage.getItem('wallpaper')&&th.mode==='dark'){wp.style.background=th.wp;wp.style.backgroundImage='';wp.classList.remove('img');}
  var meta=document.getElementById('theme-color-meta');
  if(meta) meta.content=th.mode==='light'?'#f0f0f5':'#000000';
  localStorage.setItem('theme',key);S.theme=key;
};

// ── CURRENCIES ────────────────────────────────────────
const CUR={
  CNY:{s:'¥', n:'人民币 CNY',f:'🇨🇳',d:2},HKD:{s:'HK$',n:'港元 HKD',f:'🇭🇰',d:2},
  KRW:{s:'₩', n:'韩元 KRW',f:'🇰🇷',d:0},JPY:{s:'¥', n:'日元 JPY',f:'🇯🇵',d:0},
  USD:{s:'$', n:'美元 USD',f:'🇺🇸',d:2},EUR:{s:'€', n:'欧元 EUR',f:'🇪🇺',d:2},
  TWD:{s:'NT$',n:'台币 TWD',f:'🇹🇼',d:0},SGD:{s:'S$',n:'新加坡元',f:'🇸🇬',d:2},
  THB:{s:'฿', n:'泰铢 THB',f:'🇹🇭',d:2},GBP:{s:'£', n:'英镑 GBP',f:'🇬🇧',d:2},
  AUD:{s:'A$',n:'澳元 AUD',f:'🇦🇺',d:2},MYR:{s:'RM',n:'令吉 MYR',f:'🇲🇾',d:2},
};
async function fetchRates(){
  try{
    var r=await fetch('https://open.er-api.com/v6/latest/'+S.baseCurrency);
    if(!r.ok) throw new Error('HTTP '+r.status);
    var d=await r.json();
    if(d.result==='success'){S.rates=d.rates;S.fxBase=S.baseCurrency;S.fxDate=d.time_last_update_utc||'';localStorage.setItem('fxRates',JSON.stringify(S.rates));localStorage.setItem('fxBase',S.fxBase);localStorage.setItem('fxDate',S.fxDate);return true;}
    return false;
  }catch(e){console.warn('[FX]',e.message);return false;}
}
function getRate(from,to){if(from===to)return 1;var r=S.rates,b=S.fxBase;if(!r||!Object.keys(r).length)return 1;if(from===b)return r[to]||1;if(to===b)return r[from]?1/r[from]:1;if(r[from]&&r[to])return r[to]/r[from];return 1;}
function fmtCur(amt,cur){var c=CUR[cur]||{s:cur,d:2};var n=c.d===0?Math.round(amt):parseFloat(amt).toFixed(c.d);return c.s+(c.d===0?Number(n).toLocaleString():n);}
function toBase(amt,from){return amt*getRate(from,S.baseCurrency);}

// ── EXPENSE CATEGORIES (hierarchical) ────────────────
const ECAT={
  food:{zh:'餐饮',en:'Food',tw:'餐飲',icon:'food',color:'#FF9F0A',
    sub:{breakfast:{zh:'早餐',en:'Breakfast'},lunch:{zh:'午餐',en:'Lunch'},dinner:{zh:'晚餐',en:'Dinner'},snack:{zh:'小食/零食',en:'Snack'},drinks:{zh:'饮料',en:'Drinks'},cafe:{zh:'咖啡',en:'Coffee/Café'}}},
  transport:{zh:'交通',en:'Transport',tw:'交通',icon:'car',color:'#0A84FF',
    sub:{flight:{zh:'机票',en:'Flight'},train:{zh:'高铁/火车',en:'Train'},bus:{zh:'巴士',en:'Bus'},taxi:{zh:'打车',en:'Taxi'},metro:{zh:'地铁',en:'Metro'},ferry:{zh:'船/渡轮',en:'Ferry'},rental:{zh:'租车',en:'Car Rental'}}},
  accommodation:{zh:'住宿',en:'Stay',tw:'住宿',icon:'hotel2',color:'#30D158',
    sub:{hotel:{zh:'酒店',en:'Hotel'},hostel:{zh:'青旅',en:'Hostel'},airbnb:{zh:'民宿/Airbnb',en:'Airbnb'},resort:{zh:'度假村',en:'Resort'}}},
  shopping:{zh:'购物',en:'Shopping',tw:'購物',icon:'cart',color:'#BF5AF2',
    sub:{clothes:{zh:'衣服',en:'Clothes'},accessories:{zh:'饰品',en:'Accessories'},shoes:{zh:'鞋包',en:'Shoes & Bags'},skincare:{zh:'护肤品',en:'Skincare'},cosmetics:{zh:'化妆品',en:'Cosmetics'},electronics:{zh:'电子产品',en:'Electronics'},other_shop:{zh:'其他购物',en:'Other'}}},
  attraction:{zh:'景点',en:'Attraction',tw:'景點',icon:'map',color:'#64D2FF',
    sub:{ticket:{zh:'门票',en:'Entry'},guide:{zh:'导游',en:'Guide'},activity:{zh:'体验活动',en:'Activity'}}},
  entertainment:{zh:'娱乐',en:'Fun',tw:'娛樂',icon:'heart',color:'#FF375F',
    sub:{show:{zh:'演出',en:'Show'},theme_park:{zh:'主题公园',en:'Theme Park'},nightlife:{zh:'夜生活',en:'Nightlife'},game:{zh:'游艺',en:'Games'}}},
  health:{zh:'医药健康',en:'Health',tw:'醫藥健康',icon:'heart',color:'#30D158',
    sub:{medicine:{zh:'药品',en:'Medicine'},aesthetics:{zh:'医美',en:'Aesthetics'},firstaid:{zh:'急救',en:'First Aid'}}},
  souvenir:{zh:'纪念品',en:'Souvenir',tw:'紀念品',icon:'bag',color:'#FF9F0A',
    sub:{gift:{zh:'手信/特产',en:'Souvenir'},art:{zh:'艺术品',en:'Art'}}},
  sim:{zh:'SIM/网络',en:'SIM',tw:'SIM/網路',icon:'globe',color:'#00C7BE',
    sub:{sim_card:{zh:'SIM卡',en:'SIM Card'},wifi_rent:{zh:'WiFi租借',en:'WiFi Rental'},roaming:{zh:'漫游',en:'Roaming'}}},
  prep:{zh:'旅行准备',en:'Trip Prep',tw:'旅行準備',icon:'plane',color:'#FF6B35',
    sub:{visa:{zh:'签证',en:'Visa'},insurance:{zh:'保险',en:'Insurance'},luggage:{zh:'行李/配件',en:'Luggage'}}},
  other:{zh:'其他',en:'Other',tw:'其他',icon:'wallet',color:'#8E8E93',sub:{}},
};
function catL(k){ var c=ECAT[k]; if(!c) return k; return S.lang==='en'?c.en:(S.lang==='zh-TW'?c.tw:c.zh); }
function subL(cat,sub){ var c=ECAT[cat]; if(!c||!c.sub[sub]) return sub; return S.lang==='en'?c.sub[sub].en:c.sub[sub].zh; }
function catColor(k){ return (ECAT[k]||ECAT.other).color; }
function catIcon(k){ return (ECAT[k]||ECAT.other).icon; }

// ── QUICK APPS ────────────────────────────────────────
const APPS={
  didi:{l:'滴滴',e:'DiDi',s:'diditaxi://',w:'https://www.didiglobal.com',i:'car'},
  baidu:{l:'百度地图',e:'Baidu Maps',s:'baidumap://',w:'https://map.baidu.com',i:'map'},
  meituan:{l:'美团',e:'Meituan',s:'imeituan://',w:'https://www.meituan.com',i:'food'},
  dianping:{l:'大众点评',e:'Dianping',s:'dianping://',w:'https://m.dianping.com',i:'food'},
  fliggy:{l:'飞猪',e:'Fliggy',s:'taobao://',w:'https://www.fliggy.com',i:'plane'},
  '12306':{l:'12306',e:'12306',s:'cn.12306://',w:'https://m.12306.cn',i:'train'},
  googlemaps:{l:'Google地图',e:'Google Maps',s:'comgooglemaps://',w:'https://maps.google.com',i:'map'},
  uber:{l:'Uber',e:'Uber',s:'uber://',w:'https://m.uber.com',i:'car'},
  foodpanda:{l:'Foodpanda',e:'Foodpanda',s:'foodpanda://',w:'https://www.foodpanda.com',i:'food'},
  grab:{l:'Grab',e:'Grab',s:'grab://',w:'https://www.grab.com',i:'car'},
  agoda:{l:'Agoda',e:'Agoda',s:'agoda://',w:'https://www.agoda.com',i:'plane'},
  klook:{l:'Klook',e:'Klook',s:'klook://',w:'https://www.klook.com',i:'bag'},
  kkday:{l:'KKday',e:'KKday',s:'kkday://',w:'https://www.kkday.com',i:'bag'},
  ctrip:{l:'携程',e:'Trip.com',s:'ctrip://',w:'https://www.trip.com',i:'plane'},
  navermap:{l:'NAVER地图',e:'Naver Maps',s:'nmap://',w:'https://map.naver.com',i:'map'},
  kakaotaxi:{l:'Kakao T',e:'Kakao T',s:'kakaotaxi://',w:'https://t.kakao.com',i:'car'},
  baemin:{l:'배달의민족',e:'Baemin',s:'baemin://',w:'https://www.baemin.com',i:'food'},
  mtr:{l:'港铁',e:'MTR',s:'mtr://',w:'https://www.mtr.com.hk',i:'train'},
  wechat:{l:'微信',e:'WeChat',s:'weixin://',w:'https://weixin.qq.com',i:'msg'},
  whatsapp:{l:'WhatsApp',e:'WhatsApp',s:'whatsapp://send?text=',w:'https://api.whatsapp.com/send?text=',i:'msg'},
  alipay:{l:'支付宝',e:'Alipay',s:'alipay://',w:'https://www.alipay.com',i:'wallet'},
  alipayhk:{l:'AlipayHK',e:'AlipayHK',s:'alipayhk://',w:'https://www.alipayhk.com',i:'wallet'},
  payme:{l:'PayMe',e:'PayMe',s:'payme://',w:'https://payme.hsbc.com.hk',i:'wallet'},
};
const MSG_APPS=['wechat','whatsapp','alipay','alipayhk','payme'];
const REGION_PRESETS={
  korea:{n:'韩国',detect:/首尔|釜山|济州|韩国|korea|seoul|busan|jeju/i,apps:['navermap','kakaotaxi','baemin','klook','kkday','ctrip']},
  china:{n:'中国内地',detect:/北京|上海|广州|深圳|成都|中国|china|beijing|shanghai/i,apps:['baidu','didi','meituan','fliggy','dianping','12306']},
  hk:{n:'香港',detect:/香港|hong kong|hk\b|hkg/i,apps:['googlemaps','uber','didi','foodpanda','mtr']},
  japan:{n:'日本',detect:/日本|东京|大阪|京都|japan|tokyo|osaka/i,apps:['googlemaps','klook','ctrip']},
  sea:{n:'东南亚',detect:/泰国|曼谷|新加坡|马来西亚|thailand|singapore/i,apps:['googlemaps','grab','foodpanda','agoda','klook']},
  default:{n:'默认',detect:null,apps:['googlemaps','uber','ctrip','agoda','klook','kkday']},
};
function appL(k){var a=APPS[k];if(!a)return k;return S.lang==='en'?a.e:a.l;}
function detectRegion(){var nm=(S.trip&&S.trip.name)||'';for(var r in REGION_PRESETS){if(REGION_PRESETS[r].detect&&REGION_PRESETS[r].detect.test(nm))return r;}return 'default';}
function getQuickApps(){var c=S.customApps;if(c&&c.length>=2)return c.slice(0,8);return (REGION_PRESETS[detectRegion()]||REGION_PRESETS.default).apps.slice(0,8);}

// ── WEATHER SVG ───────────────────────────────────────
const WX_P={
  sun:'<circle cx="12" cy="12" r="4.5"/><path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>',
  cloudsun:'<path d="M12 4a4 4 0 014 4"/><path d="M17 8a6 6 0 11-6.8 7H5a3 3 0 010-6 .9.9 0 010-.18"/><path d="M12 4V2.5M7.22 5.72l-1.07-1.07M5.5 10H4"/>',
  cloud:'<path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z"/>',
  rain:'<path d="M20 16.58A5 5 0 0018 7h-1.26A8 8 0 104 15.25"/><path d="M8 19v3M12 17v3M16 19v3"/>',
  drizzle:'<path d="M20 16.58A5 5 0 0018 7h-1.26A8 8 0 104 15.25"/><path d="M9 20v2M13 18v2"/>',
  snow:'<path d="M20 17.58A5 5 0 0018 8h-1.26A8 8 0 104 15.25"/><path d="M12 12v8M9 18l3-2 3 2M9 14l3 2 3-2"/>',
  thunder:'<path d="M19 16.9A5 5 0 0018 7h-1.26A8 8 0 104 15.25"/><polyline points="13 11 9 17 13 17 9 23"/>',
  fog:'<path d="M3 10h18M3 14h18M5 18h14M5 6h14"/>',
  wind:'<path d="M9.59 4.59A2 2 0 1111 8H2m10.59 11.41A2 2 0 1014 16H2m15.73-8.27A2.5 2.5 0 1119.5 12H2"/>',
};
const WMO_KEY={0:'sun',1:'sun',2:'cloudsun',3:'cloud',45:'fog',48:'fog',51:'drizzle',53:'drizzle',55:'rain',61:'rain',63:'rain',65:'rain',66:'snow',67:'snow',71:'snow',73:'snow',75:'snow',80:'rain',81:'rain',82:'rain',85:'snow',86:'snow',95:'thunder',96:'thunder',99:'thunder'};
const WX_COL={sun:'#FF9F0A',cloudsun:'#FF9F0A',cloud:'var(--t2)',rain:'#0A84FF',drizzle:'#60A0FF',snow:'#64D2FF',thunder:'#FF9F0A',fog:'var(--t3)',wind:'var(--t2)'};
const WMO_ZH={0:'晴朗',1:'基本晴',2:'部分多云',3:'阴天',45:'有雾',51:'毛毛雨',53:'小雨',55:'中雨',61:'小雨',63:'中雨',65:'大雨',71:'小雪',73:'中雪',80:'阵雨',95:'雷阵雨'};
const WMO_EN={0:'Clear',1:'Mainly clear',2:'Partly cloudy',3:'Overcast',45:'Fog',61:'Light rain',63:'Moderate rain',65:'Heavy rain',71:'Light snow',80:'Showers',95:'Thunderstorm'};
function wxSvg(code,sz){var k=WMO_KEY[code]||'sun';var col=WX_COL[k]||'var(--t2)';sz=sz||20;return '<svg width="'+sz+'" height="'+sz+'" viewBox="0 0 24 24" fill="none" stroke="'+col+'" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+WX_P[k]+'</svg>';}
function wxDesc(code){return (S.lang==='en'?WMO_EN:WMO_ZH)[code]||(S.lang==='en'?'Clear':'晴朗');}

const CLOTH_SVG={
  jacket:'<path d="M20 21v-8a2 2 0 00-.78-1.58L14 7l-2 2-2-2-5.22 4.42A2 2 0 004 13v8h4v-6h8v6z"/>',
  tshirt:'<path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.57a1 1 0 00.99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.57a2 2 0 00-1.34-2.23z"/>',
  umbrella:'<path d="M23 12a11.05 11.05 0 00-22 0zm-5 7a3 3 0 01-6 0v-7"/>',
  sunhat:'<ellipse cx="12" cy="10" rx="10" ry="3"/><path d="M12 10v4M8 17c0 1.66 2.24 3 5 3s5-1.34 5-3"/>',
  gloves:'<path d="M18 11V6a2 2 0 00-4 0v5M14 10V4a2 2 0 00-4 0v6M10 10.5V6a2 2 0 00-4 0v8a6 6 0 0012 0v-3a2 2 0 00-4 0"/>',
  sunscreen:'<rect x="8" y="2" width="8" height="20" rx="2"/><path d="M8 10h8M8 14h8"/>',
};
function clothSvg(k,sz){sz=sz||12;return '<svg width="'+sz+'" height="'+sz+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+(CLOTH_SVG[k]||CLOTH_SVG.tshirt)+'</svg>';}
function getClothRecs(tMax,tMin,precip,wind){
  var avg=(tMax+tMin)/2,en=S.lang==='en',r=[];
  if(avg<0)r=[['jacket',en?'Heavy down':'厚羽绒'],['gloves',en?'Gloves':'手套']];
  else if(avg<8)r=[['jacket',en?'Down jacket':'羽绒服'],['gloves',en?'Gloves':'手套']];
  else if(avg<14)r=[['jacket',en?'Heavy coat':'厚外套']];
  else if(avg<20)r=[['jacket',en?'Light jacket':'薄外套'],['tshirt',en?'Long sleeve':'长袖']];
  else if(avg<26)r=[['tshirt',en?'T-shirt':'T恤'],['jacket',en?'Evening layer':'晚间外套']];
  else r=[['tshirt',en?'Light top':'短袖'],['sunhat',en?'Sun hat':'防晒帽'],['sunscreen',en?'SPF50+':'防晒']];
  if(precip>40)r.push(['umbrella',en?'Umbrella':'雨伞']);
  return r.slice(0,4);
}

// ── I18N ──────────────────────────────────────────────
const T={
'zh-CN':{brand:'Travoo',sub:'和朋友一起记录每趟旅行',join:'加入行程',create:'创建新行程',or:'或',yourName:'你的名字',namePh:'名字',codePh:'6位行程码',myTrips:'我的行程',newTrip:'新建行程',today:'今天',itin:'行程',exp:'花费',ai:'管家',set:'设置',qa:'快捷操作',smRec:'智能提醒',total:'总花费',myPaid:'我付款',cnt:'笔数',detail:'明细',settle:'结算',stats:'统计',code:'行程码',members:'成员',aiCfg:'AI配置',notif:'通知',about:'关于',leave:'退出行程',copy:'复制',share:'分享',lang:'语言',wp:'壁纸',themes:'主题',save:'保存',del:'删除',cancel:'取消',aiPh:'问我任何旅行问题…',aiWelcome:'Travoo 管家',aiWelcomeSub:'餐厅推荐、景点攻略、打车方式\n花费分析，随时为你解答',noExp:'暂无记录',noExpSub:'点击添加花费',paidBy:'付款人',splitWith:'分摊成员',amount:'金额',desc:'描述',cat:'分类',subcat:'细分类',date:'日期',apiEp:'API端点',apiKey:'API Key',model:'模型',saveCfg:'保存配置',noCfg:'请先配置AI',noCfgSub:'在设置中填入API端点和Key',cfgAI:'去配置',msgApp:'消息应用',voiceHint:'按住说话',listening:'聆听中…',editItem:'编辑',addItem:'添加项目',todayTimeline:'今日行程',locationAllow:'允许位置',addExpense:'记录花费',offlineNote:'离线模式',codeShare:'分享此行程码给朋友加入',free:'免费',you:'你',viewFull:'查看完整行程',settled:'已结清',settledSub:'无待结算款项',addMember:'添加成员',logExp:'记账',importXlsx:'导入Excel',pasteImport:'粘贴文字导入',invite:'邀请',nMembers:'名成员',confirmDelItem:'确认删除此项目？',chatSug1:'今天有什么推荐',chatSug2:'附近怎么打车',chatSug3:'景点拍照技巧',chatSug4:'今日花费分析',chatSug5:'提醒我准时出发',pickFromAlbum:'从相册选取',resetDefault:'重置默认',clearChat:'清除对话',version:'版本',connected:'已连接',localMode:'本地模式',confirmLeaveTitle:'退出行程',confirmLeaveMsg:'退出后需重新输入行程码',confirmLeaveBtn:'确认退出',addMemberTitle:'添加成员',addMemberPh:'名字',timeLabel:'时间',actNameLabel:'活动名称',transLabel:'交通方式',spendMinLabel:'预计花费最低',spendMaxLabel:'预计花费最高',noteLabel:'备注/提醒',importantLabel:'重要行程',mustOnTime:'必须准时',addNewDay:'添加新一天',tripInfoTitle:'行程信息',tripNameLabel:'行程名称',dateRangeLabel:'日期范围',importDataLabel:'导入行程',importHint:'支持Excel(.xlsx)或粘贴表格文字',importHint2:'★推荐：Excel全选复制粘贴',pasteImportTitle:'粘贴行程文字',pasteHint:'格式：\n① Excel全选复制粘贴\n② 每行：2000/1/1 08:00 晚餐',wallUpdated:'壁纸已更新',wallReset:'壁纸已重置',imgTooLarge:'图片过大',codeCopied:'行程码已复制',aiConfigSaved:'AI配置已保存',chatCleared:'对话已清除',recognizing:'AI识别中...',recognizeOk:'识别成功，请确认',recognizeFail:'识别失败',logged:'已记录',deleted:'已删除',importOk:'导入成功',importFail:'解析失败',addedDay:'已添加',transferTo:'转给',relatedApps:'相关应用',askAIBtn:'询问管家',notPlanned:'未有行程',countdown:'出发倒计时',tripEnded:'旅程已结束',history:'历史行程',editAvatar:'换头像',editNickname:'改昵称',xhsRefresh:'换一批',editDayTitle:'修改标题',butlerName:'Travoo管家',currency:'货币',baseCurrency:'主货币（结算）',localCurrency:'旅行货币',rate:'汇率',refreshRate:'刷新汇率',rateUnavailable:'汇率未加载',appearance:'外观与显示',deviceId:'设备ID',lists:'清单',shopping:'购物清单',todo:'待办事项',packing:'行李打包',addListItem:'添加项目',listPre:'出发前',listDuring:'旅行中',listPost:'回来后',packingClothes:'衣物',packingDocs:'证件',packingElectronics:'电子',packingToiletries:'洗漱',period:'生理期',periodLastDate:'上次日期',periodCycleLen:'周期天数',periodDuration:'持续天数',periodAdd:'添加记录',periodConflict:'生理期可能与旅行重叠',periodPacking:'生理期提醒：备好卫生用品',customApps:'自定义应用',exportData:'导出数据',importData:'导入数据',importSuccess:'导入成功',markPaid:'标记已付',moveUp:'向前移',moveDown:'向后移',notConfigured:'未配置',noGeo:'请先允许位置权限',localWeather:'当地天气',travelDocs:'机票酒店',addFlight:'添加航班',addHotel:'添加酒店',addTrain:'添加火车',flightNo:'航班号',airline:'航空公司',from:'出发地',to:'目的地',depart:'出发时间',arrive:'到达时间',terminal:'航站楼',seat:'座位',hotelName:'酒店名称',address:'地址',checkIn:'入住日期',checkOut:'退房日期',confirmNo:'预订号',room:'房间号',flight:'航班',hotel:'酒店',train:'火车',ferry:'渡轮',noTravelDocs:'还没有机票/酒店信息',addFirst:'点击+添加',journal:'旅行手账',writeNote:'写点什么…',noJournal:'还没有手账记录',journalPrompt:'记录今天的旅行故事',newEntry:'新建记录',saveEntry:'保存',mood:'心情',moodGreat:'很棒',moodGood:'不错',moodOk:'一般',moodBad:'不好',private:'仅自己可见',shared:'所有人可见',visibility:'可见性',addPhoto:'添加照片',photoBoard:'旅行相册',noPhotos:'还没有照片',catLandscape:'风景',catFood:'美食',catArchitecture:'建筑',catPeople:'人物',catTransport:'交通',catMisc:'其他',setAccount:'账户与成员',setAppearance:'外观',setTravel:'旅行设置',setData:'数据与同步',fromCamera:'拍照',fromAlbum:'相册',splitEqual:'平均分摊',splitCustom:'自定义金额',budget:'预算',setDailyBudget:'设置每日预算',setBudget:'设置总预算',budgetOver:'超支',budgetSave:'节省',perDay:'每天',claimCode:'认领码',claimMemberTitle:'认领成员',claimMemberDesc:'输入认领码成为该成员',canDeleteMember:'可删除（未认领）',geoAllow:'允许位置权限',geoDenied:'位置权限已被拒绝',geoSettings:'请前往系统设置开启',removeMember:'删除成员',removeMemberConfirm:'确认删除此成员？此操作不可撤销',regionDetected:'目的地推荐',
},
'zh-TW':{brand:'Travoo',sub:'和朋友一起記錄每趟旅行',join:'加入行程',create:'建立新行程',or:'或',yourName:'你的名字',namePh:'名字',codePh:'6位行程碼',myTrips:'我的行程',newTrip:'新建行程',today:'今天',itin:'行程',exp:'花費',ai:'管家',set:'設定',qa:'快捷操作',smRec:'智慧提醒',total:'總花費',myPaid:'我付款',cnt:'筆數',detail:'明細',settle:'結算',stats:'統計',code:'行程碼',members:'成員',aiCfg:'AI設定',notif:'通知',about:'關於',leave:'退出行程',copy:'複製',share:'分享',lang:'語言',wp:'桌布',themes:'主題',save:'儲存',del:'刪除',cancel:'取消',aiPh:'問我任何旅遊問題…',aiWelcome:'Travoo管家',aiWelcomeSub:'餐廳推薦、景點攻略、叫車方式\n花費分析，隨時為你解答',noExp:'暫無記錄',noExpSub:'點擊添加花費',paidBy:'付款人',splitWith:'分攤成員',amount:'金額',desc:'描述',cat:'分類',subcat:'細分類',date:'日期',apiEp:'API端點',apiKey:'API Key',model:'模型',saveCfg:'儲存設定',noCfg:'請先設定AI',noCfgSub:'在設定中填入API端點和Key',cfgAI:'去設定',msgApp:'訊息應用',voiceHint:'按住說話',listening:'聆聽中…',editItem:'編輯',addItem:'新增項目',todayTimeline:'今日行程',locationAllow:'允許位置',addExpense:'記錄花費',offlineNote:'離線模式',codeShare:'分享此行程碼給朋友加入',free:'免費',you:'你',viewFull:'查看完整行程',settled:'已結清',settledSub:'無待結算款項',addMember:'添加成員',logExp:'記帳',importXlsx:'匯入Excel',pasteImport:'貼上文字匯入',invite:'邀請',nMembers:'名成員',confirmDelItem:'確認刪除此項目？',chatSug1:'今天有什麼推薦',chatSug2:'附近怎麼叫車',chatSug3:'景點拍照技巧',chatSug4:'今日花費分析',chatSug5:'提醒我準時出發',pickFromAlbum:'從相冊選取',resetDefault:'重置預設',clearChat:'清除對話',version:'版本',connected:'已連接',localMode:'本地模式',confirmLeaveTitle:'退出行程',confirmLeaveMsg:'退出後需重新輸入行程碼',confirmLeaveBtn:'確認退出',addMemberTitle:'添加成員',addMemberPh:'名字',timeLabel:'時間',actNameLabel:'活動名稱',transLabel:'交通方式',spendMinLabel:'預計花費最低',spendMaxLabel:'預計花費最高',noteLabel:'備注/提醒',importantLabel:'重要行程',mustOnTime:'必須準時',addNewDay:'添加新一天',tripInfoTitle:'行程資訊',tripNameLabel:'行程名稱',dateRangeLabel:'日期範圍',importDataLabel:'匯入行程',importHint:'支援Excel(.xlsx)或貼上表格文字',importHint2:'★推薦：Excel全選複製貼上',pasteImportTitle:'貼上行程文字',pasteHint:'格式：\n① Excel全選複製貼上\n② 每行：2000/1/1 08:00 晚餐',wallUpdated:'桌布已更新',wallReset:'已重置桌布',imgTooLarge:'圖片過大',codeCopied:'行程碼已複製',aiConfigSaved:'AI設定已儲存',chatCleared:'對話已清除',recognizing:'AI識別中...',recognizeOk:'識別成功，請確認',recognizeFail:'識別失敗',logged:'已記錄',deleted:'已刪除',importOk:'匯入成功',importFail:'解析失敗',addedDay:'已添加',transferTo:'轉給',relatedApps:'相關應用',askAIBtn:'詢問管家',notPlanned:'未有行程',countdown:'出發倒數',tripEnded:'旅程已結束',history:'歷史行程',editAvatar:'換頭像',editNickname:'改暱稱',xhsRefresh:'換一批',editDayTitle:'修改標題',butlerName:'Travoo管家',currency:'貨幣',baseCurrency:'主貨幣（結算）',localCurrency:'旅行貨幣',rate:'匯率',refreshRate:'重新整理匯率',rateUnavailable:'匯率未載入',appearance:'外觀與顯示',deviceId:'設備ID',lists:'清單',shopping:'購物清單',todo:'待辦事項',packing:'行李打包',addListItem:'添加項目',listPre:'出發前',listDuring:'旅行中',listPost:'回來後',packingClothes:'衣物',packingDocs:'證件',packingElectronics:'電子',packingToiletries:'盥洗',period:'生理期',periodLastDate:'上次日期',periodCycleLen:'週期天數',periodDuration:'持續天數',periodAdd:'添加記錄',periodConflict:'生理期可能與旅行重疊',periodPacking:'生理期提醒：備好衛生用品',customApps:'自訂應用',exportData:'匯出資料',importData:'匯入資料',importSuccess:'匯入成功',markPaid:'標記已付',moveUp:'向前移',moveDown:'向後移',notConfigured:'未配置',noGeo:'請先允許位置權限',localWeather:'當地天氣',travelDocs:'機票酒店',addFlight:'添加航班',addHotel:'添加酒店',addTrain:'添加火車',flightNo:'航班號',airline:'航空公司',from:'出發地',to:'目的地',depart:'出發時間',arrive:'到達時間',terminal:'航站樓',seat:'座位',hotelName:'酒店名稱',address:'地址',checkIn:'入住日期',checkOut:'退房日期',confirmNo:'預訂號',room:'房間號',flight:'航班',hotel:'酒店',train:'火車',ferry:'渡輪',noTravelDocs:'還沒有機票/酒店資訊',addFirst:'點擊+添加',journal:'旅行手帳',writeNote:'寫點什麼…',noJournal:'還沒有手帳記錄',journalPrompt:'記錄今天的旅行故事',newEntry:'新建記錄',saveEntry:'儲存',mood:'心情',moodGreat:'很棒',moodGood:'不錯',moodOk:'一般',moodBad:'不好',private:'僅自己可見',shared:'所有人可見',visibility:'可見性',addPhoto:'添加照片',photoBoard:'旅行相册',noPhotos:'還沒有照片',catLandscape:'風景',catFood:'美食',catArchitecture:'建築',catPeople:'人物',catTransport:'交通',catMisc:'其他',setAccount:'帳號與成員',setAppearance:'外觀',setTravel:'旅行設定',setData:'資料與同步',fromCamera:'拍照',fromAlbum:'相冊',splitEqual:'平均分攤',splitCustom:'自定義金額',budget:'預算',setDailyBudget:'設置每日預算',setBudget:'設置總預算',budgetOver:'超支',budgetSave:'節省',perDay:'每天',claimCode:'認領碼',claimMemberTitle:'認領成員',claimMemberDesc:'輸入認領碼成為該成員',canDeleteMember:'可刪除（未認領）',geoAllow:'允許位置權限',geoDenied:'位置權限已被拒絕',geoSettings:'請前往系統設定開啟',removeMember:'刪除成員',removeMemberConfirm:'確認刪除此成員？',regionDetected:'目的地推薦',
},
'en':{brand:'Travoo',sub:'Plan, track & share every journey',join:'Join Trip',create:'Create New Trip',or:'or',yourName:'Your name',namePh:'Name',codePh:'6-char code',myTrips:'My Trips',newTrip:'New Trip',today:'Today',itin:'Itinerary',exp:'Expenses',ai:'Butler',set:'Settings',qa:'Quick Actions',smRec:'Smart Tips',total:'Total',myPaid:'I Paid',cnt:'Items',detail:'Details',settle:'Settle Up',stats:'Stats',code:'Trip Code',members:'Members',aiCfg:'AI Config',notif:'Notifications',about:'About',leave:'Leave Trip',copy:'Copy',share:'Share',lang:'Language',wp:'Wallpaper',themes:'Theme',save:'Save',del:'Delete',cancel:'Cancel',aiPh:'Ask me anything…',aiWelcome:'Travoo Butler',aiWelcomeSub:'Ask about restaurants, attractions,\ntransport, expenses and more',noExp:'No expenses yet',noExpSub:'Tap to add',paidBy:'Paid by',splitWith:'Split with',amount:'Amount',desc:'Description',cat:'Category',subcat:'Subcategory',date:'Date',apiEp:'API Endpoint',apiKey:'API Key',model:'Model',saveCfg:'Save',noCfg:'AI Not Configured',noCfgSub:'Add API endpoint and key in Settings',cfgAI:'Configure',msgApp:'Messaging',voiceHint:'Hold to speak',listening:'Listening…',editItem:'Edit',addItem:'Add Item',todayTimeline:"Today's Plan",locationAllow:'Allow Location',addExpense:'Log Expense',offlineNote:'Offline mode',codeShare:'Share this code with friends',free:'Free',you:'You',viewFull:'Full Itinerary',settled:'All Settled',settledSub:'No pending payments',addMember:'Add Member',logExp:'Log',importXlsx:'Import Excel',pasteImport:'Paste Text',invite:'Invite',nMembers:'members',confirmDelItem:'Delete this item?',chatSug1:"What's on today",chatSug2:'How to get a taxi',chatSug3:'Photo tips',chatSug4:'Expense summary',chatSug5:'Remind me to leave',pickFromAlbum:'Pick from Album',resetDefault:'Reset',clearChat:'Clear Chat',version:'Version',connected:'Connected',localMode:'Local Mode',confirmLeaveTitle:'Leave Trip',confirmLeaveMsg:"You'll need the code to rejoin",confirmLeaveBtn:'Leave',addMemberTitle:'Add Member',addMemberPh:'Name',timeLabel:'Time',actNameLabel:'Activity',transLabel:'Transport (opt.)',spendMinLabel:'Min Spend',spendMaxLabel:'Max Spend',noteLabel:'Notes',importantLabel:'Highlight',mustOnTime:'Must be on time',addNewDay:'Add Day',tripInfoTitle:'Trip Info',tripNameLabel:'Trip Name',dateRangeLabel:'Dates',importDataLabel:'Import',importHint:'Import Excel or paste text',importHint2:'★ Tip: Copy all from Excel and paste',pasteImportTitle:'Paste Itinerary',pasteHint:'Supported:\n① Copy all from Excel\n② Per line: 2000/1/1 08:00 Dinner',wallUpdated:'Wallpaper updated',wallReset:'Wallpaper reset',imgTooLarge:'Image too large',codeCopied:'Code copied',aiConfigSaved:'AI config saved',chatCleared:'Chat cleared',recognizing:'Recognizing...',recognizeOk:'Recognized',recognizeFail:'Failed',logged:'Logged',deleted:'Deleted',importOk:'Imported',importFail:'Parse failed',addedDay:'Added',transferTo:'pays',relatedApps:'Apps',askAIBtn:'Ask Butler',notPlanned:'Not Planned',countdown:'Countdown',tripEnded:'Trip Ended',history:'History',editAvatar:'Change Photo',editNickname:'Edit Name',xhsRefresh:'Refresh',editDayTitle:'Edit Title',butlerName:'Travoo Butler',currency:'Currency',baseCurrency:'Home Currency',localCurrency:'Trip Currency',rate:'Rate',refreshRate:'Refresh',rateUnavailable:'Rate unavailable',appearance:'Appearance',deviceId:'Device ID',lists:'Lists',shopping:'Shopping',todo:'To-Do',packing:'Packing',addListItem:'Add item',listPre:'Before trip',listDuring:'During',listPost:'After trip',packingClothes:'Clothing',packingDocs:'Documents',packingElectronics:'Electronics',packingToiletries:'Toiletries',period:'Period',periodLastDate:'Last period',periodCycleLen:'Cycle (days)',periodDuration:'Duration (days)',periodAdd:'Add',periodConflict:'Period may overlap with trip',periodPacking:'Pack period supplies',customApps:'Quick Apps',exportData:'Export',importData:'Import',importSuccess:'Imported',markPaid:'Mark Paid',moveUp:'Move Up',moveDown:'Move Down',notConfigured:'Not set',noGeo:'Allow location first',localWeather:'Local Weather',travelDocs:'Flights & Hotels',addFlight:'Add Flight',addHotel:'Add Hotel',addTrain:'Add Train',flightNo:'Flight No.',airline:'Airline',from:'From',to:'To',depart:'Depart',arrive:'Arrive',terminal:'Terminal',seat:'Seat',hotelName:'Hotel Name',address:'Address',checkIn:'Check-in',checkOut:'Check-out',confirmNo:'Booking Ref',room:'Room',flight:'Flight',hotel:'Hotel',train:'Train',ferry:'Ferry',noTravelDocs:'No flight/hotel info yet',addFirst:'Tap + to add',journal:'Journal',writeNote:'Write something…',noJournal:'No journal entries yet',journalPrompt:"Record today's story",newEntry:'New Entry',saveEntry:'Save',mood:'Mood',moodGreat:'Great',moodGood:'Good',moodOk:'OK',moodBad:'Bad',private:'Only me',shared:'Everyone',visibility:'Visibility',addPhoto:'Add Photo',photoBoard:'Photo Board',noPhotos:'No photos yet',catLandscape:'Landscape',catFood:'Food',catArchitecture:'Architecture',catPeople:'People',catTransport:'Transport',catMisc:'Misc',setAccount:'Account & Members',setAppearance:'Appearance',setTravel:'Travel Settings',setData:'Data & Sync',fromCamera:'Camera',fromAlbum:'Album',splitEqual:'Equal split',splitCustom:'Custom amounts',budget:'Budget',setDailyBudget:'Daily budget',setBudget:'Total budget',budgetOver:'Over budget',budgetSave:'Saved',perDay:'per day',claimCode:'Claim Code',claimMemberTitle:'Claim Member Slot',claimMemberDesc:'Enter code to take over this member',canDeleteMember:'Deletable (unclaimed)',geoAllow:'Allow Location',geoDenied:'Location Denied',geoSettings:'Go to System Settings to enable',removeMember:'Remove Member',removeMemberConfirm:'Remove this member? Cannot be undone.',regionDetected:'Recommended for destination',
},
};
function t(k){return (T[S.lang]||T['zh-CN'])[k]||k;}

// ── STATE ──────────────────────────────────────────────
var S={
  lang:         localStorage.getItem('lang')          ||'zh-CN',
  tripCode:     localStorage.getItem('tripCode')      ||null,
  memberId:     localStorage.getItem('memberId')      ||null,
  memberName:   localStorage.getItem('memberName')    ||null,
  trip:null,members:{},expenses:[],chatHistory:[],
  aiConfig:     JSON.parse(localStorage.getItem('aiConfig')     ||'{}'),
  tab:'home',unsubs:[],geo:null,locationName:'',
  tokenUsed:    +(localStorage.getItem('tokenUsed')   ||0),
  tokenBudget:  +(localStorage.getItem('tokenBudget') ||4000),
  msgApp:       localStorage.getItem('msgApp')        ||'wechat',
  localTrips:   JSON.parse(localStorage.getItem('localTrips')   ||'[]'),
  theme:        localStorage.getItem('theme')         ||'dark',
  avatars:      JSON.parse(localStorage.getItem('memberAvatars')||'{}'),
  baseCurrency: localStorage.getItem('baseCurrency')  ||'HKD',
  localCurrency:localStorage.getItem('localCurrency') ||'KRW',
  rates:        JSON.parse(localStorage.getItem('fxRates')      ||'{}'),
  fxBase:       localStorage.getItem('fxBase')        ||'HKD',
  fxDate:       localStorage.getItem('fxDate')        ||'',
  weather:null,weatherHourly:null,
  customApps:   JSON.parse(localStorage.getItem('customApps')   ||'null'),
  customAppIcons:JSON.parse(localStorage.getItem('customAppIcons')||'null'),
  shoppingList: JSON.parse(localStorage.getItem('shoppingList') ||'[]'),
  todoList:     JSON.parse(localStorage.getItem('todoList')     ||'{"pre":[],"during":[],"post":[]}'),
  packingList:  JSON.parse(localStorage.getItem('packingList')  ||'{}'),
  periodData:   JSON.parse(localStorage.getItem('periodData')   ||'{"records":[],"cycleLen":28,"duration":5}'),
  settledRows:  JSON.parse(localStorage.getItem('settledRows')  ||'{}'),
  aiToggles:    JSON.parse(localStorage.getItem('aiToggles')    ||'{"packing":true,"recs":true,"import":true}'),
  budget:       JSON.parse(localStorage.getItem('budget')       ||'{"daily":null,"total":null}'),
  travelDocs:[],journal:[],photoBoard:[],
  _expTab:'list',
};
(function(){var wc=localStorage.getItem('wxCache');if(wc){try{var p=JSON.parse(wc);if(Date.now()-p.ts<3600000){S.weather=p.data;S.weatherHourly=p.hourly||null;}}catch(e){}}})();

const COLORS=['#0A84FF','#FF453A','#30D158','#FF9F0A','#BF5AF2','#FF375F','#00C7BE','#FF6B35'];

// ── ICONS ─────────────────────────────────────────────
const IC={
  home:'<path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z"/><path d="M9 21V12h6v9"/>',
  cal:'<rect x="3" y="4" width="18" height="18" rx="3"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  wallet:'<path d="M21 12H15a2 2 0 000 4h6V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2v-4z"/>',
  chat:'<path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>',
  cog:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33A1.65 1.65 0 0014 21v.09a2 2 0 01-4 0V21a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  chev:'<path d="M9 18l6-6-6-6"/>',
  send:'<polygon points="22 2 15 22 11 13 2 9 22 2"/>',
  mic:'<rect x="9" y="2" width="6" height="11" rx="3"/><path d="M5 10v2a7 7 0 0014 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>',
  car:'<path d="M5 11l1.5-4.5h11L19 11M3 17h2v2h2v-2h10v2h2v-2h2v-6H3v6z"/><circle cx="7" cy="14.5" r="1.5"/><circle cx="17" cy="14.5" r="1.5"/>',
  map:'<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/>',
  food:'<path d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/><path d="M6 2v6M10 2v6M14 2v6"/>',
  plane:'<path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>',
  train:'<rect x="4" y="2" width="16" height="17" rx="3"/><path d="M4 11h16M9 19l-1 3M15 19l1 3"/><circle cx="9" cy="15" r="1"/><circle cx="15" cy="15" r="1"/>',
  copy:'<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>',
  share:'<path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"/>',
  user:'<path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  bell:'<path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>',
  trash:'<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>',
  edit:'<path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4z"/>',
  camera:'<path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/>',
  check:'<polyline points="20 6 9 17 4 12"/>',
  img:'<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>',
  globe:'<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/>',
  msg:'<path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>',
  bag:'<path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>',
  xlsx:'<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/>',
  refresh:'<path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>',
  palette:'<path d="M12 2a10 10 0 100 20c1.1 0 2-.9 2-2v-.5c0-.83.67-1.5 1.5-1.5H17a3 3 0 003-3 8 8 0 00-8-8z"/><circle cx="8" cy="10" r="1.5" fill="currentColor"/><circle cx="11" cy="7" r="1.5" fill="currentColor"/>',
  sun:'<circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>',
  download:'<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
  upload:'<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
  arrowup:'<polyline points="18 15 12 9 6 15"/>',
  arrowdn:'<polyline points="6 9 12 15 18 9"/>',
  search:'<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
  lock:'<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>',
  sliders:'<line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>',
  cart:'<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 001.95-1.57l1.65-7.43H6"/>',
  heart:'<path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>',
  journal:'<path d="M4 2h13a2 2 0 012 2v16a2 2 0 01-2 2H4a2 2 0 01-2-2V4a2 2 0 012-2z"/><path d="M7 8h8M7 12h8M7 16h5"/>',
  photo:'<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>',
  flight:'<path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 00-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>',
  hotel2:'<path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
  piechart:'<path d="M21.21 15.89A10 10 0 118 2.83"/><path d="M22 12A10 10 0 0012 2v10z"/>',
  barChart:'<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>',
};
function ic(n,sz){var p=IC[n]||IC.plus;sz=sz||22;return '<svg width="'+sz+'" height="'+sz+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+p+'</svg>';}

// ── UTILS ──────────────────────────────────────────────
var $=function(s,el){return (el||document).querySelector(s);};
var $$=function(s,el){return Array.prototype.slice.call((el||document).querySelectorAll(s));};
function today(){return new Date().toISOString().split('T')[0];}
function nowH(){return new Date().getHours();}
function genCode(){var c='ABCDEFGHJKLMNPQRSTUVWXYZ23456789',r='';for(var i=0;i<6;i++)r+=c[Math.floor(Math.random()*c.length)];return r;}
function gen4(){var c='ABCDEFGHJKLMNPQRSTUVWXYZ23456789',r='';for(var i=0;i<4;i++)r+=c[Math.floor(Math.random()*c.length)];return r;}
function escHtml(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function getDays(){return (S.trip&&S.trip.days)||[];}
function allItems(){return getDays().reduce(function(a,d){return a.concat(d.items||[]);},[]); }
function findItem(id){return allItems().find(function(i){return i.id===id;});}
function fmtMoney(n){if(n==null)return '';if(n===0)return t('free');return Number.isInteger(n)?'¥'+n:'¥'+n.toFixed(1);}
function spendStr(item){if(item.sMin==null)return '';if(item.sMin===0&&item.sMax===0)return t('free');if(item.sMin===item.sMax)return fmtMoney(item.sMin);return fmtMoney(item.sMin)+' – '+fmtMoney(item.sMax);}
function getWdL(wd){if(S.lang==='en'){var m={'一':'Mon','二':'Tue','三':'Wed','四':'Thu','五':'Fri','六':'Sat','日':'Sun'};return m[wd]||wd;}return '周'+wd;}
function memName(id){return id===S.memberId?t('you'):(S.members[id]?S.members[id].name:id);}
function memColor(id){return S.members[id]?S.members[id].color:COLORS[0];}
function memAvatar(id){return S.avatars[id]||null;}
function renderAv(id,size){
  size=size||34;var m=S.members[id]||{name:'?',color:'#8E8E93'};var img=memAvatar(id);
  var st='width:'+size+'px;height:'+size+'px;';
  if(img)return '<div class="av" style="'+st+'"><img src="'+img+'" alt=""></div>';
  return '<div class="av" style="'+st+'background:'+m.color+';font-size:'+(size*0.38)+'px">'+(m.name||'?')[0]+'</div>';
}
function renderMentions(text){
  if(!text)return '';
  var s=escHtml(text);
  Object.entries(S.members).forEach(function(e){
    var id=e[0],m=e[1];if(!m.name||m.name.length<1)return;
    var safe=m.name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    var dn=id===S.memberId?t('you'):m.name;
    var span='<span style="background:'+m.color+'22;color:'+m.color+';border-radius:4px;padding:0 2px;font-weight:600">@'+escHtml(dn)+'</span>';
    try{s=s.replace(new RegExp(escHtml(safe),'g'),span);}catch(e2){}
  });
  return s;
}

// ── WALLPAPER ─────────────────────────────────────────
function applyWallpaper(){
  var wp=localStorage.getItem('wallpaper'),el=document.getElementById('wp');
  if(!el)return;
  if(wp){el.style.backgroundImage='url('+wp+')';el.classList.add('img');el.style.setProperty('display','block','important');document.body.style.background='transparent';}
  else{el.style.backgroundImage='';el.classList.remove('img');el.style.removeProperty('display');document.body.style.background='';window.applyTheme(S.theme);}
}
async function compressImage(dataUrl,maxDim,quality){
  return new Promise(function(resolve){
    var img=new Image();
    img.onload=function(){var w=img.width,h=img.height,ratio=Math.min(maxDim/w,maxDim/h,1);var c=document.createElement('canvas');c.width=Math.round(w*ratio);c.height=Math.round(h*ratio);c.getContext('2d').drawImage(img,0,0,c.width,c.height);resolve(c.toDataURL('image/jpeg',quality||0.75));};
    img.onerror=function(){resolve(dataUrl);};
    img.src=dataUrl;
  });
}

// ── FIREBASE ──────────────────────────────────────────
async function fbLoad(code){
  if(!db){var raw=localStorage.getItem('lt_'+code);if(raw){var d=JSON.parse(raw);S.trip=d;S.members=d.members||{};return true;}return false;}
  try{var snap=await getDoc(doc(db,'trips',code));if(!snap.exists())return false;S.trip=snap.data();S.members=S.trip.members||{};return true;}
  catch(e){toast('网络错误：'+e.message);return false;}
}
async function fbCreate(code,name){
  var mid='u_'+Date.now(),color=COLORS[0],members={};
  members[mid]={name:name,color:color,joinedVia:'invite',addedBy:null,claimed:true};
  var data={code:code,name:'我的旅行',dates:'',creatorId:mid,members:members,days:[],msgApp:'wechat'};
  S.trip=data;S.members=members;
  if(db){var fd=JSON.parse(JSON.stringify(data));fd.createdAt=serverTimestamp();await setDoc(doc(db,'trips',code),fd);}
  else{try{localStorage.setItem('lt_'+code,JSON.stringify(data));}catch(e){}}
  return {memberId:mid,color:color};
}
async function fbJoin(code,name){
  var mid='u_'+Date.now(),used=Object.values(S.members||{}).map(function(m){return m.color;}),color=COLORS.find(function(c){return used.indexOf(c)<0;})||COLORS[0];
  var memberData={name:name,color:color,joinedVia:'invite',addedBy:null,claimed:true};
  S.members[mid]=memberData;if(S.trip)S.trip.members=S.members;
  if(db){var upd={};upd['members.'+mid]=Object.assign({},memberData,{joinedAt:serverTimestamp()});await updateDoc(doc(db,'trips',code),upd);}
  else{try{if(S.trip)localStorage.setItem('lt_'+code,JSON.stringify(S.trip));}catch(e){}}
  return {memberId:mid,color:color};
}
async function fbSaveDays(days){
  if(!S.tripCode)return;if(S.trip)S.trip.days=days;
  if(db){await updateDoc(doc(db,'trips',S.tripCode),{days:days});}
  else{try{if(S.trip)localStorage.setItem('lt_'+S.tripCode,JSON.stringify(S.trip));}catch(e){}}
}
async function fbAddExpense(data){
  var exp=Object.assign({memberId:S.memberId,createdAt:new Date().toISOString()},data);
  if(db&&S.tripCode){await addDoc(collection(db,'trips',S.tripCode,'expenses'),Object.assign({},exp,{createdAt:serverTimestamp()}));}
  else{S.expenses.unshift(Object.assign({id:'loc_'+Date.now()},exp));refreshExpList();}
}
async function fbUpdateExpense(id,data){
  if(db&&S.tripCode){await updateDoc(doc(db,'trips',S.tripCode,'expenses',id),data);}
  else{var idx=S.expenses.findIndex(function(e){return e.id===id;});if(idx>=0)Object.assign(S.expenses[idx],data);refreshExpList();}
}
async function fbDelExpense(id){
  if(db&&S.tripCode){await deleteDoc(doc(db,'trips',S.tripCode,'expenses',id));}
  else{S.expenses=S.expenses.filter(function(e){return e.id!==id;});refreshExpList();}
}
// Travel docs
async function fbSaveTravelDoc(d){
  if(db&&S.tripCode){var ref=await addDoc(collection(db,'trips',S.tripCode,'travelDocs'),Object.assign({memberId:S.memberId,createdAt:serverTimestamp()},d));return ref.id;}
  else{var id='td_'+Date.now();S.travelDocs.push(Object.assign({id:id,memberId:S.memberId},d));return id;}
}
async function fbDelTravelDoc(id){
  if(db&&S.tripCode){await deleteDoc(doc(db,'trips',S.tripCode,'travelDocs',id));}
  else{S.travelDocs=S.travelDocs.filter(function(d){return d.id!==id;});}
}
// Journal
async function fbSaveJournal(entry){
  var local=JSON.parse(localStorage.getItem('journal_'+(S.tripCode||'x'))||'[]');
  var idx=local.findIndex(function(e){return e.id===entry.id;});
  if(idx>=0)local[idx]=entry;else local.push(entry);
  localStorage.setItem('journal_'+(S.tripCode||'x'),JSON.stringify(local));
  if(db&&S.tripCode&&entry.visibility==='shared'){
    if(entry.id&&!entry.id.startsWith('jl_')){await updateDoc(doc(db,'trips',S.tripCode,'journal',entry.id),entry);}
    else{var ref=await addDoc(collection(db,'trips',S.tripCode,'journal'),Object.assign({},entry,{createdAt:serverTimestamp()}));entry.id=ref.id;}
  }
}
// Photo board
async function fbAddPhoto(pd){
  if(db&&S.tripCode){var ref=await addDoc(collection(db,'trips',S.tripCode,'photoBoard'),Object.assign({addedBy:S.memberId,createdAt:serverTimestamp()},pd));S.photoBoard.unshift(Object.assign({id:ref.id},pd));}
  else{var id='ph_'+Date.now();S.photoBoard.unshift(Object.assign({id:id,addedBy:S.memberId},pd));}
  if(S.tab==='home')renderHome();
}
async function fbDelPhoto(id){
  if(db&&S.tripCode){await deleteDoc(doc(db,'trips',S.tripCode,'photoBoard',id));}
  S.photoBoard=S.photoBoard.filter(function(p){return p.id!==id;});
}

function subscribeAll(code){
  if(!db)return;
  S.unsubs.push(onSnapshot(doc(db,'trips',code),function(snap){if(!snap.exists())return;S.trip=snap.data();S.members=S.trip.members||{};if(S.tab==='home')renderHome();}));
  S.unsubs.push(onSnapshot(query(collection(db,'trips',code,'expenses'),orderBy('createdAt','desc'),limit(200)),function(snap){S.expenses=snap.docs.map(function(d){return Object.assign({id:d.id},d.data());});refreshExpList();}));
  S.unsubs.push(onSnapshot(query(collection(db,'trips',code,'chats',S.memberId,'messages'),orderBy('ts','asc'),limit(60)),function(snap){S.chatHistory=snap.docs.map(function(d){return d.data();});refreshChatMsgs();}));
  S.unsubs.push(onSnapshot(query(collection(db,'trips',code,'travelDocs'),orderBy('createdAt','asc')),function(snap){S.travelDocs=snap.docs.map(function(d){return Object.assign({id:d.id},d.data());});if(S.tab==='home')renderHome();}));
  S.unsubs.push(onSnapshot(query(collection(db,'trips',code,'photoBoard'),orderBy('createdAt','desc'),limit(50)),function(snap){S.photoBoard=snap.docs.map(function(d){return Object.assign({id:d.id},d.data());});if(S.tab==='home')renderHome();}));
}

// ── EXPORT / IMPORT ───────────────────────────────────
window.exportTripData=function(){
  var data={version:4,exported:new Date().toISOString(),tripCode:S.tripCode,memberId:S.memberId,memberName:S.memberName,trip:S.trip,members:S.members,expenses:S.expenses,localTrips:S.localTrips,shoppingList:S.shoppingList,todoList:S.todoList,packingList:S.packingList,aiConfig:S.aiConfig,aiToggles:S.aiToggles,baseCurrency:S.baseCurrency,localCurrency:S.localCurrency,theme:S.theme,lang:S.lang,msgApp:S.msgApp,customApps:S.customApps,avatars:S.avatars,travelDocs:S.travelDocs,budget:S.budget};
  var blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  var url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download='travoo_'+(S.tripCode||'backup')+'_'+today()+'.json';a.click();URL.revokeObjectURL(url);
  toast(S.lang==='en'?'Exported':'导出成功');
};
window.importTripData=function(){
  var inp=document.createElement('input');inp.type='file';inp.accept='.json';
  inp.onchange=function(){
    var f=inp.files[0];if(!f)return;
    var rd=new FileReader();rd.onload=function(e){
      try{
        var data=JSON.parse(e.target.result);
        if(!data.version||!data.tripCode)throw new Error('无效文件');
        if(data.tripCode){S.tripCode=data.tripCode;localStorage.setItem('tripCode',data.tripCode);}
        if(data.memberId){S.memberId=data.memberId;localStorage.setItem('memberId',data.memberId);}
        if(data.memberName){S.memberName=data.memberName;localStorage.setItem('memberName',data.memberName);}
        if(data.trip){S.trip=data.trip;try{localStorage.setItem('lt_'+data.tripCode,JSON.stringify(data.trip));}catch(e2){}}
        if(data.members)S.members=data.members;
        if(data.expenses)S.expenses=data.expenses;
        ['localTrips','shoppingList','todoList','packingList','aiConfig','aiToggles'].forEach(function(k){if(data[k]){S[k]=data[k];localStorage.setItem(k,JSON.stringify(data[k]));}});
        ['baseCurrency','localCurrency','theme','lang','msgApp'].forEach(function(k){if(data[k]){S[k]=data[k];localStorage.setItem(k,data[k]);}});
        if(data.customApps){S.customApps=data.customApps;localStorage.setItem('customApps',JSON.stringify(data.customApps));}
        if(data.avatars){S.avatars=data.avatars;localStorage.setItem('memberAvatars',JSON.stringify(data.avatars));}
        if(data.travelDocs)S.travelDocs=data.travelDocs;
        if(data.budget){S.budget=data.budget;localStorage.setItem('budget',JSON.stringify(data.budget));}
        toast(t('importSuccess'));closeModal();setTimeout(function(){renderApp();},400);
      }catch(err){toast('导入失败：'+err.message);}
    };rd.readAsText(f);
  };
  inp.click();
};

// ── ITINERARY PARSER ──────────────────────────────────
function extractDate(str){
  var wds=['日','一','二','三','四','五','六'],year=new Date().getFullYear();
  var m1=str.match(/(\d{1,2})[\/\-\.](\d{1,2})/);
  if(m1){var mo=parseInt(m1[1]),dy=parseInt(m1[2]);if(mo>=1&&mo<=12&&dy>=1&&dy<=31){var ds=year+'-'+(mo<10?'0':'')+mo+'-'+(dy<10?'0':'')+dy;var d=new Date(ds+'T12:00:00');return {date:ds,month:String(mo),day:String(dy),wd:wds[d.getDay()]};}}
  var m2=str.match(/(\d{4})[\/\-](\d{2})[\/\-](\d{2})/);
  if(m2){var ds=m2[1]+'-'+m2[2]+'-'+m2[3];var d=new Date(ds+'T12:00:00');return {date:ds,month:String(parseInt(m2[2])),day:String(parseInt(m2[3])),wd:wds[d.getDay()]};}
  return null;
}
function guessType(t2){if(/早餐|午餐|晚餐|食饭|吃饭|餐廳|咖啡|breakfast|lunch|dinner|restaurant/i.test(t2))return 'food';if(/入住|check.?in|酒店|民宿/i.test(t2))return 'checkin';if(/打的|打车|高铁|火车|飞机|地铁|taxi|train|flight/i.test(t2))return 'transport';if(/遊覧|参观|景区|博物|temple|museum|park/i.test(t2))return 'attr';return 'leisure';}
function guessApps(text){var a=[];if(/打车|的士|taxi/i.test(text))a.push('didi');if(/地图|导航|map/i.test(text))a.push('googlemaps');if(/高铁|火车|train/i.test(text))a.push('12306');if(/酒店/i.test(text))a.push('ctrip');return a;}
function parseSpend(str){if(!str)return {sMin:null,sMax:null};str=str.replace(/[¥￥,，]/g,'').trim();if(!str||/^[—\-–]+$/.test(str))return {sMin:null,sMax:null};var m=str.match(/(\d+(?:\.\d+)?)\s*[-~–]\s*(\d+(?:\.\d+)?)/);if(m)return {sMin:parseFloat(m[1]),sMax:parseFloat(m[2])};var s=str.match(/(\d+(?:\.\d+)?)/);if(s)return {sMin:parseFloat(s[1]),sMax:parseFloat(s[1])};return {sMin:null,sMax:null};}
function parseTableFormat(lines){
  var days={},dayOrder=[],colMap={date:0,time:1,title:2,transport:3,spend:4,lodge:5,bag:6,notes:7},headerIdx=-1;
  for(var i=0;i<Math.min(lines.length,5);i++){var cells=lines[i].split('\t');if(/日期|时间|行程/.test(cells.join(' '))){headerIdx=i;cells.forEach(function(c,j){c=c.trim();if(/日期/.test(c))colMap.date=j;else if(/时间/.test(c))colMap.time=j;else if(/行程|活动|内容/.test(c))colMap.title=j;else if(/交通/.test(c))colMap.transport=j;else if(/花费|消费|费用/.test(c))colMap.spend=j;else if(/住宿/.test(c))colMap.lodge=j;else if(/备注|notes/i.test(c))colMap.notes=j;});break;}}
  var cur=null,start=headerIdx>=0?headerIdx+1:0;
  for(var i=start;i<lines.length;i++){var cells=lines[i].split('\t');if(cells.every(function(c){return !c.trim();}))continue;var dc=(cells[colMap.date]||'').trim();if(dc){var di=extractDate(dc);if(di)cur=di;}if(!cur)continue;var title=(cells[colMap.title]||'').trim();if(!title)continue;var sp=parseSpend((cells[colMap.spend]||'').trim());if(!days[cur.date]){days[cur.date]={date:cur.date,month:cur.month,day:cur.day,wd:cur.wd,title:cur.date,items:[]};dayOrder.push(cur.date);}var dd=days[cur.date];dd.items.push({id:cur.date.replace(/-/g,'')+'_'+(dd.items.length+1),time:(cells[colMap.time]||'').trim()||'全天',title:title,transport:(cells[colMap.transport]||'').trim(),sMin:sp.sMin,sMax:sp.sMax,lodge:(cells[colMap.lodge]||'').trim(),notes:(cells[colMap.notes]||'').trim(),apps:guessApps(title),type:guessType(title),hi:false,urgent:false});}
  dayOrder.forEach(function(d){var day=days[d];var main=day.items.find(function(i){return i.type==='attr'||i.type==='checkin';})||day.items[0];if(main)day.title=main.title.substring(0,18);});
  return dayOrder.map(function(d){return days[d];}).sort(function(a,b){return a.date.localeCompare(b.date);});
}
function parseFreeText(lines){
  var days={},dayOrder=[],cur=null;
  lines.forEach(function(line){line=line.trim();if(!line||/^[-=─═]+$/.test(line))return;var di=extractDate(line);if(di){cur=di;if(!days[cur.date]){var tp=line.replace(/\d{1,2}[\/\-]\d{1,2}\S*\s*/,'').replace(/\d{4}[\/\-]\d{2}[\/\-]\d{2}\s*/,'').trim();days[cur.date]={date:cur.date,month:cur.month,day:cur.day,wd:cur.wd,title:tp||cur.date,items:[]};dayOrder.push(cur.date);}return;}if(!cur)return;var time='全天';var tm=line.match(/^(\d{1,2}:\d{2})/);if(tm){time=tm[1];line=line.substring(tm[0].length).trim();}line=line.replace(/^[\s·\-]+/,'');if(!line)return;var dd=days[cur.date];dd.items.push({id:cur.date.replace(/-/g,'')+'_'+(dd.items.length+1),time:time,title:line.substring(0,40),transport:'',sMin:null,sMax:null,notes:'',apps:guessApps(line),type:guessType(line),hi:false,urgent:false,lodge:''});});
  dayOrder.forEach(function(d){var day=days[d];if(!day.title||day.title===d){var main=day.items.find(function(i){return i.type!=='food';})||day.items[0];if(main)day.title=main.title.substring(0,18);}});
  return dayOrder.map(function(d){return days[d];}).sort(function(a,b){return a.date.localeCompare(b.date);});
}
function parseItinerary(text){
  if(!text||text.length<5)return [];
  var lines=text.split(/\r?\n/).filter(function(l){return l.trim();});
  var isTable=lines.some(function(l){return l.indexOf('\t')>=0;});
  var result=isTable?parseTableFormat(lines):parseFreeText(lines);
  return result.filter(function(d){return d.items&&d.items.length>0;});
}
window.importFromXlsx=function(){
  if(typeof XLSX==='undefined'){toast('Excel库加载中，请刷新');return;}
  var inp=document.createElement('input');inp.type='file';inp.accept='.xlsx,.xls,.csv';
  inp.onchange=function(){var file=inp.files[0];if(!file)return;closeModal();showLoad();var rd=new FileReader();rd.onload=async function(e){try{var data=new Uint8Array(e.target.result);var wb=XLSX.read(data,{type:'array'});var ws=wb.Sheets[wb.SheetNames[0]];var tsv=XLSX.utils.sheet_to_csv(ws,{FS:'\t'});var days=parseItinerary(tsv);if(!days||!days.length)throw new Error('未识别');await fbSaveDays(days);_updateTripDates(days);hideLoad();renderItin();toast(t('importOk')+'：'+days.length+'天');}catch(err){hideLoad();toast(t('importFail')+'：'+err.message);}};rd.readAsArrayBuffer(file);};
  inp.click();
};
async function importItinAI(text){
  var cfg=S.aiConfig;if(!cfg.apiKey||!cfg.endpoint)throw new Error(t('noCfg'));
  var res=await fetch(cfg.endpoint,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+cfg.apiKey},body:JSON.stringify({model:cfg.model||'gpt-4o-mini',max_tokens:4000,messages:[{role:'user',content:'Parse travel itinerary. Output JSON array ONLY:\n[{"date":"YYYY-MM-DD","month":"M","day":"DD","wd":"一|二|三|四|五|六|日","title":"day summary","items":[{"id":"d1_1","time":"HH:MM","title":"activity","transport":"","sMin":null,"sMax":null,"lodge":"","notes":"","apps":[],"type":"food|transport|attr|act|checkin|leisure","hi":false,"urgent":false}]}]\n\nItinerary:\n'+text}]})});
  if(!res.ok)throw new Error('API '+res.status);
  var d=await res.json();var txt=(d.choices&&d.choices[0]&&d.choices[0].message&&d.choices[0].message.content)||'';var m=txt.match(/\[[\s\S]*\]/);if(!m)throw new Error('解析失败');
  return JSON.parse(m[0]).sort(function(a,b){return a.date.localeCompare(b.date);});
}
function _updateTripDates(days){
  if(!S.trip||!days.length)return;
  var first=days[0],last=days[days.length-1],dates=first.month+'/'+first.day+' — '+last.month+'/'+last.day;
  S.trip.dates=dates;if(db&&S.tripCode)updateDoc(doc(db,'trips',S.tripCode),{dates:dates}).catch(function(){});
  _addLocalTrip(S.tripCode,S.trip.name||'我的旅行',dates);
}

// ── GEO + WEATHER ──────────────────────────────────────
async function requestGeoPermission(){
  if(!navigator.geolocation){toast(t('noGeo'));return;}
  // Check permission state first
  if(navigator.permissions){
    try{
      var perm=await navigator.permissions.query({name:'geolocation'});
      if(perm.state==='denied'){
        showModal('<div class="sh"></div>'+
          '<div class="sheet-title">'+t('geoAllow')+'</div>'+
          '<div style="font-size:14px;color:var(--t2);line-height:1.7;margin-bottom:18px">'+t('geoDenied')+'<br>'+t('geoSettings')+'</div>'+
          '<button class="btn btn-g btn-full" onclick="closeModal()">'+t('cancel')+'</button>');
        return;
      }
    }catch(e){}
  }
  navigator.geolocation.getCurrentPosition(
    async function(pos){
      S.geo={lat:pos.coords.latitude,lon:pos.coords.longitude};
      fetchWeather();
      var name=await fetchLocationName(S.geo.lat,S.geo.lon);
      S.locationName=name;
      if(S.tab==='home')renderHome();
    },
    function(err){
      if(err.code===err.PERMISSION_DENIED){
        showModal('<div class="sh"></div>'+
          '<div class="sheet-title">'+t('geoAllow')+'</div>'+
          '<div style="font-size:14px;color:var(--t2);line-height:1.7;margin-bottom:18px">'+t('geoDenied')+'<br>'+t('geoSettings')+'</div>'+
          '<button class="btn btn-g btn-full" onclick="closeModal()">'+t('cancel')+'</button>');
      }
    }
  );
}
window.reqGeoWeather=function(){requestGeoPermission();};

async function fetchLocationName(lat,lon){
  try{
    var lang=S.lang==='en'?'en':'zh';
    var r=await fetch('https://nominatim.openstreetmap.org/reverse?lat='+lat+'&lon='+lon+'&format=json&zoom=14&accept-language='+lang);
    var d=await r.json();
    var addr=d.address||{};
    return addr.suburb||addr.neighbourhood||addr.quarter||addr.city_district||addr.county||addr.city||addr.town||addr.village||'';
  }catch(e){return '';}
}

async function fetchWeather(){
  if(!S.geo)return;
  try{
    var url='https://api.open-meteo.com/v1/forecast?latitude='+S.geo.lat+'&longitude='+S.geo.lon+
      '&current=temperature_2m,weathercode,windspeed_10m,relative_humidity_2m'+
      '&hourly=temperature_2m,weathercode,precipitation_probability'+
      '&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_mean,weathercode'+
      '&timezone=auto&forecast_days=9&wind_speed_unit=kmh';
    var r=await fetch(url);
    if(!r.ok)throw new Error('HTTP '+r.status);
    var data=await r.json();
    S.weather=data;
    // Extract hourly (next 24h)
    if(data.hourly){
      var now=new Date();
      var nowH2=now.getHours();
      var todayStr=today();
      S.weatherHourly={times:data.hourly.time,temps:data.hourly.temperature_2m,codes:data.hourly.weathercode,precs:data.hourly.precipitation_probability};
    }
    localStorage.setItem('wxCache',JSON.stringify({data:data,hourly:S.weatherHourly,ts:Date.now()}));
    if(S.tab==='home')renderHome();
  }catch(e){console.warn('[WX]',e.message);}
}

// ── WEATHER UI ─────────────────────────────────────────
function renderWeatherMini(){
  var en=S.lang==='en';
  if(!S.geo){
    return '<div class="wx-mini" onclick="reqGeoWeather()" style="padding:11px 13px;display:flex;align-items:center;gap:11px">'+
      '<div>'+wxSvg(2,28)+'</div>'+
      '<div style="flex:1"><div style="font-size:13px;font-weight:600;color:var(--t1)">'+(S.locationName||t('localWeather'))+'</div>'+
        '<div style="font-size:11px;color:var(--t3)">'+(en?'Tap to enable':'点击开启天气')+'</div></div>'+
      '<div style="font-size:12px;color:var(--blue);font-weight:600">'+(en?'Allow':'允许')+'</div>'+
    '</div>';
  }
  if(!S.weather){return '<div class="wx-mini shimmer" style="height:58px;border-radius:var(--r2);margin:0 16px 12px"></div>';}
  var cur=S.weather.current,daily=S.weather.daily;
  var temp=Math.round(cur.temperature_2m);
  var tMax=daily.temperature_2m_max[0],tMin=daily.temperature_2m_min[0],prec0=daily.precipitation_probability_mean[0]||0;
  var wdsEN=['Sun','Mon','Tue','Wed','Thu'],wdsZH=['日','一','二','三','四','五','六'];
  var fHtml='';
  for(var i=0;i<Math.min(5,daily.time.length);i++){
    var d=new Date(daily.time[i]+'T12:00:00');
    var dl=i===0?(en?'Today':'今天'):(en?wdsEN[d.getDay()]:'周'+wdsZH[d.getDay()]);
    fHtml+='<div class="wx-mini-day">'+
      '<div class="wx-mini-day-lbl">'+dl+'</div>'+
      '<div style="display:flex;justify-content:center;margin:2px 0">'+wxSvg(daily.weathercode[i],14)+'</div>'+
      '<div class="wx-mini-day-temp">'+Math.round(daily.temperature_2m_max[i])+'°</div>'+
    '</div>';
  }
  var clothes=getClothRecs(tMax,tMin,prec0,Math.round(cur.windspeed_10m));
  var cHtml=clothes.map(function(c){return '<div class="wx-pill">'+clothSvg(c[0],10)+' '+escHtml(c[1])+'</div>';}).join('');
  return '<div class="wx-mini" onclick="showWeatherFull()">'+
    '<div class="wx-mini-row">'+
      '<div>'+wxSvg(cur.weathercode,32)+'</div>'+
      '<div style="flex:1">'+
        (S.locationName?'<div class="wx-mini-loc">'+escHtml(S.locationName)+'</div>':'')+
        '<div class="wx-mini-temp">'+temp+'°C</div>'+
        '<div class="wx-mini-desc">'+wxDesc(cur.weathercode)+' · '+cur.relative_humidity_2m+'% · '+Math.round(cur.windspeed_10m)+'km/h</div>'+
      '</div>'+
      '<div style="display:flex;gap:8px;padding-left:4px">'+fHtml+'</div>'+
    '</div>'+
    (cHtml?'<div class="wx-clothes">'+cHtml+'</div>':'')+
  '</div>';
}

window.showWeatherFull=function(){
  if(!S.weather)return;
  var en=S.lang==='en';
  var cur=S.weather.current,daily=S.weather.daily;
  var temp=Math.round(cur.temperature_2m);
  var tMax=daily.temperature_2m_max[0],tMin=daily.temperature_2m_min[0],prec0=daily.precipitation_probability_mean[0]||0;
  var clothes=getClothRecs(tMax,tMin,prec0,Math.round(cur.windspeed_10m));

  // 24h hourly
  var hourlyHtml='';
  if(S.weatherHourly){
    var nowTs=new Date();var nowHour=nowTs.getHours();var todayStr=today();
    var shown=0;
    for(var i=0;i<S.weatherHourly.times.length&&shown<24;i++){
      var ts=S.weatherHourly.times[i];if(!ts)continue;
      var tDate=ts.split('T')[0],tH=parseInt(ts.split('T')[1]);
      var tsMs=new Date(ts).getTime();if(tsMs<Date.now()-3600000)continue;
      var lbl=tDate===todayStr?(tH+':00'):(tDate.substring(5)+' '+tH+':00');
      if(shown===0)lbl=en?'Now':'现在';
      hourlyHtml+='<div class="wx-hour">'+
        '<div class="wx-hour-time">'+lbl+'</div>'+
        wxSvg(S.weatherHourly.codes[i]||0,18)+
        '<div class="wx-hour-temp">'+Math.round(S.weatherHourly.temps[i]||0)+'°</div>'+
        (S.weatherHourly.precs[i]>10?'<div class="wx-hour-prec">'+S.weatherHourly.precs[i]+'%</div>':'')+
      '</div>';
      shown++;
    }
  }

  // 9-day daily
  var wdsEN=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  var wdsZH=['日','一','二','三','四','五','六'];
  var allMax=daily.temperature_2m_max;
  var globalMax=Math.max.apply(null,allMax.filter(function(x){return x!=null;}));
  var globalMin=Math.min.apply(null,daily.temperature_2m_min.filter(function(x){return x!=null;}));
  var range=globalMax-globalMin||1;
  var dailyHtml='';
  for(var i=0;i<Math.min(9,daily.time.length);i++){
    var d2=new Date(daily.time[i]+'T12:00:00');
    var wd=en?wdsEN[d2.getDay()]:'周'+wdsZH[d2.getDay()];
    var dl=i===0?(en?'Today':'今天'):wd;
    var pr=daily.precipitation_probability_mean[i]||0;
    var barW=Math.max(8,((daily.temperature_2m_max[i]-daily.temperature_2m_min[i])/range)*100);
    var barL=Math.max(0,((daily.temperature_2m_min[i]-globalMin)/range)*100);
    dailyHtml+='<div class="wx-day-row">'+
      '<div class="wx-day-name">'+dl+'</div>'+
      wxSvg(daily.weathercode[i],18)+
      '<div class="wx-day-prec">'+(pr>10?pr+'%':'')+'</div>'+
      '<div class="wx-day-range"><div class="wx-day-fill" style="left:'+barL+'%;width:'+barW+'%"></div></div>'+
      '<div class="wx-day-temps"><span class="wx-day-min">'+Math.round(daily.temperature_2m_min[i])+'°</span><span class="wx-day-max">'+Math.round(daily.temperature_2m_max[i])+'°</span></div>'+
    '</div>';
  }

  var clothHtml=clothes.map(function(c){return '<div style="display:inline-flex;align-items:center;gap:6px;padding:6px 11px;background:var(--glass-bg);border:0.5px solid var(--glass-border);border-radius:9px;font-size:12px;color:var(--t1)">'+clothSvg(c[0],13)+' '+escHtml(c[1])+'</div>';}).join('');

  var ov=document.createElement('div');ov.className='wx-full';
  ov.innerHTML=
    '<div style="position:absolute;top:0;left:0;right:0;z-index:10;padding:calc(var(--sai)+6px) 16px 8px;display:flex;align-items:center">'+
      '<div class="nbtn" onclick="this.closest(\'.wx-full\').remove()">'+ic('arrowup',15)+'</div>'+
      '<div style="flex:1;text-align:center;font-size:14px;font-weight:600;color:var(--t1)">'+(en?'Weather':'天气')+'</div>'+
      '<div style="width:34px"></div>'+
    '</div>'+
    '<div class="wx-full-hero">'+
      (S.locationName?'<div class="wx-full-loc">'+escHtml(S.locationName)+'</div>':'')+''+
      '<div class="wx-full-temp">'+temp+'°</div>'+
      '<div class="wx-full-desc">'+wxDesc(cur.weathercode)+'</div>'+
      '<div class="wx-full-hilo">H:'+Math.round(tMax)+'° L:'+Math.round(tMin)+'°  |  '+cur.relative_humidity_2m+'%  '+Math.round(cur.windspeed_10m)+'km/h</div>'+
    '</div>'+
    '<div class="wx-full-scroll">'+
      (hourlyHtml?'<div class="wx-section"><div class="wx-section-title">'+(en?'Hourly (24h)':'未来24小时')+'</div><div class="wx-hourly-row">'+hourlyHtml+'</div></div>':'')+
      '<div class="wx-section"><div class="wx-section-title">'+(en?'9-Day Forecast':'9日预报')+'</div><div class="wx-daily-row">'+dailyHtml+'</div></div>'+
      (clothHtml?'<div class="wx-section" style="padding:12px 13px"><div class="wx-section-title" style="padding:0 0 7px">'+(en?'What to wear':'穿搭建议')+'</div><div style="display:flex;flex-wrap:wrap;gap:7px">'+clothHtml+'</div></div>':'')+
    '</div>';
  document.body.appendChild(ov);
};

// ── NOTIFICATIONS + VOICE + APP LAUNCHER ──────────────
function checkNotifs(){
  if(localStorage.getItem('notifsEnabled')==='false')return;
  var todayDay=getDays().find(function(d){return d.date===today();});if(!todayDay)return;
  var now=new Date(),shown=JSON.parse(localStorage.getItem('shownNotifs')||'[]');
  todayDay.items.forEach(function(item){
    if(!item.time||item.time==='全天')return;
    var parts=(item.time+':00').split(':'),h=parseInt(parts[0]),m=parseInt(parts[1]);
    var dt=new Date(today()+'T'+(h<10?'0':'')+h+':'+(m<10?'0':'')+m+':00'),diff=(dt-now)/60000;
    var n30='n30_'+item.id;
    if(diff>=28&&diff<=32&&shown.indexOf(n30)<0){shown.push(n30);localStorage.setItem('shownNotifs',JSON.stringify(shown));showNotifBanner('Travoo','30min: '+item.title,'');}
    var nN='nnow_'+item.id;
    if(diff>=-2&&diff<=3&&shown.indexOf(nN)<0){shown.push(nN);localStorage.setItem('shownNotifs',JSON.stringify(shown));showNotifBanner('Travoo',item.title,item.urgent?'⚠️ 必须准时':'祝旅途愉快');}
  });
}
function showNotifBanner(app,title,body){
  var e=$('.nb');if(e)e.remove();
  var d=document.createElement('div');d.className='nb';
  d.innerHTML='<div class="nb-hdr"><div class="nb-icon">'+ic('bell',10)+'</div><span class="nb-app">'+escHtml(app)+'</span><span class="nb-time">现在</span></div><div class="nb-title">'+escHtml(title)+'</div>'+(body?'<div class="nb-body">'+escHtml(body)+'</div>':'');
  document.body.appendChild(d);
  d.addEventListener('click',function(){d.classList.add('out');setTimeout(function(){d.remove();},280);});
  setTimeout(function(){d.classList.add('out');setTimeout(function(){d.remove();},280);},6000);
}
var recognition=null;
function startVoice(onResult){
  var SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR){showVoiceFallback(onResult);return;}
  var finalText='',isDone=false;
  var ov=document.createElement('div');ov.className='voice-ov';
  ov.innerHTML='<div class="voice-ring">'+ic('mic',38)+'</div><div class="voice-hint" id="vh">'+t('listening')+'</div><div class="voice-text" id="vt"></div><div style="display:flex;gap:11px;margin-top:26px"><div class="voice-cancel" id="vdone" style="background:rgba(255,255,255,.2);color:#fff;font-weight:700;padding:10px 26px">完成</div><div class="voice-cancel" id="vcancel">'+t('cancel')+'</div></div>';
  document.body.appendChild(ov);
  function finish(){if(isDone)return;isDone=true;try{recognition&&recognition.stop();}catch(e){}ov.remove();var res=finalText.trim();if(res)onResult(res);}
  function cancel(){isDone=true;try{recognition&&recognition.stop();}catch(e){}ov.remove();}
  $('#vdone',ov).addEventListener('click',finish);$('#vcancel',ov).addEventListener('click',cancel);
  recognition=new SR();recognition.lang=S.lang==='en'?'en-US':'cmn-Hans-CN';recognition.continuous=true;recognition.interimResults=true;
  recognition.onresult=function(e){var interim='';for(var i=e.resultIndex;i<e.results.length;i++){var seg=e.results[i][0].transcript;if(e.results[i].isFinal)finalText+=seg;else interim+=seg;}var el=$('#vt',ov);if(el)el.innerHTML='<span style="color:rgba(255,255,255,.95)">'+escHtml(finalText)+'</span>'+(interim?'<span style="color:rgba(255,255,255,.4)">'+escHtml(interim)+'</span>':'');};
  recognition.onerror=function(e){var h=$('#vh',ov);if(h){h.textContent='错误：'+e.error;h.style.color='rgba(255,100,80,.9)';}if(e.error==='no-speech'&&!isDone)setTimeout(function(){try{recognition.start();}catch(er){}},200);};
  recognition.onend=function(){if(!isDone)setTimeout(function(){try{recognition.start();}catch(e){finish();}},150);};
  try{recognition.start();}catch(e){ov.remove();showVoiceFallback(onResult);}
}
function showVoiceFallback(onResult){
  showModal('<div class="sh"></div><div class="sheet-title">输入文字</div><input class="inp" id="vf-inp" placeholder="输入内容" style="margin-bottom:13px"><button class="btn btn-p btn-full" onclick="window._vfcb&&window._vfcb($(`#vf-inp`).value.trim());closeModal()">确认</button>');
  window._vfcb=function(txt){if(txt)onResult(txt);window._vfcb=null;};
}
function handleVoiceIntent(txt){
  var low=txt.toLowerCase();
  if(/记录|花了|消费|spent|expense/.test(low)){var m=txt.match(/\d+(\.\d+)?/);if(m){switchTab('exp');setTimeout(function(){showAddExpenseModal({amount:parseFloat(m[0]),description:txt});},300);return;}}
  if(/叫车|打车|taxi|uber/.test(low)){openApp('didi');return;}
  switchTab('chat');setTimeout(function(){sendChatMsg(txt);},300);
}
window.openApp=function(key,extra){
  var app=APPS[key];if(!app)return;extra=extra||'';
  if(!app.s){window.open(app.w+extra,'_blank');return;}
  showLoad();var opened=false,timer;
  function onHide(){if(document.hidden){opened=true;clearTimeout(timer);hideLoad();}}
  document.addEventListener('visibilitychange',onHide);
  timer=setTimeout(function(){document.removeEventListener('visibilitychange',onHide);if(!opened){hideLoad();window.open(app.w+extra,'_blank');}},1800);
  try{window.location.href=app.s+extra;}catch(e){clearTimeout(timer);document.removeEventListener('visibilitychange',onHide);hideLoad();window.open(app.w+extra,'_blank');}
};

// ── MODAL + LOAD + TOAST ──────────────────────────────
var _ov=null;
function showModal(html){
  closeModal();
  var d=document.createElement('div');d.className='ov';
  d.innerHTML='<div class="sheet">'+html+'</div>';
  d.addEventListener('click',function(e){if(e.target===d)closeModal();});
  document.body.appendChild(d);_ov=d;
}
window.closeModal=function(){
  if(!_ov)return;
  _ov.style.animation='ovIn .15s ease reverse forwards';
  var ov=_ov;_ov=null;
  setTimeout(function(){ov.remove();},160);
};
function showLoad(){if($('.load-ov'))return;var d=document.createElement('div');d.className='load-ov';d.innerHTML='<div class="spin"></div>';document.body.appendChild(d);}
function hideLoad(){var d=$('.load-ov');if(d)d.remove();}
function toast(msg,dur){
  var e=$('.toast-el');if(e)e.remove();if(!msg)return;
  var d=document.createElement('div');d.className='toast-el';d.textContent=msg;
  document.body.appendChild(d);
  var ms=(dur===undefined)?2400:dur;
  if(ms>0)setTimeout(function(){d.style.opacity='0';setTimeout(function(){d.remove();},280);},ms);
}

// ── AI ────────────────────────────────────────────────
function sysPrompt(){
  var td=getDays().find(function(d){return d.date===today();});
  return 'You are Travoo Butler for trip "'+(S.trip&&S.trip.name||'Trip')+'". Today: '+today()+(td?' - '+td.title:'')+'. Members: '+Object.values(S.members).map(function(m){return m.name;}).join(', ')+'. Base currency: '+S.baseCurrency+'. Reply concisely in user language.';
}
async function callAI(userText){
  var cfg=S.aiConfig;if(!cfg.apiKey||!cfg.endpoint)throw new Error(t('noCfg'));
  var msgs=[{role:'system',content:sysPrompt()}];
  var hist=S.chatHistory.slice(-14);for(var i=0;i<hist.length;i++)msgs.push({role:hist[i].role,content:hist[i].content});
  msgs.push({role:'user',content:userText});
  var res=await fetch(cfg.endpoint,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+cfg.apiKey},body:JSON.stringify({model:cfg.model||'gpt-4o-mini',messages:msgs,max_tokens:S.tokenBudget||2000,temperature:0.75})});
  if(!res.ok)throw new Error('API '+res.status+': '+await res.text());
  var data=await res.json();
  var reply=(data.choices&&data.choices[0]&&data.choices[0].message&&data.choices[0].message.content)||'(no reply)';
  var used=(data.usage&&data.usage.total_tokens)||0;S.tokenUsed+=used;localStorage.setItem('tokenUsed',S.tokenUsed);
  return reply;
}
async function fbSaveMsg(role,content){
  if(!db||!S.tripCode||!S.memberId)return;
  try{await addDoc(collection(db,'trips',S.tripCode,'chats',S.memberId,'messages'),{role:role,content:content,ts:serverTimestamp()});}catch(e){}
}

// ── EXPENSE STATS ─────────────────────────────────────
function svgDonut(segments,size){
  var total=segments.reduce(function(a,s){return a+s.value;},0);
  if(!total)return '<svg width="'+size+'" height="'+size+'" viewBox="0 0 100 100"><circle cx="50" cy="50" r="35" fill="none" stroke="var(--glass-bg3)" stroke-width="14"/></svg>';
  var r=35,cx=50,cy=50,circum=2*Math.PI*r,offset=0,paths='';
  segments.forEach(function(s){
    var pct=s.value/total,dash=pct*circum;
    paths+='<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="none" stroke="'+s.color+'" stroke-width="14" stroke-dasharray="'+dash.toFixed(2)+' '+(circum-dash).toFixed(2)+'" stroke-dashoffset="'+(-offset).toFixed(2)+'" transform="rotate(-90 '+cx+' '+cy+')" style="transition:stroke-dasharray .8s var(--sp)"/>';
    offset+=dash;
  });
  return '<svg width="'+size+'" height="'+size+'" viewBox="0 0 100 100" style="overflow:visible">'+paths+'</svg>';
}

function getExpStats(){
  var catTotals={},dailyTotals={},grandTotal=0;
  S.expenses.forEach(function(e){
    var amt=Number(e.baseAmount||e.amount)||0;
    grandTotal+=amt;
    var cat=e.category||'other';
    catTotals[cat]=(catTotals[cat]||0)+amt;
    var d=e.date||today();
    dailyTotals[d]=(dailyTotals[d]||0)+amt;
  });
  return {catTotals:catTotals,dailyTotals:dailyTotals,grandTotal:grandTotal};
}

function renderExpStats(){
  var stats=getExpStats(),bc=CUR[S.baseCurrency]||{s:'¥'};
  var segments=Object.entries(stats.catTotals).map(function(e){return {key:e[0],value:e[1],color:catColor(e[0])};}).sort(function(a,b){return b.value-a.value;}).slice(0,8);
  var donut=svgDonut(segments,120);
  var legendHtml=segments.map(function(s){
    var pct=stats.grandTotal>0?((s.value/stats.grandTotal)*100).toFixed(1):0;
    return '<div class="stat-legend-item"><div class="stat-legend-dot" style="background:'+s.color+'"></div><span class="stat-legend-lbl">'+catL(s.key)+'</span><span class="stat-legend-pct">'+pct+'%  '+bc.s+Math.round(s.value)+'</span></div>';
  }).join('');

  // Daily bars
  var days=getDays();
  var dateLabels=days.length>0?days.map(function(d){return d.date;}):Object.keys(stats.dailyTotals).sort().slice(-7);
  var maxD=Math.max.apply(null,dateLabels.map(function(d){return stats.dailyTotals[d]||0;}).concat([1]));
  var barsHtml=dateLabels.map(function(d,i){
    var amt=stats.dailyTotals[d]||0;
    var h=Math.max(2,Math.round((amt/maxD)*52));
    var wd=days[i]?getWdL(days[i].wd):(d.substring(5));
    return '<div class="stat-bar-col">'+
      '<div class="stat-bar-amt">'+bc.s+Math.round(amt)+'</div>'+
      '<div class="stat-bar-fill" style="height:'+h+'px;background:var(--accent);opacity:'+(amt>0?1:.2)+'"></div>'+
      '<div class="stat-bar-lbl">'+wd+'</div>'+
    '</div>';
  }).join('');

  // Budget
  var budget=S.budget,budgetHtml='';
  if(budget.total){
    var pct=Math.min(100,Math.round((stats.grandTotal/budget.total)*100));
    var over=stats.grandTotal>budget.total;
    var fillColor=over?'var(--red)':(pct>80?'var(--orange)':'var(--green)');
    var msg=over?'⚠️ '+t('budgetOver')+' '+bc.s+Math.round(stats.grandTotal-budget.total):
      (pct<70?'🎉 '+t('budgetSave')+' '+bc.s+Math.round(budget.total-stats.grandTotal):'');
    budgetHtml='<div class="budget-row">'+
      '<div style="display:flex;justify-content:space-between;margin-bottom:4px"><span style="font-size:13px;color:var(--t2)">'+t('budget')+'</span><span style="font-size:13px;font-weight:700;color:var(--t1)">'+bc.s+Math.round(stats.grandTotal)+' / '+bc.s+budget.total+'</span></div>'+
      '<div class="budget-prog"><div class="budget-fill" style="width:'+pct+'%;background:'+fillColor+'"></div></div>'+
    (msg ? '<div class="budget-praise" style="background:' + (over ? 'rgba(var(--red-rgb),.08)' : 'rgba(var(--green-rgb),.08)') + ';border:0.5px solid ' + (over ? 'rgba(var(--red-rgb),.2)' : 'rgba(var(--green-rgb),.2)') + '">' + escHtml(msg) + '</div>' : '')
    '</div>';
  }
  var dailyBudgetHtml='';
  if(budget.daily){
    var todaySpend=stats.dailyTotals[today()]||0;
    var dpct=Math.min(100,Math.round((todaySpend/budget.daily)*100));
    var dOver=todaySpend>budget.daily;
    var dMsg=dOver?'⚠️ '+t('budgetOver')+' '+bc.s+Math.round(todaySpend-budget.daily):
      (dpct<70?'🎉 '+t('budgetSave')+' '+bc.s+Math.round(budget.daily-todaySpend):'');
    dailyBudgetHtml='<div class="budget-row">'+
      '<div style="display:flex;justify-content:space-between;margin-bottom:4px"><span style="font-size:13px;color:var(--t2)">'+t('perDay')+'</span><span style="font-size:13px;font-weight:700;color:var(--t1)">'+bc.s+Math.round(todaySpend)+' / '+bc.s+budget.daily+'</span></div>'+
      '<div class="budget-prog"><div class="budget-fill" style="width:'+dpct+'%;background:'+(dOver?'var(--red)':dpct>80?'var(--orange)':'var(--green)')+'"></div></div>'+
      (dMsg?'<div class="budget-praise" style="background:'+(dOver?'rgba(var(--red-rgb),.08)':'rgba(var(--green-rgb),.08)')+'">'+escHtml(dMsg)+'</div>':'')+
    '</div>';
  }

  var el=$('#exp-stats');
  if(!el)return;
  el.innerHTML='<div class="exp-stats-wrap">'+
    '<div class="stat-donut-row"><div>'+donut+'</div><div class="stat-legend">'+legendHtml+'</div></div>'+
    (barsHtml?'<div style="border-top:0.5px solid var(--glass-border)"><div style="padding:10px 13px 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--t3)">'+(S.lang==='en'?'Daily Spending':'每日花费')+'</div><div class="stat-daily-bar-wrap"><div class="stat-daily-bar">'+barsHtml+'</div></div></div>':'')+
    (budgetHtml||dailyBudgetHtml?'<div style="border-top:0.5px solid var(--glass-border)">'+budgetHtml+dailyBudgetHtml+'<div style="padding:8px 13px"><button class="btn btn-g btn-full" style="padding:9px;font-size:13px" onclick="showBudgetModal()">'+ic('sliders',13)+' '+t('setBudget')+' / '+t('setDailyBudget')+'</button></div></div>':'<div style="padding:8px 13px"><button class="btn btn-g btn-full" style="padding:9px;font-size:13px" onclick="showBudgetModal()">'+ic('sliders',13)+' '+t('setBudget')+' / '+t('setDailyBudget')+'</button></div>')+
  '</div>';
}

window.showBudgetModal=function(){
  var bc=CUR[S.baseCurrency]||{s:'¥'};
  showModal('<div class="sh"></div><div class="sheet-title">'+t('budget')+'</div>'+
    '<div class="inp-lbl">'+t('setBudget')+'（'+bc.s+'）</div>'+
    '<input class="inp" id="bgt-total" type="number" value="'+(S.budget.total||'')+'" placeholder="0" style="margin-bottom:11px">'+
    '<div class="inp-lbl">'+t('setDailyBudget')+'（'+bc.s+'）</div>'+
    '<input class="inp" id="bgt-daily" type="number" value="'+(S.budget.daily||'')+'" placeholder="0" style="margin-bottom:14px">'+
    '<button class="btn btn-p btn-full" onclick="saveBudget()">'+t('save')+'</button>');
};
window.saveBudget=function(){
  var tot=parseFloat($('#bgt-total')&&$('#bgt-total').value)||null;
  var day=parseFloat($('#bgt-daily')&&$('#bgt-daily').value)||null;
  S.budget={total:tot,daily:day};localStorage.setItem('budget',JSON.stringify(S.budget));
  closeModal();toast(t('save'));if(S.tab==='exp')renderExp();
};

// ── SETTLEMENT ────────────────────────────────────────
function calcSettle(){
  var ids=Object.keys(S.members);if(ids.length<2)return [];
  var bal={};ids.forEach(function(id){bal[id]=0;});
  S.expenses.forEach(function(e){
    var amt=Number(e.baseAmount||e.amount)||0;
    var split=e.splitAmong||ids;
    var splitType=e.splitType||'equal';
    if(splitType==='custom'&&e.customSplits){
      // Custom splits: each person has specified amount
      if(bal[e.paidBy]!==undefined)bal[e.paidBy]+=amt;
      Object.entries(e.customSplits).forEach(function(entry){
        var mid=entry[0],mAmt=entry[1];
        if(bal[mid]!==undefined)bal[mid]-=mAmt;
      });
    } else {
      var share=amt/(split.length||1);
      if(bal[e.paidBy]!==undefined)bal[e.paidBy]+=amt;
      split.forEach(function(id){if(bal[id]!==undefined)bal[id]-=share;});
    }
  });
  var txns=[],deb=ids.filter(function(id){return bal[id]<-0.01;}).map(function(id){return {id:id,a:-bal[id]};}).sort(function(a,b){return b.a-a.a;}),crd=ids.filter(function(id){return bal[id]>0.01;}).map(function(id){return {id:id,a:bal[id]};}).sort(function(a,b){return b.a-a.a;});
  var di=0,ci=0;
  while(di<deb.length&&ci<crd.length){var p=Math.min(deb[di].a,crd[ci].a);txns.push({from:deb[di].id,to:crd[ci].id,amount:p});deb[di].a-=p;crd[ci].a-=p;if(deb[di].a<0.01)di++;if(crd[ci].a<0.01)ci++;}
  return txns;
}

// ── PACKING ───────────────────────────────────────────
function getPackSugg(){
  var wx=S.weather,tMax=wx&&wx.daily?wx.daily.temperature_2m_max[0]:20,tMin=wx&&wx.daily?wx.daily.temperature_2m_min[0]:15,prec=wx&&wx.daily?wx.daily.precipitation_probability_mean[0]||0:0;
  var en=S.lang==='en';
  var clothes=getClothRecs(tMax,tMin,prec,0).map(function(c,i){return {id:'cl_'+c[0],text:c[1],cat:'clothes'};});
  var docs=(en?['Passport','Travel insurance','Hotel confirmation','Flight ticket','Emergency contacts']:['护照','旅行保险','酒店确认单','机票/火车票','紧急联系人']).map(function(d,i){return {id:'doc_'+i,text:d,cat:'docs'};});
  var elec=(en?['Charger','Power bank','Adapter','Earphones']:['充电线','充电宝','转换插头','耳机']).map(function(d,i){return {id:'elec_'+i,text:d,cat:'electronics'};});
  var toil=(en?['Toothbrush','Toothpaste','Shampoo','Skincare','Sunscreen']:['牙刷牙膏','洗发水','护肤品','防晒霜','口罩']).map(function(d,i){return {id:'toil_'+i,text:d,cat:'toiletries'};});
  return {clothes:clothes,docs:docs,electronics:elec,toiletries:toil};
}
function periodConflict(){
  var pd=S.periodData;if(!pd.records||!pd.records.length)return false;
  var days=getDays();if(!days.length)return false;
  var ts=new Date(days[0].date+'T00:00:00'),te=new Date(days[days.length-1].date+'T23:59:59');
  var last=new Date(pd.records[pd.records.length-1]+'T00:00:00'),cl=pd.cycleLen||28,dur=pd.duration||5;
  for(var i=0;i<3;i++){var ps=new Date(last.getTime()+(i+1)*cl*86400000),pe=new Date(ps.getTime()+dur*86400000);if(ps<=te&&pe>=ts)return true;}
  return false;
}

// ── RENDER APP ────────────────────────────────────────
function renderApp(){
  var app=document.getElementById('app');
  if(!S.tripCode||!S.memberId){if(S.localTrips.length>0)renderTripList();else renderOnboarding();return;}
  app.innerHTML=
    '<div id="v-home" class="view"></div>'+
    '<div id="v-itin" class="view"></div>'+
    '<div id="v-exp"  class="view"></div>'+
    '<div id="v-chat" class="view"></div>'+
    '<div id="v-set"  class="view"></div>'+
    '<nav class="tabs">'+
      '<div class="tab" id="tb-itin" onclick="switchTab(\'itin\')"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'+IC.cal+'</svg></div>'+
      '<div class="tab" id="tb-exp" onclick="switchTab(\'exp\')"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'+IC.wallet+'</svg></div>'+
      '<div class="tab tab-center" id="tb-home" onclick="switchTab(\'home\')"><svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+IC.home+'</svg></div>'+
      '<div class="tab" id="tb-chat" onclick="switchTab(\'chat\')"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'+IC.chat+'</svg></div>'+
      '<div class="tab" id="tb-set" onclick="switchTab(\'set\')"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'+IC.cog+'</svg></div>'+
    '</nav>';
  if(S.tripCode){try{S.journal=JSON.parse(localStorage.getItem('journal_'+S.tripCode)||'[]');}catch(e){S.journal=[];}}
  switchTab('home');
  subscribeAll(S.tripCode);
  setInterval(checkNotifs,60000);setTimeout(checkNotifs,2000);
  requestGeoPermission();

  // Mic FAB (home only)
  var mf=document.createElement('button');mf.id='gfab-mic';mf.className='gfab';mf.setAttribute('hidden','');
  mf.innerHTML=ic('mic',21);
  mf.addEventListener('mousedown',function(){startVoice(handleVoiceIntent);});
  mf.addEventListener('touchstart',function(e){e.preventDefault();startVoice(handleVoiceIntent);},{passive:false});
  app.appendChild(mf);
}

window.switchTab=function(name,dir){
  $$('.tab,.tab-center').forEach(function(tb){tb.classList.remove('on');});
  $$('.view').forEach(function(v){v.classList.remove('active','anim-in','anim-left','anim-right');});
  var tb=$('#tb-'+name),vw=$('#v-'+name);
  if(tb)tb.classList.add('on');
  if(vw){
    vw.classList.add('active');
    requestAnimationFrame(function(){
      if(dir==='left')vw.classList.add('anim-left');
      else if(dir==='right')vw.classList.add('anim-right');
      else vw.classList.add('anim-in');
    });
  }
  S.tab=name;
  // Remove expense FAB when not on expense tab
  var af=document.getElementById('gfab-add');
  if(af&&name!=='exp')af.remove();
  // Voice FAB only on home
  var mf=document.getElementById('gfab-mic');
  if(mf){if(name==='home')mf.removeAttribute('hidden');else mf.setAttribute('hidden','');}
  var fn={home:renderHome,itin:renderItin,exp:renderExp,chat:renderChat,set:renderSet};
  if(fn[name])fn[name]();
};

// Swipe gesture
var _swx=0,_swy=0;
document.addEventListener('touchstart',function(e){if(e.touches.length!==1)return;_swx=e.touches[0].clientX;_swy=e.touches[0].clientY;},{passive:true});
document.addEventListener('touchend',function(e){
  if(!_swx)return;
  var dx=e.changedTouches[0].clientX-_swx,dy=e.changedTouches[0].clientY-_swy;
  if(Math.abs(dx)<60||Math.abs(dy)>Math.abs(dx)*0.8)return;
  var target=e.target,inScroll=false;
  while(target){if(target.classList&&(target.classList.contains('itin-scroll')||target.classList.contains('day-tabs')||target.classList.contains('smart-strip')||target.classList.contains('pbw-scroll')||target.classList.contains('sheet')||target.classList.contains('ov')||target.classList.contains('wx-hourly-row'))){inScroll=true;break;}target=target.parentElement;}
  if(inScroll)return;
  var tabs=['itin','exp','home','chat','set'],cur=tabs.indexOf(S.tab);
  if(dx<-60&&cur<tabs.length-1)switchTab(tabs[cur+1],'left');
  else if(dx>60&&cur>0)switchTab(tabs[cur-1],'right');
  _swx=0;
},{passive:true});

// ── ONBOARDING ────────────────────────────────────────
function renderOnboarding(){
  var LL={'zh-CN':'简','zh-TW':'繁','en':'EN'};
  var offline=!fbApp?'<div style="font-size:11px;color:var(--t3);text-align:center;line-height:1.5;padding:4px 0">'+t('offlineNote')+'</div>':'';
  var langChips=['zh-CN','zh-TW','en'].map(function(l){return '<div class="chip '+(S.lang===l?'on':'')+'" style="padding:4px 13px;font-size:12px;font-weight:600" onclick="setLang(\''+l+'\')">'+LL[l]+'</div>';}).join('');
  document.getElementById('app').innerHTML=
    '<div id="v-ob" class="view active anim-in"><div class="ob">'+
      '<div class="ob-logo">'+ic('plane',50)+'</div>'+
      '<div class="ob-brand">'+t('brand')+'</div><div class="ob-sub">'+t('sub')+'</div>'+
      '<div class="ob-form">'+
        '<div class="inp-lbl" style="text-align:left">'+t('yourName')+'</div>'+
        '<input class="inp" id="ob-name" placeholder="'+t('namePh')+'" autocomplete="off">'+
        '<input class="code-inp" id="ob-code" maxlength="6" placeholder="'+t('codePh')+'" autocomplete="off" autocapitalize="characters">'+
        '<button class="btn btn-g btn-full" onclick="handleJoin()">'+t('join')+'</button>'+
        '<div class="ob-div">'+t('or')+'</div>'+
        '<button class="btn btn-p btn-full" onclick="handleCreate()">'+t('create')+'</button>'+
        offline+
        '<div style="display:flex;justify-content:flex-end;gap:5px;margin-top:3px">'+langChips+'</div>'+
      '</div></div></div>';
  var ci=$('#ob-code');if(ci)ci.addEventListener('input',function(){this.value=this.value.toUpperCase().replace(/[^A-Z0-9]/g,'');});
}
window.setLang=function(l){S.lang=l;localStorage.setItem('lang',l);renderApp();};
window.handleJoin=async function(){
  var code=($('#ob-code')&&$('#ob-code').value.trim().toUpperCase())||'',name=($('#ob-name')&&$('#ob-name').value.trim())||'';
  if(code.length<6){var ci=$('#ob-code');if(ci){ci.classList.add('shake');setTimeout(function(){ci.classList.remove('shake');},400);}return;}
  if(!name){toast('请输入你的名字');return;}
  showLoad();
  try{var ok=await fbLoad(code);if(!ok){hideLoad();toast('找不到此行程码');return;}var r=await fbJoin(code,name);_saveSession(code,r.memberId,name);hideLoad();renderApp();}
  catch(e){hideLoad();toast('错误：'+e.message);}
};
window.handleCreate=async function(){
  var name=($('#ob-name')&&$('#ob-name').value.trim())||'';
  if(!name){toast('请先输入你的名字');return;}
  showLoad();
  try{var code=genCode();var r=await fbCreate(code,name);_saveSession(code,r.memberId,name);_addLocalTrip(code,'我的旅行','');hideLoad();renderApp();setTimeout(function(){toast('行程码：'+code);},400);}
  catch(e){hideLoad();toast('错误：'+e.message);}
};
function _saveSession(code,mid,name){S.tripCode=code;S.memberId=mid;S.memberName=name;localStorage.setItem('tripCode',code);localStorage.setItem('memberId',mid);localStorage.setItem('memberName',name);}
function _addLocalTrip(code,name,dates){var trips=JSON.parse(localStorage.getItem('localTrips')||'[]');if(!trips.find(function(tt){return tt.code===code;}))trips.push({code:code,name:name,dates:dates});localStorage.setItem('localTrips',JSON.stringify(trips));S.localTrips=trips;}
function renderTripList(){
  var cards=S.localTrips.map(function(tr){return '<div class="list" style="margin-bottom:10px;cursor:pointer" onclick="enterTrip(\''+tr.code+'\')"><div class="lr"><div style="flex:1"><div style="font-size:16px;font-weight:600;color:var(--t1)">'+escHtml(tr.name||'我的旅行')+'</div><div style="font-size:12px;color:var(--t2)">'+escHtml(tr.dates||'—')+'</div></div><div class="lr-chev">'+ic('chev',14)+'</div></div></div>';}).join('');
  document.getElementById('app').innerHTML=
    '<div id="v-tl" class="view active anim-in">'+
    '<div class="nav"><div class="nav-large">'+t('myTrips')+'</div><div class="nbtn" onclick="renderOnboarding()">'+ic('plus',15)+'</div></div>'+
    '<div class="scroller"><div style="height:14px"></div><div class="sec li-anim">'+cards+
    '<div style="text-align:center;padding:16px;cursor:pointer;color:var(--t3);font-size:14px" onclick="renderOnboarding()">+ '+t('newTrip')+'</div></div></div></div>';
}
window.enterTrip=async function(code){
  var mid=localStorage.getItem('memberId');if(!mid){renderOnboarding();return;}
  S.memberId=mid;S.memberName=localStorage.getItem('memberName');S.tripCode=code;localStorage.setItem('tripCode',code);
  showLoad();var ok=await fbLoad(code);hideLoad();if(!ok){toast('无法加载行程');return;}renderApp();
};

// ── HOME ──────────────────────────────────────────────
function renderHome(){
  var v=$('#v-home');if(!v)return;
  var trip=S.trip||{name:'Travoo',dates:'',days:[]},days=trip.days||[];
  var todayDay=days.find(function(d){return d.date===today();}),h=nowH();
  var nowDate=new Date(),startDate=days.length>0?new Date(days[0].date):nowDate,endDate=days.length>0?new Date(days[days.length-1].date):nowDate;
  var prog=days.length>0?Math.max(0,Math.min(100,((nowDate-startDate)/(endDate-startDate+86400000))*100)):0;
  var heroDay,heroTitle;
  if(!days.length){heroDay=t('notPlanned');heroTitle=trip.name||'Travoo';}
  else if(todayDay){heroDay=getWdL(todayDay.wd)+' · '+t('today');heroTitle=todayDay.title;}
  else if(nowDate<startDate){heroDay=t('countdown');heroTitle=trip.name||'Travoo';}
  else{heroDay=t('tripEnded');heroTitle=trip.name||'Travoo';}

  var mems=Object.entries(S.members),avsHtml='';
  mems.slice(0,5).forEach(function(entry){var id=entry[0],m=entry[1];var img=memAvatar(id);avsHtml+=img?'<div class="hav"><img src="'+img+'" alt=""></div>':'<div class="hav" style="background:'+m.color+'">'+((m.name||'?')[0])+'</div>';});
  if(mems.length>5)avsHtml+='<div class="hav" style="background:var(--glass-bg3)">+'+(mems.length-5)+'</div>';
  var memRow=mems.length>0?'<div class="hero-members"><div style="display:flex">'+avsHtml+'</div><span style="flex:1;font-size:11px;color:var(--t2)">'+mems.length+' '+t('nMembers')+'</span><div class="hero-share-btn" onclick="showTripCodeModal()">'+ic('share',12)+' '+t('invite')+'</div></div>':'';

  var heroHtml='<div class="hero-card">'+
    '<div class="hero-inner">'+
      '<div class="hero-day">'+heroDay+'</div>'+
      '<div class="hero-title">'+escHtml(heroTitle)+'</div>'+
      '<div class="hero-prog"><div class="hero-fill" style="width:'+prog+'%"></div></div>'+
      memRow+'</div></div>';

  var wxHtml=renderWeatherMini();

  // Travel docs widget
  var tdHtml=renderTravelDocsWidget();

  // Rate bar
  var lc=CUR[S.localCurrency]||{f:'',s:S.localCurrency},bc=CUR[S.baseCurrency]||{f:'',s:S.baseCurrency};
  var rateVal=getRate(S.localCurrency,S.baseCurrency);
  var rateStr=Object.keys(S.rates).length>0?('1 '+S.localCurrency+' = '+fmtCur(rateVal,S.baseCurrency)):t('rateUnavailable');
  var rateHtml='<div class="rate-bar">'+
    '<div style="font-size:15px">'+lc.f+'</div><div style="font-size:12px;color:var(--t3)">→</div><div style="font-size:15px">'+bc.f+'</div>'+
    '<div style="flex:1"><div style="font-size:13px;font-weight:600;color:var(--t1)">'+escHtml(rateStr)+'</div>'+
      (S.fxDate?'<div style="font-size:10px;color:var(--t3)">'+S.fxDate.substring(0,16)+'</div>':'')+
    '</div>'+
    '<div onclick="event.stopPropagation();doFetchRates()" style="padding:5px 11px;background:var(--glass-bg2);border:0.5px solid var(--glass-border);border-radius:9px;font-size:12px;color:var(--t2);display:flex;align-items:center;gap:3px;cursor:pointer">'+ic('refresh',11)+'</div>'+
  '</div>';

  // Quick actions (no XHS, no butler/expense)
  var qaApps=getQuickApps();
  var qaHtml='';
  qaApps.forEach(function(key){
    var app=APPS[key];if(!app)return;
    var customIcon=S.customAppIcons&&S.customAppIcons[key];
    var iconHtml=customIcon?'<img src="'+customIcon+'" alt="">':('<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+IC[app.i||'globe']+'</svg>');
    qaHtml+='<div class="qa" onclick="openApp(\''+key+'\')"><div class="qa-icon">'+iconHtml+'</div><div class="qa-lbl">'+escHtml(appL(key))+'</div></div>';
  });

  // Photo board
  var pbHtml=renderPhotoBoardWidget();
  // Journal
  var jHtml=renderJournalWidget();
  // Smart recs
  var recs=buildSmartRecs(todayDay,h),recsHtml='';
  if(recs.length){
    recsHtml='<div style="margin-bottom:16px"><div class="sec-ttl" style="padding:0 16px;margin-bottom:7px">'+t('smRec')+'</div><div class="smart-strip">';
    recs.forEach(function(r){recsHtml+='<div class="smart-pill" onclick="'+(r.action||'')+'"><div class="smart-tag">'+escHtml(r.type)+'</div><div class="smart-ttl">'+escHtml(r.title)+'</div><div class="smart-desc">'+escHtml(r.desc)+'</div></div>';});
    recsHtml+='</div></div>';
  }
  // Today timeline
  var bottomHtml='';
  if(todayDay&&todayDay.items.length){
    bottomHtml='<div class="sec"><div class="sec-ttl">'+t('todayTimeline')+'</div><div class="list li-anim">';
    todayDay.items.forEach(function(item){
      var sp=spendStr(item);
      bottomHtml+='<div class="lr" onclick="showActDetail(\''+item.id+'\')">'+
        '<div style="width:42px;flex-shrink:0;font-size:11px;font-weight:700;color:var(--t2)">'+escHtml(item.time)+'</div>'+
        '<div style="flex:1"><div style="font-size:14px;font-weight:600;color:var(--t1)">'+renderMentions(item.title)+'</div>'+
          (sp?'<div style="font-size:11px;color:var(--orange)">'+escHtml(sp)+'</div>':'')+
        '</div>'+
        (item.urgent?'<div style="width:6px;height:6px;border-radius:50%;background:var(--red);flex-shrink:0"></div>':'')+
      '</div>';
    });
    bottomHtml+='</div><button class="btn btn-g btn-full" style="margin-top:9px" onclick="switchTab(\'itin\')">'+t('viewFull')+'</button></div>';
  }

  v.innerHTML=
    '<div class="nav" style="padding-top:calc(var(--sai)+4px)">'+
      '<div style="font-size:12px;font-weight:500;color:var(--t2);flex:1">'+escHtml(trip.name||'')+'</div>'+
      '<div class="nbtn" onclick="showTripCodeModal()">'+ic('share',14)+'</div>'+
    '</div>'+
    '<div class="scroller" style="padding-top:6px">'+
      heroHtml+wxHtml+tdHtml+rateHtml+
      '<div class="sec">'+
        '<div style="display:flex;align-items:center;margin-bottom:7px">'+
          '<div class="sec-ttl" style="margin-bottom:0;flex:1">'+t('qa')+'</div>'+
          '<div onclick="showCustomAppsModal()" style="font-size:11px;color:var(--t3);cursor:pointer;padding:3px 8px;border-radius:7px;border:0.5px solid var(--glass-border);display:flex;align-items:center;gap:3px">'+ic('edit',10)+' '+t('customApps')+'</div>'+
        '</div>'+
        '<div class="qa-grid">'+qaHtml+'</div>'+
      '</div>'+
      pbHtml+jHtml+recsHtml+bottomHtml+
    '</div>';
}
window.doFetchRates=async function(){toast('获取汇率中…',0);var ok=await fetchRates();toast(ok?'汇率已更新':'获取失败');if(S.tab==='home')renderHome();else if(S.tab==='set')renderSet();};
function buildSmartRecs(todayDay,h){
  var recs=[],en=S.lang==='en';if(!todayDay)return recs;
  if(h>=7&&h<=9)recs.push({type:en?'Breakfast':'早餐',title:en?'Nearby breakfast':'附近早餐',desc:en?'Check reviews':'查看评分',action:"openApp('dianping')"});
  if(h>=11&&h<=13)recs.push({type:en?'Lunch':'午餐',title:en?'Local lunch':'当地特色',desc:en?'Search nearby':'搜索附近',action:"openApp('dianping')"});
  var hasCar=todayDay.items.some(function(i){return i.apps&&i.apps.indexOf('didi')>=0;});
  if(hasCar)recs.push({type:en?'Transport':'出行',title:en?'Book taxi early':'提前叫车',desc:en?'5-10 mins ahead':'建议提前',action:"openApp('didi')"});
  return recs.slice(0,3);
}
window.showTripCodeModal=function(){
  showModal('<div class="sh"></div><div style="font-size:20px;font-weight:700;margin-bottom:13px">'+t('code')+'</div><div class="code-disp" style="margin-bottom:13px">'+(S.tripCode||'------')+'</div><div style="font-size:13px;color:var(--t2);text-align:center;margin-bottom:14px;line-height:1.6">'+t('codeShare')+'</div><div style="display:flex;gap:7px"><button class="btn btn-g" style="flex:1" onclick="copyCode()">'+ic('copy',14)+' '+t('copy')+'</button><button class="btn btn-p" style="flex:1" onclick="shareCode()">'+ic('share',14)+' '+t('share')+'</button></div>');
};
window.copyCode=function(){if(navigator.clipboard)navigator.clipboard.writeText(S.tripCode||'').then(function(){toast(t('codeCopied'));});};
window.shareCode=function(){if(navigator.share)navigator.share({title:'Travoo',text:'行程码 '+S.tripCode,url:location.href});else copyCode();};

// ── TRAVEL DOCS WIDGET ────────────────────────────────
function renderTravelDocsWidget(){
  var docs=S.travelDocs||[];
  var html='<div class="travel-docs-widget">'+
    '<div class="tdw-header" onclick="showTravelDocsModal()">'+
      '<div style="width:26px;height:26px;background:rgba(var(--blue-rgb),.14);border-radius:8px;display:flex;align-items:center;justify-content:center">'+
        '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+IC.flight+'</svg></div>'+
      '<div style="flex:1;font-size:14px;font-weight:600;color:var(--t1)">'+t('travelDocs')+'</div>'+
      '<div class="nbtn" style="width:26px;height:26px" onclick="event.stopPropagation();showAddTravelDoc()">'+ic('plus',12)+'</div>'+
    '</div>';
  if(!docs.length){
    html+='<div style="padding:16px 13px;display:flex;align-items:center;gap:10px"><span style="font-size:13px;color:var(--t3);flex:1">'+t('noTravelDocs')+'</span><button class="btn btn-g" style="padding:5px 12px;font-size:12px" onclick="showAddTravelDoc()">'+t('addFirst')+'</button></div>';
  } else {
    docs.slice(0,3).forEach(function(doc){
      var tc={flight:'#0A84FF',hotel:'#30D158',train:'#FF9F0A',ferry:'#BF5AF2'}[doc.type]||'#8E8E93';
      var iconN={flight:'flight',hotel:'hotel2',train:'train'}[doc.type]||'globe';
      var main='',sub='';
      if(doc.type==='flight'){main=(doc.airline||'')+' '+doc.flightNo;sub=(doc.from||'')+'→'+(doc.to||'')+' '+((doc.depart||'').substring(0,16));}
      else if(doc.type==='hotel'){main=doc.hotelName||'';sub=t('checkIn')+' '+doc.checkIn+' · '+t('checkOut')+' '+doc.checkOut;}
      else{main=doc.title||t(doc.type||'flight');sub='';}
      var mem=S.members[doc.memberId];var tagColor=mem?mem.color:tc;var tagName=doc.memberId===S.memberId?t('you'):(mem?mem.name:'?');
      html+='<div class="tdw-doc" onclick="showTravelDocDetail(\''+doc.id+'\')">'+
        '<div class="tdw-doc-icon" style="background:'+tc+'22"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="'+tc+'" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+IC[iconN]+'</svg></div>'+
        '<div style="flex:1;min-width:0"><div class="tdw-doc-title">'+escHtml(main)+'</div>'+(sub?'<div class="tdw-doc-sub">'+escHtml(sub)+'</div>':'')+
          '<div style="margin-top:3px"><span class="tdw-member-tag" style="background:'+tagColor+'">'+escHtml(tagName)+'</span></div></div>'+
      '</div>';
    });
    if(docs.length>3)html+='<div style="padding:9px 13px;font-size:12px;color:var(--t3);cursor:pointer;text-align:center" onclick="showTravelDocsModal()">全部 ('+docs.length+') →</div>';
  }
  html+='</div>';
  return html;
}
window.showTravelDocsModal=function(){
  var docs=S.travelDocs||[];
  var docsHtml=docs.map(function(doc){
    var tc={flight:'#0A84FF',hotel:'#30D158',train:'#FF9F0A'}[doc.type]||'#8E8E93';
    var main=doc.type==='flight'?(doc.airline||'')+' '+doc.flightNo:doc.type==='hotel'?(doc.hotelName||''):(doc.title||t(doc.type));
    var sub=doc.type==='flight'?(doc.from||'')+'→'+(doc.to||''):doc.type==='hotel'?t('checkIn')+' '+doc.checkIn:'';
    var mem=S.members[doc.memberId];var memName2=doc.memberId===S.memberId?t('you'):(mem?mem.name:'?');
    return '<div class="lr">'+
      '<div style="width:9px;height:9px;border-radius:50%;background:'+tc+';flex-shrink:0"></div>'+
      '<div style="flex:1;min-width:0"><div style="font-size:14px;font-weight:600;color:var(--t1)">'+escHtml(main)+'</div>'+
        (sub?'<div style="font-size:11px;color:var(--t2)">'+escHtml(sub)+'</div>':'')+
        '<div style="font-size:11px;color:var(--t3)">'+escHtml(memName2)+'</div></div>'+
      '<div class="nbtn" style="width:26px;height:26px" onclick="deleteTravelDoc(\''+doc.id+'\')">'+ic('trash',11)+'</div>'+
    '</div>';
  }).join('');
  showModal('<div class="sh"></div><div style="display:flex;align-items:center;margin-bottom:14px"><div class="sheet-title" style="margin-bottom:0;flex:1">'+t('travelDocs')+'</div><div class="nbtn" onclick="closeModal();setTimeout(showAddTravelDoc,200)">'+ic('plus',15)+'</div></div>'+
    (docsHtml?'<div class="list" style="margin-bottom:13px">'+docsHtml+'</div>':'<div style="text-align:center;padding:26px;color:var(--t3)">'+t('noTravelDocs')+'</div>')+
    '<button class="btn btn-p btn-full" onclick="closeModal();setTimeout(showAddTravelDoc,200)">'+ic('plus',14)+' '+t('addFlight')+'/'+t('addHotel')+'</button>');
};
window.showAddTravelDoc=function(){
  var typeOpts=['flight','hotel','train','ferry'].map(function(tp){return '<option value="'+tp+'">'+t(tp)+'</option>';}).join('');
  var memOpts=Object.entries(S.members).map(function(entry){var id=entry[0],m=entry[1];return '<option value="'+id+'"'+(id===S.memberId?' selected':'')+'>'+escHtml(m.name+(id===S.memberId?' ('+t('you')+')':''))+'</option>';}).join('');
  showModal('<div class="sh"></div><div class="sheet-title">'+t('travelDocs')+'</div>'+
    '<div class="inp-lbl">'+t('docType')+'</div><select class="inp" id="td-type" style="margin-bottom:9px" onchange="updateTravelDocForm()">'+typeOpts+'</select>'+
    '<div class="inp-lbl">'+t('members')+'</div><select class="inp" id="td-mem" style="margin-bottom:9px">'+memOpts+'</select>'+
    '<div id="td-form"></div>'+
    '<button class="btn btn-p btn-full" onclick="submitTravelDoc()" style="margin-top:3px">'+t('save')+'</button>');
  updateTravelDocForm();
};
window.updateTravelDocForm=function(){
  var tp=$('#td-type')&&$('#td-type').value,fm=$('#td-form');if(!fm)return;
  if(tp==='flight')fm.innerHTML='<div class="inp-lbl">'+t('flightNo')+'</div><input class="inp" id="td-flightno" placeholder="CX234" style="margin-bottom:9px"><div class="inp-lbl">'+t('airline')+'</div><input class="inp" id="td-airline" style="margin-bottom:9px"><div style="display:flex;gap:7px;margin-bottom:9px"><div style="flex:1"><div class="inp-lbl">'+t('from')+'</div><input class="inp" id="td-from" placeholder="HKG"></div><div style="flex:1"><div class="inp-lbl">'+t('to')+'</div><input class="inp" id="td-to" placeholder="ICN"></div></div><div class="inp-lbl">'+t('depart')+'</div><input class="inp" id="td-depart" type="datetime-local" style="margin-bottom:9px"><div class="inp-lbl">'+t('arrive')+'</div><input class="inp" id="td-arrive" type="datetime-local" style="margin-bottom:9px"><div style="display:flex;gap:7px;margin-bottom:9px"><div style="flex:1"><div class="inp-lbl">'+t('terminal')+'</div><input class="inp" id="td-terminal" placeholder="T1"></div><div style="flex:1"><div class="inp-lbl">'+t('seat')+'</div><input class="inp" id="td-seat"></div></div>';
  else if(tp==='hotel')fm.innerHTML='<div class="inp-lbl">'+t('hotelName')+'</div><input class="inp" id="td-hotelname" style="margin-bottom:9px"><div class="inp-lbl">'+t('address')+'</div><input class="inp" id="td-address" style="margin-bottom:9px"><div style="display:flex;gap:7px;margin-bottom:9px"><div style="flex:1"><div class="inp-lbl">'+t('checkIn')+'</div><input class="inp" id="td-checkin" type="date"></div><div style="flex:1"><div class="inp-lbl">'+t('checkOut')+'</div><input class="inp" id="td-checkout" type="date"></div></div><div style="display:flex;gap:7px;margin-bottom:9px"><div style="flex:1"><div class="inp-lbl">'+t('confirmNo')+'</div><input class="inp" id="td-confirm"></div><div style="flex:1"><div class="inp-lbl">'+t('room')+'</div><input class="inp" id="td-room"></div></div>';
  else fm.innerHTML='<div class="inp-lbl">'+t('desc')+'</div><input class="inp" id="td-title" style="margin-bottom:9px"><div class="inp-lbl">'+t('depart')+'</div><input class="inp" id="td-depart" type="datetime-local" style="margin-bottom:9px"><div style="display:flex;gap:7px;margin-bottom:9px"><div style="flex:1"><div class="inp-lbl">'+t('from')+'</div><input class="inp" id="td-from"></div><div style="flex:1"><div class="inp-lbl">'+t('to')+'</div><input class="inp" id="td-to"></div></div>';
};
window.submitTravelDoc=async function(){
  var tp=$('#td-type')&&$('#td-type').value,mem=$('#td-mem')&&$('#td-mem').value;
  var data={type:tp,memberId:mem};
  if(tp==='flight')Object.assign(data,{flightNo:$('#td-flightno')&&$('#td-flightno').value,airline:$('#td-airline')&&$('#td-airline').value,from:$('#td-from')&&$('#td-from').value,to:$('#td-to')&&$('#td-to').value,depart:$('#td-depart')&&$('#td-depart').value,arrive:$('#td-arrive')&&$('#td-arrive').value,terminal:$('#td-terminal')&&$('#td-terminal').value,seat:$('#td-seat')&&$('#td-seat').value});
  else if(tp==='hotel')Object.assign(data,{hotelName:$('#td-hotelname')&&$('#td-hotelname').value,address:$('#td-address')&&$('#td-address').value,checkIn:$('#td-checkin')&&$('#td-checkin').value,checkOut:$('#td-checkout')&&$('#td-checkout').value,confirmNo:$('#td-confirm')&&$('#td-confirm').value,room:$('#td-room')&&$('#td-room').value});
  else Object.assign(data,{title:$('#td-title')&&$('#td-title').value,from:$('#td-from')&&$('#td-from').value,to:$('#td-to')&&$('#td-to').value,depart:$('#td-depart')&&$('#td-depart').value});
  showLoad();await fbSaveTravelDoc(data);hideLoad();closeModal();renderHome();toast(t('save'));
};
window.deleteTravelDoc=async function(id){if(!confirm(t('del')+'?'))return;await fbDelTravelDoc(id);closeModal();renderHome();};
window.showTravelDocDetail=function(id){
  var doc=S.travelDocs.find(function(d){return d.id===id;});if(!doc)return;
  var rows='';Object.keys(doc).forEach(function(k){if(k==='id'||k==='type'||k==='memberId'||!doc[k])return;var lbl=t(k)||k;rows+='<div class="lr" style="cursor:default"><span class="lr-lbl">'+escHtml(lbl)+'</span><span class="lr-val" style="word-break:break-all">'+escHtml(String(doc[k]))+'</span></div>';});
  showModal('<div class="sh"></div><div style="font-size:19px;font-weight:700;margin-bottom:13px;color:var(--t1)">'+t(doc.type||'flight')+'</div><div class="list" style="margin-bottom:13px">'+rows+'</div><button class="btn btn-d btn-full" onclick="deleteTravelDoc(\''+id+'\');closeModal()">'+ic('trash',14)+' '+t('del')+'</button>');
};

// ── PHOTO BOARD WIDGET ────────────────────────────────
function renderPhotoBoardWidget(){
  var photos=S.photoBoard||[],en=S.lang==='en';
  return '<div style="margin:0 16px 12px">'+
    '<div style="display:flex;align-items:center;margin-bottom:8px">'+
      '<div class="sec-ttl" style="margin-bottom:0;flex:1">'+t('photoBoard')+'</div>'+
      '<div onclick="showPhotoGallery(0)" style="font-size:11px;color:var(--t3);cursor:pointer;padding:2px 8px;border-radius:7px;border:0.5px solid var(--glass-border);display:flex;align-items:center;gap:3px">'+ic('img',10)+' '+(en?'All':'全部')+'</div>'+
    '</div>'+
    '<div class="pbw-scroll">'+
      '<div class="pbw-add" onclick="addPhotoToBoard()">'+ic('plus',20)+'<div style="font-size:10px;color:var(--t3)">'+(en?'Add':'添加')+'</div></div>'+
      photos.slice(0,10).map(function(photo,i){
        return '<div class="pbw-photo" onclick="showPhotoGallery('+i+')">'+
          (photo.url?'<img src="'+photo.url+'" alt="">':'<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center">'+ic('img',22)+'</div>')+
          (photo.category?'<div class="pbw-photo-cat">'+escHtml(photo.category)+'</div>':'')+
        '</div>';
      }).join('')+
    '</div></div>';
}
window.addPhotoToBoard=function(){
  var cats=[t('catLandscape'),t('catFood'),t('catArchitecture'),t('catPeople'),t('catTransport'),t('catMisc')];
  var catChips=cats.map(function(c,i){return '<div class="chip '+(i===0?'on':'')+'" data-c="'+c+'" onclick="$$(\'.pb-cat\').forEach(function(cc){cc.classList.remove(\'on\')});this.classList.add(\'on\')" class="chip pb-cat">'+c+'</div>';}).join('');
  showModal('<div class="sh"></div><div class="sheet-title">'+t('addPhotoBoard')+'</div>'+
    '<div id="pb-preview" style="margin-bottom:9px"></div>'+
    '<div style="display:flex;gap:7px;margin-bottom:11px"><button class="btn btn-g" style="flex:1;padding:10px" onclick="pickPhotoBoard(\'camera\')">'+ic('camera',14)+' '+t('fromCamera')+'</button><button class="btn btn-g" style="flex:1;padding:10px" onclick="pickPhotoBoard(\'album\')">'+ic('img',14)+' '+t('fromAlbum')+'</button></div>'+
    '<div class="inp-lbl">'+t('photoCat')+'</div><div class="chips" style="margin-bottom:11px" id="pb-cats">'+catChips+'</div>'+
    '<input class="inp" id="pb-cap" placeholder="Caption…" style="margin-bottom:13px">'+
    '<button class="btn btn-p btn-full" id="pb-submit" disabled onclick="submitPhotoBoard()">'+t('save')+'</button>');
};
window.pickPhotoBoard=function(src){
  var inp=document.createElement('input');inp.type='file';inp.accept='image/*';if(src==='camera')inp.capture='environment';
  inp.onchange=async function(){var f=inp.files[0];if(!f)return;showLoad();var rd=new FileReader();rd.onload=async function(e){var c=await compressImage(e.target.result,800,.75);hideLoad();var prev=$('#pb-preview');if(prev)prev.innerHTML='<img src="'+c+'" style="width:100%;border-radius:var(--r2);max-height:170px;object-fit:cover">';var btn=$('#pb-submit');if(btn)btn.disabled=false;window._pbImage=c;};rd.readAsDataURL(f);};
  inp.click();
};
window.submitPhotoBoard=async function(){
  if(!window._pbImage){toast('请先选择图片');return;}
  var cat=$('.pb-cat.chip.on')&&$('.pb-cat.chip.on').dataset.c||t('catMisc');
  var cap=$('#pb-cap')&&$('#pb-cap').value.trim()||'';
  showLoad();await fbAddPhoto({url:window._pbImage,category:cat,caption:cap});
  window._pbImage=null;hideLoad();closeModal();toast(t('save'));
};
window.showPhotoGallery=function(startIdx){
  var photos=S.photoBoard||[];startIdx=startIdx||0;
  if(!photos.length){toast(t('noPhotos'));return;}
  var curr=Math.max(0,Math.min(startIdx,photos.length-1));
  var ov=document.createElement('div');ov.className='gallery-ov';
  function render(){
    var p=photos[curr]||{};
    var thumbs=photos.map(function(ph,i){return '<div class="gallery-thumb '+(i===curr?'on':'')+'" onclick="window._galleryGo('+i+')">'+
      (ph.url?'<img src="'+ph.url+'" alt="">':'<div style="width:100%;height:100%;background:var(--glass-bg2)"></div>')+
    '</div>';}).join('');
    ov.innerHTML=
      '<div style="position:absolute;top:0;left:0;right:0;z-index:10;padding:calc(var(--sai)+6px) 14px 10px;display:flex;align-items:center;background:linear-gradient(rgba(0,0,0,.6),transparent)">'+
        '<div class="nbtn" onclick="this.closest(\'.gallery-ov\').remove()">'+ic('arrowup',15)+'</div>'+
        '<div style="flex:1;text-align:center;font-size:13px;color:rgba(255,255,255,.7)">'+(curr+1)+'/'+photos.length+(p.caption?' · '+escHtml(p.caption):'')+'</div>'+
        '<div class="nbtn" onclick="if(confirm(\'Delete?\'))window._galleryDel()">'+ic('trash',13)+'</div>'+
      '</div>'+
      '<div class="gallery-img-wrap" id="gimg">'+(p.url?'<img src="'+p.url+'" alt="">':'<div style="color:rgba(255,255,255,.3)">No image</div>')+'</div>'+
      '<div class="gallery-strip">'+thumbs+'</div>';
    var img=ov.querySelector('#gimg');
    if(img){var sx=0;img.addEventListener('touchstart',function(e){sx=e.touches[0].clientX;},{passive:true});img.addEventListener('touchend',function(e){var dx=e.changedTouches[0].clientX-sx;if(Math.abs(dx)>50){if(dx<0&&curr<photos.length-1){curr++;render();}else if(dx>0&&curr>0){curr--;render();}}},{passive:true});}
  }
  render();
  window._galleryGo=function(i){curr=i;render();};
  window._galleryDel=async function(){var id=photos[curr].id;await fbDelPhoto(id);photos=S.photoBoard.filter(function(p){return p.id!==id;});if(!photos.length){ov.remove();return;}curr=Math.max(0,curr-1);render();if(S.tab==='home')renderHome();};
  document.body.appendChild(ov);
};

// ── JOURNAL WIDGET ────────────────────────────────────
function renderJournalWidget(){
  var todayEntry=S.journal.find(function(e){return e.date===today()&&(e.ownerId===S.memberId||e.visibility==='shared');});
  return '<div class="journal-widget" onclick="showJournalModal()">'+
    '<div class="journal-header">'+
      '<div style="width:26px;height:26px;background:rgba(var(--purple-rgb),.14);border-radius:8px;display:flex;align-items:center;justify-content:center">'+
        '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--purple)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+IC.journal+'</svg></div>'+
      '<div style="flex:1;font-size:14px;font-weight:600;color:var(--t1)">'+t('journal')+'</div>'+
      ic('chev',13)+
    '</div>'+
    '<div class="journal-preview">'+
      (todayEntry?
        '<div style="font-size:13px;color:var(--t1);line-height:1.6;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">'+escHtml(todayEntry.content||'')+'</div>'+
        '<div style="font-size:10px;color:var(--t3);margin-top:3px">'+today()+'</div>':
        '<div style="font-size:13px;color:var(--t3);font-style:italic">'+t('journalPrompt')+'</div>')+
    '</div></div>';
}
window.showJournalModal=function(){
  var entries=S.journal.filter(function(e){return e.ownerId===S.memberId||(e.visibility==='shared');});
  var todayEntry=entries.find(function(e){return e.date===today();});
  var otherEntries=entries.filter(function(e){return e.date!==today();}).sort(function(a,b){return b.date.localeCompare(a.date);});
  var html='<div class="sh"></div><div style="display:flex;align-items:center;margin-bottom:14px"><div class="sheet-title" style="margin-bottom:0;flex:1">'+t('journal')+'</div><div class="nbtn" onclick="closeModal();setTimeout(showNewJournalEntry,200)">'+ic('plus',15)+'</div></div>';
  html+='<div style="font-size:11px;font-weight:700;color:var(--t3);text-transform:uppercase;letter-spacing:.4px;margin-bottom:7px">'+t('today')+'</div>';
  if(todayEntry){
    html+='<div class="journal-entry-card" onclick="editJournalEntry(\''+todayEntry.id+'\')"><div class="journal-entry-header"><div style="font-size:18px">'+(todayEntry.mood?['😶','😢','😐','😊','🤩'][todayEntry.mood-1]:'✏️')+'</div><div style="flex:1;font-size:11px;color:var(--t3)">'+todayEntry.date+(todayEntry.visibility==='shared'?' · '+t('shared'):'')+'</div></div><div class="journal-entry-body"><div class="journal-entry-text">'+escHtml(todayEntry.content||'')+'</div></div></div>';
  } else {
    html+='<button class="btn btn-g btn-full" style="margin-bottom:13px" onclick="closeModal();setTimeout(showNewJournalEntry,200)">'+ic('edit',14)+' '+t('writeNote')+'</button>';
  }
  if(otherEntries.length){
    html+='<div style="font-size:11px;font-weight:700;color:var(--t3);text-transform:uppercase;letter-spacing:.4px;margin:13px 0 7px">'+t('history')+'</div>';
    otherEntries.slice(0,8).forEach(function(e){
      html+='<div class="journal-entry-card" onclick="editJournalEntry(\''+e.id+'\')"><div class="journal-entry-header"><div style="font-size:18px">'+(e.mood?['😶','😢','😐','😊','🤩'][e.mood-1]:'✏️')+'</div><div style="flex:1;font-size:11px;color:var(--t3)">'+e.date+(e.visibility==='shared'?' · '+t('shared'):'')+'</div></div><div class="journal-entry-body"><div class="journal-entry-text">'+escHtml(e.content||'')+'</div></div></div>';
    });
  }
  if(!entries.length)html+='<div style="text-align:center;padding:26px;color:var(--t3)">'+t('noJournal')+'</div>';
  showModal(html);
};
window.showNewJournalEntry=function(){
  var moodEmojis=['😶','😢','😐','😊','🤩'];
  var moodHtml=moodEmojis.map(function(e,i){return '<div style="text-align:center;cursor:pointer;padding:6px;border-radius:9px;font-size:22px;transition:all .15s" id="mood-'+(i+1)+'" onclick="selJMood('+(i+1)+')" class="jmood">'+e+'</div>';}).join('');
  showModal('<div class="sh"></div><div class="sheet-title">'+t('newEntry')+'</div>'+
    '<div style="display:flex;justify-content:space-around;margin-bottom:13px;padding:7px;background:var(--glass-bg);border:0.5px solid var(--glass-border);border-radius:var(--r2)">'+moodHtml+'</div>'+
    '<textarea class="inp" id="je-content" placeholder="'+t('writeNote')+'" style="min-height:150px;margin-bottom:9px"></textarea>'+
    '<div style="display:flex;align-items:center;margin-bottom:13px"><span style="font-size:14px;color:var(--t1);flex:1">'+t('visibility')+'</span><select class="inp" id="je-vis" style="width:auto;padding:6px 11px"><option value="private">'+t('private')+'</option><option value="shared">'+t('shared')+'</option></select></div>'+
    '<button class="btn btn-p btn-full" onclick="submitJournalEntry()">'+t('saveEntry')+'</button>');
  window._jMood=3;window._jPhotos=[];selJMood(3);
};
window.selJMood=function(m){window._jMood=m;$$('.jmood').forEach(function(el){el.style.background='';el.style.opacity='.4';});var el=$('#mood-'+m);if(el){el.style.background='var(--glass-bg2)';el.style.opacity='1';}};
window.submitJournalEntry=async function(){
  var content=$('#je-content')&&$('#je-content').value.trim();var vis=$('#je-vis')&&$('#je-vis').value||'private';
  if(!content){toast('请输入内容');return;}
  var entry={id:'jl_'+Date.now(),date:today(),ownerId:S.memberId,content:content,mood:window._jMood||3,photos:[],visibility:vis,createdAt:new Date().toISOString()};
  showLoad();await fbSaveJournal(entry);S.journal=JSON.parse(localStorage.getItem('journal_'+S.tripCode)||'[]');
  hideLoad();closeModal();toast(t('save'));if(S.tab==='home')renderHome();
};
window.editJournalEntry=function(id){
  var entry=S.journal.find(function(e){return e.id===id;});if(!entry)return;
  showModal('<div class="sh"></div><div class="sheet-title">'+t('editItem')+'</div>'+
    '<textarea class="inp" id="eje-content" style="min-height:150px;margin-bottom:13px">'+escHtml(entry.content||'')+'</textarea>'+
    '<button class="btn btn-p btn-full" onclick="submitEditJournal(\''+id+'\')" style="margin-bottom:7px">'+t('save')+'</button>'+
    '<button class="btn btn-d btn-full" onclick="deleteJournal(\''+id+'\')">'+ic('trash',14)+' '+t('del')+'</button>');
};
window.submitEditJournal=async function(id){
  var content=$('#eje-content')&&$('#eje-content').value.trim();if(!content)return;
  var entry=S.journal.find(function(e){return e.id===id;});if(!entry)return;entry.content=content;
  showLoad();await fbSaveJournal(entry);S.journal=JSON.parse(localStorage.getItem('journal_'+S.tripCode)||'[]');
  hideLoad();closeModal();toast(t('save'));if(S.tab==='home')renderHome();
};
window.deleteJournal=function(id){
  if(!confirm(t('del')+'?'))return;
  S.journal=S.journal.filter(function(e){return e.id!==id;});
  localStorage.setItem('journal_'+S.tripCode,JSON.stringify(S.journal));
  closeModal();if(S.tab==='home')renderHome();
};

// ── CUSTOM APPS ───────────────────────────────────────
window.showCustomAppsModal=function(){
  var current=getQuickApps();
  var region=detectRegion(),preset=REGION_PRESETS[region]||REGION_PRESETS.default;
  var html='<div class="sh"></div>'+
    '<div style="display:flex;align-items:center;margin-bottom:4px"><div class="nbtn" onclick="closeModal()">'+ic('arrowup',14)+'</div><div class="sheet-title" style="margin-bottom:0;flex:1;text-align:center">'+t('customApps')+'</div><div class="nbtn" onclick="resetCustomApps()">'+ic('refresh',13)+'</div></div>'+
    '<div style="font-size:12px;color:var(--t3);margin-bottom:11px;text-align:center">'+t('regionDetected')+': '+preset.n+' · 最多8个</div>'+
    '<div class="list">';
  Object.keys(APPS).forEach(function(key){
    var app=APPS[key];if(!app)return;
    var on=current.indexOf(key)>=0;
    var customIcon=S.customAppIcons&&S.customAppIcons[key];
    var iconHtml=customIcon?
      '<div style="width:30px;height:30px;border-radius:8px;overflow:hidden"><img src="'+customIcon+'" style="width:100%;height:100%;object-fit:cover"></div>':
      '<div style="width:30px;height:30px;border-radius:8px;background:var(--glass-bg2);display:flex;align-items:center;justify-content:center"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--t2)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+IC[app.i||'globe']+'</svg></div>';
    html+='<div class="lr">'+iconHtml+'<span class="lr-lbl">'+escHtml(appL(key))+'</span>'+
      '<div class="nbtn" style="width:24px;height:24px;opacity:.45;margin-right:5px" onclick="uploadAppIcon(\''+key+'\')">'+ic('camera',10)+'</div>'+
      '<div style="width:28px;height:28px;border-radius:50%;border:1.5px solid '+(on?'var(--green)':'var(--glass-border2)')+';background:'+(on?'rgba(var(--green-rgb),.14)':'var(--glass-bg)')+';display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;transition:all .16s var(--sp)" id="qac-'+key+'" onclick="toggleQAApp(\''+key+'\')">'+
        (on?ic('check',12):'<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--t3)" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>')+
      '</div></div>';
  });
  html+='</div><button class="btn btn-p btn-full" onclick="saveCustomApps()" style="margin-top:13px">'+t('save')+'</button>';
  showModal(html);
};
window.uploadAppIcon=function(key){
  var inp=document.createElement('input');inp.type='file';inp.accept='image/*';
  inp.onchange=async function(){var f=inp.files[0];if(!f)return;showLoad();var rd=new FileReader();rd.onload=async function(e){var c=await compressImage(e.target.result,80,.8);hideLoad();if(!S.customAppIcons)S.customAppIcons={};S.customAppIcons[key]=c;localStorage.setItem('customAppIcons',JSON.stringify(S.customAppIcons));closeModal();setTimeout(showCustomAppsModal,200);};rd.readAsDataURL(f);};
  inp.click();
};
window.toggleQAApp=function(key){
  var current=getQuickApps();var idx=current.indexOf(key);
  if(idx>=0){current.splice(idx,1);}else{if(current.length>=8){toast('最多选8个');return;}current.push(key);}
  S.customApps=current;
  var btn=$('#qac-'+key);if(!btn)return;
  var on=current.indexOf(key)>=0;
  btn.style.border='1.5px solid '+(on?'var(--green)':'var(--glass-border2)');
  btn.style.background=on?'rgba(var(--green-rgb),.14)':'var(--glass-bg)';
  btn.innerHTML=on?ic('check',12):'<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--t3)" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>';
};
window.saveCustomApps=function(){localStorage.setItem('customApps',JSON.stringify(S.customApps));closeModal();renderHome();};
window.resetCustomApps=function(){S.customApps=null;localStorage.removeItem('customApps');closeModal();renderHome();};

// ── ITINERARY ─────────────────────────────────────────
var _itinDay=0;
function renderItin(){
  var v=$('#v-itin');if(!v)return;
  var days=getDays(),todayIdx=days.findIndex(function(d){return d.date===today();});
  _itinDay=todayIdx>=0?todayIdx:0;
  var tabsHtml=days.map(function(d,i){
    return '<div class="dtab'+(i===_itinDay?' on':'')+(d.date===today()?' today':'')+'" id="dtab-'+i+'" onclick="jumpToDay('+i+')">'+
      '<div class="dtab-wd">'+getWdL(d.wd)+'</div><div class="dtab-d">'+d.day+'</div></div>';
  }).join('');
  var pagesHtml=days.map(function(day,di){
    var itemsHtml=day.items.map(function(item){return renderActCard(item);}).join('');
    return '<div class="itin-page" id="ipg-'+di+'">'+
      '<div class="day-hdr">'+
        '<div class="day-hdr-title" onclick="editDayTitle('+di+')">'+escHtml(day.title)+'</div>'+
        '<div class="day-hdr-sub">'+day.month+'/'+day.day+' '+getWdL(day.wd)+'</div>'+
        '<div class="day-reorder">'+
          (di>0?'<div class="day-reorder-btn" onclick="reorderDay('+di+',-1)">'+ic('arrowup',11)+'</div>':'<div style="width:26px"></div>')+
          (di<days.length-1?'<div class="day-reorder-btn" onclick="reorderDay('+di+',1)">'+ic('arrowdn',11)+'</div>':'<div style="width:26px"></div>')+
        '</div>'+
      '</div>'+
      '<div class="li-anim">'+itemsHtml+'</div>'+
      '<div style="margin:3px 16px 9px"><button class="btn btn-g btn-full" style="padding:9px;font-size:13px" onclick="showAddItemModal('+di+')">'+ic('plus',13)+' '+t('addItem')+'</button></div>'+
    '</div>';
  }).join('');
  var emptyHtml=days.length===0?
    '<div class="empty" style="min-height:60dvh;cursor:pointer" onclick="showTripEditModal()">'+
      ic('cal',50)+'<div class="empty-ttl">'+t('notPlanned')+'</div><div class="empty-sub">'+t('importDataLabel')+'</div>'+
      '<button class="btn btn-g" style="margin-top:14px;padding:11px 22px" onclick="event.stopPropagation();showTripEditModal()">'+ic('upload',14)+' '+t('importDataLabel')+'</button></div>':'';
  v.innerHTML=
    '<div class="nav"><div class="nbtn" onclick="showTripEditModal()">'+ic('edit',14)+'</div><div class="nav-title">'+escHtml((S.trip&&S.trip.name)||t('itin'))+'</div><div class="nbtn" onclick="showAddDayModal()">'+ic('plus',14)+'</div></div>'+
    (days.length>0?
      '<div class="day-tabs" id="dtabs">'+tabsHtml+'</div>'+
      '<div class="itin-scroll" id="itin-sl">'+pagesHtml+'</div>':
      emptyHtml);
  var sl=$('#itin-sl');
  if(sl&&_itinDay>0)setTimeout(function(){sl.scrollTo({left:_itinDay*sl.offsetWidth,behavior:'instant'});},50);
  if(sl){sl.addEventListener('scroll',function(){var idx=Math.round(sl.scrollLeft/sl.offsetWidth);if(idx!==_itinDay){_itinDay=idx;$$('.dtab').forEach(function(d,i){d.classList.toggle('on',i===idx);d.classList.toggle('today',getDays()[i]&&getDays()[i].date===today());});var tab=$('#dtab-'+idx);if(tab)tab.scrollIntoView({behavior:'smooth',block:'nearest',inline:'center'});}},{passive:true});}
}
window.reorderDay=async function(di,dir){var days=JSON.parse(JSON.stringify(getDays()));var ni=di+dir;if(ni<0||ni>=days.length)return;var tmp=days[di];days[di]=days[ni];days[ni]=tmp;showLoad();await fbSaveDays(days);hideLoad();renderItin();};
window.editDayTitle=function(di){var days=getDays();if(!days[di])return;showModal('<div class="sh"></div><div class="sheet-title">'+t('editDayTitle')+'</div><input class="inp" id="edt-t" value="'+escHtml(days[di].title||'')+'" style="margin-bottom:13px"><button class="btn btn-p btn-full" onclick="submitEditDayTitle('+di+')">'+t('save')+'</button>');};
window.submitEditDayTitle=async function(di){var title=$('#edt-t')&&$('#edt-t').value.trim();if(!title)return;var days=JSON.parse(JSON.stringify(getDays()));days[di].title=title;closeModal();showLoad();await fbSaveDays(days);hideLoad();renderItin();};
function renderActCard(item){
  var spend=spendStr(item),isHi=item.hi&&item.transport;
  var chips='';if(item.transport&&!isHi)chips+='<span class="act-chip">'+ic('car',9)+' '+escHtml(item.transport)+'</span>';if(item.lodge)chips+='<span class="act-chip">'+ic('map',9)+' '+escHtml(item.lodge)+'</span>';
  var apps='';if(item.apps&&item.apps.length)item.apps.forEach(function(a){if(!APPS[a])return;apps+='<div class="act-app" onclick="event.stopPropagation();openApp(\''+a+'\')"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+IC[APPS[a].i||'globe']+'</svg> '+escHtml(appL(a))+'</div>';});
  return '<div class="act'+(item.urgent?' urgent':'')+'" onclick="showActDetail(\''+item.id+'\')">'+
    '<div class="act-row"><div class="act-tc"><div class="act-time">'+escHtml(item.time)+'</div></div>'+
    '<div class="act-body"><div class="act-title">'+renderMentions(item.title)+'</div>'+
      (chips?'<div class="act-meta">'+chips+'</div>':'')+
      (isHi?'<div class="act-chip" style="margin-top:3px;display:inline-flex;background:rgba(var(--blue-rgb),.1);color:#60B0FF">'+ic('train',9)+' '+escHtml(item.transport)+'</div>':'')+
      (spend?'<div class="act-spend">'+escHtml(spend)+'</div>':'')+
      (item.notes?'<div class="act-note">'+escHtml(item.notes)+'</div>':'')+
      (item.urgent?'<div class="act-note urg">'+ic('bell',10)+' 必须准时</div>':'')+
      (apps?'<div class="act-apps">'+apps+'</div>':'')+
    '</div></div>'+
    '<div class="act-edit" onclick="event.stopPropagation();showEditItemModal(\''+item.id+'\')">'+ic('edit',11)+' '+t('editItem')+'</div></div>';
}
window.jumpToDay=function(idx){_itinDay=idx;var sl=$('#itin-sl');if(sl)sl.scrollTo({left:idx*sl.offsetWidth,behavior:'smooth'});$$('.dtab').forEach(function(d,i){d.classList.toggle('on',i===idx);});};
window.showActDetail=function(id){
  var item=findItem(id);if(!item)return;var spend=spendStr(item);
  var rows='';
  if(item.transport)rows+='<div class="lr" style="cursor:default"><span class="lr-lbl">'+t('transLabel')+'</span><span class="lr-val">'+escHtml(item.transport)+'</span></div>';
  if(spend)rows+='<div class="lr" style="cursor:default"><span class="lr-lbl">'+t('amount')+'</span><span class="lr-val" style="color:var(--orange);font-weight:700">'+escHtml(spend)+'</span></div>';
  if(item.notes)rows+='<div style="padding:9px 11px;background:rgba(var(--orange-rgb),.06);border-left:2px solid rgba(var(--orange-rgb),.4);border-radius:0 7px 7px 0;margin-bottom:7px;font-size:13px;line-height:1.55;color:var(--t1)">'+escHtml(item.notes)+'</div>';
  var appBtns='';if(item.apps&&item.apps.length){var btns='';item.apps.forEach(function(a){if(!APPS[a])return;btns+='<button class="btn btn-g" style="flex:1;min-width:76px;padding:9px;font-size:12px" onclick="openApp(\''+a+'\');closeModal()">'+escHtml(appL(a))+'</button>';});if(btns)appBtns='<div style="margin-bottom:11px"><div style="font-size:11px;color:var(--t3);font-weight:700;margin-bottom:7px">'+t('relatedApps')+'</div><div style="display:flex;flex-wrap:wrap;gap:7px">'+btns+'</div></div>';}
  var safe=item.title.replace(/'/g,"\\'");
  showModal('<div class="sh"></div><div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--t3);margin-bottom:5px">'+item.type+'</div><div style="font-size:21px;font-weight:700;line-height:1.35;margin-bottom:13px;color:var(--t1)">'+renderMentions(item.title)+'</div>'+(rows?'<div class="list" style="margin-bottom:11px">'+rows+'</div>':'')+appBtns+'<button class="btn btn-g btn-full" onclick="askAIAbout(\''+safe+'\');closeModal()" style="margin-bottom:7px">'+t('askAIBtn')+'</button><button class="btn btn-g btn-full" onclick="closeModal();showEditItemModal(\''+item.id+'\')">'+ic('edit',14)+' '+t('editItem')+'</button>');
};
window.showEditItemModal=function(id){
  var item=findItem(id);if(!item)return;
  showModal('<div class="sh"></div><div class="sheet-title">'+t('editItem')+'</div>'+
    '<div class="inp-lbl">'+t('timeLabel')+'</div><input class="inp" id="ei-time" value="'+escHtml(item.time||'')+'" placeholder="HH:MM" style="margin-bottom:9px">'+
    '<div class="inp-lbl">'+t('actNameLabel')+'</div><input class="inp" id="ei-title" value="'+escHtml(item.title||'')+'" style="margin-bottom:9px">'+
    '<div class="inp-lbl">'+t('transLabel')+'</div><input class="inp" id="ei-trans" value="'+escHtml(item.transport||'')+'" style="margin-bottom:9px">'+
    '<div style="display:flex;gap:7px;margin-bottom:9px"><div style="flex:1"><div class="inp-lbl">'+t('spendMinLabel')+'</div><input class="inp" id="ei-smin" type="number" value="'+(item.sMin!=null?item.sMin:'')+'"></div><div style="flex:1"><div class="inp-lbl">'+t('spendMaxLabel')+'</div><input class="inp" id="ei-smax" type="number" value="'+(item.sMax!=null?item.sMax:'')+'"></div></div>'+
    '<div class="inp-lbl">'+t('noteLabel')+'</div><textarea class="inp" id="ei-notes" style="margin-bottom:9px">'+escHtml(item.notes||'')+'</textarea>'+
    '<div style="display:flex;gap:7px;margin-bottom:13px">'+
      '<label class="lr" style="flex:1;cursor:pointer;border-radius:var(--r2);background:var(--glass-bg)"><span class="lr-lbl" style="font-size:13px">'+t('importantLabel')+'</span><input type="checkbox" id="ei-hi" '+(item.hi?'checked':'')+' style="width:17px;height:17px"></label>'+
      '<label class="lr" style="flex:1;cursor:pointer;border-radius:var(--r2);background:rgba(var(--red-rgb),.05)"><span class="lr-lbl" style="font-size:13px;color:var(--red)">'+t('mustOnTime')+'</span><input type="checkbox" id="ei-urg" '+(item.urgent?'checked':'')+' style="width:17px;height:17px"></label>'+
    '</div>'+
    '<button class="btn btn-p btn-full" onclick="submitEditItem(\''+id+'\')" style="margin-bottom:7px">'+t('save')+'</button>'+
    '<button class="btn btn-d btn-full" onclick="deleteItem(\''+id+'\')">'+ic('trash',14)+' '+t('del')+'</button>');
};
window.submitEditItem=async function(id){
  var days=JSON.parse(JSON.stringify(getDays()));
  for(var di=0;di<days.length;di++){var idx=days[di].items.findIndex(function(i){return i.id===id;});if(idx<0)continue;var it=days[di].items[idx];it.time=($('#ei-time')&&$('#ei-time').value.trim())||it.time;it.title=($('#ei-title')&&$('#ei-title').value.trim())||it.title;it.transport=($('#ei-trans')&&$('#ei-trans').value.trim())||'';it.sMin=($('#ei-smin')&&$('#ei-smin').value!=='')?parseFloat($('#ei-smin').value):null;it.sMax=($('#ei-smax')&&$('#ei-smax').value!=='')?parseFloat($('#ei-smax').value):null;it.notes=($('#ei-notes')&&$('#ei-notes').value.trim())||'';it.hi=!!($('#ei-hi')&&$('#ei-hi').checked);it.urgent=!!($('#ei-urg')&&$('#ei-urg').checked);days[di].items[idx]=it;break;}
  closeModal();showLoad();await fbSaveDays(days);hideLoad();toast(t('save'));renderItin();
};
window.deleteItem=async function(id){if(!confirm(t('confirmDelItem')))return;var days=JSON.parse(JSON.stringify(getDays()));for(var di=0;di<days.length;di++){var idx=days[di].items.findIndex(function(i){return i.id===id;});if(idx>=0){days[di].items.splice(idx,1);break;}}closeModal();showLoad();await fbSaveDays(days);hideLoad();renderItin();};
window.showAddItemModal=function(dayIdx){
  showModal('<div class="sh"></div><div class="sheet-title">'+t('addItem')+'</div>'+
    '<div class="inp-lbl">'+t('timeLabel')+'</div><input class="inp" id="ai-time" placeholder="HH:MM" style="margin-bottom:9px">'+
    '<div class="inp-lbl">'+t('actNameLabel')+'</div><input class="inp" id="ai-title" style="margin-bottom:9px">'+
    '<div class="inp-lbl">'+t('transLabel')+'</div><input class="inp" id="ai-trans" style="margin-bottom:9px">'+
    '<div class="inp-lbl">'+t('spendMinLabel')+'</div><input class="inp" id="ai-spend" type="number" style="margin-bottom:9px">'+
    '<div class="inp-lbl">'+t('noteLabel')+'</div><textarea class="inp" id="ai-notes" style="margin-bottom:13px"></textarea>'+
    '<button class="btn btn-p btn-full" onclick="submitAddItem('+dayIdx+')">'+t('save')+'</button>');
};
window.submitAddItem=async function(di){
  var title=$('#ai-title')&&$('#ai-title').value.trim();if(!title){toast('请输入活动名称');return;}
  var days=JSON.parse(JSON.stringify(getDays()));var spend=($('#ai-spend')&&$('#ai-spend').value!=='')?parseFloat($('#ai-spend').value):null;
  days[di].items.push({id:'u_'+Date.now(),time:($('#ai-time')&&$('#ai-time').value.trim())||'',title:title,transport:($('#ai-trans')&&$('#ai-trans').value.trim())||'',sMin:spend,sMax:spend,notes:($('#ai-notes')&&$('#ai-notes').value.trim())||'',apps:[],type:guessType(title),hi:false,urgent:false,lodge:''});
  closeModal();showLoad();await fbSaveDays(days);hideLoad();renderItin();toast(t('save'));
};
window.showAddDayModal=function(){
  showModal('<div class="sh"></div><div class="sheet-title">'+t('addNewDay')+'</div>'+
    '<div class="inp-lbl">'+t('date')+'</div><input class="inp" id="ad-date" type="date" style="margin-bottom:9px">'+
    '<div class="inp-lbl">'+t('desc')+'</div><input class="inp" id="ad-title" placeholder="Day 1" style="margin-bottom:13px">'+
    '<button class="btn btn-p btn-full" onclick="submitAddDay()">'+t('save')+'</button>');
};
window.submitAddDay=async function(){
  var date=$('#ad-date')&&$('#ad-date').value;var title=($('#ad-title')&&$('#ad-title').value.trim())||'新的一天';
  if(!date){toast('请选择日期');return;}
  var days=JSON.parse(JSON.stringify(getDays()));var d=new Date(date+'T12:00:00');var wds=['日','一','二','三','四','五','六'];
  days.push({date:date,month:String(d.getMonth()+1),day:String(d.getDate()),wd:wds[d.getDay()],title:title,items:[]});
  days.sort(function(a,b){return a.date.localeCompare(b.date);});
  closeModal();showLoad();await fbSaveDays(days);hideLoad();renderItin();toast(t('addedDay'));
};
window.showTripEditModal=function(){
  var trip=S.trip||{},hasCfg=!!(S.aiConfig.apiKey&&S.aiConfig.endpoint);
  showModal('<div class="sh"></div><div class="sheet-title">'+t('tripInfoTitle')+'</div>'+
    '<div class="inp-lbl">'+t('tripNameLabel')+'</div><input class="inp" id="te-name" value="'+escHtml(trip.name||'')+'" style="margin-bottom:9px">'+
    '<div class="inp-lbl">'+t('dateRangeLabel')+'</div><input class="inp" id="te-dates" value="'+escHtml(trip.dates||'')+'" style="margin-bottom:14px">'+
    '<div style="font-size:13px;font-weight:600;color:var(--t2);margin-bottom:7px">'+t('importDataLabel')+'</div>'+
    '<div style="padding:13px;background:var(--glass-bg);border:0.5px solid var(--glass-border);border-radius:var(--r2);margin-bottom:13px">'+
      '<div style="font-size:11px;color:var(--t3);margin-bottom:9px;line-height:1.6">'+t('importHint')+'<br><span style="color:var(--orange);font-weight:600">'+t('importHint2')+'</span></div>'+
      '<button class="btn btn-g btn-full" style="padding:10px;margin-bottom:7px" onclick="importFromXlsx()">'+ic('xlsx',14)+' '+t('importXlsx')+'</button>'+
      '<button class="btn btn-g btn-full" style="padding:10px;'+(hasCfg?'margin-bottom:7px':'')+';" onclick="showPasteImport()">'+ic('edit',14)+' '+t('pasteImport')+'</button>'+
      (hasCfg?'<button class="btn btn-g btn-full" style="padding:10px" onclick="importFromImage()">'+ic('camera',14)+' AI图片识别</button>':'')+
    '</div>'+
    '<button class="btn btn-p btn-full" onclick="saveTripInfo()">'+t('save')+'</button>');
};
window.showPasteImport=function(){
  closeModal();setTimeout(function(){
    showModal('<div class="sh"></div><div class="sheet-title">'+t('pasteImportTitle')+'</div>'+
      '<div style="font-size:13px;color:var(--t2);margin-bottom:11px;line-height:1.6;white-space:pre-line">'+t('pasteHint')+'</div>'+
      '<textarea class="inp" id="paste-txt" style="min-height:170px;font-size:12px;margin-bottom:13px" placeholder="2000/1/1（一）&#10;08:00  抵达仁川"></textarea>'+
      '<button class="btn btn-p btn-full" onclick="submitPasteImport()" style="margin-bottom:7px">解析导入</button>'+
      '<button class="btn btn-g btn-full" onclick="closeModal()">'+t('cancel')+'</button>');
  },260);
};
window.submitPasteImport=async function(){
  var el=$('#paste-txt'),txt=el?el.value.trim():'';if(!txt||txt.length<5){toast('请先粘贴行程');return;}
  closeModal();showLoad();
  try{
    var days=parseItinerary(txt);
    if((!days||!days.length)&&S.aiConfig.apiKey&&S.aiConfig.endpoint&&S.aiToggles.import){try{days=await importItinAI(txt);}catch(e){console.warn(e);}}
    if(!days||!days.length)throw new Error('未识别到行程');
    await fbSaveDays(days);_updateTripDates(days);hideLoad();renderItin();toast(t('importOk')+'：'+days.length+'天');
  }catch(e){hideLoad();toast(t('importFail')+'：'+e.message);}
};
window.saveTripInfo=async function(){
  var name=($('#te-name')&&$('#te-name').value.trim())||'';var dates=($('#te-dates')&&$('#te-dates').value.trim())||'';
  if(!S.trip)return;S.trip.name=name;S.trip.dates=dates;
  if(db&&S.tripCode)await updateDoc(doc(db,'trips',S.tripCode),{name:name,dates:dates});
  _addLocalTrip(S.tripCode,name,dates);closeModal();toast(t('save'));renderHome();
};
window.importFromImage=function(){
  var inp=document.createElement('input');inp.type='file';inp.accept='image/*,application/pdf';
  inp.onchange=async function(){var f=inp.files[0];if(!f)return;closeModal();showLoad();var rd=new FileReader();rd.onload=async function(e){try{var cfg=S.aiConfig;var res=await fetch(cfg.endpoint,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+cfg.apiKey},body:JSON.stringify({model:cfg.model||'gpt-4o',max_tokens:4000,messages:[{role:'user',content:[{type:'text',text:'Parse travel itinerary from image. Output JSON array ONLY:\n[{"date":"YYYY-MM-DD","month":"M","day":"DD","wd":"一二三四五六日","title":"day summary","items":[{"id":"d1_1","time":"HH:MM","title":"activity","transport":"","sMin":null,"sMax":null,"notes":"","apps":[],"type":"food|transport|attr|act|checkin|leisure","hi":false,"urgent":false}]}]'},{type:'image_url',image_url:{url:e.target.result,detail:'high'}}]}]})});if(!res.ok)throw new Error('API '+res.status);var d=await res.json();var txt=(d.choices&&d.choices[0]&&d.choices[0].message&&d.choices[0].message.content)||'';var m=txt.match(/\[[\s\S]*\]/);if(!m)throw new Error('解析失败');var days=JSON.parse(m[0]).sort(function(a,b){return a.date.localeCompare(b.date);});await fbSaveDays(days);_updateTripDates(days);hideLoad();renderItin();toast(t('importOk')+'，'+days.length+'天');}catch(err){hideLoad();toast(t('importFail')+'：'+err.message);}};rd.readAsDataURL(f);};
  inp.click();
};

// ── EXPENSES ──────────────────────────────────────────
function renderExp(){
  var v=$('#v-exp');if(!v)return;
  v.innerHTML='<div class="nav"><div class="nav-title">'+t('exp')+'</div><div class="nbtn" onclick="showBudgetModal()">'+ic('sliders',14)+'</div></div>'+
    '<div class="scroller"><div style="height:12px"></div><div class="sec">'+
      '<div id="exp-summary"></div>'+
      '<div class="ptabs" style="margin-bottom:12px" id="exp-ptabs">'+
        '<div class="ptab '+(S._expTab==='list'?'on':'')+'" onclick="switchExpTab(\'list\',this)">'+t('detail')+'</div>'+
        '<div class="ptab '+(S._expTab==='stats'?'on':'')+'" onclick="switchExpTab(\'stats\',this)">'+t('stats')+'</div>'+
        '<div class="ptab '+(S._expTab==='settle'?'on':'')+'" onclick="switchExpTab(\'settle\',this)">'+t('settle')+'</div>'+
      '</div>'+
      '<div id="exp-list-pane" style="'+(S._expTab==='list'?'':'display:none')+'"><div id="exp-list" class="list"></div></div>'+
      '<div id="exp-stats-pane" style="'+(S._expTab==='stats'?'':'display:none')+'"><div id="exp-stats" class="list"></div></div>'+
      '<div id="exp-settle-pane" style="'+(S._expTab==='settle'?'':'display:none')+'"><div id="exp-settle" class="list"></div></div>'+
    '</div></div>';
  // Add FAB
  var addFab=document.createElement('button');addFab.id='gfab-add';addFab.className='gfab';
  addFab.innerHTML=ic('plus',21);
  addFab.addEventListener('click',function(){showAddExpenseModal();});
  document.getElementById('app').appendChild(addFab);
  refreshExpList();
}
window.switchExpTab=function(tab,el){
  $$('#exp-ptabs .ptab').forEach(function(tb){tb.classList.remove('on');});
  if(el)el.classList.add('on');
  S._expTab=tab;
  var lp=$('#exp-list-pane'),sp=$('#exp-stats-pane'),pp=$('#exp-settle-pane');
  if(lp)lp.style.display=tab==='list'?'block':'none';
  if(sp)sp.style.display=tab==='stats'?'block':'none';
  if(pp)pp.style.display=tab==='settle'?'block':'none';
  if(tab==='stats')renderExpStats();
  if(tab==='settle')renderSettle();
};
function refreshExpList(){
  var sum=$('#exp-summary'),list=$('#exp-list');if(!sum||!list)return;
  var bc=CUR[S.baseCurrency]||{s:'¥'};
  var tot=S.expenses.reduce(function(a,e){return a+(Number(e.baseAmount||e.amount)||0);},0);
  var myP=S.expenses.filter(function(e){return e.memberId===S.memberId;}).reduce(function(a,e){return a+(Number(e.baseAmount||e.amount)||0);},0);
  sum.innerHTML='<div class="exp-sum"><div class="estat"><div class="estat-lbl">'+t('total')+'</div><div class="estat-val" style="color:var(--red)">'+bc.s+tot.toFixed(0)+'</div></div><div class="estat"><div class="estat-lbl">'+t('myPaid')+'</div><div class="estat-val" style="color:var(--orange)">'+bc.s+myP.toFixed(0)+'</div></div><div class="estat"><div class="estat-lbl">'+t('cnt')+'</div><div class="estat-val">'+S.expenses.length+'</div></div></div>';
  if(!S.expenses.length){list.innerHTML='<div class="empty" style="cursor:pointer" onclick="showAddExpenseModal()">'+ic('wallet',48)+'<div class="empty-ttl">'+t('noExp')+'</div><div class="empty-sub">'+t('noExpSub')+'</div></div>';return;}
  list.innerHTML=S.expenses.map(function(e){
    var cc=catColor(e.category);
    var expCur=e.currency||S.localCurrency;
    var dispAmt=fmtCur(Number(e.amount)||0,expCur);
    var convHtml=expCur!==S.baseCurrency&&e.baseAmount?'<div style="font-size:10px;color:var(--t3)">≈ '+fmtCur(e.baseAmount,S.baseCurrency)+'</div>':'';
    var subLabel=e.subcategory?catL(e.category)+' · '+subL(e.category,e.subcategory):catL(e.category);
    return '<div class="ei" onclick="showExpDetail(\''+e.id+'\')">'+
      '<div class="ei-ic" style="background:'+cc+'"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+IC[catIcon(e.category)]+'</svg></div>'+
      '<div class="ei-d"><div class="ei-name">'+escHtml(e.description||catL(e.category))+'</div><div class="ei-sub">'+escHtml(memName(e.paidBy))+' · '+escHtml(subLabel)+' · '+escHtml(e.date||'')+'</div></div>'+
      '<div style="text-align:right"><div class="ei-amt" style="color:'+cc+'">'+dispAmt+'</div>'+convHtml+'</div></div>';
  }).join('');
  if(S._expTab==='stats')renderExpStats();
  if(S._expTab==='settle')renderSettle();
}
function renderSettle(){
  var el=$('#exp-settle');if(!el)return;var txns=calcSettle();
  if(!txns.length){el.innerHTML='<div class="empty">'+ic('check',48)+'<div class="empty-ttl">'+t('settled')+'</div><div class="empty-sub">'+t('settledSub')+'</div></div>';return;}
  el.innerHTML=txns.map(function(tx){
    var key=tx.from+'_'+tx.to,isPaid=!!S.settledRows[key];
    var payBtns=MSG_APPS.slice(0,4).map(function(k){var a=APPS[k];if(!a)return '';return '<div class="pay-btn" onclick="payVia(\''+k+'\',\''+tx.from+'\',\''+tx.to+'\','+tx.amount+')">'+ic('phone',10)+' '+escHtml(appL(k))+'</div>';}).join('');
    return '<div class="srow">'+
      '<div class="srow-main">'+
        '<div style="flex:1"><div class="srow-name" style="'+(isPaid?'text-decoration:line-through;opacity:.5':'')+'">'+escHtml(memName(tx.from))+'</div><div class="srow-to">'+t('transferTo')+' '+escHtml(memName(tx.to))+'</div></div>'+
        '<div class="srow-amt" style="'+(isPaid?'text-decoration:line-through;opacity:.5':'')+'">'+fmtCur(tx.amount,S.baseCurrency)+'</div>'+
        '<div class="srow-done'+(isPaid?' paid':'')+'" onclick="markSettled(\''+key+'\')">'+ic('check',10)+' '+(isPaid?'已付':t('markPaid'))+'</div>'+
      '</div>'+
      (isPaid?'':'<div class="pay-btns">'+payBtns+'</div>')+
    '</div>';
  }).join('');
}
window.payVia=function(appKey,fromId,toId,amount){var msg='[Travoo] '+memName(fromId)+' → '+memName(toId)+': '+fmtCur(amount,S.baseCurrency);openApp(appKey,encodeURIComponent(msg));};
window.markSettled=function(key){S.settledRows[key]=!S.settledRows[key];localStorage.setItem('settledRows',JSON.stringify(S.settledRows));renderSettle();};

// ── ADD EXPENSE MODAL (with hierarchical cats, custom split, text extract) ──
// Category selector render
function renderCatSelector(){
  var html='<div class="cat-main-grid" id="cat-main-grid">';
  Object.keys(ECAT).forEach(function(k){
    var c=ECAT[k];
    html+='<div class="cat-main-item" data-cat="'+k+'" onclick="selectMainCat(\''+k+'\')">'+
      '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="'+c.color+'" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+IC[c.icon]+'</svg>'+
      '<div class="cat-main-lbl">'+catL(k)+'</div></div>';
  });
  html+='</div><div class="cat-sub-row" id="cat-sub-row"></div>';
  return html;
}
window.selectMainCat=function(k){
  $$('.cat-main-item').forEach(function(el){el.classList.toggle('on',el.dataset.cat===k);});
  window._selCat=k;
  window._selSubcat=null;
  var sub=ECAT[k]&&ECAT[k].sub||{};
  var subRow=$('#cat-sub-row');
  if(subRow){
    subRow.innerHTML=Object.keys(sub).map(function(sk){
      return '<div class="cat-sub-chip" data-sk="'+sk+'" onclick="selectSubCat(\''+sk+'\')">'+subL(k,sk)+'</div>';
    }).join('');
  }
};
window.selectSubCat=function(sk){
  window._selSubcat=sk;
  $$('.cat-sub-chip').forEach(function(el){el.classList.toggle('on',el.dataset.sk===sk);});
};

// Custom split render
function renderSplitSelector(prefill){
  var ids=Object.keys(S.members);
  var splitType=prefill&&prefill.splitType||'equal';
  var customSplits=prefill&&prefill.customSplits||{};
  var html='<div style="display:flex;gap:7px;margin-bottom:9px">'+
    '<div class="chip '+(splitType==='equal'?'on':'')+' split-type-btn" data-st="equal" onclick="switchSplitType(\'equal\')">'+t('splitEqual')+'</div>'+
    '<div class="chip '+(splitType==='custom'?'on':'')+' split-type-btn" data-st="custom" onclick="switchSplitType(\'custom\')">'+t('splitCustom')+'</div>'+
  '</div>'+
  '<div class="split-grid" id="split-grid">';
  ids.forEach(function(id){
    var m=S.members[id];
    var checked=!prefill||(prefill.splitAmong||ids).indexOf(id)>=0;
    var customAmt=customSplits[id]||'';
    html+='<div class="split-row" id="sr-'+id+'">'+
      '<div class="split-check '+(checked?'on':'')+'" id="sc-'+id+'" onclick="toggleSplitMem(\''+id+'\')">'+
        '<svg width="11" height="11" viewBox="0 0 24 24" fill="none"><polyline points="20 6 9 17 4 12" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>'+
      '</div>'+
      renderAv(id,24)+
      '<span class="split-name">'+escHtml(memName(id))+'</span>'+
      '<input class="split-inp" id="si-'+id+'" type="number" value="'+customAmt+'" placeholder="0" style="'+(splitType==='custom'?'':'display:none')+'">'+
    '</div>';
  });
  html+='</div>';
  return html;
}
window.switchSplitType=function(st){
  $$('.split-type-btn').forEach(function(el){el.classList.toggle('on',el.dataset.st===st);});
  window._splitType=st;
  $$('[id^="si-"]').forEach(function(el){el.style.display=st==='custom'?'block':'none';});
};
window.toggleSplitMem=function(id){
  var btn=$('#sc-'+id);if(!btn)return;
  btn.classList.toggle('on');
  // If custom split and all unchecked -> don't allow
};

window.showExpDetail=function(id){
  var e=S.expenses.find(function(x){return x.id===id;});if(!e)return;
  var ids=e.splitAmong||Object.keys(S.members),expCur=e.currency||S.localCurrency;
  showModal('<div class="sh"></div>'+
    '<div style="font-size:19px;font-weight:700;margin-bottom:4px;color:var(--t1)">'+escHtml(e.description||catL(e.category))+'</div>'+
    '<div style="font-size:34px;font-weight:800;color:var(--red);margin:9px 0">'+fmtCur(Number(e.amount)||0,expCur)+'</div>'+
    '<div class="list" style="margin-bottom:13px">'+
      '<div class="lr" style="cursor:default"><span class="lr-lbl">'+t('paidBy')+'</span><span class="lr-val">'+escHtml(memName(e.paidBy))+'</span></div>'+
      '<div class="lr" style="cursor:default"><span class="lr-lbl">'+t('splitWith')+'</span><span class="lr-val">'+escHtml(ids.map(memName).join('、'))+'</span></div>'+
      '<div class="lr" style="cursor:default"><span class="lr-lbl">'+t('cat')+'</span><span class="lr-val">'+escHtml(catL(e.category)+(e.subcategory?' · '+subL(e.category,e.subcategory):''))+'</span></div>'+
      (expCur!==S.baseCurrency&&e.baseAmount?'<div class="lr" style="cursor:default"><span class="lr-lbl">≈</span><span class="lr-val">'+fmtCur(e.baseAmount,S.baseCurrency)+'</span></div>':'')+
    '</div>'+
    '<button class="btn btn-g btn-full" onclick="closeModal();editExpense(\''+id+'\')" style="margin-bottom:7px">'+ic('edit',14)+' '+t('editItem')+'</button>'+
    '<button class="btn btn-d btn-full" onclick="fbDelExpense(\''+id+'\');closeModal();toast(t(\'deleted\'))">'+ic('trash',14)+' '+t('del')+'</button>');
};

window.editExpense=function(id){
  var e=S.expenses.find(function(x){return x.id===id;});if(!e)return;
  showAddExpenseModal({id:id,amount:e.amount,currency:e.currency||S.localCurrency,description:e.description,category:e.category,subcategory:e.subcategory,paidBy:e.paidBy,splitAmong:e.splitAmong,splitType:e.splitType,customSplits:e.customSplits,date:e.date,_editing:true});
};

window.showAddExpenseModal=function(prefill){
  prefill=prefill||{};
  window._selCat=prefill.category||'food';
  window._selSubcat=prefill.subcategory||null;
  window._splitType=prefill.splitType||'equal';
  window._expEditing=prefill._editing?prefill.id:null;

  var curOpts=Object.keys(CUR).map(function(k){return '<option value="'+k+'"'+(k===(prefill.currency||S.localCurrency)?' selected':'')+'>'+CUR[k].f+' '+CUR[k].n+'</option>';}).join('');
  var memOpts=Object.entries(S.members).map(function(entry){var mid=entry[0],m=entry[1];return '<option value="'+mid+'"'+(mid===(prefill.paidBy||S.memberId)?' selected':'')+'>'+escHtml(m.name+(mid===S.memberId?' ('+t('you')+')':''))+'</option>';}).join('');
  var rateHint=Object.keys(S.rates).length>0?'1 '+S.localCurrency+' = '+fmtCur(getRate(S.localCurrency,S.baseCurrency),S.baseCurrency):'';

  showModal('<div class="sh"></div><div class="sheet-title">'+(window._expEditing?t('editItem'):t('addExpense'))+'</div>'+
    '<div id="receipt-prev"></div>'+
    // Receipt capture (camera + album)
    '<div style="display:flex;gap:7px;margin-bottom:11px">'+
      '<button class="btn btn-g" style="flex:1;padding:9px;font-size:12px" onclick="captureReceipt(\'camera\')">'+ic('camera',13)+' '+t('fromCamera')+'</button>'+
      '<button class="btn btn-g" style="flex:1;padding:9px;font-size:12px" onclick="captureReceipt(\'album\')">'+ic('img',13)+' '+t('fromAlbum')+'</button>'+
    '</div>'+
    // Amount + currency
    '<div style="display:flex;gap:7px;margin-bottom:4px">'+
      '<div style="flex:1"><div class="inp-lbl">'+t('amount')+'</div><input class="inp" id="ex-amt" type="number" placeholder="0" value="'+(prefill.amount!=null?prefill.amount:'')+'" style="font-size:21px;font-weight:700" oninput="updateExpConv()"></div>'+
      '<div style="width:130px"><div class="inp-lbl">'+t('expCurrency')+'</div><select class="inp" id="ex-cur" onchange="updateExpConv()">'+curOpts+'</select></div>'+
    '</div>'+
    '<div id="exp-conv-hint" style="font-size:11px;color:var(--t3);margin-bottom:10px;min-height:15px">'+escHtml(rateHint)+'</div>'+
    // Description + date
    '<div style="display:flex;gap:7px;margin-bottom:10px">'+
      '<div style="flex:1"><div class="inp-lbl">'+t('desc')+'</div><input class="inp" id="ex-desc" placeholder="" value="'+(prefill.description?escHtml(prefill.description):'')+'"></div>'+
      '<div style="width:130px"><div class="inp-lbl">'+t('date')+'</div><input class="inp" id="ex-date" type="date" value="'+(prefill.date||today())+'"></div>'+
    '</div>'+
    // Category (hierarchical)
    '<div class="inp-lbl">'+t('cat')+'</div>'+
    renderCatSelector()+
    // Paid by
    '<div class="inp-lbl" style="margin-top:11px">'+t('paidBy')+'</div>'+
    '<select class="inp" id="ex-payer" style="margin-bottom:10px">'+memOpts+'</select>'+
    // Split
    '<div class="inp-lbl">'+t('splitWith')+'</div>'+
    renderSplitSelector(prefill)+
    '<button class="btn btn-p btn-full" onclick="submitExpense()" style="margin-top:13px">'+t('save')+'</button>');

  // Set initial cat
  setTimeout(function(){selectMainCat(window._selCat);if(window._selSubcat)selectSubCat(window._selSubcat);},100);
  if(prefill.amount)updateExpConv();
};
window.updateExpConv=function(){
  var ae=$('#ex-amt'),ce=$('#ex-cur'),hint=$('#exp-conv-hint');if(!ae||!ce||!hint)return;
  var amt=parseFloat(ae.value)||0,cur=ce.value;
  if(cur!==S.baseCurrency&&amt>0&&Object.keys(S.rates).length>0){hint.textContent='≈ '+fmtCur(toBase(amt,cur),S.baseCurrency);}
  else hint.textContent=Object.keys(S.rates).length>0?'1 '+S.localCurrency+' = '+fmtCur(getRate(S.localCurrency,S.baseCurrency),S.baseCurrency):'';
};

// Receipt capture with text extraction fallback
window.captureReceipt=function(src){
  var inp=document.createElement('input');inp.type='file';inp.accept='image/*';
  if(src==='camera')inp.capture='environment';
  inp.onchange=async function(){
    var f=inp.files[0];if(!f)return;
    var hasCfg=!!(S.aiConfig.apiKey&&S.aiConfig.endpoint);
    if(hasCfg)toast(t('recognizing'),0);
    var rd=new FileReader();rd.onload=async function(e){
      var b64=e.target.result;
      var prev=$('#receipt-prev');if(prev)prev.innerHTML='<img src="'+b64+'" style="width:100%;border-radius:var(--r2);margin-bottom:9px;max-height:160px;object-fit:cover">';
      var result=null;
      if(hasCfg){
        try{
          var res=await fetch(S.aiConfig.endpoint,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+S.aiConfig.apiKey},body:JSON.stringify({model:S.aiConfig.model||'gpt-4o-mini',max_tokens:80,messages:[{role:'user',content:[{type:'text',text:'Extract from receipt. JSON only: {"amount":number,"description":"string","category":"food|transport|accommodation|shopping|attraction|entertainment|health|souvenir|sim|prep|other","subcategory":"string"}'},{type:'image_url',image_url:{url:b64}}]}]})});
          var d=await res.json();var txt=(d.choices&&d.choices[0]&&d.choices[0].message&&d.choices[0].message.content)||'';var m=txt.match(/\{[\s\S]*\}/);if(m)result=JSON.parse(m[0]);
        }catch(e2){console.warn('[OCR]',e2);}
      }
      toast('');
      if(result){
        var ae=$('#ex-amt');if(ae&&result.amount)ae.value=result.amount;
        var de=$('#ex-desc');if(de&&result.description)de.value=result.description;
        if(result.category){selectMainCat(result.category);if(result.subcategory)setTimeout(function(){selectSubCat(result.subcategory);},100);}
        toast(t('recognizeOk'));updateExpConv();
      } else {
        // text-based keyword extraction from filename/context
        toast(S.lang==='en'?'Photo added, please fill amount':'图片已添加，请填写金额');
      }
    };rd.readAsDataURL(f);
  };
  inp.click();
};

window.submitExpense=function(){
  var amtEl=$('#ex-amt'),dscEl=$('#ex-desc'),payEl=$('#ex-payer'),curEl=$('#ex-cur'),dateEl=$('#ex-date');
  var amt=amtEl?parseFloat(amtEl.value):0,desc=dscEl?dscEl.value.trim():'';
  var cat=window._selCat||'other',subcat=window._selSubcat||null;
  var paidBy=payEl?payEl.value:S.memberId,currency=curEl?curEl.value:S.localCurrency;
  var date=dateEl?dateEl.value:today();
  var splitType=window._splitType||'equal';
  var split=$$('.split-check.on').map(function(el){return el.id.replace('sc-','');});
  if(!split.length)split=Object.keys(S.members);
  if(!amt||amt<=0){toast('请输入正确金额');return;}
  var data={amount:amt,currency:currency,baseAmount:toBase(amt,currency),baseCurrency:S.baseCurrency,description:desc||catL(cat),category:cat,subcategory:subcat,paidBy:paidBy,splitAmong:split,splitType:splitType,date:date};
  if(splitType==='custom'){
    var customSplits={};split.forEach(function(id){var inp=$('#si-'+id);if(inp&&inp.value)customSplits[id]=parseFloat(inp.value)||0;});
    data.customSplits=customSplits;
  }
  if(window._expEditing){
    fbUpdateExpense(window._expEditing,data);
    closeModal();toast(t('save'));
  } else {
    fbAddExpense(data);closeModal();toast(t('logged'));
  }
};

// ── CHAT ──────────────────────────────────────────────
function renderChat(){
  var v=$('#v-chat');if(!v)return;
  var hasCfg=!!(S.aiConfig.apiKey&&S.aiConfig.endpoint);
  var sugs=[t('chatSug1'),t('chatSug2'),t('chatSug3'),t('chatSug4'),t('chatSug5')];
  var noBanner='';if(!hasCfg){noBanner='<div style="margin:0 14px 10px;padding:13px;background:rgba(var(--orange-rgb),.07);border:0.5px solid rgba(var(--orange-rgb),.22);border-radius:var(--r2)"><div style="font-size:13px;font-weight:700;color:var(--orange);margin-bottom:4px">'+t('noCfg')+'</div><div style="font-size:12px;color:var(--t2);margin-bottom:9px">'+t('noCfgSub')+'</div><button class="btn btn-g" style="padding:7px 14px;font-size:12px" onclick="showAIConfig()">'+t('cfgAI')+'</button></div>';}
  var welcome=S.chatHistory.length===0?
    '<div style="text-align:center;padding:28px 18px">'+
      '<div style="width:60px;height:60px;background:var(--glass-bg2);border:0.5px solid var(--glass-border);border-radius:18px;display:flex;align-items:center;justify-content:center;margin:0 auto 13px">'+ic('chat',26)+'</div>'+
      '<div style="font-size:16px;font-weight:600;margin-bottom:5px;color:var(--t1)">'+t('aiWelcome')+'</div>'+
      '<div style="font-size:13px;color:var(--t2);line-height:1.65;white-space:pre-line">'+t('aiWelcomeSub')+'</div>'+
    '</div>':
    S.chatHistory.map(renderMsg).join('');
  var sugHtml=sugs.map(function(s){return '<div class="csug" onclick="sendSug(\''+s.replace(/'/g,"\\'")+'\')">'+escHtml(s)+'</div>';}).join('');

  v.innerHTML=
    '<div class="nav">'+
      '<div style="width:34px;flex-shrink:0"></div>'+
      '<div class="nav-title" style="position:static;transform:none;flex:1;text-align:center">'+t('butlerName')+'</div>'+
      '<div class="nbtn" onclick="showAIConfig()">'+ic('cog',14)+'</div>'+
    '</div>'+
    noBanner+
    // FIX #1: chat-outer fills remaining space, bar always at bottom
    '<div class="chat-outer">'+
      '<div class="chat-body" id="chat-body">'+welcome+'</div>'+
      '<div class="csug-wrap" id="csug-wrap">'+sugHtml+'</div>'+
      '<div class="chat-bar">'+
        '<button class="cvbtn" onmousedown="startVoice(handleVoiceIntent)" ontouchstart="event.preventDefault();startVoice(handleVoiceIntent)" style="-webkit-user-select:none">'+ic('mic',17)+'</button>'+
        '<textarea class="chat-inp-el" id="chat-inp" rows="1" placeholder="'+t('aiPh')+'" onkeydown="if(event.key===\'Enter\'&&!event.shiftKey){event.preventDefault();sendChatMsg()}" oninput="this.style.height=\'auto\';this.style.height=Math.min(this.scrollHeight,110)+\'px\'"></textarea>'+
        '<button class="csend" id="csend" onclick="sendChatMsg()"><svg width="17" height="17" viewBox="0 0 24 24" fill="none">'+IC.send+'</svg></button>'+
      '</div>'+
    '</div>';
  scrollChat();
}
function renderMsg(m){var isU=m.role==='user';var time='';if(m.ts&&m.ts.toDate)time=m.ts.toDate().toLocaleTimeString('zh',{hour:'2-digit',minute:'2-digit'});return '<div class="msg '+(isU?'msg-u':'msg-a')+'"><div class="mbubble">'+(m.content||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>')+'</div>'+(time?'<div class="mmeta">'+time+'</div>':'')+'</div>';}
function refreshChatMsgs(){var body=$('#chat-body');if(!body)return;if(S.chatHistory.length)body.innerHTML=S.chatHistory.map(renderMsg).join('');scrollChat();}
function scrollChat(){var b=$('#chat-body');if(b)setTimeout(function(){b.scrollTop=b.scrollHeight;},60);}
window.sendSug=function(txt){var inp=$('#chat-inp');if(inp){inp.value=txt;sendChatMsg();}};
window.askAIAbout=function(title){switchTab('chat');setTimeout(function(){sendChatMsg('关于"'+title+'"，给我建议和注意事项');},300);};
window.sendChatMsg=async function(forceTxt){
  var inp=$('#chat-inp'),btn=$('#csend'),body=$('#chat-body');
  var txt=forceTxt||(inp?inp.value.trim():'');if(!txt)return;
  if(inp){inp.value='';inp.style.height='auto';}if(btn)btn.disabled=true;
  var uEl=document.createElement('div');uEl.className='msg msg-u';uEl.innerHTML='<div class="mbubble">'+txt.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/\n/g,'<br>')+'</div>';if(body)body.appendChild(uEl);scrollChat();
  await fbSaveMsg('user',txt);
  var typEl=document.createElement('div');typEl.className='typing-wrap';typEl.innerHTML='<div class="typing-bub"><div class="tdot"></div><div class="tdot"></div><div class="tdot"></div></div>';if(body)body.appendChild(typEl);scrollChat();
  var sw=$('#csug-wrap');if(sw)sw.style.display='none';
  try{
    var reply=await callAI(txt);typEl.remove();
    var aEl=document.createElement('div');aEl.className='msg msg-a';aEl.innerHTML='<div class="mbubble">'+reply.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/\n/g,'<br>')+'</div>';
    if(body)body.appendChild(aEl);await fbSaveMsg('assistant',reply);scrollChat();
  }catch(e){
    typEl.remove();var errEl=document.createElement('div');errEl.className='msg msg-a';errEl.innerHTML='<div class="mbubble" style="color:var(--red)">'+escHtml(e.message)+'</div>';if(body)body.appendChild(errEl);scrollChat();if(e.message===t('noCfg'))setTimeout(showAIConfig,600);
  }
  if(btn)btn.disabled=false;
};
window.showAIConfig=function(){
  var cfg=S.aiConfig;
  showModal('<div class="sh"></div><div class="sheet-title">'+t('aiCfg')+'</div>'+
    '<div style="display:flex;gap:5px;margin-bottom:13px"><div class="chip" onclick="presetAI(\'openai\',this)">OpenAI</div><div class="chip" onclick="presetAI(\'custom\',this)">Custom</div></div>'+
    '<div class="inp-lbl">'+t('apiEp')+'</div><input class="inp" id="cfg-ep" value="'+escHtml(cfg.endpoint||'')+'" placeholder="https://api.openai.com/v1/chat/completions" style="margin-bottom:9px">'+
    '<div class="inp-lbl">'+t('apiKey')+'</div><input class="inp" id="cfg-key" type="password" value="'+escHtml(cfg.apiKey||'')+'" placeholder="sk-..." style="margin-bottom:9px">'+
    '<div class="inp-lbl">'+t('model')+'</div><input class="inp" id="cfg-model" value="'+escHtml(cfg.model||'gpt-4o-mini')+'" style="margin-bottom:13px">'+
    '<button class="btn btn-p btn-full" onclick="saveAICfg()" style="margin-bottom:7px">'+t('saveCfg')+'</button>'+
    (cfg.apiKey?'<button class="btn btn-g btn-full" onclick="S.aiConfig={};localStorage.removeItem(\'aiConfig\');closeModal();renderChat()">清除配置</button>':'')+
    '<div style="font-size:11px;color:var(--t4);text-align:center;margin-top:11px">API Key仅存本设备，不上传</div>');
};
window.presetAI=function(p,el){$$('.sheet .chip').forEach(function(c){c.classList.remove('on');});el.classList.add('on');var ep=$('#cfg-ep'),md=$('#cfg-model');if(p==='openai'&&ep&&md){ep.value='https://api.openai.com/v1/chat/completions';md.value='gpt-4o-mini';}};
window.saveAICfg=function(){var ep=($('#cfg-ep')&&$('#cfg-ep').value.trim())||'',key=($('#cfg-key')&&$('#cfg-key').value.trim())||'',model=($('#cfg-model')&&$('#cfg-model').value.trim())||'gpt-4o-mini';if(!ep||!key){toast('请填写端点和Key');return;}S.aiConfig={endpoint:ep,apiKey:key,model:model};localStorage.setItem('aiConfig',JSON.stringify(S.aiConfig));closeModal();toast(t('aiConfigSaved'));renderChat();};
window.confirmClearChat=function(){showModal('<div class="sh"></div><div style="text-align:center;padding:9px 0"><div style="font-size:17px;font-weight:700;color:var(--t1);margin-bottom:7px">'+t('confirmClearChat')+'</div><div style="font-size:13px;color:var(--t2);margin-bottom:20px">'+t('confirmClearChatSub')+'</div><button class="btn btn-d btn-full" onclick="S.chatHistory=[];toast(t(\'chatCleared\'));closeModal()" style="margin-bottom:9px">'+t('clearChatConfirmBtn')+'</button><button class="btn btn-g btn-full" onclick="closeModal()">'+t('cancel')+'</button></div>');};
var CONFIRM_CLEAR_CHAT='confirmClearChat';
T['zh-CN'].confirmClearChat='确认清除所有对话？';T['zh-CN'].confirmClearChatSub='此操作不可撤销';T['zh-CN'].clearChatConfirmBtn='确认清除';
T['zh-TW'].confirmClearChat='確認清除所有對話？';T['zh-TW'].confirmClearChatSub='此操作不可撤銷';T['zh-TW'].clearChatConfirmBtn='確認清除';
T['en'].confirmClearChat='Clear all messages?';T['en'].confirmClearChatSub='Cannot be undone';T['en'].clearChatConfirmBtn='Clear';
T['zh-CN'].confirmClearChat='确认清除所有对话？';

// ── LISTS ─────────────────────────────────────────────
window.showListsModal=function(){ S._listsPane='shopping'; renderListsView(); };
function renderListsView(){
  var pane=S._listsPane||'shopping';
  var tabs=['shopping','todo','packing'].map(function(k){return '<div class="ptab '+(pane===k?'on':'')+'" onclick="switchListPane(\''+k+'\')">'+t(k)+'</div>';}).join('');
  var content=pane==='shopping'?renderShoppingPane():pane==='todo'?renderTodoPane():renderPackingPane();
  showModal('<div class="sh"></div><div class="ptabs" style="margin-bottom:13px">'+tabs+'</div><div id="lists-content">'+content+'</div>');
}
window.switchListPane=function(p){S._listsPane=p;var lc=$('#lists-content');if(lc){lc.innerHTML=p==='shopping'?renderShoppingPane():p==='todo'?renderTodoPane():renderPackingPane();}else renderListsView();};
function renderShoppingPane(){
  var items=S.shoppingList,en=S.lang==='en';
  var html='<div style="display:flex;gap:7px;margin-bottom:11px"><input class="inp" id="shop-inp" placeholder="'+(en?'Item…':'物品…')+'" style="flex:1"><button class="btn btn-p" style="padding:9px 13px" onclick="addShoppingItem()">'+ic('plus',14)+'</button></div>';
  var visible=items.filter(function(i){return i.ownerId===S.memberId||(i.sharedWith&&i.sharedWith.indexOf(S.memberId)>=0);});
  if(!visible.length)html+='<div style="text-align:center;padding:22px;color:var(--t3)">'+(en?'No items':'暂无物品')+'</div>';
  else html+='<div class="list">'+visible.map(function(item){return '<div class="list-item'+(item.done?' done':'')+'"><div class="list-check'+(item.done?' checked':'')+'" onclick="toggleShoppingItem(\''+item.id+'\')"><svg width="11" height="11" viewBox="0 0 24 24" fill="none"><polyline points="20 6 9 17 4 12" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg></div><span class="list-item-text">'+renderMentions(item.text)+'</span><div class="list-item-del" onclick="removeShoppingItem(\''+item.id+'\')">'+ic('trash',12)+'</div></div>';}).join('')+'</div>';
  return html;
}
window.addShoppingItem=function(){var inp=$('#shop-inp');if(!inp)return;var text=inp.value.trim();if(!text)return;var sw=[];Object.entries(S.members).forEach(function(e){var id=e[0],m=e[1];if(text.indexOf('@'+m.name)>=0&&id!==S.memberId)sw.push(id);});S.shoppingList.push({id:'s_'+Date.now(),text:text,done:false,ownerId:S.memberId,sharedWith:sw});localStorage.setItem('shoppingList',JSON.stringify(S.shoppingList));inp.value='';var lc=$('#lists-content');if(lc)lc.innerHTML=renderShoppingPane();};
window.toggleShoppingItem=function(id){var item=S.shoppingList.find(function(i){return i.id===id;});if(item)item.done=!item.done;localStorage.setItem('shoppingList',JSON.stringify(S.shoppingList));var lc=$('#lists-content');if(lc)lc.innerHTML=renderShoppingPane();};
window.removeShoppingItem=function(id){S.shoppingList=S.shoppingList.filter(function(i){return i.id!==id;});localStorage.setItem('shoppingList',JSON.stringify(S.shoppingList));var lc=$('#lists-content');if(lc)lc.innerHTML=renderShoppingPane();};
function renderTodoPane(){
  var phases=['pre','during','post'],pLbl={'pre':t('listPre'),'during':t('listDuring'),'post':t('listPost')};
  var html='<div style="display:flex;gap:7px;margin-bottom:11px"><input class="inp" id="todo-inp" placeholder="'+(S.lang==='en'?'Task…':'任务…')+'" style="flex:1"><select class="inp" id="todo-ph" style="width:90px">'+phases.map(function(p){return '<option value="'+p+'">'+pLbl[p]+'</option>';}).join('')+'</select><button class="btn btn-p" style="padding:9px 12px" onclick="addTodoItem()">'+ic('plus',12)+'</button></div>';
  phases.forEach(function(ph){var items=(S.todoList[ph]||[]).filter(function(i){return i.ownerId===S.memberId||(i.sharedWith&&i.sharedWith.indexOf(S.memberId)>=0);});if(!items.length)return;html+='<div style="font-size:11px;font-weight:700;color:var(--t3);text-transform:uppercase;letter-spacing:.4px;margin:7px 0 4px">'+pLbl[ph]+'</div><div class="list" style="margin-bottom:9px">'+items.map(function(i){return '<div class="list-item'+(i.done?' done':'')+'"><div class="list-check'+(i.done?' checked':'')+'" onclick="toggleTodoItem(\''+ph+'\',\''+i.id+'\')"><svg width="11" height="11" viewBox="0 0 24 24" fill="none"><polyline points="20 6 9 17 4 12" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg></div><span class="list-item-text">'+renderMentions(i.text)+'</span><div class="list-item-del" onclick="removeTodoItem(\''+ph+'\',\''+i.id+'\')">'+ic('trash',12)+'</div></div>';}).join('')+'</div>';});
  if(phases.every(function(ph){return !(S.todoList[ph]||[]).length;}))html+='<div style="text-align:center;padding:22px;color:var(--t3)">'+(S.lang==='en'?'No tasks':'暂无待办')+'</div>';
  return html;
}
window.addTodoItem=function(){var inp=$('#todo-inp'),ph=$('#todo-ph');if(!inp||!ph)return;var text=inp.value.trim();if(!text)return;var phase=ph.value;var sw=[];Object.entries(S.members).forEach(function(e){var id=e[0],m=e[1];if(text.indexOf('@'+m.name)>=0&&id!==S.memberId)sw.push(id);});if(!S.todoList[phase])S.todoList[phase]=[];S.todoList[phase].push({id:'t_'+Date.now(),text:text,done:false,ownerId:S.memberId,sharedWith:sw});localStorage.setItem('todoList',JSON.stringify(S.todoList));inp.value='';var lc=$('#lists-content');if(lc)lc.innerHTML=renderTodoPane();};
window.toggleTodoItem=function(ph,id){var items=S.todoList[ph]||[];var item=items.find(function(i){return i.id===id;});if(item)item.done=!item.done;localStorage.setItem('todoList',JSON.stringify(S.todoList));var lc=$('#lists-content');if(lc)lc.innerHTML=renderTodoPane();};
window.removeTodoItem=function(ph,id){S.todoList[ph]=(S.todoList[ph]||[]).filter(function(i){return i.id!==id;});localStorage.setItem('todoList',JSON.stringify(S.todoList));var lc=$('#lists-content');if(lc)lc.innerHTML=renderTodoPane();};
function renderPackingPane(){
  var sugg=getPackSugg(),cats=['clothes','docs','electronics','toiletries'];
  var catLbls={clothes:t('packingClothes'),docs:t('packingDocs'),electronics:t('packingElectronics'),toiletries:t('packingToiletries')};
  var html='<div style="font-size:12px;color:var(--t3);margin-bottom:9px;line-height:1.55">'+(S.lang==='en'?'Suggested based on weather & itinerary':'根据天气和行程智能推荐')+'</div>';
  cats.forEach(function(cat){var items=sugg[cat]||[];if(!items.length)return;html+='<div style="font-size:10px;font-weight:700;color:var(--t3);text-transform:uppercase;letter-spacing:.4px;padding:7px 0 3px">'+catLbls[cat]+'</div><div class="list" style="margin-bottom:9px">'+items.map(function(item){var done=S.packingList[item.id]||false;return '<div class="list-item'+(done?' done':'')+'"><div class="list-check'+(done?' checked':'')+'" onclick="togglePacking(\''+item.id+'\')"><svg width="11" height="11" viewBox="0 0 24 24" fill="none"><polyline points="20 6 9 17 4 12" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg></div><span class="list-item-text">'+escHtml(item.text)+'</span></div>';}).join('')+'</div>';});
  if(periodConflict())html+='<div class="period-warning" style="margin-top:7px">'+ic('bell',13)+' '+t('periodPacking')+'</div>';
  return html;
}
window.togglePacking=function(id){S.packingList[id]=!S.packingList[id];localStorage.setItem('packingList',JSON.stringify(S.packingList));var lc=$('#lists-content');if(lc)lc.innerHTML=renderPackingPane();};

// ── SETTINGS ──────────────────────────────────────────
function renderSet(){
  var v=$('#v-set');if(!v)return;
  var af=document.getElementById('gfab-add');if(af)af.remove();
  var notifsChk=localStorage.getItem('notifsEnabled')!=='false'?'checked':'';
  var lc=CUR[S.localCurrency]||{f:'',n:S.localCurrency},bc=CUR[S.baseCurrency]||{f:'',n:S.baseCurrency};
  var rateVal=getRate(S.localCurrency,S.baseCurrency);
  var rateStr=Object.keys(S.rates).length>0?'1 '+S.localCurrency+' = '+fmtCur(rateVal,S.baseCurrency):t('rateUnavailable');
  var histSection='';if(S.localTrips.length>0){histSection='<div class="set-ttl">'+t('history')+'</div><div class="set-group">'+S.localTrips.map(function(tr){return '<div class="set-row" onclick="enterTrip(\''+tr.code+'\')"><div style="flex:1"><div style="font-size:15px;color:var(--t1)">'+escHtml(tr.name||'—')+'</div><div style="font-size:11px;color:var(--t3)">'+escHtml(tr.dates||'—')+'</div></div><span class="set-chev">'+ic('chev',14)+'</span></div>';}).join('')+'</div>';}

  // Members
  var memHtml=Object.entries(S.members).map(function(entry){
    var id=entry[0],m=entry[1],img=memAvatar(id),isYou=id===S.memberId;
    var canDelete=(m.joinedVia==='manual'&&!m.claimed&&m.addedBy===S.memberId)||(!isYou&&(S.trip&&S.trip.creatorId===S.memberId)&&m.joinedVia==='manual'&&!m.claimed);
    return '<div class="set-row" onclick="showMemberEdit(\''+id+'\')">'+
      (img?'<div style="width:30px;height:30px;border-radius:50%;overflow:hidden;flex-shrink:0"><img src="'+img+'" style="width:100%;height:100%;object-fit:cover"></div>':'<div style="width:30px;height:30px;border-radius:50%;background:'+m.color+';display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:#fff;flex-shrink:0">'+((m.name||'?')[0])+'</div>')+
      '<span class="set-lbl">'+escHtml(m.name)+'</span>'+
      (isYou?'<span class="you-tag">'+t('you')+'</span>':'')+'  '+
      (canDelete?'<div class="member-can-del" onclick="event.stopPropagation();removeMemberConfirm(\''+id+'\')" style="margin-right:4px">'+ic('trash',10)+' '+t('del')+'</div>':'')+
      '<span class="set-chev">'+ic('chev',14)+'</span>'+
    '</div>';
  }).join('');

  v.innerHTML=
    '<div class="nav"><div class="nav-large">'+t('set')+'</div></div>'+
    '<div class="scroller"><div style="height:10px"></div>'+

    '<div class="set-ttl">'+t('code')+'</div>'+
    '<div class="set-group"><div class="set-row" style="cursor:default"><div class="set-icon">'+ic('lock',14)+'</div><div class="set-lbl" style="font-family:monospace;letter-spacing:2px;font-weight:700">'+escHtml(S.tripCode||'——')+'</div><div style="display:flex;gap:5px"><div class="nbtn" style="width:26px;height:26px" onclick="copyCode()">'+ic('copy',11)+'</div><div class="nbtn" style="width:26px;height:26px" onclick="shareCode()">'+ic('share',11)+'</div></div></div></div>'+

    '<div class="set-ttl">'+t('members')+'</div>'+
    '<div class="set-group">'+memHtml+
      '<div class="set-row" onclick="showAddMember()"><div class="set-icon">'+ic('plus',13)+'</div><span class="set-lbl">'+t('addMember')+'</span></div>'+
      '<div class="set-row" onclick="showClaimMember()"><div class="set-icon">'+ic('user',13)+'</div><span class="set-lbl">'+t('claimMemberTitle')+'</span></div>'+
    '</div>'+

    '<div class="set-ttl">'+t('setAppearance')+'</div>'+
    '<div class="set-group">'+
      '<div class="set-row" onclick="showAppearanceModal()"><div class="set-icon">'+ic('palette',14)+'</div><div class="set-lbl">'+t('appearance')+'</div><span class="set-val">'+t('appearanceDesc')+'</span><span class="set-chev">'+ic('chev',14)+'</span></div>'+
    '</div>'+

    '<div class="set-ttl">'+t('setTravel')+'</div>'+
    '<div class="set-group">'+
      '<div class="set-row" onclick="showCurrencyModal()"><div class="set-icon">'+ic('wallet',14)+'</div><div class="set-lbl">'+t('currency')+'</div><span class="set-val">'+lc.f+' → '+bc.f+'</span><span class="set-chev">'+ic('chev',14)+'</span></div>'+
      '<div class="set-row" onclick="showMsgAppModal()"><div class="set-icon">'+ic('msg',14)+'</div><div class="set-lbl">'+t('msgApp')+'</div><span class="set-val">'+escHtml(appL(S.msgApp))+'</span><span class="set-chev">'+ic('chev',14)+'</span></div>'+
      '<div class="set-row" onclick="showPeriodModal()"><div class="set-icon">'+ic('heart',14)+'</div><div class="set-lbl">'+t('period')+'</div><span class="set-val" style="'+(periodConflict()?'color:var(--red)':'')+'">'+(periodConflict()?(S.lang==='en'?'Conflict!':'注意重叠'):(S.lang==='en'?'OK':'无'))+'</span><span class="set-chev">'+ic('chev',14)+'</span></div>'+
      '<div class="set-row" onclick="showListsModal()"><div class="set-icon">'+ic('list',14)+'</div><div class="set-lbl">'+t('lists')+'</div><span class="set-chev">'+ic('chev',14)+'</span></div>'+
    '</div>'+

    '<div class="set-ttl">'+t('notif')+'</div>'+
    '<div class="set-group">'+
      '<div class="set-row" style="cursor:default"><div class="set-icon">'+ic('bell',14)+'</div><span class="set-lbl">'+(S.lang==='en'?'Trip Reminders':'行程提醒')+'</span><label class="toggle"><input type="checkbox" '+notifsChk+' onchange="localStorage.setItem(\'notifsEnabled\',this.checked)"><span class="tsl"></span></label></div>'+
      '<div class="set-row" onclick="reqGeoPermission()"><div class="set-icon">'+ic('map',14)+'</div><span class="set-lbl">'+t('locationAllow')+'</span><span class="set-val">'+(S.geo?'✓':'—')+'</span></div>'+
    '</div>'+

    '<div class="set-ttl">'+t('aiCfg')+'</div>'+
    '<div class="set-group">'+
      '<div class="set-row" onclick="showAIConfig()"><div class="set-icon">'+ic('sliders',14)+'</div><span class="set-lbl">'+t('aiCfg')+'</span><span class="set-val">'+escHtml(S.aiConfig.model||t('notConfigured'))+'</span><span class="set-chev">'+ic('chev',14)+'</span></div>'+
      '<div class="set-row" onclick="confirmClearChat()"><div class="set-icon">'+ic('trash',14)+'</div><span class="set-lbl">'+t('clearChat')+'</span></div>'+
    '</div>'+

    '<div class="set-ttl">'+t('setData')+'</div>'+
    '<div class="set-group">'+
      '<div class="set-row" onclick="exportTripData()"><div class="set-icon">'+ic('download',14)+'</div><span class="set-lbl">'+t('exportData')+'</span></div>'+
      '<div class="set-row" onclick="importTripData()"><div class="set-icon">'+ic('upload',14)+'</div><span class="set-lbl">'+t('importData')+'</span></div>'+
      '<div class="set-row" style="cursor:default"><div class="set-icon">'+ic('lock',14)+'</div><span class="set-lbl">'+t('deviceId')+'</span><span class="set-val" style="font-size:10px;font-family:monospace">'+DEVICE_ID.substring(0,12)+'…</span></div>'+
    '</div>'+

    histSection+

    '<div class="set-ttl">'+t('about')+'</div>'+
    '<div class="set-group">'+
      '<div class="set-row" style="cursor:default"><div class="set-icon">'+ic('globe',14)+'</div><span class="set-lbl">'+t('version')+'</span><span class="set-val">5.2.0</span></div>'+
      '<div class="set-row" style="cursor:default"><div class="set-icon">'+ic('check',14)+'</div><span class="set-lbl">Firebase</span><span class="set-val">'+(fbApp?t('connected'):t('localMode'))+'</span></div>'+
    '</div>'+

    '<div style="padding:0 16px 18px"><button class="btn btn-d btn-full" onclick="confirmLeave()" style="margin-top:7px">'+t('leave')+'</button></div>'+
    '</div>';
}
// Member management
window.showAddMember=function(){
  showModal('<div class="sh"></div><div class="sheet-title">'+t('addMember')+'</div>'+
    '<div style="font-size:13px;color:var(--t2);line-height:1.6;margin-bottom:13px">'+(S.lang==='en'?'Add a member slot. They can claim it using the 4-char claim code.':'添加成员槽位，朋友可用4位认领码自行认领。')+'</div>'+
    '<input class="inp" id="nm-name" placeholder="'+t('addMemberPh')+'" style="margin-bottom:13px">'+
    '<button class="btn btn-p btn-full" onclick="submitAddMember()">'+t('addMember')+'</button>');
};
window.submitAddMember=async function(){
  var name=$('#nm-name')&&$('#nm-name').value.trim();if(!name){toast('请输入名字');return;}
  var id='u_'+Date.now(),used=Object.values(S.members).map(function(m){return m.color;}),color=COLORS.find(function(c){return used.indexOf(c)<0;})||COLORS[0];
  var claimCode=gen4();
  var memberData={name:name,color:color,joinedVia:'manual',addedBy:S.memberId,claimed:false,claimCode:claimCode};
  if(db&&S.tripCode){var upd={};upd['members.'+id]=Object.assign({},memberData,{addedAt:serverTimestamp()});await updateDoc(doc(db,'trips',S.tripCode),upd);}
  S.members[id]=memberData;
  closeModal();renderSet();
  showModal('<div class="sh"></div><div class="sheet-title">'+t('addMember')+'</div>'+
    '<div style="text-align:center;padding:10px 0">'+
      '<div style="font-size:14px;color:var(--t2);margin-bottom:14px">'+(S.lang==='en'?'Member added. Share this claim code with your friend:':'成员已添加，把认领码分享给朋友：')+'</div>'+
      '<div class="code-disp" style="font-size:32px;letter-spacing:8px;margin-bottom:14px">'+claimCode+'</div>'+
      '<div style="font-size:12px;color:var(--t3)">'+t('claimMemberDesc')+'</div>'+
    '</div>'+
    '<button class="btn btn-p btn-full" onclick="navigator.clipboard&&navigator.clipboard.writeText(\''+claimCode+'\').then(function(){toast(t(\'codeCopied\'));})">'+ic('copy',14)+' '+t('copy')+'</button>');
};
window.removeMemberConfirm=function(id){
  var m=S.members[id];if(!m)return;
  showModal('<div class="sh"></div><div class="sheet-title">'+t('removeMember')+'</div>'+
    '<div style="font-size:14px;color:var(--t2);margin-bottom:16px">'+escHtml(m.name)+' · '+t('removeMemberConfirm')+'</div>'+
    "<button class='btn btn-d btn-full' onclick='doRemoveMember(\"" + id.replace(/"/g, '\\"') + "\")' style='margin-bottom:7px'>" + t('removeMember') + "</button>"
    '<button class="btn btn-g btn-full" onclick="closeModal()">'+t('cancel')+'</button>');
};
window.doRemoveMember=async function(id){
  var m=S.members[id];if(!m)return;
  var canDelete=(m.joinedVia==='manual'&&!m.claimed&&m.addedBy===S.memberId);
  if(!canDelete){toast('无法删除此成员');closeModal();return;}
  if(db&&S.tripCode){var upd={};upd['members.'+id]=deleteField();await updateDoc(doc(db,'trips',S.tripCode),upd);}
  delete S.members[id];closeModal();renderSet();toast(t('deleted'));
};
window.showClaimMember=function(){
  showModal('<div class="sh"></div><div class="sheet-title">'+t('claimMemberTitle')+'</div>'+
    '<div style="font-size:13px;color:var(--t2);line-height:1.6;margin-bottom:13px">'+t('claimMemberDesc')+'</div>'+
    '<input class="inp code-inp" id="claim-inp" maxlength="4" placeholder="XXXX" autocapitalize="characters" style="margin-bottom:13px">'+
    '<button class="btn btn-p btn-full" onclick="submitClaimMember()">认领</button>');
  var ci=$('#claim-inp');if(ci)ci.addEventListener('input',function(){this.value=this.value.toUpperCase();});
};
window.submitClaimMember=async function(){
  var code=($('#claim-inp')&&$('#claim-inp').value.trim().toUpperCase())||'';
  if(code.length<4){toast('请输入完整认领码');return;}
  var entry=Object.entries(S.members).find(function(e){return e[1].claimCode===code&&!e[1].claimed&&e[1].joinedVia==='manual';});
  if(!entry){toast('找不到对应成员或已被认领');return;}
  var oldId=entry[0],m=entry[1];
  // Claim: mark as claimed, link to this device
  m.claimed=true;m.claimedBy=S.memberId;m.claimDeviceId=DEVICE_ID;
  if(db&&S.tripCode){var upd={};upd['members.'+oldId+'.claimed']=true;upd['members.'+oldId+'.claimedBy']=S.memberId;await updateDoc(doc(db,'trips',S.tripCode),upd);}
  // Switch session to the claimed member
  S.memberId=oldId;S.memberName=m.name;
  localStorage.setItem('memberId',oldId);localStorage.setItem('memberName',m.name);
  closeModal();renderSet();toast('已认领为 '+m.name);
};

window.showMemberEdit=function(id){
  var m=S.members[id];if(!m)return;var img=memAvatar(id),isYou=id===S.memberId;
  showModal('<div class="sh"></div><div style="display:flex;flex-direction:column;align-items:center;gap:9px;margin-bottom:18px">'+
    '<div onclick="changeMemberAvatar(\''+id+'\')" style="cursor:pointer;position:relative">'+
      (img?'<div style="width:68px;height:68px;border-radius:50%;overflow:hidden"><img src="'+img+'" style="width:100%;height:100%;object-fit:cover"></div>':'<div style="width:68px;height:68px;border-radius:50%;background:'+m.color+';display:flex;align-items:center;justify-content:center;font-size:26px;font-weight:700;color:#fff">'+((m.name||'?')[0])+'</div>')+
      '<div style="position:absolute;bottom:0;right:0;width:20px;height:20px;background:var(--blue);border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid var(--bg)">'+ic('camera',9)+'</div>'+
    '</div>'+
    '<div style="font-size:15px;font-weight:600;color:var(--t1)">'+escHtml(m.name)+(isYou?' ('+t('you')+')':'')+'</div>'+
  '</div>'+
  (isYou?'<div class="inp-lbl">'+t('editNickname')+'</div><input class="inp" id="mem-name" value="'+escHtml(m.name)+'" style="margin-bottom:13px">'+
    '<button class="btn btn-p btn-full" style="margin-bottom:7px" onclick="submitMemberEdit(\''+id+'\')">'+t('save')+'</button>':'')+
  '<button class="btn btn-g btn-full" onclick="changeMemberAvatar(\''+id+'\')">'+ic('camera',13)+' '+t('editAvatar')+'</button>');
};
window.changeMemberAvatar=function(id){
  var inp=document.createElement('input');inp.type='file';inp.accept='image/*';
  inp.onchange=async function(){var f=inp.files[0];if(!f)return;showLoad();var rd=new FileReader();rd.onload=async function(e){try{var img=new Image();img.onload=function(){var canvas=document.createElement('canvas'),sz=Math.min(img.width,img.height,120);canvas.width=sz;canvas.height=sz;canvas.getContext('2d').drawImage(img,(img.width-sz)/2,(img.height-sz)/2,sz,sz,0,0,sz,sz);S.avatars[id]=canvas.toDataURL('image/jpeg',.7);localStorage.setItem('memberAvatars',JSON.stringify(S.avatars));hideLoad();closeModal();renderSet();toast(t('wallUpdated'));};img.src=e.target.result;}catch(err){hideLoad();toast(t('imgTooLarge'));}};rd.readAsDataURL(f);};
  inp.click();
};
window.submitMemberEdit=async function(id){var name=$('#mem-name')&&$('#mem-name').value.trim();if(!name)return;S.members[id].name=name;if(id===S.memberId){S.memberName=name;localStorage.setItem('memberName',name);}if(db&&S.tripCode){var upd={};upd['members.'+id+'.name']=name;await updateDoc(doc(db,'trips',S.tripCode),upd);}closeModal();renderSet();toast(t('save'));};
window.showCurrencyModal=function(){
  var curOpts=Object.keys(CUR).map(function(k){return '<option value="'+k+'">'+CUR[k].f+' '+CUR[k].n+'</option>';}).join('');
  var rateStr=Object.keys(S.rates).length>0?'1 '+S.localCurrency+' = '+fmtCur(getRate(S.localCurrency,S.baseCurrency),S.baseCurrency):t('rateUnavailable');
  showModal('<div class="sh"></div><div class="sheet-title">'+t('currency')+'</div>'+
    '<div style="display:flex;gap:7px;margin-bottom:9px"><div style="flex:1"><div class="inp-lbl">'+t('baseCurrency')+'</div><select class="inp" id="set-base" onchange="S.baseCurrency=this.value">'+curOpts+'</select></div><div style="flex:1"><div class="inp-lbl">'+t('localCurrency')+'</div><select class="inp" id="set-local" onchange="S.localCurrency=this.value">'+curOpts+'</select></div></div>'+
    '<div style="padding:11px 13px;background:var(--glass-bg);border:0.5px solid var(--glass-border);border-radius:var(--r2);display:flex;align-items:center;gap:9px;margin-bottom:13px"><div style="flex:1"><div style="font-size:13px;font-weight:600;color:var(--t1)">'+escHtml(rateStr)+'</div>'+(S.fxDate?'<div style="font-size:10px;color:var(--t3)">'+S.fxDate.substring(0,16)+'</div>':'')+
    '</div><button class="btn btn-g" style="padding:6px 11px;font-size:12px" onclick="doFetchRates()">'+ic('refresh',11)+' '+t('refreshRate')+'</button></div>'+
    '<button class="btn btn-p btn-full" onclick="saveCurrencySettings()">'+t('save')+'</button>');
  var sb=$('#set-base'),sl=$('#set-local');if(sb)sb.value=S.baseCurrency;if(sl)sl.value=S.localCurrency;
};
window.saveCurrencySettings=function(){localStorage.setItem('baseCurrency',S.baseCurrency);localStorage.setItem('localCurrency',S.localCurrency);if(S.fxBase!==S.baseCurrency){S.rates={};S.fxDate='';}closeModal();renderSet();};
window.showMsgAppModal=function(){showModal('<div class="sh"></div><div class="sheet-title">'+t('msgApp')+'</div><div class="list">'+MSG_APPS.map(function(a){var app=APPS[a];if(!app)return '';return '<div class="lr" onclick="setMsgApp(\''+a+'\')"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+IC[app.i||'msg']+'</svg><span class="lr-lbl">'+escHtml(appL(a))+'</span>'+(S.msgApp===a?'<span style="color:var(--green)">'+ic('check',15)+'</span>':'')+'</div>';}).join('')+'</div>');};
window.setMsgApp=function(a){S.msgApp=a;localStorage.setItem('msgApp',a);closeModal();renderSet();};
window.showAppearanceModal=function(){
  var LL={'zh-CN':'简','zh-TW':'繁','en':'EN'};
  var langChips=['zh-CN','zh-TW','en'].map(function(l){return '<div class="chip '+(S.lang===l?'on':'')+'" style="font-weight:700;padding:5px 13px" onclick="setLang(\''+l+'\')">'+LL[l]+'</div>';}).join('');
  var swatches='<div class="theme-grid">';
  Object.entries(THEMES).forEach(function(entry){var k=entry[0],th=entry[1];var sty=typeof th.swatch==='string'&&th.swatch.startsWith('linear')?'background:'+th.swatch:'background:'+th.swatch;swatches+='<div class="theme-swatch'+(S.theme===k?' on':'')+'" style="'+sty+'" title="'+th.n+'" onclick="window.applyTheme(\''+k+'\');$$(\'.theme-swatch\').forEach(function(s){s.classList.remove(\'on\')});this.classList.add(\'on\')"></div>';});
  swatches+='</div>';
  showModal('<div class="sh"></div><div class="sheet-title">'+t('appearance')+'</div>'+
    '<div class="inp-lbl">'+t('lang')+'</div><div class="chips" style="margin-bottom:16px">'+langChips+'</div>'+
    '<div class="inp-lbl">'+t('themes')+'</div><div style="font-size:11px;color:var(--t3);margin-bottom:7px">深色 / 浅色 / 跟随系统</div>'+swatches+
    '<div style="margin-top:16px"><div class="inp-lbl">'+t('wp')+'</div>'+
    '<div style="display:flex;gap:7px;margin-top:5px"><button class="btn btn-g" style="flex:1" onclick="pickWallpaper()">'+ic('img',13)+' '+t('pickFromAlbum')+'</button><button class="btn btn-g" style="flex:1" onclick="clearWallpaper()">'+t('resetDefault')+'</button></div></div>');
  T['zh-CN'].appearanceDesc='主题 · 语言 · 壁纸';T['zh-TW'].appearanceDesc='主題 · 語言 · 桌布';T['en'].appearanceDesc='Theme · Language · Wallpaper';
};
window.showPeriodModal=function(){
  var pd=S.periodData;
  var preds=getPeriodPreds();
  var days=getDays();var tripStart=days.length?days[0].date:'',tripEnd=days.length?days[days.length-1].date:'';
  var conflict=periodConflict();
  var predHtml=preds.map(function(p,i){
    var end=new Date(new Date(p.start+'T00:00:00').getTime()+p.days*86400000);
    var overlap=tripStart&&tripEnd&&new Date(p.start)<=new Date(tripEnd+'T23:59:59')&&end>=new Date(tripStart);
    return '<div class="lr" style="cursor:default;'+(overlap?'border-left:2px solid var(--red)':'')+'"><span class="lr-lbl">'+(S.lang==='en'?'Cycle '+(i+1):'第'+(i+1)+'次')+'</span><span class="lr-val" style="'+(overlap?'color:var(--red)':'')+'">'+p.start+' – '+end.toISOString().split('T')[0]+'</span></div>';
  }).join('');
  var recordList=pd.records.slice(-3).map(function(r,i){return '<div class="lr" style="cursor:default"><span class="lr-lbl">'+r+'</span><div class="nbtn" style="width:24px;height:24px" onclick="removePeriodRecord('+i+')">'+ic('trash',10)+'</div></div>';}).join('');
  showModal('<div class="sh"></div><div class="sheet-title">'+t('period')+'</div>'+
    (conflict?'<div class="period-warning" style="margin-bottom:13px">'+ic('bell',12)+' '+t('periodConflict')+'</div>':'')+
    (predHtml?'<div class="list" style="margin-bottom:13px">'+predHtml+'</div>':'')+
    '<div class="inp-lbl">'+t('periodLastDate')+'</div><input class="inp" id="period-date" type="date" style="margin-bottom:9px">'+
    '<div style="display:flex;gap:7px;margin-bottom:13px"><div style="flex:1"><div class="inp-lbl">'+t('periodCycleLen')+'</div><input class="inp" id="period-cycle" type="number" value="'+(pd.cycleLen||28)+'"></div><div style="flex:1"><div class="inp-lbl">'+t('periodDuration')+'</div><input class="inp" id="period-dur" type="number" value="'+(pd.duration||5)+'"></div></div>'+
    (recordList?'<div class="list" style="margin-bottom:13px">'+recordList+'</div>':'')+
    '<button class="btn btn-p btn-full" onclick="addPeriodRecord()">'+t('periodAdd')+'</button>');
};
function getPeriodPreds(){var pd=S.periodData;if(!pd.records||!pd.records.length)return [];var last=new Date(pd.records[pd.records.length-1]+'T00:00:00'),cl=pd.cycleLen||28,dur=pd.duration||5,r=[];for(var i=0;i<3;i++){r.push({start:new Date(last.getTime()+(i+1)*cl*86400000).toISOString().split('T')[0],days:dur});}return r;}
window.addPeriodRecord=function(){var d=$('#period-date')&&$('#period-date').value,cy=parseInt($('#period-cycle')&&$('#period-cycle').value)||28,du=parseInt($('#period-dur')&&$('#period-dur').value)||5;if(!d){toast('请选择日期');return;}S.periodData.records.push(d);S.periodData.records.sort();S.periodData.cycleLen=cy;S.periodData.duration=du;localStorage.setItem('periodData',JSON.stringify(S.periodData));closeModal();setTimeout(showPeriodModal,200);};
window.removePeriodRecord=function(i){S.periodData.records.splice(i,1);localStorage.setItem('periodData',JSON.stringify(S.periodData));closeModal();setTimeout(showPeriodModal,200);};
window.pickWallpaper=function(){var inp=document.createElement('input');inp.type='file';inp.accept='image/*';inp.onchange=function(){var f=inp.files[0];if(!f)return;var rd=new FileReader();rd.onload=function(e){try{localStorage.setItem('wallpaper',e.target.result);}catch(err){toast(t('imgTooLarge'));return;}applyWallpaper();closeModal();toast(t('wallUpdated'));};rd.readAsDataURL(f);};inp.click();};
window.clearWallpaper=function(){localStorage.removeItem('wallpaper');applyWallpaper();toast(t('wallReset'));};
window.confirmLeave=function(){showModal('<div class="sh"></div><div class="sheet-title">'+t('confirmLeaveTitle')+'</div><div style="font-size:13px;color:var(--t2);margin-bottom:16px">'+t('confirmLeaveMsg')+'</div><button class="btn btn-d btn-full" onclick="leaveTrip()" style="margin-bottom:7px">'+t('confirmLeaveBtn')+'</button><button class="btn btn-g btn-full" onclick="closeModal()">'+t('cancel')+'</button>');};
window.leaveTrip=function(){S.unsubs.forEach(function(u){u();});S.unsubs=[];['tripCode','memberId','memberName'].forEach(function(k){localStorage.removeItem(k);});S.tripCode=null;S.memberId=null;S.memberName=null;S.trip=null;S.members={};S.expenses=[];S.chatHistory=[];closeModal();var af=document.getElementById('gfab-add');if(af)af.remove();var mf=document.getElementById('gfab-mic');if(mf)mf.remove();renderApp();};

// ── INIT ──────────────────────────────────────────────
async function init(){
  if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(function(e){console.warn('[SW]',e);});
  var ci=localStorage.getItem('customAppIcons');if(ci){try{S.customAppIcons=JSON.parse(ci);}catch(e){}}
  window.applyTheme(S.theme);
  applyWallpaper();
  if(S.tripCode&&S.memberId){
    showLoad();await fbLoad(S.tripCode);
    try{S.journal=JSON.parse(localStorage.getItem('journal_'+S.tripCode)||'[]');}catch(e){S.journal=[];}
    hideLoad();
  }
  renderApp();
  requestGeoPermission();
  if(S.baseCurrency){var fxTs=S.fxDate?new Date(S.fxDate).getTime():0;if(Date.now()-fxTs>4*3600*1000)fetchRates().then(function(){if(S.tab==='home')renderHome();});}
  if('Notification' in window&&localStorage.getItem('notifsEnabled')!=='false'){if(Notification.permission==='default')Notification.requestPermission();}
}
// Add missing T keys
T['zh-CN'].appearanceDesc='主题 · 语言 · 壁纸';
T['zh-TW'].appearanceDesc='主題 · 語言 · 桌布';
T['en'].appearanceDesc='Theme · Language · Wallpaper';
T['zh-CN'].geoObtained='已获取';T['zh-TW'].geoObtained='已獲取';T['en'].geoObtained='Obtained';
T['zh-CN'].geoNotObtained='未获取';T['zh-TW'].geoNotObtained='未獲取';T['en'].geoNotObtained='Not obtained';
T['zh-CN'].confirmClearChat='确认清除？';T['zh-TW'].confirmClearChat='確認清除？';T['en'].confirmClearChat='Clear all?';
T['zh-CN'].confirmClearChatSub='不可撤销';T['zh-TW'].confirmClearChatSub='不可撤銷';T['en'].confirmClearChatSub='Cannot be undone';
T['zh-CN'].clearChatConfirmBtn='清除';T['zh-TW'].clearChatConfirmBtn='清除';T['en'].clearChatConfirmBtn='Clear';
init();