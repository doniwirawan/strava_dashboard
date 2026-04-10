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
let activeLayout = 'strip';
let hideTitle = false, hideDate = false, hideRoute = false;
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

/* ═══════════════════════════════════════════
   STORY CARD — 25 layouts, custom colors, map
   ═══════════════════════════════════════════ */


function drawRoute(ctx, pts, x, y, w, h, color, lw) {
  if(hideRoute) return;
  if(!pts||pts.length<2) return;
  const lats=pts.map(p=>p[0]),lngs=pts.map(p=>p[1]);
  const minLat=Math.min(...lats),maxLat=Math.max(...lats);
  const minLng=Math.min(...lngs),maxLng=Math.max(...lngs);
  const latSpan=maxLat-minLat||0.001, lngSpan=maxLng-minLng||0.001;
  const pad=0.08;
  // preserve aspect ratio — use same scale for lat and lng
  const scale=Math.min((w*(1-pad*2))/lngSpan,(h*(1-pad*2))/latSpan);
  const drawW=lngSpan*scale,drawH=latSpan*scale;
  const ox=x+(w-drawW)/2, oy=y+(h-drawH)/2;
  const toX=lng=>ox+(lng-minLng)*scale;
  const toY=lat=>oy+(maxLat-lat)*scale;
  ctx.beginPath();
  pts.forEach((p,i)=>i===0?ctx.moveTo(toX(p[1]),toY(p[0])):ctx.lineTo(toX(p[1]),toY(p[0])));
  ctx.strokeStyle=color; ctx.lineWidth=lw; ctx.lineCap='round'; ctx.lineJoin='round';
  ctx.stroke();
  const s=pts[0], e=pts[pts.length-1];
  ctx.fillStyle=color;
  ctx.beginPath(); ctx.arc(toX(s[1]),toY(s[0]),lw*2.5,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(toX(e[1]),toY(e[0]),lw*2.5,0,Math.PI*2); ctx.fill();
}

/* ── icon ── */
const STAT_ICONS={distance:'distance',moving_time:'time',average_speed:'speed',max_speed:'speed',average_heartrate:'hr',max_heartrate:'hr',average_cadence:'cadence',average_watts:'power',total_elevation_gain:'elev',kilojoules:'power',calories:'fire',suffer_score:'hr',achievement_count:'star'};

function drawIcon(ctx,type,cx,cy,s,col){
  ctx.save(); ctx.strokeStyle=col; ctx.fillStyle=col;
  ctx.lineWidth=s*.08; ctx.lineCap='round'; ctx.lineJoin='round';
  switch(type){
    case 'distance':
      ctx.beginPath();ctx.arc(cx-s*.18,cy-s*.2,s*.18,0,Math.PI*2);ctx.stroke();
      ctx.beginPath();ctx.arc(cx-s*.18,cy-s*.2,s*.07,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.arc(cx+s*.18,cy+s*.2,s*.1,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.moveTo(cx-s*.18,cy-.02*s);ctx.bezierCurveTo(cx-s*.18,cy+s*.15,cx+s*.18,cy+s*.05,cx+s*.18,cy+s*.2);ctx.stroke();break;
    case 'speed':
      ctx.beginPath();ctx.arc(cx,cy+s*.05,s*.36,Math.PI,0);ctx.stroke();
      [0,45,90,135,180].forEach(a=>{const r=a*Math.PI/180;ctx.beginPath();ctx.moveTo(cx-s*.36*Math.cos(r),cy+s*.05-s*.36*Math.sin(r));ctx.lineTo(cx-s*.27*Math.cos(r),cy+s*.05-s*.27*Math.sin(r));ctx.stroke();});
      ctx.beginPath();ctx.moveTo(cx,cy+s*.05);ctx.lineTo(cx+s*.28*Math.cos(-0.9),cy+s*.05+s*.28*Math.sin(-0.9));ctx.stroke();
      ctx.beginPath();ctx.arc(cx,cy+s*.05,s*.06,0,Math.PI*2);ctx.fill();break;
    case 'elev':
      ctx.beginPath();ctx.moveTo(cx-s*.42,cy+s*.28);ctx.lineTo(cx-s*.1,cy-s*.28);ctx.lineTo(cx+s*.2,cy+s*.28);ctx.stroke();
      ctx.beginPath();ctx.moveTo(cx,cy+s*.28);ctx.lineTo(cx+s*.28,cy-s*.1);ctx.lineTo(cx+s*.44,cy+s*.28);ctx.stroke();break;
    case 'time':
      ctx.beginPath();ctx.arc(cx,cy,s*.36,0,Math.PI*2);ctx.stroke();
      ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx,cy-s*.22);ctx.stroke();
      ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+s*.16,cy+s*.1);ctx.stroke();break;
    case 'hr':
      ctx.beginPath();ctx.moveTo(cx,cy+s*.28);ctx.bezierCurveTo(cx-s*.5,cy,cx-s*.5,cy-s*.36,cx,cy-s*.16);ctx.bezierCurveTo(cx+s*.5,cy-s*.36,cx+s*.5,cy,cx,cy+s*.28);ctx.stroke();break;
    case 'cadence':
      ctx.beginPath();ctx.arc(cx,cy,s*.3,0,Math.PI*2);ctx.stroke();
      ctx.beginPath();ctx.arc(cx,cy,s*.09,0,Math.PI*2);ctx.fill();
      for(let i=0;i<8;i++){const a=i*Math.PI/4;ctx.beginPath();ctx.moveTo(cx+s*.3*Math.cos(a),cy+s*.3*Math.sin(a));ctx.lineTo(cx+s*.42*Math.cos(a),cy+s*.42*Math.sin(a));ctx.stroke();}break;
    case 'power':
      ctx.beginPath();ctx.moveTo(cx+s*.06,cy-s*.38);ctx.lineTo(cx-s*.1,cy+s*.04);ctx.lineTo(cx+s*.06,cy+s*.04);ctx.lineTo(cx-s*.06,cy+s*.38);ctx.lineTo(cx+s*.2,cy-s*.04);ctx.lineTo(cx+s*.06,cy-s*.04);ctx.closePath();ctx.stroke();break;
    case 'star':
      for(let i=0;i<5;i++){const a=i*Math.PI*2/5-Math.PI/2,b=a+Math.PI/5;ctx.beginPath();ctx.moveTo(cx+s*.36*Math.cos(a),cy+s*.36*Math.sin(a));ctx.lineTo(cx+s*.16*Math.cos(b),cy+s*.16*Math.sin(b));ctx.stroke();}break;
    case 'fire':
      ctx.beginPath();
      ctx.moveTo(cx,cy+s*.38);
      ctx.bezierCurveTo(cx-s*.36,cy+s*.1,cx-s*.22,cy-s*.18,cx,cy-s*.1);
      ctx.bezierCurveTo(cx+s*.06,cy-s*.32,cx-s*.06,cy-s*.38,cx,cy-s*.38);
      ctx.bezierCurveTo(cx+s*.2,cy-s*.2,cx+s*.38,cy,cx+s*.28,cy+s*.2);
      ctx.bezierCurveTo(cx+s*.44,cy+s*.04,cx+s*.38,cy-s*.14,cx+s*.28,cy-s*.2);
      ctx.bezierCurveTo(cx+s*.46,cy+s*.0,cx+s*.42,cy+s*.28,cx,cy+s*.38);
      ctx.closePath();ctx.stroke();
      ctx.beginPath();ctx.arc(cx,cy+s*.18,s*.1,0,Math.PI*2);ctx.fill();break;
    default:
      ctx.beginPath();ctx.arc(cx,cy,s*.3,0,Math.PI*2);ctx.stroke();
  }
  ctx.restore();
}

/* ── get resolved scheme — always transparent ── */
function getScheme(){
  return SCHEMES.transp;
}

/* ── stat value helper ── */
function statVal(s,act){const v=String(s.fmt(act));const p=v.split(' ');return{num:p[0],unit:p.slice(1).join(' ')};}

/* ── 25 LAYOUTS ── */
const LAYOUTS=[
  {id:'strip',   name:'Strip'},
  {id:'grid',    name:'Grid'},
  {id:'hero',    name:'Hero'},
  {id:'map',     name:'Map'},
  {id:'minimal', name:'Minimal'},
  {id:'split',   name:'Split'},
  {id:'stacked', name:'Stacked'},
  {id:'cinema',  name:'Cinema'},
  {id:'neon',    name:'Neon'},
  {id:'sport',   name:'Sport'},
  {id:'gradient',name:'Gradient'},
  {id:'badge',   name:'Badge'},
  {id:'tiles',   name:'Tiles'},
  {id:'ink',     name:'Ink'},
];

function drawLayout(canvas,act,selected,sc,layout){
  const ctx=canvas.getContext('2d');
  const W=canvas.width,H=canvas.height;
  ctx.clearRect(0,0,W,H);
  ctx.letterSpacing='0px';
  const S=W/1080; // scale factor — works for both 1080px canvas and 216px thumbnails
  const P=Math.round(88*S);
  const polyline=act.map&&act.map.summary_polyline?decodePolyline(act.map.summary_polyline):null;
  const skipBg=!!(storyBgImage&&canvas.id==='storyCanvas');

  // background
  if(storyBgImage&&canvas.id==='storyCanvas'){
    // draw image with cover behaviour (maintain proportion, crop to fill)
    const iw=storyBgImage.naturalWidth,ih=storyBgImage.naturalHeight;
    const scale=Math.max(W/iw,H/ih);
    const sw=W/scale,sh=H/scale;
    const sx=(iw-sw)/2,sy=(ih-sh)/2;
    ctx.drawImage(storyBgImage,sx,sy,sw,sh,0,0,W,H);
    ctx.fillStyle='rgba(0,0,0,0.45)';ctx.fillRect(0,0,W,H);
  } else if(sc.bg&&sc.bg!=='transparent'){
    if(sc.bg.startsWith('linear-gradient')){
      const m=sc.bg.match(/linear-gradient\([^,]+,\s*([^,]+),\s*([^)]+)\)/);
      if(m){const g=ctx.createLinearGradient(0,0,W*0.6,H);g.addColorStop(0,m[1].trim());g.addColorStop(1,m[2].trim());ctx.fillStyle=g;}
      else{ctx.fillStyle='#111';} ctx.fillRect(0,0,W,H);
    } else {ctx.fillStyle=sc.bg;ctx.fillRect(0,0,W,H);}
  }

  // helpers
  const F=(sz,wt)=>`${wt||400} ${Math.round(sz*S)}px -apple-system,sans-serif`;
  const fitText=(text,maxW,baseSz,wt)=>{
    let sz=Math.round(baseSz*S);
    ctx.font=`${wt||400} ${sz}px -apple-system,sans-serif`;
    while(sz>Math.round(14*S)&&ctx.measureText(text).width>maxW){sz--;ctx.font=`${wt||700} ${sz}px -apple-system,sans-serif`;}
    return sz;
  };

  // title block: name + date · type
  function title(x,y,maxW,sz){
    let n=act.name||'Activity';
    const fs=fitText(n,maxW,sz,700);
    if(!hideTitle){
      ctx.fillStyle=sc.text;ctx.textAlign='left';ctx.letterSpacing='-0.5px';ctx.fillText(n,x,y);
    }
    if(!hideDate){
      ctx.fillStyle=sc.muted;ctx.font=F(26,400);ctx.letterSpacing='0';
      const dateY=hideTitle?y:y+Math.round(40*S);
      ctx.fillText((act.start_date?fmtDt(act.start_date):'')+' · '+(act.type||''),x,dateY);
    }
    return fs;
  }

  // stat grid: 2-col max, icon + label + big value, fully scaled
  function grid(stats,x,y,w,h,cols){
    if(!stats.length) return;
    const COLS=Math.min(stats.length,cols||2),ROWS=Math.ceil(stats.length/COLS);
    const cW=w/COLS,cH=h/ROWS;
    stats.forEach((s,i)=>{
      const col=i%COLS,row=Math.floor(i/COLS);
      const cx=x+col*cW+cW/2,cy=y+row*cH;
      const{num,unit}=statVal(s,act);
      const iconS=Math.round(42*S),lfs=Math.round(17*S);
      let vfs=Math.round(58*S);
      ctx.font=`800 ${vfs}px -apple-system,sans-serif`;
      while(vfs>Math.round(20*S)&&ctx.measureText(num+(unit?' '+unit:'')).width>cW*0.8){vfs-=Math.max(1,Math.round(2*S));ctx.font=`800 ${vfs}px -apple-system,sans-serif`;}
      drawIcon(ctx,STAT_ICONS[s.key]||'time',cx,cy+cH*0.22,iconS,sc.icon);
      ctx.fillStyle=sc.accent;ctx.font=`600 ${lfs}px -apple-system,sans-serif`;ctx.textAlign='center';ctx.letterSpacing='0.04em';
      ctx.fillText(s.label.toUpperCase(),cx,cy+cH*0.45);
      ctx.fillStyle=sc.text;ctx.font=`800 ${vfs}px -apple-system,sans-serif`;ctx.letterSpacing='-1px';
      ctx.fillText(num,cx,cy+cH*0.78);
      if(unit){ctx.fillStyle=sc.muted;ctx.font=F(vfs*0.44/S,500);ctx.letterSpacing='0';ctx.fillText(unit,cx,cy+cH*0.92);}
    });
  }

  // stat rows: label left, value right — both on same baseline
  function rows(stats,x,y,w,h){
    if(!stats.length) return;
    const rH=Math.min(Math.round(210*S),h/stats.length);
    stats.forEach((s,i)=>{
      const{num,unit}=statVal(s,act),ry=y+i*rH;
      const baseY=ry+rH*0.64;
      let vfs=Math.round(64*S);
      ctx.font=`800 ${vfs}px -apple-system,sans-serif`;
      while(vfs>Math.round(22*S)&&ctx.measureText(num+(unit?' '+unit:'')).width>w*0.55){vfs-=Math.max(1,Math.round(2*S));ctx.font=`800 ${vfs}px -apple-system,sans-serif`;}
      ctx.fillStyle=sc.muted;ctx.font=F(20,600);ctx.letterSpacing='0.05em';ctx.textAlign='left';
      ctx.fillText(s.label.toUpperCase(),x,baseY);
      ctx.fillStyle=sc.text;ctx.font=`800 ${vfs}px -apple-system,sans-serif`;ctx.letterSpacing='-1px';ctx.textAlign='right';
      ctx.fillText(num+(unit?' '+unit:''),x+w,baseY);
      ctx.letterSpacing='0px';
    });
  }

  // ── SHARED 6-COL THEME HELPER ──
  function themed6(o){
    // background
    if(!skipBg&&o.bg){ctx.fillStyle=o.bg;ctx.fillRect(0,0,W,H);}
    if(!skipBg&&o.overlay) o.overlay();
    // title
    const titleH=Math.round((hideDate?108:152)*S);
    const nm=act.name||'Activity';
    fitText(nm,W-P*2,44,700);
    ctx.fillStyle=o.headText||sc.text;ctx.textAlign='left';ctx.letterSpacing='-0.5px';
    ctx.fillText(nm,P,Math.round(96*S));
    if(!hideDate){
      ctx.fillStyle=o.headMuted||sc.muted;ctx.font=F(22,400);ctx.letterSpacing='0';
      ctx.fillText((act.start_date?fmtDt(act.start_date):'')+' · '+(act.type||''),P,Math.round(130*S));
    }
    // spatial layout: route fills everything except tiles
    const COLS=6,gap=Math.round(10*S),ROWS=Math.ceil(selected.length/COLS);
    const minTile=Math.round(130*S);
    const tilesMinH=ROWS*(minTile+gap)+Math.round(20*S);
    const routeH=Math.max(H-titleH-tilesMinH-Math.round(10*S),Math.round(280*S));
    const tilesY=titleH+routeH+Math.round(8*S);
    const tilesAvail=H-tilesY-Math.round(18*S);
    const tH=Math.min(Math.round(240*S),Math.floor((tilesAvail-gap*(ROWS-1))/Math.max(ROWS,1)));
    const tW=(W-P*2-gap*(COLS-1))/COLS;
    const r=Math.round((o.tileR!==undefined?o.tileR:10)*S);
    // route
    if(polyline&&polyline.length>1){
      if(o.routeGlow){ctx.shadowColor=o.routeCol;ctx.shadowBlur=Math.round(o.routeGlow*S);}
      if(o.routeAlpha!==undefined)ctx.globalAlpha=o.routeAlpha;
      drawRoute(ctx,polyline,P,titleH,W-P*2,routeH,o.routeCol||sc.accent,Math.round(6*S));
      ctx.globalAlpha=1;ctx.shadowBlur=0;
    }
    // tiles
    selected.forEach((s,i)=>{
      const col=i%COLS,row=Math.floor(i/COLS);
      const tx=P+col*(tW+gap),ty=tilesY+row*(tH+gap),cx=tx+tW/2;
      // bg
      ctx.beginPath();ctx.roundRect(tx,ty,tW,tH,r);
      ctx.fillStyle=typeof o.tileBg==='function'?o.tileBg(i):(o.tileBg||'rgba(255,255,255,0.06)');
      ctx.fill();
      // border
      if(o.tileBorder){
        const bc=typeof o.tileBorder==='function'?o.tileBorder(i):o.tileBorder;
        if(bc){ctx.beginPath();ctx.roundRect(tx,ty,tW,tH,r);ctx.strokeStyle=bc;ctx.lineWidth=Math.round(1.5*S);ctx.stroke();}
      }
      // left accent bar
      if(o.tileBar){
        const bc=typeof o.tileBar==='function'?o.tileBar(i):o.tileBar;
        if(bc){ctx.fillStyle=bc;ctx.fillRect(tx,ty,Math.round(3*S),tH);}
      }
      const{num,unit}=statVal(s,act),disp=num+(unit?' '+unit:'');
      const iS=Math.round(Math.min(26,tH*0.155)*S);
      const iCol=typeof o.iconCol==='function'?o.iconCol(i):(o.iconCol||sc.accent);
      const lCol=typeof o.lblCol==='function'?o.lblCol(i):(o.lblCol||sc.muted);
      const vCol=typeof o.valCol==='function'?o.valCol(i):(o.valCol||sc.text);
      drawIcon(ctx,STAT_ICONS[s.key]||'time',cx,ty+tH*0.26,iS,iCol);
      let lfs=Math.round(11*S);ctx.font=`700 ${lfs}px -apple-system,sans-serif`;
      const lbl=s.label.toUpperCase();
      while(lfs>6&&ctx.measureText(lbl).width>tW*0.9){lfs--;ctx.font=`700 ${lfs}px -apple-system,sans-serif`;}
      ctx.fillStyle=lCol;ctx.textAlign='center';ctx.letterSpacing='0.03em';ctx.fillText(lbl,cx,ty+tH*0.53);
      let vfs=Math.round(30*S);ctx.font=`800 ${vfs}px -apple-system,sans-serif`;
      while(vfs>10&&ctx.measureText(disp).width>tW*0.9){vfs--;ctx.font=`800 ${vfs}px -apple-system,sans-serif`;}
      ctx.fillStyle=vCol;ctx.letterSpacing='-0.5px';ctx.fillText(disp,cx,ty+tH*0.87);
      ctx.letterSpacing='0px';
    });
  }

  switch(layout){

    /* 1. STRIP — centered card, 2-col stat grid */
    case 'strip':{
      const COLS=Math.min(selected.length,2),ROWS=Math.ceil(selected.length/COLS);
      const cW=W-P*2,rH=Math.round(240*S);
      const hH=Math.round(180*S),cardH=hH+ROWS*rH;
      const cY=Math.round((H-cardH)/2);
      if(sc.card!=='transparent'){ctx.fillStyle=sc.card;ctx.fillRect(P,cY,cW,cardH);}
      title(P+Math.round(52*S),cY+Math.round(82*S),cW-Math.round(104*S),52);
      grid(selected,P,cY+hH,cW,ROWS*rH,COLS);
      break;
    }

    /* 2. GRID — full card, 2-col */
    case 'grid':{
      if(sc.card!=='transparent'){ctx.fillStyle=sc.card;ctx.fillRect(0,0,W,H);}
      title(P,Math.round(100*S),W-P*2,62);
      grid(selected,0,Math.round(195*S),W,H-Math.round(210*S),2);
      break;
    }

    /* 3. HERO — giant first stat, 2-col rest */
    case 'hero':{
      if(sc.card!=='transparent'){ctx.fillStyle=sc.card;ctx.fillRect(P,P,W-P*2,H-P*2);}
      title(P+Math.round(52*S),P+Math.round(78*S),W-P*2-Math.round(104*S),50);
      if(selected.length>0){
        const s=selected[0];const{num,unit}=statVal(s,act);
        ctx.fillStyle=sc.accent;ctx.font=F(32,700);ctx.textAlign='center';ctx.letterSpacing='0.12em';
        ctx.fillText(s.label.toUpperCase(),W/2,P+Math.round(240*S));
        drawIcon(ctx,STAT_ICONS[s.key]||'time',W/2,P+Math.round(315*S),Math.round(72*S),sc.accent);
        const hfs=fitText(num,W-P*4,172,900);
        ctx.fillStyle=sc.text;ctx.letterSpacing='-0.04em';ctx.textAlign='center';
        ctx.fillText(num,W/2,P+Math.round(540*S));
        if(unit){ctx.fillStyle=sc.muted;ctx.font=F(44,400);ctx.letterSpacing='0';ctx.fillText(unit,W/2,P+Math.round(598*S));}
        if(selected.length>1){
          grid(selected.slice(1),P,P+Math.round(650*S),W-P*2,H-P*2-Math.round(660*S),2);
        }
      }
      break;
    }

    /* 4. MAP — route top, stats bottom */
    case 'map':{
      const mapH=Math.round(H*0.46);
      if(sc.card!=='transparent'){ctx.fillStyle=sc.card;ctx.fillRect(0,0,W,H);}
      const routeBg=sc.card!=='transparent'?sc.card:'rgba(255,255,255,0.06)';
      if(!skipBg){ctx.fillStyle=routeBg;ctx.fillRect(0,0,W,mapH);}
      if(polyline&&polyline.length>1){
        drawRoute(ctx,polyline,P,Math.round(P*0.7),W-P*2,mapH-P*1.3,sc.accent,Math.round(6*S));
      }else{
        ctx.fillStyle=sc.muted;ctx.font=F(34,400);ctx.textAlign='center';ctx.fillText('No route data',W/2,mapH/2);
      }
      const bY=mapH+Math.round(16*S);
      title(P,bY+Math.round(72*S),W-P*2,50);
      grid(selected,0,bY+Math.round(165*S),W,H-bY-Math.round(170*S),2);
      break;
    }

    /* 5. MINIMAL — clean typography, no icons */
    case 'minimal':{
      if(sc.card!=='transparent'){ctx.fillStyle=sc.card;ctx.fillRect(0,0,W,H);}
      title(P,Math.round(130*S),W-P*2,58);
      const lY=Math.round(230*S);
      rows(selected,P,lY,W-P*2,H-lY-P);
      break;
    }

    /* 6. SPLIT — left accent panel, right stats list */
    case 'split':{
      const sX=Math.round(W*0.41);
      if(!skipBg){ctx.globalAlpha=0.72;ctx.fillStyle=sc.accent;ctx.fillRect(0,0,sX,H);ctx.globalAlpha=1;}
      if(sc.card!=='transparent'){ctx.fillStyle=sc.card;ctx.fillRect(sX,0,W-sX,H);}
      ctx.save();ctx.translate(sX/2,H/2);ctx.rotate(-Math.PI/2);
      ctx.fillStyle='rgba(255,255,255,0.16)';ctx.font=`900 ${Math.round(88*S)}px -apple-system,sans-serif`;ctx.textAlign='center';ctx.letterSpacing='-2px';
      ctx.fillText((act.type||'ACTIVITY').toUpperCase(),0,Math.round(32*S));ctx.restore();
      if(polyline&&polyline.length>1){
        drawRoute(ctx,polyline,Math.round(20*S),Math.round(H*0.28),sX-Math.round(40*S),Math.round(H*0.4),'rgba(255,255,255,0.7)',Math.round(4*S));
      }
      ctx.fillStyle='rgba(255,255,255,0.7)';ctx.font=F(25,500);ctx.textAlign='center';ctx.letterSpacing='0';
      ctx.fillText(act.start_date?fmtDt(act.start_date):'',sX/2,Math.round(H*0.88));
      const rx=sX+Math.round(50*S),rw=W-rx-Math.round(36*S);
      let nm=act.name||'Activity';
      const nfs=fitText(nm,rw,40,700);
      ctx.fillStyle=sc.text;ctx.textAlign='left';ctx.letterSpacing='-0.5px';ctx.fillText(nm,rx,Math.round(96*S));
      ctx.fillStyle=sc.muted;ctx.font=F(24,400);ctx.letterSpacing='0';ctx.fillText(act.type||'',rx,Math.round(132*S));
      rows(selected,rx,Math.round(162*S),rw,H-Math.round(174*S));
      break;
    }

    /* 7. STACKED — full-width rows with icon */
    case 'stacked':{
      if(sc.card!=='transparent'){ctx.fillStyle=sc.card;ctx.fillRect(P,P,W-P*2,H-P*2);}
      title(P+Math.round(50*S),P+Math.round(74*S),W-P*2-Math.round(100*S),50);
      const lY=P+Math.round(164*S);
      const available=H-P*2-Math.round(164*S);
      const rH=Math.min(Math.round(188*S),available/Math.max(selected.length,1));
      selected.forEach((s,i)=>{
        const{num,unit}=statVal(s,act),ry=lY+i*rH;
        const iconS=Math.round(36*S);
        drawIcon(ctx,STAT_ICONS[s.key]||'time',P+iconS*1.4,ry+rH/2,iconS,sc.icon);
        ctx.fillStyle=sc.muted;ctx.font=F(20,600);ctx.letterSpacing='0.05em';ctx.textAlign='left';
        ctx.fillText(s.label.toUpperCase(),P+iconS*2.8,ry+rH/2-Math.round(8*S));
        let vfs=Math.round(56*S);
        const maxVW=(W-P*2)*0.36;
        ctx.font=`800 ${vfs}px -apple-system,sans-serif`;
        while(vfs>Math.round(20*S)&&ctx.measureText(num).width>maxVW){vfs-=Math.max(1,Math.round(2*S));ctx.font=`800 ${vfs}px -apple-system,sans-serif`;}
        ctx.fillStyle=sc.accent;ctx.letterSpacing='-1px';ctx.textAlign='right';
        ctx.fillText(num,W-P-Math.round(80*S),ry+rH/2+Math.round(22*S));
        if(unit){ctx.fillStyle=sc.muted;ctx.font=F(22,500);ctx.letterSpacing='0';ctx.fillText(unit,W-P-Math.round(38*S),ry+rH/2+Math.round(20*S));}
      });
      break;
    }

    /* 8. CINEMA — dark borders top/bottom, center card */
    case 'cinema':{
      if(sc.card!=='transparent'){ctx.fillStyle='#000';ctx.fillRect(0,0,W,H);}
      const cY=Math.round(H*0.19),cH=Math.round(H*0.62);
      if(sc.card!=='transparent'){ctx.fillStyle=sc.card;ctx.fillRect(0,cY,W,cH);}
      title(P,cY+Math.round(72*S),W-P*2,50);
      grid(selected,0,cY+Math.round(160*S),W,cH-Math.round(168*S),2);
      ctx.fillStyle='rgba(255,255,255,0.18)';ctx.font=F(26,400);ctx.textAlign='center';ctx.letterSpacing='0.12em';
      ctx.fillText('STRAVA · '+new Date().getFullYear(),W/2,cY-Math.round(32*S));ctx.letterSpacing='0px';
      if(polyline&&polyline.length>1){
        drawRoute(ctx,polyline,P,cY+cH+Math.round(32*S),W-P*2,H-(cY+cH)-Math.round(48*S),sc.accent,Math.round(4*S));
      }
      break;
    }

    /* 9. NEON — dark glow */
    case 'neon':{
      if(sc.card!=='transparent'){ctx.fillStyle=sc.card==='rgba(18,18,18,0.97)'||sc.card==='rgba(5,5,5,0.97)'||sc.card==='rgba(10,12,28,0.97)'?sc.card:'#050510';ctx.fillRect(0,0,W,H);}
      const grd=ctx.createLinearGradient(0,0,W,H);
      grd.addColorStop(0,sc.accent+'22');grd.addColorStop(.5,sc.accent+'30');grd.addColorStop(1,sc.accent+'08');
      if(!skipBg){ctx.fillStyle=grd;ctx.fillRect(0,0,W,H);}
      let nm2=act.name||'Activity';
      const nfs2=fitText(nm2,W-P*2,48,700);
      ctx.fillStyle='rgba(255,255,255,0.92)';ctx.textAlign='left';ctx.letterSpacing='-0.5px';ctx.fillText(nm2,P,Math.round(96*S));
      ctx.fillStyle='rgba(255,255,255,0.3)';ctx.font=F(28,400);ctx.letterSpacing='0';
      ctx.fillText((act.start_date?fmtDt(act.start_date):'')+' · '+(act.type||''),P,Math.round(138*S));
      let statsY=Math.round(185*S);
      if(polyline&&polyline.length>1){
        ctx.shadowColor=sc.accent;ctx.shadowBlur=Math.round(14*S);
        const routeH=Math.round(480*S);
        drawRoute(ctx,polyline,P,statsY,W-P*2,routeH,sc.accent,Math.round(5*S));
        ctx.shadowBlur=0;statsY+=routeH+Math.round(40*S);
      }
      const COLS=Math.min(selected.length,2),ROWS=Math.ceil(selected.length/COLS);
      const cW=(W-P*2)/COLS,cH=(H-statsY-Math.round(30*S))/ROWS;
      selected.forEach((s,i)=>{
        const col=i%COLS,row=Math.floor(i/COLS);
        const cx=P+col*cW+cW/2,cy=statsY+row*cH;
        const{num,unit}=statVal(s,act);
        const iconS=Math.round(44*S);
        ctx.shadowColor=sc.accent;ctx.shadowBlur=Math.round(7*S);
        drawIcon(ctx,STAT_ICONS[s.key]||'time',cx,cy+cH*0.24,iconS,sc.accent);
        ctx.shadowBlur=0;
        ctx.fillStyle=sc.accent;ctx.font=F(18,600);ctx.textAlign='center';ctx.letterSpacing='0.06em';
        ctx.fillText(s.label.toUpperCase(),cx,cy+cH*0.52);
        let vfs=Math.round(Math.min(66,cH*0.32)*S);
        ctx.font=`800 ${vfs}px -apple-system,sans-serif`;
        while(vfs>Math.round(18*S)&&ctx.measureText(num+(unit?' '+unit:'')).width>cW*0.8){vfs-=Math.max(1,Math.round(2*S));ctx.font=`800 ${vfs}px -apple-system,sans-serif`;}
        ctx.fillStyle='rgba(255,255,255,0.95)';ctx.letterSpacing='-1px';
        ctx.fillText(num+(unit?' '+unit:''),cx,cy+cH*0.86);ctx.letterSpacing='0px';
      });
      break;
    }

    /* 10. SPORT — diagonal accent, right stats list */
    case 'sport':{
      if(sc.card!=='transparent'){ctx.fillStyle=sc.card;ctx.fillRect(0,0,W,H);}
      ctx.save();ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(W*0.55,0);ctx.lineTo(W*0.38,H);ctx.lineTo(0,H);ctx.closePath();
      ctx.globalAlpha=0.72;ctx.fillStyle=sc.accent;ctx.fill();ctx.globalAlpha=1;ctx.restore();
      ctx.save();ctx.translate(W*0.18,H/2);ctx.rotate(-Math.PI/2);
      ctx.fillStyle='rgba(255,255,255,0.13)';ctx.font=`900 ${Math.round(115*S)}px -apple-system,sans-serif`;ctx.textAlign='center';ctx.letterSpacing='-2px';
      ctx.fillText((act.type||'SPORT').toUpperCase(),0,Math.round(42*S));ctx.restore();
      if(polyline&&polyline.length>1){
        ctx.globalAlpha=0.25;drawRoute(ctx,polyline,Math.round(18*S),Math.round(H*0.1),W*0.37-Math.round(36*S),Math.round(H*0.8),'#fff',Math.round(4*S));ctx.globalAlpha=1;
      }
      const rx=W*0.42,rw=W-rx-P;
      let nm3=act.name||'Activity';
      const nfs3=fitText(nm3,rw,42,700);
      ctx.fillStyle=sc.text;ctx.textAlign='left';ctx.letterSpacing='-0.5px';ctx.fillText(nm3,rx,Math.round(106*S));
      ctx.fillStyle=sc.muted;ctx.font=F(24,400);ctx.letterSpacing='0';
      ctx.fillText(act.start_date?fmtDt(act.start_date):'',rx,Math.round(142*S));
      rows(selected,rx,Math.round(165*S),rw,H-Math.round(180*S));
      break;
    }

    /* 11. GRADIENT — vertical gradient BG, stat grid centered */
    case 'gradient':{
      if(!skipBg){
        const g=ctx.createLinearGradient(0,0,0,H);
        if(sc.card!=='transparent'){g.addColorStop(0,sc.card);g.addColorStop(1,sc.accent+'cc');}
        else{g.addColorStop(0,sc.accent+'44');g.addColorStop(1,sc.accent+'cc');}
        ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
        const lineY=Math.round(H*0.65);
        ctx.globalAlpha=0.15;ctx.fillStyle=sc.accent;ctx.fillRect(0,lineY,W,H-lineY);ctx.globalAlpha=1;
      }
      title(P,Math.round(110*S),W-P*2,56);
      const sY=Math.round(220*S),sH=H-Math.round(240*S);
      if(polyline&&polyline.length>1){
        drawRoute(ctx,polyline,P,sY,W-P*2,Math.round(380*S),sc.text==='#111'?'rgba(0,0,0,0.5)':'rgba(255,255,255,0.4)',Math.round(5*S));
        grid(selected,0,sY+Math.round(410*S),W,H-sY-Math.round(420*S),2);
      } else {
        grid(selected,0,sY,W,sH,2);
      }
      break;
    }

    /* 12. BADGE — stats as rounded pill badges */
    case 'badge':{
      if(sc.card!=='transparent'){ctx.fillStyle=sc.card;ctx.fillRect(0,0,W,H);}
      title(P,Math.round(120*S),W-P*2,56);
      const bpad=Math.round(28*S),bh=Math.round(130*S),bgap=Math.round(22*S);
      const bw=(W-P*2-bgap)/2;
      selected.forEach((s,i)=>{
        const col=i%2,row=Math.floor(i/2);
        const bx=P+col*(bw+bgap),by=Math.round(240*S)+row*(bh+bgap);
        const r=Math.round(18*S);
        ctx.beginPath();ctx.roundRect(bx,by,bw,bh,r);
        ctx.fillStyle=i%3===0?sc.accent+'22':sc.card==='transparent'?'rgba(255,255,255,0.08)':sc.div;
        ctx.fill();
        ctx.strokeStyle=i%3===0?sc.accent+'66':sc.div;ctx.lineWidth=Math.round(1.5*S);ctx.stroke();
        const{num,unit}=statVal(s,act);
        const iconS2=Math.round(28*S);
        drawIcon(ctx,STAT_ICONS[s.key]||'time',bx+bpad,by+bh/2,iconS2,i%3===0?sc.accent:sc.icon);
        ctx.fillStyle=sc.muted;ctx.font=F(17,600);ctx.letterSpacing='0.04em';ctx.textAlign='left';
        ctx.fillText(s.label.toUpperCase(),bx+bpad*2.2,by+bh*0.38);
        let vfs2=Math.round(46*S);ctx.font=`800 ${vfs2}px -apple-system,sans-serif`;
        while(vfs2>Math.round(18*S)&&ctx.measureText(num+(unit?' '+unit:'')).width>bw-bpad*2.5){vfs2-=Math.max(1,Math.round(2*S));ctx.font=`800 ${vfs2}px -apple-system,sans-serif`;}
        ctx.fillStyle=sc.text;ctx.letterSpacing='-0.5px';
        ctx.fillText(num+(unit?' '+unit:''),bx+bpad*2.2,by+bh*0.76);
      });
      break;
    }

    /* 13. TILES — 5 or 6 compact stat tiles per row */
    case 'tiles':{
      if(sc.card!=='transparent'){ctx.fillStyle=sc.card;ctx.fillRect(0,0,W,H);}
      title(P,Math.round(118*S),W-P*2,52);

      const COLS=selected.length>5?6:5;
      const gap=Math.round(10*S);
      const tW=(W-P*2-gap*(COLS-1))/COLS;

      // optional route strip at bottom
      const hasRoute=polyline&&polyline.length>1;
      const routeH=hasRoute?Math.round(340*S):0;
      const routeY=H-routeH-Math.round(30*S);

      // distribute tiles in available height
      const tilesAreaH=routeH>0?routeY-Math.round(230*S)-Math.round(20*S):H-Math.round(230*S)-Math.round(30*S);
      const ROWS=Math.ceil(selected.length/COLS);
      const tH=Math.min(Math.round(260*S),Math.floor((tilesAreaH-gap*(ROWS-1))/ROWS));
      const startY=Math.round(220*S);

      selected.forEach((s,i)=>{
        const col=i%COLS,row=Math.floor(i/COLS);
        const tx=P+col*(tW+gap),ty=startY+row*(tH+gap);
        const cx=tx+tW/2;
        const r=Math.round(14*S);

        // tile background
        ctx.beginPath();ctx.roundRect(tx,ty,tW,tH,r);
        const isAccent=i%5===0;
        ctx.fillStyle=isAccent?(sc.accent+'28'):(sc.card==='transparent'?'rgba(255,255,255,0.07)':sc.div);
        ctx.fill();
        if(isAccent){ctx.strokeStyle=sc.accent+'55';ctx.lineWidth=Math.round(1.5*S);ctx.stroke();}

        const{num,unit}=statVal(s,act);

        // icon — top portion of tile
        const iconS=Math.round(Math.min(26,tH*0.15)*S);
        drawIcon(ctx,STAT_ICONS[s.key]||'time',cx,ty+tH*0.26,iconS,isAccent?sc.accent:sc.icon);

        // label — middle
        let lfs=Math.round(13*S);
        ctx.font=`700 ${lfs}px -apple-system,sans-serif`;
        const lbl=s.label.toUpperCase();
        while(lfs>Math.round(7*S)&&ctx.measureText(lbl).width>tW*0.9){lfs--;ctx.font=`700 ${lfs}px -apple-system,sans-serif`;}
        ctx.fillStyle=isAccent?sc.accent:sc.muted;ctx.textAlign='center';ctx.letterSpacing='0.03em';
        ctx.fillText(lbl,cx,ty+tH*0.54);

        // value — bottom
        const disp=num+(unit?' '+unit:'');
        let vfs=Math.round(32*S);
        ctx.font=`800 ${vfs}px -apple-system,sans-serif`;
        while(vfs>Math.round(12*S)&&ctx.measureText(disp).width>tW*0.92){vfs--;ctx.font=`800 ${vfs}px -apple-system,sans-serif`;}
        ctx.fillStyle=sc.text;ctx.letterSpacing='-0.5px';
        ctx.fillText(disp,cx,ty+tH*0.86);
        ctx.letterSpacing='0px';
      });

      // route strip at bottom
      if(hasRoute){
        ctx.globalAlpha=0.35;
        drawRoute(ctx,polyline,P,routeY,W-P*2,routeH-Math.round(10*S),sc.accent,Math.round(4*S));
        ctx.globalAlpha=1;
      }
      break;
    }

    /* 14. INK — high contrast B&W with bold type */
    case 'ink':{
      const bg=sc.card==='transparent'?'transparent':(sc.card.includes('255,255,255')?'#fff':'#0a0a0a');
      const fg=bg==='#fff'?'#0a0a0a':bg==='transparent'?sc.text:'#f0f0f0';
      const mg=bg==='#fff'?'#888':bg==='transparent'?sc.muted:'#444';
      if(bg!=='transparent'){ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);}
      // big type name
      let nm=act.name||'Activity';
      ctx.fillStyle=fg;ctx.textAlign='left';ctx.letterSpacing='-2px';
      const nfs=fitText(nm,W-P*2,80,900);ctx.fillText(nm,P,Math.round(120*S));
      if(!hideDate){
        ctx.fillStyle=mg;ctx.font=F(26,400);ctx.letterSpacing='2px';
        ctx.fillText((act.start_date?fmtDt(act.start_date):'').toUpperCase(),P,Math.round(162*S));
      }
      // thick divider line
      ctx.fillStyle=sc.accent;ctx.fillRect(P,Math.round(182*S),Math.round(88*S),Math.round(5*S));
      // stats as large numbers — dynamic row height so all fit
      const inkStartY=Math.round(215*S);
      const inkAvail=H-inkStartY-Math.round(30*S);
      const inkRH=Math.min(Math.round(200*S),Math.floor(inkAvail/Math.max(selected.length,1)));
      selected.forEach((s,i)=>{
        const{num,unit}=statVal(s,act),ry=inkStartY+i*inkRH;
        ctx.fillStyle=mg;ctx.font=F(18,700);ctx.letterSpacing='0.08em';ctx.textAlign='left';
        ctx.fillText(s.label.toUpperCase(),P,ry+Math.round(26*S));
        // fit value font
        const maxNumW=W-P*2-(unit?Math.round(120*S):0);
        let vfs=Math.round(Math.min(80,inkRH*0.55)*S);
        ctx.font=`900 ${vfs}px -apple-system,sans-serif`;
        while(vfs>Math.round(20*S)&&ctx.measureText(num).width>maxNumW){vfs-=Math.max(1,Math.round(2*S));ctx.font=`900 ${vfs}px -apple-system,sans-serif`;}
        ctx.fillStyle=fg;ctx.letterSpacing='-2px';ctx.textAlign='left';
        ctx.fillText(num,P,ry+inkRH-Math.round(18*S));
        if(unit){
          // measure num width with current font BEFORE switching to unit font
          const numW=ctx.measureText(num).width;
          ctx.fillStyle=sc.accent;ctx.font=F(Math.min(28,vfs*0.38/S),700);ctx.letterSpacing='0';
          ctx.fillText(unit,P+numW+Math.round(10*S),ry+inkRH-Math.round(20*S));
        }
      });
      break;
    }
  }
}

