// TEAM RDM - version finale Firebase Auth + Firestore
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
const allowedMembers = team.map(m => m.name.toLowerCase());
const host = window.location.hostname || 'localhost';

let fb = { ready:false, app:null, auth:null, db:null, modules:{} };
let currentUser = null;
let currentMemberPseudo = '';
let onlineClips = [];

const defaultClips = [
  { streamer: 'kenshin5996', title: 'Clip kenshin5996 #1', slug: 'BoxySpineyStrawberryTBTacoRight-RVw4ImPXBY7cYFXY', url: 'https://www.twitch.tv/kenshin5996/clip/BoxySpineyStrawberryTBTacoRight-RVw4ImPXBY7cYFXY' },
  { streamer: 'kenshin5996', title: 'Clip kenshin5996 #2', slug: 'AmericanFunDinosaurKeyboardCat-tfmv5WLOv_v63LjV', url: 'https://www.twitch.tv/kenshin5996/clip/AmericanFunDinosaurKeyboardCat-tfmv5WLOv_v63LjV' },
  { streamer: 'c_djo', title: 'Clip c_djo #1', slug: 'EsteemedTriangularShingleGingerPower-yBSuvPj5I32SXtzH', url: 'https://www.twitch.tv/c_djo/clip/EsteemedTriangularShingleGingerPower-yBSuvPj5I32SXtzH' },
  { streamer: 'c_djo', title: 'Clip c_djo #2', slug: 'FairCuriousWolfDeIlluminati-7YO9dvECQFCYz5iY', url: 'https://www.twitch.tv/c_djo/clip/FairCuriousWolfDeIlluminati-7YO9dvECQFCYz5iY' },
  { streamer: 'kenshin5996', title: 'Clip kenshin5996 #3', slug: 'CrowdedArtsyYogurtDxAbomb-ovDudfB44BUi0boP', url: 'https://www.twitch.tv/kenshin5996/clip/CrowdedArtsyYogurtDxAbomb-ovDudfB44BUi0boP' },
];

function $(id){ return document.getElementById(id); }
function avatarUrl(name){ return `https://unavatar.io/twitch/${name}`; }
function cleanText(value){ const div = document.createElement('div'); div.textContent = value || ''; return div.innerHTML; }
function twitchPlayer(channel){ return `https://player.twitch.tv/?channel=${channel}&parent=${host}&muted=true&autoplay=false`; }
function clipEmbed(slug){ return `https://clips.twitch.tv/embed?clip=${encodeURIComponent(slug)}&parent=${host}&autoplay=false`; }

