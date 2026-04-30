const team = [
  {name:'kenshin5996', display:'KENSHIN5996', role:'Créateur', followers:'214 followers'},
  {name:'c_djo', display:'C_DJO', role:'Membre', followers:'475 followers'},
  {name:'manimang0', display:'MANIMANG0', role:'Membre', followers:'3 followers'},
  {name:'fandeipromxtrollmod', display:'FANDEIPROMXTROLLMOD', role:'Membre', followers:'2 k followers'},
  {name:'theoherlintw', display:'THEOHERLINTW', role:'Membre', followers:'3 followers'},
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
  return `https://clips.twitch.tv/embed?clip=${slug}&parent=${host}&autoplay=false`;
}

const clipsGrid = document.getElementById('clipsGrid');
if (clipsGrid) {
  clips.forEach(clip => {
    const card = document.createElement('article');
    card.className = 'clipCard';
    card.innerHTML = `
      <div class="clipHeader">
        <img src="${avatarUrl(clip.streamer)}" onerror="this.src='assets/wolf-logo.png'" alt="${clip.streamer}">
        <div><h3>${clip.title}</h3><p>${clip.streamer}</p></div>
      </div>
      <iframe src="${clipEmbed(clip.slug)}" allowfullscreen="true" allow="autoplay; fullscreen"></iframe>
      <a class="clipLink" href="${clip.url}" target="_blank">Ouvrir le clip sur Twitch</a>
    `;
    clipsGrid.appendChild(card);
  });
}


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
