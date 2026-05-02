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

const defaultClips = [
  { streamer: 'kenshin5996', title: 'Clip kenshin5996 #1', slug: 'BoxySpineyStrawberryTBTacoRight-RVw4ImPXBY7cYFXY', url: 'https://www.twitch.tv/kenshin5996/clip/BoxySpineyStrawberryTBTacoRight-RVw4ImPXBY7cYFXY' },
  { streamer: 'kenshin5996', title: 'Clip kenshin5996 #2', slug: 'AmericanFunDinosaurKeyboardCat-tfmv5WLOv_v63LjV', url: 'https://www.twitch.tv/kenshin5996/clip/AmericanFunDinosaurKeyboardCat-tfmv5WLOv_v63LjV' },
  { streamer: 'c_djo', title: 'Clip c_djo #1', slug: 'EsteemedTriangularShingleGingerPower-yBSuvPj5I32SXtzH', url: 'https://www.twitch.tv/c_djo/clip/EsteemedTriangularShingleGingerPower-yBSuvPj5I32SXtzH' },
  { streamer: 'c_djo', title: 'Clip c_djo #2', slug: 'FairCuriousWolfDeIlluminati-7YO9dvECQFCYz5iY', url: 'https://www.twitch.tv/c_djo/clip/FairCuriousWolfDeIlluminati-7YO9dvECQFCYz5iY' },
  { streamer: 'kenshin5996', title: 'Clip kenshin5996 #3', slug: 'CrowdedArtsyYogurtDxAbomb-ovDudfB44BUi0boP', url: 'https://www.twitch.tv/kenshin5996/clip/CrowdedArtsyYogurtDxAbomb-ovDudfB44BUi0boP' },
];

let onlineClips = [];
let dbTools = null;
let firestoreDb = null;
let clipsCollectionRef = null;
let ordersCollectionRef = null;
let firebaseReady = false;

// Mets ici ton lien Stripe Payment Link quand ton produit est prêt.
// Exemple : const STRIPE_PAYMENT_LINK = 'https://buy.stripe.com/xxxx';
const STRIPE_PAYMENT_LINK = '';
const SHOP_AVAILABLE = false;

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
    firestoreDb = db;
    clipsCollectionRef = fs.collection(db, 'clips');
    ordersCollectionRef = fs.collection(db, 'orders');
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
    if ($('orderStatus')) $('orderStatus').textContent = 'Firebase non connecté';
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


function setShopAvailability(){
  const btn = $('orderButton');
  const payInfo = $('paymentInfo');
  if ($('orderStatus')) $('orderStatus').textContent = SHOP_AVAILABLE ? 'Disponible ✅' : 'Bientôt disponible 🚧';
  if (!btn) return;
  btn.textContent = SHOP_AVAILABLE ? 'Commander et payer par carte' : 'Demande / ticket de réservation';
  if (payInfo) payInfo.textContent = SHOP_AVAILABLE
    ? 'Paiement sécurisé par Stripe. Aucune carte bancaire n’est stockée sur le site TEAM RDM.'
    : 'Le produit n’est pas encore en vente. Le formulaire crée un ticket de demande sans paiement.';
}

function validEmail(email){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }
function orderValue(id){ const el = $(id); return el ? (el.value || '').trim() : ''; }

async function sendOrder(){
  const pseudo = orderValue('orderPseudo');
  const email = orderValue('orderEmail');
  const phone = orderValue('orderPhone');
  const version = orderValue('orderVersion');
  const fullName = orderValue('orderFullName');
  const address = orderValue('orderAddress');
  const postalCode = orderValue('orderPostalCode');
  const city = orderValue('orderCity');
  const country = orderValue('orderCountry') || 'France';
  const message = orderValue('orderMessage');

  if (!pseudo || !email || !fullName || !address || !postalCode || !city) {
    return alert('Remplis pseudo, email, nom, adresse, code postal et ville.');
  }
  if (!validEmail(email)) return alert('Adresse email invalide.');
  if (!firebaseReady || !dbTools || !ordersCollectionRef) return alert('Firebase pas encore prêt. Recharge la page.');

  try {
    const order = {
      status: SHOP_AVAILABLE ? 'en_attente_paiement' : 'reservation_bientot_disponible',
      product: 'Sticker PS5 TEAM RDM Edition',
      version,
      pseudo,
      email,
      phone,
      fullName,
      address,
      postalCode,
      city,
      country,
      message,
      paymentProvider: SHOP_AVAILABLE ? 'Stripe Payment Link' : 'Aucun paiement',
      createdAt: dbTools.serverTimestamp()
    };
    const ref = await dbTools.addDoc(ordersCollectionRef, order);

    ['orderPseudo','orderEmail','orderPhone','orderFullName','orderAddress','orderPostalCode','orderCity','orderMessage'].forEach(id => { if ($(id)) $(id).value = ''; });
    if ($('orderTicket')) $('orderTicket').textContent = 'Ticket commande créé : ' + ref.id;

    if (SHOP_AVAILABLE) {
      if (!STRIPE_PAYMENT_LINK) {
        alert('Ticket créé ✅ Ajoute ton lien Stripe dans script.js pour activer le paiement par carte. Ticket : ' + ref.id);
        return;
      }
      const sep = STRIPE_PAYMENT_LINK.includes('?') ? '&' : '?';
      const payUrl = STRIPE_PAYMENT_LINK + sep + 'prefilled_email=' + encodeURIComponent(email) + '&client_reference_id=' + encodeURIComponent(ref.id);
      window.location.href = payUrl;
      return;
    }

    alert('Ticket enregistré ✅ Tu pourras contacter la personne quand les stickers seront disponibles.');
  } catch (err) {
    console.error(err);
    alert('Impossible d’enregistrer la commande. Vérifie les règles Firestore pour orders.');
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
setShopAvailability();
showChannel('kenshin5996', 'KENSHIN5996');
initFirebase();
