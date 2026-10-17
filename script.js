const team = [
  {name:'kenshin5996', display:'KENSHIN5996', role:'Créateur', followers:'216 followers', logo:'https://unavatar.io/twitch/kenshin5996'},
  {name:'c_djo', display:'C_DJO', role:'Membre', followers:'475 followers', logo:'https://unavatar.io/twitch/c_djo'},
  {name:'manimang0', display:'MANIMANG0', role:'Membre', followers:'3 followers', logo:'https://unavatar.io/twitch/manimang0'},
  {name:'fandeipromxtrollmod', display:'FANDEIPROMXTROLLMOD', role:'Membre', followers:'2 k followers', logo:'https://unavatar.io/twitch/fandeipromxtrollmod'},
  {name:'theoherlintw', display:'THEOHERLINTW', role:'Membre', followers:'6 followers', logo:'https://unavatar.io/twitch/theoherlintw'},
  {name:'maszoks', display:'MASZOKS', role:'Membre', followers:'1 follower', logo:'assets/maszoks.png'},
];

const PRIVATE_VOICE_CODE = 'RDM59968';
const PRIVATE_VOICE_ROOM = 'TeamRDMVocalPriveKenshin5996';
const allowedMembers = team.map(m => m.name.toLowerCase());
const host = window.location.hostname || 'localhost';
let liveStatuses = {};
let onlineClips = [];
let dbTools = null;
let dbRef = null;
let firebaseReady = false;
const sessionId = localStorage.getItem('rdm_session_id') || (Date.now() + '_' + Math.random().toString(36).slice(2));
localStorage.setItem('rdm_session_id', sessionId);

const defaultClips = [
  { streamer: 'kenshin5996', title: 'Clip kenshin5996 #1', slug: 'BoxySpineyStrawberryTBTacoRight-RVw4ImPXBY7cYFXY', url: 'https://www.twitch.tv/kenshin5996/clip/BoxySpineyStrawberryTBTacoRight-RVw4ImPXBY7cYFXY' },
  { streamer: 'kenshin5996', title: 'Clip kenshin5996 #2', slug: 'AmericanFunDinosaurKeyboardCat-tfmv5WLOv_v63LjV', url: 'https://www.twitch.tv/kenshin5996/clip/AmericanFunDinosaurKeyboardCat-tfmv5WLOv_v63LjV' },
  { streamer: 'c_djo', title: 'Clip c_djo #1', slug: 'EsteemedTriangularShingleGingerPower-yBSuvPj5I32SXtzH', url: 'https://www.twitch.tv/c_djo/clip/EsteemedTriangularShingleGingerPower-yBSuvPj5I32SXtzH' },
];

function $(id){ return document.getElementById(id); }
function clean(value){ const d = document.createElement('div'); d.textContent = value || ''; return d.innerHTML; }
function memberByName(name){ return team.find(m => m.name === String(name).toLowerCase()); }
function avatarUrl(name){ return (memberByName(name)?.logo) || `https://unavatar.io/twitch/${name}`; }
function twitchPlayer(channel){ return `https://player.twitch.tv/?channel=${channel}&parent=${host}&muted=true&autoplay=false`; }
function clipEmbed(slug){ return `https://clips.twitch.tv/embed?clip=${encodeURIComponent(slug)}&parent=${host}&autoplay=false`; }

