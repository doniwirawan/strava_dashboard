const CONFIG = {
  clientId:     '__STRAVA_CLIENT_ID__',
  clientSecret: '__STRAVA_CLIENT_SECRET__',
  accessToken:  localStorage.getItem('strava_access_token')  || '',
  refreshToken: localStorage.getItem('strava_refresh_token') || ''
};

/* ── SUPABASE CACHE ── */
const _sbUrl = '__SUPABASE_URL__';
const _sbKey = '__SUPABASE_KEY__';
const _sb = (typeof supabase !== 'undefined' && _sbUrl && !_sbUrl.startsWith('__') && _sbKey && !_sbKey.startsWith('__'))
  ? supabase.createClient(_sbUrl, _sbKey)
  : null;

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

async function cacheLoad() {
  if (!_sb) return null;
  try {
    const { data, error } = await _sb
      .from('strava_cache')
      .select('activities, synced_at')
      .limit(1)
      .single();
    if (error || !data) return null;
    const age = Date.now() - new Date(data.synced_at).getTime();
    if (age > CACHE_TTL_MS) return null; // stale
    return data.activities;
  } catch { return null; }
}

async function cacheSave(activities, athleteId) {
  if (!_sb) return;
  try {
    await _sb.from('strava_cache').upsert(
      { id: athleteId, activities, synced_at: new Date().toISOString() },
      { onConflict: 'id' }
    );
  } catch { /* non-fatal */ }
}

let acts = [], charts = {};
let currentAthlete = null;
let leafletMapInst = null;