function showChannel(name, display){
  $('currentName').textContent = display;
  $('playerBox').innerHTML = `<iframe allowfullscreen="true" scrolling="no" allow="autoplay; fullscreen" src="${twitchPlayer(name)}"></iframe>`;
  $('chaine').scrollIntoView({behavior:'smooth'});
}
function openTwitch(name){ window.open(`https://www.twitch.tv/${name}`, '_blank'); }

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
      <p class="followers">${member.followers}</p>
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
      <img src="${avatarUrl(clip.streamer)}" onerror="this.src='assets/wolf-logo.png'" alt="${cleanText(clip.streamer)}">
      <div><h3>${cleanText(clip.title)}</h3><p>${cleanText(clip.streamer)}</p></div>
    </div>
    <iframe src="${clipEmbed(clip.slug)}" allowfullscreen="true" allow="autoplay; fullscreen"></iframe>
    <a class="clipLink" href="${cleanText(clip.url)}" target="_blank">Ouvrir le clip sur Twitch</a>`;
  return card;
}
function renderClips(){
  const grid = $('clipsGrid');
  if (!grid) return;
  grid.innerHTML = '';
  [...onlineClips, ...defaultClips].forEach(clip => grid.appendChild(renderClipCard(clip)));
  $('clipsTotal') && ($('clipsTotal').textContent = String(onlineClips.length + defaultClips.length));
}

function firebaseConfigIsFilled(config){
  return config && config.apiKey && !String(config.apiKey).includes('REMPLACE_MOI') && config.projectId && !String(config.projectId).includes('REMPLACE_MOI');
}
function friendlyAuthError(error){
  const code = error?.code || '';
  const msg = error?.message || String(error);
  const map = {
    'auth/email-already-in-use':'Cet email existe déjà. Utilise Connexion au lieu de S’inscrire.',
    'auth/invalid-email':'Email invalide.',
    'auth/weak-password':'Mot de passe trop faible. Mets au moins 6 caractères.',
    'auth/wrong-password':'Mot de passe incorrect.',
    'auth/user-not-found':'Aucun compte avec cet email.',
    'auth/invalid-credential':'Email ou mot de passe incorrect.',
    'auth/operation-not-allowed':'Email/Mot de passe est encore désactivé dans Firebase Authentication.',
    'auth/network-request-failed':'Problème réseau. Réessaie.'
  };
  return map[code] || `Erreur Firebase (${code || 'sans code'}) : ${msg}`;
}

async function initFirebase(){
  renderMembers();
  renderClips();
  showChannel('kenshin5996', 'KENSHIN5996');

  const config = window.RDM_FIREBASE_CONFIG;
  if (!firebaseConfigIsFilled(config)) {
    setAuthStatus('Firebase non configuré', false);
    alert('Firebase non configuré : firebase-config.js doit contenir tes vraies clés.');
    return;
  }

  try {
    const appModule = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js');
    const authModule = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js');
    const dbModule = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js');

    fb.app = appModule.initializeApp(config);
    fb.auth = authModule.getAuth(fb.app);
    fb.db = dbModule.getFirestore(fb.app);
    fb.modules = { appModule, authModule, dbModule };
    fb.ready = true;

    authModule.onAuthStateChanged(fb.auth, async (user) => {
      currentUser = user;
      if (user) {
        await loadMemberProfile(user.uid);
        setAuthStatus(`Connecté : ${currentMemberPseudo || user.email}`, true);
      } else {
        currentMemberPseudo = '';
        setAuthStatus('Non connecté', false);
      }
    });

    listenClips();
    listenStats();
    registerVisit();
  } catch (error) {
    console.error('Erreur init Firebase', error);
    setAuthStatus('Erreur Firebase', false);
    alert('Erreur Firebase : ' + (error.message || error));
  }
}

function setAuthStatus(text, connected){
  const box = $('authStatus');
  if (!box) return;
  box.textContent = text;
  box.className = connected ? 'authStatus connected' : 'authStatus disconnected';
}

async function signupMember(){
  if (!fb.ready) { alert('Firebase charge encore. Attends 2 secondes puis réessaie.'); return; }
  const pseudo = ($('signupPseudo').value || '').trim().toLowerCase();
  const email = ($('signupEmail').value || '').trim();
  const password = ($('signupPassword').value || '').trim();
  const code = ($('signupCode').value || '').trim();
  if (!allowedMembers.includes(pseudo)) { alert('Pseudo refusé : ce pseudo n’est pas dans la TEAM RDM.'); return; }
  if (code !== PRIVATE_VOICE_CODE) { alert('Code membre incorrect.'); return; }
  if (!email || !password) { alert('Ajoute email et mot de passe.'); return; }
  try {
    const { createUserWithEmailAndPassword, updateProfile } = fb.modules.authModule;
    const { doc, setDoc, serverTimestamp } = fb.modules.dbModule;
    const cred = await createUserWithEmailAndPassword(fb.auth, email, password);
    await updateProfile(cred.user, { displayName: pseudo });
    await setDoc(doc(fb.db, 'users', cred.user.uid), {
      pseudo, email, role: pseudo === 'kenshin5996' ? 'admin' : 'member', createdAt: serverTimestamp()
    }, { merge:true });
    currentMemberPseudo = pseudo;
    $('signupPassword').value = '';
    $('signupCode').value = '';
    alert('Compte créé et connecté !');
  } catch (error) {
    console.error('signupMember error', error);
    alert(friendlyAuthError(error));
  }
}

async function loginMember(){
  if (!fb.ready) { alert('Firebase charge encore. Attends 2 secondes puis réessaie.'); return; }
  const email = ($('loginEmail').value || '').trim();
  const password = ($('loginPassword').value || '').trim();
  try {
    const { signInWithEmailAndPassword } = fb.modules.authModule;
    await signInWithEmailAndPassword(fb.auth, email, password);
    $('loginPassword').value = '';
    alert('Connecté !');
  } catch (error) {
    console.error('loginMember error', error);
    alert(friendlyAuthError(error));
  }
}

async function logoutMember(){
  if (!fb.ready) return;
  await fb.modules.authModule.signOut(fb.auth);
  alert('Déconnecté.');
}

async function loadMemberProfile(uid){
  try {
    const { doc, getDoc } = fb.modules.dbModule;
    const snap = await getDoc(doc(fb.db, 'users', uid));
    currentMemberPseudo = snap.exists() ? (snap.data().pseudo || '') : (currentUser?.displayName || '');
  } catch(e) { currentMemberPseudo = currentUser?.displayName || ''; }
}

function listenClips(){
  const { collection, query, orderBy, onSnapshot } = fb.modules.dbModule;
  const q = query(collection(fb.db, 'clips'), orderBy('createdAt', 'desc'));
  onSnapshot(q, snapshot => {
    onlineClips = snapshot.docs.map(doc => ({ id:doc.id, ...doc.data() })).filter(c => c.slug && c.title && c.streamer);
    renderClips();
  }, error => {
    console.error('clips snapshot error', error);
    alert('Firestore refuse la lecture des clips : vérifie les règles.');
  });
}

async function publishClip(){
  if (!fb.ready) { alert('Firebase charge encore. Réessaie dans 2 secondes.'); return; }
  if (!currentUser) { alert('Connecte-toi avant de publier un clip.'); return; }
  const streamer = ($('clipStreamer').value || currentMemberPseudo || '').trim().toLowerCase();
  const title = ($('clipTitle').value || '').trim();
  const url = ($('clipUrl').value || '').trim();
  const slug = extractClipSlug(url);
  if (!allowedMembers.includes(streamer)) { alert('Pseudo refusé : ce pseudo n’est pas dans la TEAM RDM.'); return; }
  if (!title) { alert('Ajoute un titre pour ton clip.'); return; }
  if (!slug) { alert('Lien Twitch invalide. Mets un vrai lien de clip Twitch.'); return; }
  if (onlineClips.some(c => c.slug === slug) || defaultClips.some(c => c.slug === slug)) { alert('Ce clip est déjà publié.'); return; }
  try {
    const { collection, addDoc, serverTimestamp } = fb.modules.dbModule;
    await addDoc(collection(fb.db, 'clips'), { streamer, title, slug, url, uid: currentUser.uid, createdAt: serverTimestamp() });
    $('clipTitle').value = '';
    $('clipUrl').value = '';
    alert('Clip publié en ligne !');
  } catch (error) {
    console.error('publishClip error', error);
    alert('Impossible de publier : ' + (error.message || error));
  }
}

async function registerVisit(){
  try {
    const { doc, setDoc, updateDoc, increment, serverTimestamp } = fb.modules.dbModule;
    const ref = doc(fb.db, 'visits', 'total');
    await setDoc(ref, { createdAt: serverTimestamp(), total: 0 }, { merge: true });
    await updateDoc(ref, { total: increment(1), lastVisit: serverTimestamp() });
  } catch(error){ console.warn('visit counter error', error); }
}

function listenStats(){
  const { doc, collection, onSnapshot } = fb.modules.dbModule;
  onSnapshot(doc(fb.db, 'visits', 'total'), snap => {
    $('visitsTotal') && ($('visitsTotal').textContent = String(snap.exists() ? (snap.data().total || 0) : 0));
  });
  onSnapshot(collection(fb.db, 'users'), snap => { $('membersTotal') && ($('membersTotal').textContent = String(snap.size)); });
}

function joinPrivateVoice(){
  const pseudo = ($('voiceName').value || '').trim().toLowerCase();
  const code = ($('voiceCode').value || '').trim();
  if(!allowedMembers.includes(pseudo)){ alert('Accès refusé : ce pseudo n’est pas dans la TEAM RDM.'); return; }
  if(code !== PRIVATE_VOICE_CODE){ alert('Code membre incorrect.'); return; }
  const displayName = encodeURIComponent(pseudo);
  $('voiceFrame').src = `https://meet.jit.si/${PRIVATE_VOICE_ROOM}#userInfo.displayName="${displayName}"&config.prejoinPageEnabled=false&config.startWithVideoMuted=true&config.startAudioOnly=true`;
  $('voiceRoom').style.display = 'block';
  $('vocal').scrollIntoView({behavior:'smooth'});
}
function leavePrivateVoice(){ $('voiceFrame').src = ''; $('voiceRoom').style.display = 'none'; }

initFirebase();
