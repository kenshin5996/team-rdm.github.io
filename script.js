const team = [
  {name:'kenshin5996', display:'KENSHIN5996', role:'Créateur'},
  {name:'c_djo', display:'C_DJO', role:'Membre'},
  {name:'manimang0', display:'MANIMANG0', role:'Membre'},
  {name:'fandeipromxtrollmod', display:'FANDEIPROMXTROLLMOD', role:'Membre'},
  {name:'theoherlintw', display:'THEOHERLINTW', role:'Membre'},
  {name:'maszoks', display:'MASZOKS', role:'Membre'},
];

const PRIVATE_VOICE_CODE = 'RDM5996';
const PRIVATE_VOICE_ROOM = 'TeamRDMVocalPriveKenshin5996';
const allowedVoiceMembers = team.map(m => m.name.toLowerCase());
const host = window.location.hostname || 'localhost';

const defaultClips = [
  { streamer: 'kenshin5996', title: 'Clip kenshin5996 #1', slug: 'BoxySpineyStrawberryTBTacoRight-RVw4ImPXBY7cYFXY', url: 'https://www.twitch.tv/kenshin5996/clip/BoxySpineyStrawberryTBTacoRight-RVw4ImPXBY7cYFXY' },
  { streamer: 'kenshin5996', title: 'Clip kenshin5996 #2', slug: 'AmericanFunDinosaurKeyboardCat-tfmv5WLOv_v63LjV', url: 'https://www.twitch.tv/kenshin5996/clip/AmericanFunDinosaurKeyboardCat-tfmv5WLOv_v63LjV' },
  { streamer: 'c_djo', title: 'Clip c_djo #1', slug: 'EsteemedTriangularShingleGingerPower-yBSuvPj5I32SXtzH', url: 'https://www.twitch.tv/c_djo/clip/EsteemedTriangularShingleGingerPower-yBSuvPj5I32SXtzH' },
  { streamer: 'c_djo', title: 'Clip c_djo #2', slug: 'FairCuriousWolfDeIlluminati-7YO9dvECQFCYz5iY', url: 'https://www.twitch.tv/c_djo/clip/FairCuriousWolfDeIlluminati-7YO9dvECQFCYz5iY' },
  { streamer: 'kenshin5996', title: 'Clip kenshin5996 #3', slug: 'CrowdedArtsyYogurtDxAbomb-ovDudfB44BUi0boP', url: 'https://www.twitch.tv/kenshin5996/clip/CrowdedArtsyYogurtDxAbomb-ovDudfB44BUi0boP' },
];

let onlineClips = [];
let dbTools = null;
let clipsCollectionRef = null;
let firebaseReady = false;

function $(id){ return document.getElementById(id); }
function avatarUrl(name){ return `https://unavatar.io/twitch/${name}`; }
function clean(value){ const d = document.createElement('div'); d.textContent = value || ''; return d.innerHTML; }
function twitchPlayer(channel){ return `https://player.twitch.tv/?channel=${channel}&parent=${host}&muted=true&autoplay=false`; }
function clipEmbed(slug){ return `https://clips.twitch.tv/embed?clip=${encodeURIComponent(slug)}&parent=${host}&autoplay=false`; }

function showChannel(name, display){
  $('currentName').textContent = display;
  $('playerBox').innerHTML = `<iframe allowfullscreen="true" scrolling="no" allow="autoplay; fullscreen" src="${twitchPlayer(name)}"></iframe>`;
  $('chaine').scrollIntoView({behavior:'smooth'});
}
function openTwitch(name){ window.open(`https://www.twitch.tv/${name}`, '_blank'); }

async function checkLiveStatus(member){
  const btn = $(`live-${member.name}`);
  if (!btn) return;
  btn.textContent = '⏳ Vérification...';
  try {
    const response = await fetch(`https://decapi.me/twitch/uptime/${member.name}?_=${Date.now()}`, { cache: 'no-store' });
    const text = (await response.text()).toLowerCase();
    const isOffline = text.includes('offline') || text.includes('not live') || text.includes('does not exist');
    if (isOffline) {
      btn.textContent = '⚫ Hors live';
      btn.className = 'liveStatus offline';
    } else {
      btn.textContent = '🔴 En live';
      btn.className = 'liveStatus online';
    }
  } catch (err) {
    btn.textContent = 'Voir le live';
    btn.className = 'liveStatus offline';
  }
}
function refreshLiveStatuses(){ team.forEach(checkLiveStatus); }

function renderMembers(){
  const grid = $('membersGrid');
  if (!grid) return;
  grid.innerHTML = '';
  team.forEach(member => {
    const card = document.createElement('article');
    card.className = 'memberCard';
    card.innerHTML = `
      <span class="badge ${member.role === 'Créateur' ? 'creator' : ''}">${member.role}</span>
      <img class="avatar" src="${avatarUrl(member.name)}" alt="Profil Twitch ${member.display}" onerror="this.src='assets/wolf-logo.png'" />
      <h3 title="${member.display}">${member.display}</h3>
      <button id="live-${member.name}" class="liveStatus offline" onclick="openTwitch('${member.name}')">⚫ Hors live</button>
      <p class="status">● Profil Twitch</p>
      <button onclick="showChannel('${member.name}', '${member.display}')">Afficher sur le site</button>
      <button class="secondary" onclick="openTwitch('${member.name}')">Ouvrir Twitch</button>`;
    grid.appendChild(card);
  });
}

function extractClipSlug(url){
  const text = (url || '').trim();
  const match = text.match(/(?:twitch\.tv\/[\w-]+\/clip\/|clips\.twitch\.tv\/)([A-Za-z0-9_-]+)/i);
  return match ? match[1] : '';
}