function showChannel(name, display){
  $('currentName').textContent = display;
  $('playerBox').innerHTML = `<iframe title="Live Twitch ${display}" allowfullscreen="true" scrolling="no" allow="autoplay; fullscreen" src="${twitchPlayer(name)}"></iframe>`;

  // Chat Twitch officiel associé au membre sélectionné (aucun chat séparé/Firebase).
  let chatBox = $('rdmTwitchChatBox');
  if(!chatBox){
    chatBox = document.createElement('section');
    chatBox.id = 'rdmTwitchChatBox';
    chatBox.style.cssText = 'box-sizing:border-box;width:min(360px,100%);margin:12px 0 12px auto;padding:10px;background:linear-gradient(145deg,#070d1a,#100a25);border:1px solid #00c8ff;border-radius:12px;color:#f4f7ff;box-shadow:0 0 16px #168bff33, inset 0 0 12px #6d28d911;overflow:hidden;';
    const title = document.createElement('h3');
    title.id = 'rdmTwitchChatTitle';
    title.style.cssText = 'margin:0 0 5px;font-size:.9rem;line-height:1.3;color:#7dddff;text-shadow:0 0 8px #168bff55;';
    title.textContent = '💬 Chat Twitch officiel';
    const note = document.createElement('p');
    note.id = 'rdmTwitchChatNote';
    note.style.cssText = 'margin:0 0 7px;font-size:.72rem;line-height:1.35;color:#b9c6df;';
    note.textContent = 'Connecte-toi à Twitch dans le chat pour envoyer des messages. Les règles et la modération de Twitch s’appliquent.';
    const frame = document.createElement('iframe');
    frame.id = 'rdmTwitchChatFrame';
    frame.title = 'Chat Twitch officiel';
    frame.loading = 'lazy';
    frame.style.cssText = 'display:block;width:100%;height:245px;border:1px solid #29254a;border-radius:7px;background:#080d1b;';
    frame.setAttribute('allow', 'clipboard-read; clipboard-write');
    chatBox.append(title, note, frame);
    const player = $('playerBox');
    player.insertAdjacentElement('afterend', chatBox);
  }
  $('rdmTwitchChatTitle').textContent = `💬 Chat officiel de ${display}`;
  $('rdmTwitchChatFrame').src = `https://www.twitch.tv/embed/${encodeURIComponent(name)}/chat?parent=${encodeURIComponent(host)}`;
  $('chaine').scrollIntoView({behavior:'smooth'});
}
function openTwitch(name){ window.open(`https://www.twitch.tv/${name}`, '_blank'); }

function renderMembers(){
  const grid = $('membersGrid'); if (!grid) return; grid.innerHTML = '';
  team.forEach(member => {
    const st = liveStatuses[member.name];
    const card = document.createElement('article');
    card.className = 'memberCard';
    card.innerHTML = `
      <span class="badge ${member.role === 'Créateur' ? 'creator' : ''}">${member.role}</span>
      <img class="avatar" src="${avatarUrl(member.name)}" alt="Profil Twitch ${member.display}" onerror="this.src='assets/wolf-logo.png'" />
      <h3 title="${member.display}">${member.display}</h3>
      <p class="followers">${member.followers}</p>
      <p class="status ${st && st.live ? 'statusLive' : ''}">${st && st.live ? '🔴 EN DIRECT' : '● Profil Twitch'}</p>
      <button onclick="showChannel('${member.name}', '${member.display}')">Afficher sur le site</button>
      <button class="secondary" onclick="openTwitch('${member.name}')">Ouvrir Twitch</button>`;
    grid.appendChild(card);
  });
}

function renderLiveCards(){
  const grid = $('liveGrid'); if (!grid) return;
  const liveMembers = team.filter(m => liveStatuses[m.name]?.live);
  const count = liveMembers.length;
  $('liveSummary').textContent = count > 0 ? `🔴 ${count} membre(s) en live maintenant` : '⚫ Aucun membre en live pour le moment';
  grid.innerHTML = '';
  if (count === 0) {
    const empty = document.createElement('div');
    empty.className = 'emptyLive';
    empty.textContent = 'Aucun membre en live actuellement. Les lives apparaîtront ici automatiquement.';
    grid.appendChild(empty);
    renderMembers();
    return;
  }
  liveMembers.forEach(member => {
    const st = liveStatuses[member.name];
    const card = document.createElement('article');
    card.className = 'liveCard';
    card.innerHTML = `
      <div class="liveCardTop">
        <img class="liveAvatar" src="${avatarUrl(member.name)}" onerror="this.src='assets/wolf-logo.png'" alt="${member.display}">
        <div><h3 class="liveName">${member.display}</h3><span class="liveState">🔴 EN DIRECT</span></div>
      </div>
      <p class="liveDetails">${clean(st.text)}</p>
      <div class="liveActions">
        <button onclick="showChannel('${member.name}', '${member.display}')">Regarder sur le site</button>
        <a href="https://www.twitch.tv/${member.name}" target="_blank" rel="noopener">Ouvrir Twitch</a>
      </div>`;
    grid.appendChild(card);
  });
  renderMembers();
}

