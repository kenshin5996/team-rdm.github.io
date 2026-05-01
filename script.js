const team = [
  {name:'kenshin5996', display:'KENSHIN5996', role:'Créateur', followers:'215 followers'},
  {name:'c_djo', display:'C_DJO', role:'Membre', followers:'475 followers'},
  {name:'manimang0', display:'MANIMANG0', role:'Membre', followers:'3 followers'},
  {name:'fandeipromxtrollmod', display:'FANDEIPROMXTROLLMOD', role:'Membre', followers:'2 k followers'},
  {name:'theoherlintw', display:'THEOHERLINTW', role:'Membre', followers:'3 followers'},
  {name:'maszoks', display:'MASZOKS', role:'Membre', followers:'1 follower'},
];

const grid = document.getElementById('membersGrid');
const playerBox = document.getElementById('playerBox');
const currentName = document.getElementById('currentName');
const host = window.location.hostname || 'localhost';

function avatarUrl(name){
  // Récupère automatiquement la vraie photo de profil Twitch via un service public.
  return `https://unavatar.io/twitch/${name}`;
}
function twitchPlayer(channel){
  return `https://player.twitch.tv/?channel=${channel}&parent=${host}&muted=true&autoplay=false`;
}
function showChannel(name, display){
  currentName.textContent = display;
  playerBox.innerHTML = `<iframe allowfullscreen="true" scrolling="no" allow="autoplay; fullscreen" src="${twitchPlayer(name)}"></iframe>`;
  document.getElementById('chaine').scrollIntoView({behavior:'smooth'});
}
function openTwitch(name){ window.open(`https://www.twitch.tv/${name}`, '_blank'); }

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
    <button class="secondary" onclick="openTwitch('${member.name}')">Ouvrir Twitch</button>
  `;
  grid.appendChild(card);
});

showChannel('kenshin5996', 'KENSHIN5996');

const clips = [
  { streamer: 'kenshin5996', title: 'Clip kenshin5996 #1', slug: 'BoxySpineyStrawberryTBTacoRight-RVw4ImPXBY7cYFXY', url: 'https://www.twitch.tv/kenshin5996/clip/BoxySpineyStrawberryTBTacoRight-RVw4ImPXBY7cYFXY' },
  { streamer: 'kenshin5996', title: 'Clip kenshin5996 #2', slug: 'AmericanFunDinosaurKeyboardCat-tfmv5WLOv_v63LjV', url: 'https://www.twitch.tv/kenshin5996/clip/AmericanFunDinosaurKeyboardCat-tfmv5WLOv_v63LjV' },
  { streamer: 'c_djo', title: 'Clip c_djo #1', slug: 'EsteemedTriangularShingleGingerPower-yBSuvPj5I32SXtzH', url: 'https://www.twitch.tv/c_djo/clip/EsteemedTriangularShingleGingerPower-yBSuvPj5I32SXtzH' },
  { streamer: 'c_djo', title: 'Clip c_djo #2', slug: 'FairCuriousWolfDeIlluminati-7YO9dvECQFCYz5iY', url: 'https://www.twitch.tv/c_djo/clip/FairCuriousWolfDeIlluminati-7YO9dvECQFCYz5iY' },
  { streamer: 'kenshin5996', title: 'Clip kenshin5996 #3', slug: 'CrowdedArtsyYogurtDxAbomb-ovDudfB44BUi0boP', url: 'https://www.twitch.tv/kenshin5996/clip/CrowdedArtsyYogurtDxAbomb-ovDudfB44BUi0boP' },
];

// Code membre utilisé pour publier un clip et rejoindre le vocal.
const PRIVATE_VOICE_CODE = 'RDM5996';
const PRIVATE_VOICE_ROOM = 'TeamRDMVocalPriveKenshin5996';
const allowedVoiceMembers = team.map(m => m.name.toLowerCase());

let onlineClips = [];
let firebaseReady = false;
let firebaseTools = null;
let clipsCollectionRef = null;
let auth = null;
let currentMember = null;
let usersCollectionRef = null;
let statsDocRef = null;

function clipEmbed(slug){
  return `https://clips.twitch.tv/embed?clip=${encodeURIComponent(slug)}&parent=${host}&autoplay=false`;
}

function cleanText(value){
  const div = document.createElement('div');
  div.textContent = value || '';
  return div.innerHTML;
}