function renderClipCard(clip){
  const card = document.createElement('article');
  card.className = 'clipCard';
  card.innerHTML = `
    <div class="clipHeader">
      <img src="${avatarUrl(clip.streamer)}" onerror="this.src='assets/wolf-logo.png'" alt="${clean(clip.streamer)}">
      <div><h3>${clean(clip.title)}</h3><p>${clean(clip.streamer)}</p></div>
    </div>
    <iframe src="${clipEmbed(clip.slug)}" allowfullscreen="true" allow="autoplay; fullscreen"></iframe>
    <a class="clipLink" href="${clean(clip.url)}" target="_blank">Ouvrir le clip sur Twitch</a>`;
  return card;
}

function renderClips(){
  const grid = $('clipsGrid');
  if (!grid) return;
  grid.innerHTML = '';
  [...onlineClips, ...defaultClips].forEach(c => grid.appendChild(renderClipCard(c)));
  if ($('onlineClipCount')) $('onlineClipCount').textContent = String(onlineClips.length);
}

function configOk(){
  const c = window.RDM_FIREBASE_CONFIG;
  return c && c.apiKey && c.projectId && !String(c.apiKey).includes('REMPLACE_MOI');
}

async function initFirebase(){
  renderClips();
  if (!configOk()) {
    $('firebaseStatus').textContent = 'Firebase config manquante.';
    $('statsStatus').textContent = 'Firebase non configuré';
    return;
  }
  try {
    const appModule = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js');
    const fs = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js');
    const app = appModule.initializeApp(window.RDM_FIREBASE_CONFIG);
    const db = fs.getFirestore(app);
    dbTools = fs;
    clipsCollectionRef = fs.collection(db, 'clips');
    firebaseReady = true;
    $('firebaseStatus').textContent = 'Firebase connecté ✅';
    $('statsStatus').textContent = 'Connecté ✅';

    fs.onSnapshot(fs.query(clipsCollectionRef, fs.orderBy('createdAt', 'desc')), snap => {
      onlineClips = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(c => c.slug);
      renderClips();
    }, err => {
      console.error(err);
      $('firebaseStatus').textContent = 'Firestore bloque la lecture. Vérifie les règles.';
    });

    await recordVisit(fs, db);
  } catch (err) {
    console.error(err);
    $('firebaseStatus').textContent = 'Erreur Firebase. Vérifie les règles Firestore.';
    $('statsStatus').textContent = 'Erreur Firebase';
  }
}

async function recordVisit(fs, db){
  try {
    const visitsRef = fs.collection(db, 'visits');
    const today = new Date().toISOString().slice(0,10);
    const key = 'rdm_visit_' + today;
    if (!localStorage.getItem(key)) {
      await fs.addDoc(visitsRef, { page: location.pathname, day: today, createdAt: fs.serverTimestamp() });
      localStorage.setItem(key, '1');
    }
    fs.onSnapshot(visitsRef, snap => {
      let total = 0, todayCount = 0;
      snap.forEach(d => { total++; if (d.data().day === today) todayCount++; });
      $('totalVisits').textContent = String(total);
      $('todayVisits').textContent = String(todayCount);
    });
  } catch (err) {
    console.error(err);
    $('statsStatus').textContent = 'Stats bloquées par Firestore';
  }
}

async function publishClip(){
  const streamer = ($('clipStreamer').value || '').trim().toLowerCase();
  const title = ($('clipTitle').value || '').trim();
  const url = ($('clipUrl').value || '').trim();
  const code = ($('clipCode').value || '').trim();
  const slug = extractClipSlug(url);

  if (!allowedVoiceMembers.includes(streamer)) return alert('Accès refusé : ce pseudo n’est pas dans la TEAM RDM.');
  if (code !== PRIVATE_VOICE_CODE) return alert('Code membre incorrect.');
  if (!title) return alert('Ajoute un titre.');
  if (!slug) return alert('Lien Twitch invalide. Exemple : https://www.twitch.tv/chaine/clip/SLUG');
  if (!firebaseReady || !clipsCollectionRef || !dbTools) return alert('Firebase pas encore prêt. Recharge la page.');
  if ([...onlineClips, ...defaultClips].some(c => c.slug === slug)) return alert('Ce clip est déjà publié.');

  try {
    await dbTools.addDoc(clipsCollectionRef, { streamer, title, slug, url, createdAt: dbTools.serverTimestamp() });
    $('clipTitle').value = ''; $('clipUrl').value = ''; $('clipCode').value = '';
    alert('Clip publié ✅');
  } catch (err) {
    console.error(err);
    alert('Impossible de publier. Mets les règles Firestore avec clips/visits en read/write true.');
  }
}

function joinPrivateVoice(){
  const pseudo = ($('voiceName').value || '').trim().toLowerCase();
  const code = ($('voiceCode').value || '').trim();
  if(!allowedVoiceMembers.includes(pseudo)) return alert('Accès refusé : ce pseudo n’est pas dans la TEAM RDM.');
  if(code !== PRIVATE_VOICE_CODE) return alert('Code membre incorrect.');
  const displayName = encodeURIComponent(pseudo);
  $('voiceFrame').src = `https://meet.jit.si/${PRIVATE_VOICE_ROOM}#userInfo.displayName="${displayName}"&config.prejoinPageEnabled=false&config.startWithVideoMuted=true&config.startAudioOnly=true`;
  $('voiceRoom').style.display = 'block';
  $('vocal').scrollIntoView({behavior:'smooth'});
}
function leavePrivateVoice(){ $('voiceFrame').src = ''; $('voiceRoom').style.display = 'none'; }

renderMembers();
refreshLiveStatuses();
setInterval(refreshLiveStatuses, 120000);
showChannel('kenshin5996', 'KENSHIN5996');
initFirebase();
