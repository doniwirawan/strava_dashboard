/* ── AUTH ── */
async function doRefresh() {
  const r = await fetch('https://www.strava.com/oauth/token', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ client_id:CONFIG.clientId, client_secret:CONFIG.clientSecret,
                           refresh_token:CONFIG.refreshToken, grant_type:'refresh_token' })
  });
  if (!r.ok) throw new Error('Token refresh failed ('+r.status+')');
  const d = await r.json();
  CONFIG.accessToken  = d.access_token;
  CONFIG.refreshToken = d.refresh_token;
  localStorage.setItem('strava_access_token',  d.access_token);
  localStorage.setItem('strava_refresh_token', d.refresh_token);
  localStorage.setItem('strava_expires_at',    d.expires_at);
}

async function api(ep, retry=false) {
  const r = await fetch('https://www.strava.com/api/v3'+ep, {
    headers: { Authorization:'Bearer '+CONFIG.accessToken }
  });
  if (r.status===401 && !retry) { await doRefresh(); return api(ep,true); }
  if (!r.ok) throw new Error('API '+r.status+' — '+ep);
  return r.json();
}

/* ── LOAD ── */
async function loadData(forceRefresh = false) {
  const btn = document.getElementById('mainBtn');
  btn.disabled = true; btn.textContent = 'Loading…';
  try {
    // Try Supabase cache first (unless forced refresh)
    if (!forceRefresh) {
      setStatus('Checking cache…','loading');
      const cached = await cacheLoad();
      if (cached && cached.length) {
        acts = cached;
        renderAll();
        setStatus(`✓ ${acts.length} activities (cached) — <a href="#" onclick="loadData(true);return false;" style="color:var(--orange);font-weight:700">Refresh from Strava</a>`, 'success');
        btn.textContent = 'Refresh'; btn.disabled = false;
        // Still refresh athlete profile from API (and re-render gear which needs athlete.bikes)
        try { await doRefresh(); renderAthlete(await api('/athlete')); renderGear(); } catch {}
        return;
      }
    }

    setStatus('Refreshing token…','loading');
    await doRefresh();
    setStatus('Loading profile…','loading');
    const athlete = await api('/athlete');
    renderAthlete(athlete);
    setStatus('Fetching activities…','loading');
    const [p1,p2] = await Promise.all([
      api('/athlete/activities?per_page=100&page=1'),
      api('/athlete/activities?per_page=100&page=2')
    ]);
    acts = [...p1,...p2];
    renderAll();
    cacheSave(acts, athlete.id);
    setStatus(`✓ ${acts.length} activities loaded`, 'success');
    btn.textContent = 'Refresh'; btn.disabled = false;
  } catch(e) {
    setStatus('Error: '+e.message+' — use Demo or get a new token.','error');
    btn.textContent = 'Retry'; btn.disabled = false;
  }
}

/* ── RENDER ATHLETE ── */
function renderAthlete(a) {
  currentAthlete = a;
  document.getElementById('av').src    = a.profile_medium||a.profile||'';
  document.getElementById('aname').textContent = a.firstname+' '+a.lastname;
  document.getElementById('badge').style.display = 'flex';
  // Update sidebar user profile
  const su=document.getElementById('sidebarUser');
  if(su){
    document.getElementById('sidebarAv').src=a.profile_medium||a.profile||'';
    document.getElementById('sidebarName').textContent=a.firstname+' '+a.lastname;
    su.style.display='flex';
  }
}

/* ── DEMO ── */
function loadDemo() {
  const types=['Ride','Ride','Ride','Run','Hike','VirtualRide','Run'];
  const now=Date.now();
  acts=Array.from({length:120},(_,i)=>{
    const type=types[i%types.length];
    const r=()=>Math.random();
    let dist,avgS,maxS;
    if(type.includes('Ride')){dist=8000+r()*85000;avgS=5+r()*5;maxS=avgS*(1.25+r()*.3);}
    else if(type==='Run'){dist=3000+r()*18000;avgS=2.5+r()*1.5;maxS=avgS*1.2;}
    else{dist=2000+r()*12000;avgS=1.5+r();maxS=avgS*1.1;}
    return {
      name:type+' '+String(i+1).padStart(3,'0'),
      type, distance:dist, moving_time:dist/avgS,
      average_speed:avgS, max_speed:maxS,
      total_elevation_gain:30+r()*700,
      start_date:new Date(now-i*86400000*(0.6+r()*.9)).toISOString()
    };
  });
  renderAthlete({firstname:'Demo',lastname:'Athlete',profile_medium:''});
  renderAll();
  setStatus(`Demo mode — ${acts.length} sample activities`,'success');
  const btn=document.getElementById('mainBtn');
  btn.textContent='Refresh'; btn.disabled=false;
}
