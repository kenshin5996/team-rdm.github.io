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
  $('playerBox').innerHTML = `<iframe allowfullscreen="true" scrolling="no" allow="autoplay; fullscreen" src="${twitchPlayer(name)}"></iframe>`;
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


/* ===== ASSISTANT TEAM RDM (ajout indépendant : ne remplace pas les fonctions du site) ===== */
(function initTeamRDMAssistant(){
  if (document.getElementById('rdmAssistantRoot')) return;

  const root = document.createElement('div');
  root.id = 'rdmAssistantRoot';
  root.innerHTML = `
    <style>
      #rdmAssistantRoot{font-family:Arial,sans-serif;position:fixed;right:20px;bottom:20px;z-index:99999;color:#f5f7ff}
      #rdmAssistantRoot *{box-sizing:border-box}
      #rdmAssistantToggle{border:1px solid #42d9ff;background:linear-gradient(135deg,#101a38,#481a77);color:#fff;border-radius:999px;padding:14px 19px;font-weight:800;box-shadow:0 0 18px #277dff88;cursor:pointer}
      #rdmAssistantPanel{display:none;flex-direction:column;width:min(360px,calc(100vw - 28px));height:min(570px,calc(100vh - 110px));margin-bottom:12px;border:1px solid #4f8cff;border-radius:18px;overflow:hidden;background:#090d1b;box-shadow:0 0 28px #493cff55}
      #rdmAssistantPanel.rdm-open{display:flex}
      .rdm-a-head{padding:15px;background:linear-gradient(120deg,#10264a,#321052);border-bottom:1px solid #344b9c;display:flex;align-items:center;justify-content:space-between}
      .rdm-a-head strong{display:block;color:#7deaff;font-size:16px}.rdm-a-head small{color:#c7cce8}
      #rdmAssistantClose{background:transparent;border:0;color:white;font-size:24px;cursor:pointer}
      #rdmAssistantMessages{padding:13px;overflow:auto;flex:1;display:flex;flex-direction:column;gap:10px}
      .rdm-a-msg{white-space:pre-wrap;overflow-wrap:anywhere;max-width:95%;padding:10px 12px;border-radius:13px;background:#151d34;border:1px solid #293b69;font-size:13px;line-height:1.45}
      .rdm-a-msg.rdm-user{align-self:flex-end;background:#25164a;border-color:#774bda}
      .rdm-a-actions{display:flex;flex-wrap:wrap;gap:7px;padding:0 12px 12px}
      .rdm-a-actions button,.rdm-a-actions a{font-size:12px;text-decoration:none;color:#fff;border:1px solid #4c7bff;background:#111d3b;padding:8px 10px;border-radius:10px;cursor:pointer}
      .rdm-a-actions button:hover,.rdm-a-actions a:hover{background:#30205e}
      #rdmAssistantForm{display:flex;gap:7px;padding:10px;border-top:1px solid #28365f}
      #rdmAssistantInput{min-width:0;flex:1;background:#0e1426;border:1px solid #344875;border-radius:10px;padding:11px;color:white;outline:none}
      #rdmAssistantSend{background:linear-gradient(135deg,#147dff,#743bdb);border:0;color:white;border-radius:10px;padding:0 13px;font-weight:bold;cursor:pointer}
      .rdm-a-ticket{display:grid;gap:8px;width:100%}.rdm-a-ticket label{font-size:12px;color:#d7ddff}.rdm-a-ticket input,.rdm-a-ticket select,.rdm-a-ticket textarea{display:block;width:100%;margin-top:4px;padding:9px;border:1px solid #3b4e80;border-radius:8px;background:#0c1325;color:#fff}.rdm-a-ticket button{padding:10px;border-radius:9px;background:#39216a;border:1px solid #8a63ff;color:#fff;cursor:pointer}
      @media(max-width:480px){#rdmAssistantRoot{right:10px;bottom:10px}#rdmAssistantPanel{width:calc(100vw - 20px);height:min(72vh,570px)}}
    </style>
    <section id="rdmAssistantPanel" aria-label="Assistant TEAM RDM" aria-live="polite">
      <header class="rdm-a-head"><div><strong>🐺 Assistant TEAM RDM</strong><small>Accueil • Infos • Candidature</small></div><button id="rdmAssistantClose" aria-label="Fermer">×</button></header>
      <div id="rdmAssistantMessages"></div>
      <div class="rdm-a-actions" id="rdmAssistantActions">
        <button data-rdm="join">📝 Rejoindre la team</button><button data-rdm="rules">📜 Règlement</button><button data-rdm="gta">🎮 Clans GTA</button><button data-rdm="support">💙 Soutenir la team</button>
      </div>
      <form id="rdmAssistantForm"><input id="rdmAssistantInput" maxlength="300" placeholder="Écris ta question…" autocomplete="off"><button id="rdmAssistantSend" type="submit">➤</button></form>
    </section>
    <button id="rdmAssistantToggle" aria-expanded="false">💬 Assistant RDM</button>`;
  document.body.appendChild(root);

  const panel = root.querySelector('#rdmAssistantPanel');
  const toggle = root.querySelector('#rdmAssistantToggle');
  const messages = root.querySelector('#rdmAssistantMessages');
  const actions = root.querySelector('#rdmAssistantActions');
  const input = root.querySelector('#rdmAssistantInput');

  function addMessage(text, user=false){
    const el=document.createElement('div'); el.className='rdm-a-msg'+(user?' rdm-user':''); el.textContent=text;
    messages.appendChild(el); messages.scrollTop=messages.scrollHeight; return el;
  }
  function addLinks(){
    const el=document.createElement('div'); el.className='rdm-a-msg';
    el.textContent='Crews Rockstar Games :';
    const a=document.createElement('a'); a.href='https://socialclub.rockstargames.com/crew/team_rdmm/hierarchy'; a.target='_blank'; a.rel='noopener noreferrer'; a.textContent='TEAM_RDMM'; a.style.color='#7deaff'; a.style.display='block'; a.style.marginTop='8px';
    const b=document.createElement('a'); b.href='https://socialclub.rockstargames.com/crew/army-dz59/hierarchy'; b.target='_blank'; b.rel='noopener noreferrer'; b.textContent='ARMY-DZ59'; b.style.color='#c9a8ff'; b.style.display='block'; b.style.marginTop='6px';
    el.append(a,b); messages.appendChild(el); messages.scrollTop=messages.scrollHeight;
  }
  function showRules(){
    addMessage("📜 RÈGLEMENT TEAM RDM\\n1. Respecter tous les membres et les autres joueurs.\\n2. Pas d’insultes, de harcèlement, de triche ni de comportement toxique.\\n3. Sur Call of Duty et les autres jeux où tu représentes la team, porte le tag RDM si les règles du jeu le permettent.\\n4. Soutenir les membres : follow leurs chaînes Twitch et passe leur dire bonjour.\\n5. Respecter les consignes du créateur et prévenir en cas de problème.\\n6. Une candidature est vérifiée par le créateur avant toute acceptation.");
  }
  function showSupport(){
    addMessage("💙 Le site sert à soutenir la TEAM RDM ! N’hésite pas à follow les membres Twitch, à regarder leurs lives et à leur faire un petit coucou dans le chat. Merci pour le soutien !");
    if (Array.isArray(window.team)) {
      window.team.forEach(m=>{ if(m.name){ const el=document.createElement('div'); el.className='rdm-a-msg'; const a=document.createElement('a'); a.href='https://www.twitch.tv/'+encodeURIComponent(m.name); a.target='_blank'; a.rel='noopener noreferrer'; a.textContent='Suivre '+(m.display||m.name); a.style.color='#7deaff'; el.appendChild(a); messages.appendChild(el); }});
    } else addMessage("Tu peux retrouver les chaînes dans la section Membres du site.");
  }
  function showJoin(){
    const box=addMessage("📝 CANDIDATURE TEAM RDM");
    const form=document.createElement('form'); form.className='rdm-a-ticket';
    form.innerHTML=`
      <label>Pseudo Twitch <input name="pseudo" required maxlength="30" placeholder="TonPseudo"></label>
      <label>Lien de ta chaîne Twitch <input name="chaine" type="url" required placeholder="https://www.twitch.tv/tonpseudo"></label>
      <label>Nombre de followers <input name="followers" type="number" min="0" required placeholder="100"></label>
      <label>Es-tu affilié Twitch ? <select name="affilie" required><option value="">Choisir…</option><option value="oui">Oui</option><option value="non">Non</option></select></label>
      <label>Jeux auxquels tu joues <input name="jeux" maxlength="120" placeholder="Call of Duty, GTA, autres…"></label>
      <button type="submit">Préparer mon ticket</button>`;
    box.appendChild(form);
    form.addEventListener('submit',ev=>{
      ev.preventDefault(); const fd=new FormData(form);
      const pseudo=String(fd.get('pseudo')||'').trim(), chaine=String(fd.get('chaine')||'').trim();
      const followers=Number(fd.get('followers')), affilie=String(fd.get('affilie')), jeux=String(fd.get('jeux')||'Non précisés');
      let validUrl; try{validUrl=new URL(chaine)}catch{addMessage("Le lien Twitch n’est pas valide. Vérifie l’adresse et réessaie.");return;}
      if(!/^https?:$/.test(validUrl.protocol)||!/(^|\.)twitch\.tv$/i.test(validUrl.hostname)){addMessage("Utilise un lien de chaîne Twitch valide, par exemple https://www.twitch.tv/tonpseudo");return;}
      if(followers<100){addMessage("Merci pour ta candidature ! Pour rejoindre la team, il faut au moins 100 followers. Tu peux revenir quand tu auras atteint ce seuil.");return;}
      if(affilie!=='oui'){addMessage("Merci pour ta demande. L’affiliation Twitch est également demandée pour rejoindre la team. Tu pourras refaire une candidature lorsque tu seras affilié.");return;}
      const ticket=`CANDIDATURE TEAM RDM\\nPseudo Twitch : ${pseudo}\\nChaîne : ${chaine}\\nFollowers déclarés : ${followers}\\nAffilié Twitch : ${affilie}\\nJeux : ${jeux}\\n\\nÀ vérifier par le créateur avant acceptation.`;
      addMessage("✅ Ta candidature remplit les conditions déclarées. Ton ticket est préparé ci-dessous. Il n’est pas envoyé automatiquement : copie-le et transmets-le au créateur pour vérification.");
      const out=document.createElement('textarea'); out.value=ticket; out.readOnly=true; out.rows=6; out.style.cssText='width:100%;margin-top:8px;background:#080e1b;color:#fff;border:1px solid #4c7bff;border-radius:8px;padding:9px';
      const copy=document.createElement('button'); copy.type='button'; copy.textContent='Copier le ticket'; copy.style.cssText='margin-top:8px;padding:9px;background:#30205e;color:#fff;border:1px solid #8a63ff;border-radius:8px;cursor:pointer';
      copy.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(ticket);copy.textContent='Ticket copié !'}catch{out.focus();out.select();copy.textContent='Sélectionne puis copie le texte';}});
      const wrap=document.createElement('div'); wrap.className='rdm-a-msg'; wrap.append(out,copy); messages.appendChild(wrap); form.querySelector('button').disabled=true;
      messages.scrollTop=messages.scrollHeight;
    });
  }
  function answer(text){
    const q=text.toLowerCase();
    if(/rejoin|candidat|inscri|team|recrut/.test(q)) return showJoin();
    if(/r[eè]gle|comport|tag|oblig/.test(q)) return showRules();
    if(/gta|rockstar|crew|clan/.test(q)) return addLinks();
    if(/follow|souten|coucou|bonjour|aider/.test(q)) return showSupport();
    if(/live|stream|twitch|membre/.test(q)) return addMessage("Tu peux consulter les membres et leurs lives dans les sections Membres et En direct du site. Clique sur un profil pour ouvrir sa chaîne Twitch.");
    if(/clip|vocal|code|mot de passe/.test(q)) return addMessage("Les clips et le vocal privé sont réservés aux membres acceptés. Le créateur communique le code privé après validation. Ne partage pas ce code publiquement.");
    addMessage("Salut ! 🐺 Je suis l’assistant TEAM RDM. Je peux t’aider pour une candidature, le règlement, les crews GTA ou le soutien aux chaînes Twitch. Choisis un bouton ci-dessous.");
  }

  toggle.addEventListener('click',()=>{const open=!panel.classList.contains('rdm-open');panel.classList.toggle('rdm-open',open);toggle.setAttribute('aria-expanded',String(open));if(open&&!messages.childElementCount)addMessage("Salut et bienvenue sur le site TEAM RDM ! 🐺 Le site sert à soutenir la team : n’hésite pas à follow les membres et à leur faire un coucou. Comment puis-je t’aider ?");});
  root.querySelector('#rdmAssistantClose').addEventListener('click',()=>{panel.classList.remove('rdm-open');toggle.setAttribute('aria-expanded','false');});
  actions.addEventListener('click',ev=>{const b=ev.target.closest('button[data-rdm]');if(!b)return;({join:showJoin,rules:showRules,gta:addLinks,support:showSupport})[b.dataset.rdm]?.();});
  root.querySelector('#rdmAssistantForm').addEventListener('submit',ev=>{ev.preventDefault();const text=input.value.trim();if(!text)return;addMessage(text,true);input.value='';answer(text);});
})();