function extractClipSlug(url){
  const text = (url || '').trim();
  if (!text) return '';

  // Liens acceptés :
  // https://www.twitch.tv/chaine/clip/SLUG
  // https://clips.twitch.tv/SLUG
  // https://m.twitch.tv/chaine/clip/SLUG
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
    <a class="clipLink" href="${cleanText(clip.url)}" target="_blank">Ouvrir le clip sur Twitch</a>
  `;
  return card;
}

function renderClips(){
  const clipsGrid = document.getElementById('clipsGrid');
  if (!clipsGrid) return;
  clipsGrid.innerHTML = '';
  [...onlineClips, ...clips].forEach(clip => clipsGrid.appendChild(renderClipCard(clip)));
}

function firebaseConfigIsFilled(config){
  return config && config.apiKey && !String(config.apiKey).includes('REMPLACE_MOI') && config.projectId && !String(config.projectId).includes('REMPLACE_MOI');
}

async function initFirebaseClips(){
  renderClips();
  const config = window.RDM_FIREBASE_CONFIG;
  if (!firebaseConfigIsFilled(config)) {
    console.warn('Firebase non configuré : remplis firebase-config.js pour publier les clips en ligne.');
    return;
  }
  try {
    const appModule = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js');
    const dbModule = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js');
    const authModule = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js');
    const app = appModule.initializeApp(config);
    const db = dbModule.getFirestore(app);
    auth = authModule.getAuth(app);

    if (config.measurementId) {
      try {
        const analyticsModule = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-analytics.js');
        analyticsModule.getAnalytics(app);
      } catch (analyticsError) {
        console.warn('Analytics non chargé :', analyticsError);
      }
    }

    clipsCollectionRef = dbModule.collection(db, 'clips');
    usersCollectionRef = dbModule.collection(db, 'users');
    statsDocRef = dbModule.doc(db, 'stats', 'site');
    firebaseTools = { ...dbModule, ...authModule };
    firebaseReady = true;

    setupAuthListener();
    trackVisit();
    listenStats();

    const q = dbModule.query(clipsCollectionRef, dbModule.orderBy('createdAt', 'desc'));
    dbModule.onSnapshot(q, snapshot => {
      onlineClips = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      renderClips();
    }, error => {
      console.error(error);
      alert('Firebase est connecté, mais Firestore refuse la lecture. Vérifie les règles Firestore.');
    });
  } catch (error) {
    console.error(error);
    alert('Erreur Firebase : vérifie firebase-config.js, Authentication et Firestore.');
  }
}

function updateAuthStatus(){
  const box = document.getElementById('authStatus');
  if (!box) return;
  if (currentMember) {
    box.textContent = `Connecté : ${currentMember.pseudo} (${currentMember.email})`;
    box.classList.add('connected');
  } else {
    box.textContent = 'Non connecté';
    box.classList.remove('connected');
  }
}

function setupAuthListener(){
  if (!auth || !firebaseTools) return;
  firebaseTools.onAuthStateChanged(auth, async user => {
    if (!user) {
      currentMember = null;
      updateAuthStatus();
      return;
    }
    try {
      const userRef = firebaseTools.doc(usersCollectionRef, user.uid);
      const snap = await firebaseTools.getDoc(userRef);
      currentMember = snap.exists() ? snap.data() : { email: user.email, pseudo: user.email };
      currentMember.uid = user.uid;
      currentMember.email = user.email;
      updateAuthStatus();
    } catch (error) {
      console.error(error);
      currentMember = { uid: user.uid, email: user.email, pseudo: user.email };
      updateAuthStatus();
    }
  });
}

async function signUpMember(){
  if (!firebaseReady || !auth || !firebaseTools) {
    alert('Firebase n’est pas prêt. Vérifie firebase-config.js.');
    return;
  }
  const pseudo = (document.getElementById('signupPseudo').value || '').trim().toLowerCase();
  const email = (document.getElementById('signupEmail').value || '').trim();
  const password = (document.getElementById('signupPassword').value || '').trim();
  const code = (document.getElementById('signupCode').value || '').trim();

  if (!allowedVoiceMembers.includes(pseudo)) {
    alert('Accès refusé : ce pseudo n’est pas dans la TEAM RDM.');
    return;
  }
  if (code !== PRIVATE_VOICE_CODE) {
    alert('Code membre incorrect.');
    return;
  }
  if (!email || password.length < 6) {
    alert('Mets un email valide et un mot de passe de 6 caractères minimum.');
    return;
  }

  try {
    const result = await firebaseTools.createUserWithEmailAndPassword(auth, email, password);
    await firebaseTools.setDoc(firebaseTools.doc(usersCollectionRef, result.user.uid), {
      pseudo,
      email,
      role: pseudo === 'kenshin5996' ? 'admin' : 'membre',
      createdAt: firebaseTools.serverTimestamp()
    });
    await firebaseTools.setDoc(statsDocRef, { members: firebaseTools.increment(1) }, { merge: true });
    alert('Compte créé et connecté !');
  } catch (error) {
    console.error(error);
    alert('Inscription impossible : active Email/Password dans Firebase Authentication.');
  }
}

async function loginMember(){
  if (!firebaseReady || !auth || !firebaseTools) {
    alert('Firebase n’est pas prêt.');
    return;
  }
  const email = (document.getElementById('loginEmail').value || '').trim();
  const password = (document.getElementById('loginPassword').value || '').trim();
  try {
    await firebaseTools.signInWithEmailAndPassword(auth, email, password);
    alert('Connecté !');
  } catch (error) {
    console.error(error);
    alert('Connexion impossible : email ou mot de passe incorrect, ou Authentication non activé.');
  }
}

async function logoutMember(){
  if (!auth || !firebaseTools) return;
  await firebaseTools.signOut(auth);
  alert('Déconnecté.');
}

async function trackVisit(){
  if (!firebaseReady || !firebaseTools || !statsDocRef) return;
  const today = new Date().toISOString().slice(0, 10);
  const key = `rdm_visit_${today}`;
  if (localStorage.getItem(key)) return;
  localStorage.setItem(key, '1');
  try {
    await firebaseTools.setDoc(statsDocRef, {
      totalVisits: firebaseTools.increment(1),
      [`days.${today}`]: firebaseTools.increment(1),
      lastVisitAt: firebaseTools.serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.warn('Compteur visites non mis à jour :', error);
  }
}

function listenStats(){
  if (!firebaseReady || !firebaseTools || !statsDocRef) return;
  firebaseTools.onSnapshot(statsDocRef, snap => {
    const data = snap.exists() ? snap.data() : {};
    const today = new Date().toISOString().slice(0, 10);
    const totalEl = document.getElementById('statTotalVisits');
    const todayEl = document.getElementById('statTodayVisits');
    const membersEl = document.getElementById('statMembers');
    if (totalEl) totalEl.textContent = data.totalVisits || 0;
    if (todayEl) todayEl.textContent = data.days && data.days[today] ? data.days[today] : 0;
    if (membersEl) membersEl.textContent = data.members || 0;
  });
}


async function publishClip(){
  const title = (document.getElementById('clipTitle').value || '').trim();
  const url = (document.getElementById('clipUrl').value || '').trim();
  const slug = extractClipSlug(url);

  if (!currentMember) {
    alert('Connecte-toi avant de publier un clip.');
    document.getElementById('connexion').scrollIntoView({behavior:'smooth'});
    return;
  }
  const streamer = (currentMember.pseudo || '').toLowerCase();
  if (!allowedVoiceMembers.includes(streamer)) {
    alert('Ton compte n’est pas autorisé à publier.');
    return;
  }
  if (!title) {
    alert('Ajoute un titre pour ton clip.');
    return;
  }
  if (!slug) {
    alert('Lien Twitch invalide. Mets un lien de clip comme : https://www.twitch.tv/chaine/clip/SLUG ou https://clips.twitch.tv/SLUG');
    return;
  }
  if (onlineClips.some(c => c.slug === slug) || clips.some(c => c.slug === slug)) {
    alert('Ce clip est déjà publié.');
    return;
  }
  if (!firebaseReady || !clipsCollectionRef || !firebaseTools) {
    alert('Firebase n’est pas encore configuré. Remplis firebase-config.js puis republie le site.');
    return;
  }

  try {
    await firebaseTools.addDoc(clipsCollectionRef, {
      streamer,
      title,
      slug,
      url,
      uid: currentMember.uid || '',
      createdAt: firebaseTools.serverTimestamp()
    });

    document.getElementById('clipTitle').value = '';
    document.getElementById('clipUrl').value = '';
    alert('Clip publié en ligne ! Toute la team peut le voir.');
  } catch (error) {
    console.error(error);
    alert('Impossible de publier : vérifie les règles Firestore.');
  }
}


function clearMyPublishedClips(){
  alert('Avec Firebase, les clips sont en ligne. Pour supprimer un clip, va dans Firebase > Firestore Database > collection clips.');
}

initFirebaseClips();

// Vocal privé TEAM RDM
// Pour changer le code membre, modifie la ligne PRIVATE_VOICE_CODE plus haut.

function joinPrivateVoice(){
  const nameInput = document.getElementById('voiceName');
  const codeInput = document.getElementById('voiceCode');
  const roomBox = document.getElementById('voiceRoom');
  const frame = document.getElementById('voiceFrame');
  const pseudo = (nameInput.value || '').trim().toLowerCase();
  const code = (codeInput.value || '').trim();

  if(!allowedVoiceMembers.includes(pseudo)){
    alert('Accès refusé : ce pseudo n’est pas dans la TEAM RDM.');
    return;
  }
  if(code !== PRIVATE_VOICE_CODE){
    alert('Code membre incorrect. Demande le code au créateur kenshin5996.');
    return;
  }

  const displayName = encodeURIComponent(pseudo);
  frame.src = `https://meet.jit.si/${PRIVATE_VOICE_ROOM}#userInfo.displayName="${displayName}"&config.prejoinPageEnabled=false&config.startWithVideoMuted=true&config.startAudioOnly=true`;
  roomBox.style.display = 'block';
  document.getElementById('vocal').scrollIntoView({behavior:'smooth'});
}

function leavePrivateVoice(){
  const frame = document.getElementById('voiceFrame');
  frame.src = '';
  document.getElementById('voiceRoom').style.display = 'none';
}
