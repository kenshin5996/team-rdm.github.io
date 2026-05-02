const team = [
  {name:'kenshin5996', display:'KENSHIN5996', role:'Créateur', followers:'215 followers'},
  {name:'c_djo', display:'C_DJO', role:'Membre', followers:'475 followers'},
  {name:'manimang0', display:'MANIMANG0', role:'Membre', followers:'3 followers'},
  {name:'fandeipromxtrollmod', display:'FANDEIPROMXTROLLMOD', role:'Membre', followers:'2 k followers'},
  {name:'theoherlintw', display:'THEOHERLINTW', role:'Membre', followers:'3 followers'},
  {name:'maszoks', display:'MASZOKS', role:'Membre', followers:'1 follower'},
];

const PRIVATE_VOICE_CODE = 'RDM5996';
const PRIVATE_VOICE_ROOM = 'TeamRDMVocalPriveKenshin5996';
const allowedVoiceMembers = team.map(m => m.name.toLowerCase());
const host = window.location.hostname || 'localhost';
let liveStatuses = {};
let onlineClips = [];
let dbTools = null;
let dbRef = null;
let firebaseReady = false;
let heartbeatTimer = null;
const sessionId = localStorage.getItem('rdm_session_id') || (Date.now() + '_' + Math.random().toString(36).slice(2));
localStorage.setItem('rdm_session_id', sessionId);

const defaultClips = [
  { streamer: 'kenshin5996', title: 'Clip kenshin5996 #1', slug: 'BoxySpineyStrawberryTBTacoRight-RVw4ImPXBY7cYFXY', url: 'https://www.twitch.tv/kenshin5996/clip/BoxySpineyStrawberryTBTacoRight-RVw4ImPXBY7cYFXY' },
  { streamer: 'kenshin5996', title: 'Clip kenshin5996 #2', slug: 'AmericanFunDinosaurKeyboardCat-tfmv5WLOv_v63LjV', url: 'https://www.twitch.tv/kenshin5996/clip/AmericanFunDinosaurKeyboardCat-tfmv5WLOv_v63LjV' },
  { streamer: 'c_djo', title: 'Clip c_djo #1', slug: 'EsteemedTriangularShingleGingerPower-yBSuvPj5I32SXtzH', url: 'https://www.twitch.tv/c_djo/clip/EsteemedTriangularShingleGingerPower-yBSuvPj5I32SXtzH' },
];

function $(id){ return document.getElementById(id); }
function clean(value){ const d = document.createElement('div'); d.textContent = value || ''; return d.innerHTML; }
function avatarUrl(name){ return `https://unavatar.io/twitch/${name}`; }
function twitchPlayer(channel){ return `https://player.twitch.tv/?channel=${channel}&parent=${host}&muted=true&autoplay=false`; }
function clipEmbed(slug){ return `https://clips.twitch.tv/embed?clip=${encodeURIComponent(slug)}&parent=${host}&autoplay=false`; }
function showChannel(name, display){ $('currentName').textContent = display; $('playerBox').innerHTML = `<iframe allowfullscreen="true" scrolling="no" allow="autoplay; fullscreen" src="${twitchPlayer(name)}"></iframe>`; $('chaine').scrollIntoView({behavior:'smooth'}); }
function openTwitch(name){ window.open(`https://www.twitch.tv/${name}`, '_blank'); }

function renderMembers(){
  const grid = $('membersGrid'); if (!grid) return; grid.innerHTML = '';
  team.forEach(member => {
    const st = liveStatuses[member.name];
    const card = document.createElement('article');
    card.className = 'memberCard';
    card.innerHTML = `<span class="badge ${member.role === 'Créateur' ? 'creator' : ''}">${member.role}</span><img class="avatar" src="${avatarUrl(member.name)}" alt="Profil Twitch ${member.display}" onerror="this.src='assets/wolf-logo.png'" /><h3 title="${member.display}">${member.display}</h3><p class="followers">${member.followers}</p><p class="status ${st && st.live ? 'statusLive' : ''}">${st && st.live ? '🔴 EN DIRECT' : '● Profil Twitch'}</p><button onclick="showChannel('${member.name}', '${member.display}')">Afficher sur le site</button><button class="secondary" onclick="openTwitch('${member.name}')">Ouvrir Twitch</button>`;
    grid.appendChild(card);
  });
}