async function checkLiveStatus(member){
  try{
    const ctrl = new AbortController();
    const timer = setTimeout(()=>ctrl.abort(), 7000);
    const res = await fetch(`https://decapi.me/twitch/uptime/${encodeURIComponent(member.name)}`, {signal:ctrl.signal, cache:'no-store'});
    clearTimeout(timer);
    const text = (await res.text()).trim();
    const offline = /offline|not live|not streaming|does not exist|not found/i.test(text);
    liveStatuses[member.name] = (!offline && text) ? {live:true, text:`En live depuis ${text}`} : {live:false, text:'Pas en live pour le moment'};
  }catch(e){
    liveStatuses[member.name] = {live:false, text:'Statut live indisponible'};
  }
}
async function checkAllLiveStatus(manual){
  $('liveSummary').textContent = manual ? 'Actualisation des lives...' : 'Vérification des lives...';
  await Promise.all(team.map(checkLiveStatus));
  renderLiveCards();
}

function extractClipSlug(url){
  const text = (url || '').trim();
  const match = text.match(/(?:twitch\.tv\/[\w-]+\/clip\/|clips\.twitch\.tv\/)([A-Za-z0-9_-]+)/i);
  return match ? match[1] : '';
}
function renderClipCard(clip){
  const card=document.createElement('article');
  card.className='clipCard';
  card.innerHTML=`
    <div class="clipHeader">
      <img src="${avatarUrl(clip.streamer)}" onerror="this.src='assets/wolf-logo.png'" alt="${clean(clip.streamer)}">
      <div><h3>${clean(clip.title)}</h3><p>${clean(clip.streamer)}</p></div>
    </div>
    <iframe src="${clipEmbed(clip.slug)}" allowfullscreen="true" allow="autoplay; fullscreen"></iframe>
    <a class="clipLink" href="${clean(clip.url)}" target="_blank" rel="noopener">Ouvrir le clip sur Twitch</a>`;
  return card;
}
function renderClips(){ const grid=$('clipsGrid'); if(!grid)return; grid.innerHTML=''; [...onlineClips,...defaultClips].forEach(c=>grid.appendChild(renderClipCard(c))); }

function configOk(){ const c = window.RDM_FIREBASE_CONFIG; return c && c.apiKey && c.projectId && !String(c.apiKey).includes('REMPLACE_MOI'); }
async function initFirebase(){
  renderClips();
  if(!configOk()){ $('firebaseStatus').textContent='Firebase config manquante'; $('statsStatus').textContent='Compteur local'; loadLocalVisits(); return; }
  try{
    const appModule = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js');
    const fs = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js');
    const app = appModule.initializeApp(window.RDM_FIREBASE_CONFIG); const db = fs.getFirestore(app);
    dbTools = fs; dbRef = db; firebaseReady = true;
    $('firebaseStatus').textContent='Connecté ✅'; $('statsStatus').textContent='Connecté ✅';
    fs.onSnapshot(fs.query(fs.collection(db,'clips'), fs.orderBy('createdAt','desc')), snap => {
      onlineClips=snap.docs.map(doc=>({id:doc.id,...doc.data()})).filter(c=>c.slug);
      renderClips();
    }, err => { console.error(err); $('firebaseStatus').textContent='Firestore bloque les clips'; });
    await recordVisitAndPresence(fs, db);
  }catch(err){ console.error(err); $('firebaseStatus').textContent='Erreur Firebase'; $('statsStatus').textContent='Compteur local'; loadLocalVisits(); }
}
function loadLocalVisits(){
  const today = new Date().toISOString().slice(0,10);
  const key = 'rdm_local_visit_' + today;
  let total = Number(localStorage.getItem('rdm_total_visits') || '0');
  if(!localStorage.getItem(key)){ total++; localStorage.setItem('rdm_total_visits', String(total)); localStorage.setItem(key,'1'); }
  $('totalVisits').textContent = String(total);
  $('todayVisits').textContent = '1';
  $('onlineVisitors').textContent = '1';
}
async function recordVisitAndPresence(fs, db){
  const today = new Date().toISOString().slice(0,10);
  const visitKey = 'rdm_visit_' + today;
  if(!localStorage.getItem(visitKey)){
    await fs.addDoc(fs.collection(db,'visits'), {day:today, page:location.pathname, createdAt:fs.serverTimestamp()});
    localStorage.setItem(visitKey,'1');
  }
  fs.onSnapshot(fs.collection(db,'visits'), snap => {
    let total=0, todayCount=0;
    snap.forEach(d=>{ total++; if(d.data().day===today) todayCount++; });
    $('totalVisits').textContent=String(total); $('todayVisits').textContent=String(todayCount);
  });
  const presenceDoc = fs.doc(db, 'presence', sessionId);
  async function heartbeat(){ try{ await fs.setDoc(presenceDoc, {page:location.pathname, lastSeen:Date.now(), updatedAt:fs.serverTimestamp()}, {merge:true}); }catch(e){ console.error(e); } }
  await heartbeat(); setInterval(heartbeat, 25000);
  fs.onSnapshot(fs.collection(db,'presence'), snap => {
    const now=Date.now(); let online=0;
    snap.forEach(d=>{ if((d.data().lastSeen||0) > now - 70000) online++; });
    $('onlineVisitors').textContent=String(online);
  });
}

