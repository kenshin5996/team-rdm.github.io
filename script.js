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

function clipEmbed(slug){
  return `https://clips.twitch.tv/embed?clip=${encodeURIComponent(slug)}&parent=${host}&autoplay=false`;
}

function cleanText(value){
  const div = document.createElement('div');
  div.textContent = value || '';
  return div.innerHTML;
}

function getSavedClips(){
  try {
    return JSON.parse(localStorage.getItem('rdmPublishedClips') || '[]');
  } catch (e) {
    return [];
  }
}

function saveClips(items){
  localStorage.setItem('rdmPublishedClips', JSON.stringify(items));
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
  [...getSavedClips(), ...clips].forEach(clip => clipsGrid.appendChild(renderClipCard(clip)));
}

function publishClip(){
  const streamer = (document.getElementById('clipStreamer').value || '').trim().toLowerCase();
  const title = (document.getElementById('clipTitle').value || '').trim();
  const url = (document.getElementById('clipUrl').value || '').trim();
  const code = (document.getElementById('clipCode').value || '').trim();
  const slug = extractClipSlug(url);

  if (!allowedVoiceMembers.includes(streamer)) {
    alert('Accès refusé : ce pseudo n’est pas dans la TEAM RDM.');
    return;
  }
  if (code !== PRIVATE_VOICE_CODE) {
    alert('Code membre incorrect.');
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

  const saved = getSavedClips();
  if (saved.some(c => c.slug === slug) || clips.some(c => c.slug === slug)) {
    alert('Ce clip est déjà publié.');
    return;
  }

  saved.unshift({ streamer, title, slug, url });
  saveClips(saved);
  renderClips();

  document.getElementById('clipTitle').value = '';
  document.getElementById('clipUrl').value = '';
  document.getElementById('clipCode').value = '';
  alert('Clip publié sur ton navigateur !');
}

function clearMyPublishedClips(){
  if (confirm('Effacer les clips ajoutés sur ce navigateur ?')) {
    localStorage.removeItem('rdmPublishedClips');
    renderClips();
  }
}

renderClips();


// Vocal privé TEAM RDM
// Pour changer le code membre, modifie la ligne PRIVATE_VOICE_CODE.
const PRIVATE_VOICE_CODE = 'RDM5996';
const PRIVATE_VOICE_ROOM = 'TeamRDMVocalPriveKenshin5996';
const allowedVoiceMembers = team.map(m => m.name.toLowerCase());

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