function renderLiveCards(){
  const grid = $('liveGrid'); if (!grid) return;
  const ordered = [...team].sort((a,b) => ((liveStatuses[b.name]?.live?1:0) - (liveStatuses[a.name]?.live?1:0)));
  grid.innerHTML = '';
  ordered.forEach(member => {
    const st = liveStatuses[member.name] || {live:false, text:'Vérification...'};
    const card = document.createElement('article'); card.className = 'liveCard' + (st.live ? ' isLive' : '');
    card.innerHTML = `<div class="liveCardTop"><img class="liveAvatar" src="${avatarUrl(member.name)}" onerror="this.src='assets/wolf-logo.png'" alt="${member.display}"><div><h3 class="liveName">${member.display}</h3><span class="liveState ${st.live ? 'on' : 'off'}">${st.live ? '🔴 EN DIRECT' : '⚫ HORS LIVE'}</span></div></div><p class="liveDetails">${clean(st.text)}</p><div class="liveActions"><button onclick="showChannel('${member.name}', '${member.display}')">Regarder sur le site</button><a href="https://www.twitch.tv/${member.name}" target="_blank">Ouvrir Twitch</a></div>`;
    grid.appendChild(card);
  });
  const count = Object.values(liveStatuses).filter(x => x.live).length;
  $('liveSummary').textContent = count > 0 ? `🔴 ${count} membre(s) en live maintenant` : '⚫ Aucun membre en live pour le moment';
  renderMembers();
}

async function checkLiveStatus(member){
  try{
    const ctrl = new AbortController(); const timer = setTimeout(()=>ctrl.abort(), 7000);
    const res = await fetch(`https://decapi.me/twitch/uptime/${encodeURIComponent(member.name)}`, {signal:ctrl.signal, cache:'no-store'});
    clearTimeout(timer); const text = (await res.text()).trim();
    const offline = /offline|not live|not streaming|does not exist/i.test(text);
    liveStatuses[member.name] = (!offline && text) ? {live:true, text:`En live depuis ${text}`} : {live:false, text:'Pas en live pour le moment'};
  }catch(e){ liveStatuses[member.name] = {live:false, text:'Statut live indisponible, ouvre Twitch pour vérifier'}; }
}
async function checkAllLiveStatus(manual){ $('liveSummary').textContent = manual ? 'Actualisation des lives...' : 'Vérification des lives...'; renderLiveCards(); await Promise.all(team.map(checkLiveStatus)); renderLiveCards(); }

function extractClipSlug(url){ const text = (url || '').trim(); const match = text.match(/(?:twitch\.tv\/[\w-]+\/clip\/|clips\.twitch\.tv\/)([A-Za-z0-9_-]+)/i); return match ? match[1] : ''; }
function renderClipCard(clip){ const card=document.createElement('article'); card.className='clipCard'; card.innerHTML=`<div class="clipHeader"><img src="${avatarUrl(clip.streamer)}" onerror="this.src='assets/wolf-logo.png'" alt="${clean(clip.streamer)}"><div><h3>${clean(clip.title)}</h3><p>${clean(clip.streamer)}</p></div></div><iframe src="${clipEmbed(clip.slug)}" allowfullscreen="true" allow="autoplay; fullscreen"></iframe><a class="clipLink" href="${clean(clip.url)}" target="_blank">Ouvrir le clip sur Twitch</a>`; return card; }
function renderClips(){ const grid=$('clipsGrid'); if(!grid)return; grid.innerHTML=''; [...onlineClips,...defaultClips].forEach(c=>grid.appendChild(renderClipCard(c))); }

function configOk(){ const c = window.RDM_FIREBASE_CONFIG; return c && c.apiKey && c.projectId && !String(c.apiKey).includes('REMPLACE_MOI'); }
async function initFirebase(){
  renderClips();
  if(!configOk()){ $('firebaseStatus').textContent='Firebase config manquante'; $('statsStatus').textContent='Firebase non configuré'; loadLocalVisits(); return; }
  try{
    const appModule = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js');
    const fs = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js');
    const app = appModule.initializeApp(window.RDM_FIREBASE_CONFIG); const db = fs.getFirestore(app);
    dbTools = fs; dbRef = db; firebaseReady = true; $('firebaseStatus').textContent='Firebase connecté ✅'; $('statsStatus').textContent='Connecté ✅';
    fs.onSnapshot(fs.query(fs.collection(db,'clips'), fs.orderBy('createdAt','desc')), snap => { onlineClips=snap.docs.map(doc=>({id:doc.id,...doc.data()})).filter(c=>c.slug); renderClips(); }, err => { console.error(err); $('firebaseStatus').textContent='Firestore bloque les clips'; });
    await recordVisitAndPresence(fs, db);
  }catch(err){ console.error(err); $('firebaseStatus').textContent='Erreur Firebase'; $('statsStatus').textContent='Erreur Firebase'; loadLocalVisits(); }
}