async function publishClip(){
  const streamer=($('clipStreamer').value||'').trim().toLowerCase();
  const title=($('clipTitle').value||'').trim();
  const url=($('clipUrl').value||'').trim();
  const code=($('clipCode').value||'').trim();
  const slug=extractClipSlug(url);
  if(!allowedMembers.includes(streamer)) return alert('Identifiant refusé : ce pseudo n’est pas dans la TEAM RDM.');
  if(code!==PRIVATE_VOICE_CODE) return alert('Mot de passe incorrect.');
  if(!title) return alert('Ajoute le titre du clip.');
  if(!slug) return alert('Lien de clip Twitch invalide.');
  if([...onlineClips,...defaultClips].some(c=>c.slug===slug)) return alert('Ce clip est déjà publié.');
  if(!firebaseReady || !dbTools || !dbRef) return alert('Firebase pas prêt : recharge la page ou vérifie firebase-config.js.');
  try{
    await dbTools.addDoc(dbTools.collection(dbRef,'clips'), {streamer,title,slug,url,createdAt:dbTools.serverTimestamp()});
    $('clipTitle').value=''; $('clipUrl').value=''; $('clipCode').value=''; alert('Clip publié ✅');
  }catch(err){ console.error(err); alert('Impossible de publier : vérifie les règles Firestore.'); }
}
function joinPrivateVoice(){
  const pseudo=($('voiceName').value||'').trim().toLowerCase();
  const code=($('voiceCode').value||'').trim();
  if(!allowedMembers.includes(pseudo)) return alert('Accès refusé : ce pseudo n’est pas dans la TEAM RDM.');
  if(code!==PRIVATE_VOICE_CODE) return alert('Code membre incorrect.');
  const displayName=encodeURIComponent(pseudo);
  $('voiceFrame').src=`https://meet.jit.si/${PRIVATE_VOICE_ROOM}#userInfo.displayName="${displayName}"&config.prejoinPageEnabled=false&config.startWithVideoMuted=true&config.startAudioOnly=true`;
  $('voiceRoom').style.display='block'; $('vocal').scrollIntoView({behavior:'smooth'});
}
function leavePrivateVoice(){ $('voiceFrame').src=''; $('voiceRoom').style.display='none'; }

const menuBtn = $('menuBtn');
if(menuBtn){ menuBtn.addEventListener('click', () => $('navLinks').classList.toggle('open')); }
renderMembers();
renderLiveCards();
showChannel('kenshin5996','KENSHIN5996');
checkAllLiveStatus(false);
setInterval(()=>checkAllLiveStatus(false), 120000);
initFirebase();