function drawStoryCanvas(){
  const canvas=document.getElementById('storyCanvas');
  const idx=parseInt(document.getElementById('activityPicker').value)||0;
  const act=acts[idx]||{};
  const selected=STAT_DEFS.filter(s=>checkedStats.has(s.key));
  drawLayout(canvas,act,selected,getScheme(),activeLayout);
  // also redraw all layout thumbnails
  document.querySelectorAll('.layout-thumb').forEach(c=>{
    const sc=getScheme(),miniAct={...act};
    const miniSel=selected.slice(0,4);
    drawLayout(c,miniAct,miniSel,sc,c.dataset.layout);
  });
}

function openStoryModal(){
  const picker=document.getElementById('activityPicker');
  picker.innerHTML=acts.slice(0,50).map((a,i)=>`<option value="${i}">${fmtDt(a.start_date)} — ${a.name} (${fmtD(a.distance)})</option>`).join('');

  // layout thumbnails
  const lp=document.getElementById('layoutPicker');
  lp.innerHTML=LAYOUTS.map(l=>`
    <button class="layout-btn${l.id===activeLayout?' active':''}" data-layout="${l.id}">
      <canvas class="layout-thumb" data-layout="${l.id}" width="216" height="384"></canvas>
      <span>${l.name}</span>
    </button>
  `).join('');
  lp.querySelectorAll('.layout-btn').forEach(btn=>{
    btn.addEventListener('click',()=>{
      activeLayout=btn.dataset.layout;
      lp.querySelectorAll('.layout-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      drawStoryCanvas();
    });
  });

  // stat toggles
  const tw=document.getElementById('statToggles');
  tw.innerHTML=STAT_DEFS.map(s=>`
    <label id="lbl-${s.key}" style="display:flex;align-items:center;gap:6px;font-size:11px;cursor:pointer;padding:5px 8px;background:var(--surface2);border-radius:5px;border:1px solid ${checkedStats.has(s.key)?'var(--orange)':'var(--border)'};">
      <input type="checkbox" ${checkedStats.has(s.key)?'checked':''} data-key="${s.key}" style="accent-color:var(--orange);">${s.label}
    </label>`).join('');
  tw.querySelectorAll('input').forEach(cb=>{
    cb.addEventListener('change',()=>{
      const k=cb.dataset.key;cb.checked?checkedStats.add(k):checkedStats.delete(k);
      document.getElementById('lbl-'+k).style.borderColor=cb.checked?'var(--orange)':'var(--border)';
      drawStoryCanvas();
    });
  });

  picker.addEventListener('change',drawStoryCanvas);

  // hide title / date toggles
  const chkTitle=document.getElementById('chk-hideTitle');
  const chkDate=document.getElementById('chk-hideDate');
  chkTitle.checked=hideTitle;chkDate.checked=hideDate;
  chkTitle.addEventListener('change',()=>{hideTitle=chkTitle.checked;document.getElementById('lbl-hideTitle').style.borderColor=hideTitle?'var(--orange)':'var(--border)';drawStoryCanvas();});
  chkDate.addEventListener('change',()=>{hideDate=chkDate.checked;document.getElementById('lbl-hideDate').style.borderColor=hideDate?'var(--orange)':'var(--border)';drawStoryCanvas();});

  const chkRoute=document.getElementById('chk-hideRoute');
  if(chkRoute){
    chkRoute.checked=hideRoute;
    chkRoute.addEventListener('change',()=>{hideRoute=chkRoute.checked;document.getElementById('lbl-hideRoute').style.borderColor=hideRoute?'var(--orange)':'var(--border)';drawStoryCanvas();});
  }

  const bgInput=document.getElementById('bgImageInput');
  const bgUploadBtn=document.getElementById('bgUploadBtn');
  const clearBg=document.getElementById('clearBgBtn');
  const bgName=document.getElementById('bgImageName');
  if(bgUploadBtn&&bgInput) bgUploadBtn.addEventListener('click',()=>bgInput.click());
  if(bgInput){
    bgInput.addEventListener('change',e=>{
      const file=e.target.files[0];
      if(!file) return;
      const reader=new FileReader();
      reader.onload=ev=>{
        const img=new Image();
        img.onload=()=>{storyBgImage=img;clearBg.style.display='';bgName.textContent=file.name;drawStoryCanvas();};
        img.src=ev.target.result;
      };
      reader.readAsDataURL(file);
    });
  }
  if(clearBg){
    clearBg.style.display=storyBgImage?'':'none';
    clearBg.addEventListener('click',()=>{storyBgImage=null;clearBg.style.display='none';bgName.textContent='';if(bgInput)bgInput.value='';drawStoryCanvas();});
  }

  document.getElementById('storyModal').classList.add('open');
  setTimeout(drawStoryCanvas,50);
}