function loadLocalVisits(){
  const total = Number(localStorage.getItem('rdm_total_visits') || '0') + 1; localStorage.setItem('rdm_total_visits', String(total));
  $('totalVisits').textContent = String(total); $('todayVisits').textContent = '1'; $('onlineVisitors').textContent = '1';
}
async function recordVisitAndPresence(fs, db){
  const today = new Date().toISOString().slice(0,10);
  const visitKey = 'rdm_visit_' + today;
  if(!localStorage.getItem(visitKey)){ await fs.addDoc(fs.collection(db,'visits'), {day:today, page:location.pathname, createdAt:fs.serverTimestamp()}); localStorage.setItem(visitKey,'1'); }
  fs.onSnapshot(fs.collection(db,'visits'), snap => { let total=0, todayCount=0; snap.forEach(d=>{ total++; if(d.data().day===today) todayCount++; }); $('totalVisits').textContent=String(total); $('todayVisits').textContent=String(todayCount); });
  const presenceDoc = fs.doc(db, 'presence', sessionId);
  async function heartbeat(){ try{ await fs.setDoc(presenceDoc, {page:location.pathname, lastSeen:Date.now(), updatedAt:fs.serverTimestamp()}, {merge:true}); }catch(e){ console.error(e); } }
  await heartbeat(); heartbeatTimer = setInterval(heartbeat, 25000);
  fs.onSnapshot(fs.collection(db,'presence'), snap => { const now=Date.now(); let online=0; snap.forEach(d=>{ if((d.data().lastSeen||0) > now - 70000) online++; }); $('onlineVisitors').textContent=String(online); });
}

async function publishClip(){
  const streamer=($('clipStreamer').value||'').trim().toLowerCase(); const title=($('clipTitle').value||'').trim(); const url=($('clipUrl').value||'').trim(); const code=($('clipCode').value||'').trim(); const slug=extractClipSlug(url);
  if(!allowedVoiceMembers.includes(streamer)) return alert('Identifiant refusé : ce pseudo n’est pas dans la TEAM RDM.');
  if(code!==PRIVATE_VOICE_CODE) return alert('Mot de passe incorrect. Mets RDM5996.');
  if(!title) return alert('Ajoute le titre du clip.'); if(!slug) return alert('Lien de clip Twitch invalide.');
  if([...onlineClips,...defaultClips].some(c=>c.slug===slug)) return alert('Ce clip est déjà publié.');
  if(!firebaseReady || !dbTools || !dbRef) return alert('Firebase pas prêt : recharge la page ou vérifie firebase-config.js.');
  try{ await dbTools.addDoc(dbTools.collection(dbRef,'clips'), {streamer,title,slug,url,createdAt:dbTools.serverTimestamp()}); $('clipTitle').value=''; $('clipUrl').value=''; $('clipCode').value=''; alert('Clip publié ✅'); }
  catch(err){ console.error(err); alert('Impossible de publier : vérifie les règles Firestore.'); }
}

function joinPrivateVoice(){ const pseudo=($('voiceName').value||'').trim().toLowerCase(); const code=($('voiceCode').value||'').trim(); if(!allowedVoiceMembers.includes(pseudo)) return alert('Accès refusé : ce pseudo n’est pas dans la TEAM RDM.'); if(code!==PRIVATE_VOICE_CODE) return alert('Code membre incorrect.'); const displayName=encodeURIComponent(pseudo); $('voiceFrame').src=`https://meet.jit.si/${PRIVATE_VOICE_ROOM}#userInfo.displayName="${displayName}"&config.prejoinPageEnabled=false&config.startWithVideoMuted=true&config.startAudioOnly=true`; $('voiceRoom').style.display='block'; $('vocal').scrollIntoView({behavior:'smooth'}); }
function leavePrivateVoice(){ $('voiceFrame').src=''; $('voiceRoom').style.display='none'; }

renderMembers(); renderLiveCards(); showChannel('kenshin5996','KENSHIN5996'); checkAllLiveStatus(false); setInterval(()=>checkAllLiveStatus(false), 120000); initFirebase();