/* Assistant TEAM RDM — réponses prédéfinies + candidature par e-mail */
(function(){
  if(document.getElementById('rdmHelpButton')) return;
  const mail='kenshin5996pro@gmail.com';
  const style=document.createElement('style');
  style.textContent=`#rdmHelpButton{position:fixed;right:22px;bottom:22px;z-index:9998;border:1px solid #32c8ff;border-radius:999px;padding:14px 19px;background:linear-gradient(135deg,#061b35,#24104a);color:#fff;font-weight:800;box-shadow:0 0 22px #168bff88;cursor:pointer}#rdmHelpPanel{position:fixed;right:18px;bottom:82px;z-index:9999;width:min(360px,calc(100vw - 28px));max-height:78vh;overflow:auto;background:#080d1b;color:#f4f7ff;border:1px solid #278cff;border-radius:16px;box-shadow:0 0 28px #4b35ff66;font:14px/1.45 Arial,sans-serif}#rdmHelpPanel *{box-sizing:border-box}#rdmHelpPanel header{padding:14px;background:linear-gradient(100deg,#062747,#30104f);font-size:17px;font-weight:bold;color:#7dddff}#rdmHelpPanel .rdmBody{padding:13px}#rdmHelpPanel button,#rdmHelpPanel a.rdmBtn{display:inline-block;border:1px solid #248fff;border-radius:9px;padding:9px 11px;background:#101f3d;color:#fff;cursor:pointer;text-decoration:none;margin:4px 3px 4px 0}#rdmHelpPanel label{display:block;margin:9px 0 4px;color:#b8dfff}#rdmHelpPanel input,#rdmHelpPanel textarea,#rdmHelpPanel select{width:100%;padding:9px;border-radius:8px;border:1px solid #344b72;background:#101629;color:#fff;font:inherit}#rdmHelpPanel textarea{min-height:70px;resize:vertical}#rdmHelpPanel .rdmHidden{display:none}#rdmHelpPanel .rdmClose{float:right;background:transparent;border:0;font-size:20px;padding:0 6px}`;
  document.head.appendChild(style);
  const launcher=document.createElement('button');launcher.id='rdmHelpButton';launcher.textContent='💬 Assistant RDM';launcher.setAttribute('aria-expanded','false');
  const panel=document.createElement('section');panel.id='rdmHelpPanel';panel.className='rdmHidden';panel.innerHTML=`<header>🐺 Assistant TEAM RDM <button class="rdmClose" id="rdmClose" aria-label="Fermer">×</button></header><div class="rdmBody"><p>Salut ! Je peux t’expliquer la team ou t’aider à préparer une candidature.</p><button id="rdmRules">📜 Règlement</button><button id="rdmSupport">💙 Soutenir la team</button><button id="rdmApply">📝 Candidater</button><button id="rdmGta">🎮 Crews GTA</button><div id="rdmAnswer" aria-live="polite"></div><form id="rdmApplyForm" class="rdmHidden"><p><b>Candidature TEAM RDM</b><br>Il faut au moins 100 followers Twitch et être affilié. Vérifie que tes informations sont exactes.</p><label for="rdmPseudo">Pseudo Twitch</label><input id="rdmPseudo" required maxlength="100" placeholder="TonPseudo"><label for="rdmChannel">Lien de ta chaîne Twitch</label><input id="rdmChannel" type="url" required placeholder="https://www.twitch.tv/tonpseudo"><label for="rdmFollowers">Nombre de followers</label><input id="rdmFollowers" type="number" min="0" required><label for="rdmAffil">Es-tu affilié Twitch ?</label><select id="rdmAffil" required><option value="">Choisir…</option><option>Oui</option><option>Non</option><option>En cours</option></select><label for="rdmGames">Jeux joués</label><input id="rdmGames" required placeholder="Call of Duty, GTA…"><label for="rdmMotivation">Ta motivation</label><textarea id="rdmMotivation" required maxlength="1500" placeholder="Pourquoi veux-tu rejoindre la team ?"></textarea><button type="submit">✉️ Préparer l’e-mail</button><p id="rdmMailHint">Ton application de messagerie va s’ouvrir. Tu devras appuyer sur Envoyer.</p></form></div>`;
  document.body.append(launcher,panel);
  const $=id=>document.getElementById(id);
  launcher.addEventListener('click',()=>{panel.classList.toggle('rdmHidden');launcher.setAttribute('aria-expanded',String(!panel.classList.contains('rdmHidden')))});
  $('rdmClose').addEventListener('click',()=>panel.classList.add('rdmHidden'));
  $('rdmRules').addEventListener('click',()=>{$('rdmAnswer').innerHTML='<p><b>Règlement TEAM RDM</b><br>Respecte tous les membres, reste fair-play, évite les insultes et la triche, respecte les consignes du créateur. Pour les jeux de la team, utilise le tag RDM quand cela est demandé, notamment sur Call of Duty et les autres jeux concernés. Une candidature est examinée par le créateur.</p>';$('rdmApplyForm').classList.add('rdmHidden')});
  $('rdmSupport').addEventListener('click',()=>{$('rdmAnswer').innerHTML='<p>💙 Ce site sert à soutenir la TEAM RDM ! N’hésite pas à follow les membres sur Twitch et à leur faire un petit coucou pendant leurs lives.</p>';$('rdmApplyForm').classList.add('rdmHidden')});
  $('rdmGta').addEventListener('click',()=>{$('rdmAnswer').innerHTML='<p><b>Crews GTA</b><br><a class="rdmBtn" target="_blank" rel="noopener" href="https://socialclub.rockstargames.com/crew/team_rdmm/hierarchy">TEAM RDMM</a><a class="rdmBtn" target="_blank" rel="noopener" href="https://socialclub.rockstargames.com/crew/army-dz59/hierarchy">ARMY-DZ59</a></p>';$('rdmApplyForm').classList.add('rdmHidden')});
  $('rdmApply').addEventListener('click',()=>{$('rdmAnswer').textContent='';$('rdmApplyForm').classList.toggle('rdmHidden')});
  $('rdmApplyForm').addEventListener('submit',e=>{
    e.preventDefault();
    const pseudo=$('rdmPseudo').value.trim();
    const channel=$('rdmChannel').value.trim();
    const followers=$('rdmFollowers').value;
    const affiliation=$('rdmAffil').value;
    const games=$('rdmGames').value.trim();
    const motivation=$('rdmMotivation').value.trim();
    const hint=$('rdmMailHint');
    if(!/^https?:\/\/(www\.)?twitch\.tv\/[A-Za-z0-9_]+\/?$/i.test(channel)){
      hint.textContent='Le lien Twitch ne semble pas valide. Exemple : https://www.twitch.tv/tonpseudo';
      $('rdmChannel').focus(); return;
    }
    const subject='Candidature TEAM RDM - '+pseudo;
    const body='Bonjour KENSHIN5996,\n\nJe souhaite rejoindre la TEAM RDM.\n\nPseudo Twitch : '+pseudo+'\nChaîne Twitch : '+channel+'\nFollowers : '+followers+'\nAffilié Twitch : '+affiliation+'\nJeux joués : '+games+'\nMotivation : '+motivation+'\n\nJe confirme que ces informations sont exactes.\n';
    const gmailUrl='https://mail.google.com/mail/?view=cm&fs=1&to='+encodeURIComponent(mail)+'&su='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body);
    hint.textContent='Ouverture de Gmail… Si rien ne s’ouvre, utilise le bouton Gmail ci-dessous.';
    let fallback=$('rdmGmailFallback');
    if(!fallback){fallback=document.createElement('a');fallback.id='rdmGmailFallback';fallback.className='rdmBtn';fallback.target='_blank';fallback.rel='noopener noreferrer';fallback.textContent='Ouvrir Gmail avec ma candidature';hint.insertAdjacentElement('afterend',fallback);}
    fallback.href=gmailUrl;
    const opened=window.open(gmailUrl,'_blank','noopener');
    if(!opened){hint.textContent='Le navigateur a bloqué la fenêtre. Clique sur « Ouvrir Gmail avec ma candidature ».';}
    else {hint.textContent='Gmail a été ouvert. Vérifie le message puis clique sur Envoyer.';}
  });
})();
