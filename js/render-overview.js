/* ── RENDER ALL ── */
function renderAll() {
  // Show all sections temporarily so charts can measure their containers
  _ALL_SECTIONS.forEach(id=>{const e=document.getElementById(id);if(e)e.style.display='';});

  renderStats();
  renderCycling();
  renderTrends();
  renderActivities();
  renderCalendar();
  renderEddington();
  renderMonthly();
  renderBestEfforts();
  renderGear();
  // heatmap is lazy-loaded when user navigates to heatSection
  renderMilestones();
  renderRewind();
  renderChallenges();
  renderSegments();
  renderPhotos();

  document.getElementById('shareBtn').style.display = '';
  document.getElementById('logoutBtn').style.display = '';
  const nl = document.getElementById('navLinks');
  nl.style.opacity = '1';
  nl.style.pointerEvents = '';
  const sn = document.getElementById('sidebarNav');
  if(sn) sn.classList.remove('locked');

  // Navigate to Overview page by default
  const firstLink = document.querySelector('#sidebarNav .nav-link');
  navScrollTo('statRow', firstLink);
}

/* ── STATS ── */
function renderStats() {
  const dist  = acts.reduce((s,a)=>s+(a.distance||0),0);
  const time  = acts.reduce((s,a)=>s+(a.moving_time||0),0);
  const elev  = acts.reduce((s,a)=>s+(a.total_elevation_gain||0),0);
  const E     = eddington(acts.filter(isRide));
  const rides = acts.filter(isRide);
  const runs  = acts.filter(a=>a.type==='Run'||a.type==='VirtualRun');
  const kudos = acts.reduce((s,a)=>s+(a.kudos_count||0),0);
  const prs   = acts.reduce((s,a)=>s+(a.pr_count||0),0);
  const achs  = acts.reduce((s,a)=>s+(a.achievement_count||0),0);
  const longest = rides.reduce((m,a)=>a.distance>m?a.distance:m,0);
  const ridingActs = rides.filter(a=>a.average_speed>0);
  const avgSpd = ridingActs.length ? ridingActs.reduce((s,a)=>s+a.average_speed,0)/ridingActs.length*3.6 : 0;

  // max speed across all rides (max_speed field is in m/s)
  const maxSpd = rides.reduce((m,a)=>a.max_speed>m?a.max_speed:m,0)*3.6;

  // avg heart rate across activities that have it
  const hrActs = acts.filter(a=>a.average_heartrate>0);
  const avgHR  = hrActs.length ? Math.round(hrActs.reduce((s,a)=>s+a.average_heartrate,0)/hrActs.length) : 0;

  // best consecutive day streak
  const daySet = new Set(acts.map(a=>a.start_date.slice(0,10)));
  const days   = [...daySet].sort();
  let bestStreak=days.length?1:0, curStreak=days.length?1:0;
  for(let i=1;i<days.length;i++){
    const diff=(new Date(days[i])-new Date(days[i-1]))/(864e5);
    if(diff===1){curStreak++;bestStreak=Math.max(bestStreak,curStreak);}
    else curStreak=1;
  }

  // calories: sum of kilojoules (≈ kcal for cycling) or calories field
  const totalCal = Math.round(acts.reduce((s,a)=>s+(a.kilojoules||a.calories||0),0));

  document.getElementById('sv-acts').textContent    = acts.length;
  document.getElementById('sv-dist').textContent    = fmtD(dist);
  document.getElementById('sv-dist-sub').textContent= 'avg '+fmtD(dist/acts.length);
  document.getElementById('sv-time').textContent    = Math.round(time/3600)+'h';
  document.getElementById('sv-elev').textContent    = Math.round(elev/1000)+'k m';
  document.getElementById('sv-eddy').textContent    = E;
  document.getElementById('sv-eddy-sub').textContent= 'cycling km';
  document.getElementById('sv-rides').textContent   = rides.length;
  document.getElementById('sv-runs').textContent    = runs.length;
  document.getElementById('sv-kudos').textContent   = kudos.toLocaleString();
  document.getElementById('sv-prs').textContent     = prs.toLocaleString();
  document.getElementById('sv-ach').textContent     = achs.toLocaleString();
  document.getElementById('sv-longest').textContent = longest?(longest/1000).toFixed(1):'—';
  document.getElementById('sv-avgspd').textContent  = avgSpd?avgSpd.toFixed(1):'—';
  document.getElementById('sv-maxspd').textContent  = maxSpd?maxSpd.toFixed(1):'—';
  document.getElementById('sv-avghr').textContent   = avgHR||'—';
  document.getElementById('sv-streak').textContent  = bestStreak||'—';
  document.getElementById('sv-cal').textContent     = totalCal?Math.round(totalCal/1000)+'k':'—';
}

/* ── EDDINGTON ── */
function eddington(rides) {
  const kms = rides.map(r=>(r.distance||0)/1000).sort((a,b)=>b-a);
  let E=0;
  for (let i=0;i<kms.length;i++) { if (kms[i]>=i+1) E=i+1; else break; }
  return E;
}

function renderEddington() {
  const rides = acts.filter(isRide);
  const E = eddington(rides);
  document.getElementById('eddyNum').textContent = E;

  // how many rides ≥ E+1 km already?
  const next = E+1;
  const have = rides.filter(r=>(r.distance||0)/1000>=next).length;
  const need = next - have;
  document.getElementById('eddyNext').innerHTML =
    `To reach <strong>E=${next}</strong> you need <strong>${need} more ride${need!==1?'s':''} of ≥${next} km</strong> (have ${have}/${next}).`;

  // bar chart: last 15 E-values cumulative
  const kms = rides.map(r=>(r.distance||0)/1000).sort((a,b)=>b-a).slice(0,next+5);
  const labels = kms.map((_,i)=>i+1+'');
  destroyChart('eddyChart');
  charts['eddyChart'] = new Chart(document.getElementById('eddyChart').getContext('2d'),{
    type:'bar',
    data:{
      labels,
      datasets:[
        { label:'Ride km', data:kms.map(k=>+k.toFixed(1)),
          backgroundColor: kms.map((k,i)=>k>=i+1?'rgba(252,76,2,.7)':'rgba(252,76,2,.15)'),
          borderRadius:3 },
        { label:'Required', data:labels.map((_,i)=>i+1),
          type:'line', borderColor:'#555', borderWidth:1.5, pointRadius:0, fill:false }
      ]
    },
    options: { ...chartOpts('km',false), scales:{
      x:{display:false},
      y:{grid:{color:'#1a1a1a'},ticks:{color:'#555',font:{size:10}},beginAtZero:true}
    }}
  });
}
