/* ── STORY CARD ── */
const STAT_DEFS = [
  { key:'distance',        label:'Distance',       fmt: a => fmtD(a.distance||0),                       unit:'' },
  { key:'moving_time',     label:'Moving Time',    fmt: a => fmtT(a.moving_time||0),                    unit:'' },
  { key:'average_speed',   label:'Avg Speed',      fmt: a => kmh(a.average_speed||0)+' km/h',           unit:'' },
  { key:'max_speed',       label:'Max Speed',      fmt: a => kmh(a.max_speed||0)+' km/h',               unit:'' },
  { key:'average_heartrate',label:'Avg Heart Rate',fmt: a => a.average_heartrate ? Math.round(a.average_heartrate)+' bpm' : '—', unit:'' },
  { key:'max_heartrate',   label:'Max Heart Rate', fmt: a => a.max_heartrate ? Math.round(a.max_heartrate)+' bpm' : '—',         unit:'' },
  { key:'average_cadence', label:'Avg Cadence',    fmt: a => a.average_cadence ? Math.round(a.average_cadence)+' rpm' : '—',     unit:'' },
  { key:'average_watts',   label:'Avg Power',      fmt: a => a.average_watts ? Math.round(a.average_watts)+' W' : '—',           unit:'' },
  { key:'total_elevation_gain', label:'Elevation', fmt: a => Math.round(a.total_elevation_gain||0)+' m', unit:'' },
  { key:'kilojoules',      label:'Energy',         fmt: a => a.kilojoules ? Math.round(a.kilojoules)+' kJ' : '—',                unit:'' },
  { key:'calories',        label:'Calories',       fmt: a => a.calories ? Math.round(a.calories)+' kcal' : '—',                   unit:'' },
  { key:'suffer_score',    label:'Suffer Score',   fmt: a => a.suffer_score || '—',                     unit:'' },
  { key:'achievement_count',label:'Achievements',  fmt: a => a.achievement_count || 0,                  unit:'' },
];

let checkedStats = new Set(['distance','moving_time','average_speed','max_speed','total_elevation_gain','average_heartrate']);
let activeScheme = 'transp';
let customAccent = null; // override accent color
let activeLayout = 'strip';
let hideTitle = false, hideDate = false, hideRoute = false, hideLogo = false;
let storyBgImage = null; // uploaded background image

const SCHEMES = {
  transp:   { card:'transparent', text:'#ffffff', muted:'rgba(255,255,255,0.55)', icon:'rgba(255,255,255,0.75)', div:'rgba(255,255,255,0.15)', accent:'#FC4C02', bg:'transparent' },
  white:    { card:'rgba(255,255,255,0.97)', text:'#111',    muted:'#999',   icon:'#555',    div:'#ebebeb', accent:'#FC4C02', bg:'transparent' },
  dark:     { card:'rgba(18,18,18,0.97)',    text:'#f0f0f0', muted:'#555',   icon:'#aaa',    div:'#282828', accent:'#FC4C02', bg:'transparent' },
  orange:   { card:'rgba(252,76,2,0.97)',    text:'#fff',    muted:'rgba(255,255,255,.6)', icon:'#fff', div:'rgba(255,255,255,.15)', accent:'#fff', bg:'transparent' },
  black:    { card:'rgba(5,5,5,0.97)',       text:'#fff',    muted:'#444',   icon:'#777',    div:'#1a1a1a', accent:'#FC4C02', bg:'transparent' },
  night:    { card:'rgba(10,12,28,0.97)',    text:'#dde2ff', muted:'#4a5580',icon:'#6677bb', div:'#181d3a', accent:'#7c8fff', bg:'transparent' },
  forest:   { card:'rgba(10,22,10,0.97)',    text:'#cce8cc', muted:'#4a6a4a',icon:'#5a8a5a', div:'#162a16', accent:'#5aaa5a', bg:'transparent' },
  slate:    { card:'rgba(14,20,32,0.97)',    text:'#dce8ff', muted:'#4a5a7a',icon:'#6070a0', div:'#1a2438', accent:'#64a0ff', bg:'transparent' },
  gold:     { card:'linear-gradient(160deg,#1a1200,#3d2e00)', text:'#ffe87a', muted:'rgba(255,220,80,0.6)', icon:'#ffd700', div:'rgba(255,215,0,0.15)', accent:'#ffd700', bg:'linear-gradient(160deg,#1a1200,#3d2e00)' },
  silver:   { card:'linear-gradient(160deg,#141414,#2a2a2a)', text:'#e8e8f0', muted:'rgba(200,200,220,0.6)', icon:'#c0c0d8', div:'rgba(180,180,200,0.15)', accent:'#c0c0c0', bg:'linear-gradient(160deg,#141414,#2a2a2a)' },
  bronze:   { card:'linear-gradient(160deg,#1e0d00,#3a1a00)', text:'#f0c070', muted:'rgba(200,140,60,0.65)', icon:'#cd7f32', div:'rgba(205,127,50,0.15)', accent:'#cd7f32', bg:'linear-gradient(160deg,#1e0d00,#3a1a00)' },
  rosegold: { card:'linear-gradient(160deg,#1e0e10,#3a1820)', text:'#ffd4d8', muted:'rgba(255,180,185,0.6)', icon:'#f4a7b0', div:'rgba(244,167,176,0.15)', accent:'#e8818a', bg:'linear-gradient(160deg,#1e0e10,#3a1820)' },
  emerald:  { card:'linear-gradient(160deg,#001a0d,#003320)', text:'#a0ffcc', muted:'rgba(80,200,130,0.65)', icon:'#00a86b', div:'rgba(0,168,107,0.15)', accent:'#00cc80', bg:'linear-gradient(160deg,#001a0d,#003320)' },
  sapphire: { card:'linear-gradient(160deg,#000d2e,#001a5c)', text:'#a0c4ff', muted:'rgba(80,140,255,0.65)', icon:'#4080ff', div:'rgba(64,128,255,0.15)', accent:'#4096ff', bg:'linear-gradient(160deg,#000d2e,#001a5c)' },
};

/* ── icon ── */
const STAT_ICONS={distance:'distance',moving_time:'time',average_speed:'speed',max_speed:'speed',average_heartrate:'hr',max_heartrate:'hr',average_cadence:'cadence',average_watts:'power',total_elevation_gain:'elev',kilojoules:'power',calories:'fire',suffer_score:'hr',achievement_count:'star'};

/* ── get resolved scheme ── */
function getScheme(){
  const s={...SCHEMES[activeScheme]||SCHEMES.transp};
  if(customAccent){s.accent=customAccent;}
  return s;
}

/* ── stat value helper ── */
function statVal(s,act){const v=String(s.fmt(act));const p=v.split(' ');return{num:p[0],unit:p.slice(1).join(' ')};}

/* ── 25 LAYOUTS ── */
const LAYOUTS=[
  {id:'strip',    name:'Strip'},
  {id:'grid',     name:'Grid'},
  {id:'hero',     name:'Hero'},
  {id:'map',      name:'Map'},
  {id:'minimal',  name:'Minimal'},
  {id:'split',    name:'Split'},
  {id:'stacked',  name:'Stacked'},
  {id:'cinema',   name:'Cinema'},
  {id:'neon',     name:'Neon'},
  {id:'sport',    name:'Sport'},
  {id:'gradient', name:'Gradient'},
  {id:'badge',    name:'Badge'},
  {id:'tiles',    name:'Tiles'},
  {id:'ink',      name:'Ink'},
  {id:'nightrun', name:'Night Run'},
  {id:'explorer', name:'Explorer'},
  {id:'topo',     name:'Topo'},
  {id:'graphic',  name:'Graphic'},
  {id:'field',    name:'Field'},
];
