/* TEAM RDM — lecteur d'ambiance indépendant. Ne remplace PAS script.js. */
(() => {
  if (document.getElementById('rdmMusicWidget')) return;
  const style = document.createElement('style');
  style.textContent = `
    #rdmMusicWidget{position:fixed;left:16px;bottom:16px;z-index:99999;width:230px;box-sizing:border-box;padding:12px 13px;background:linear-gradient(145deg,#061426f5,#10072af5);border:1px solid #00c8ff;border-radius:14px;box-shadow:0 0 18px #00c8ff35;color:#edfaff;font:13px Arial,sans-serif}
    #rdmMusicWidget .rdm-m-title{font-weight:800;color:#59dcff;margin-bottom:8px}
    #rdmMusicWidget .rdm-m-row{display:flex;gap:7px;align-items:center}
    #rdmMusicWidget button{cursor:pointer;color:white;background:linear-gradient(100deg,#40108a,#075eae);border:1px solid #287cff;border-radius:8px;padding:7px 10px;font-weight:700}
    #rdmMusicWidget button:focus-visible,#rdmMusicWidget input:focus-visible{outline:2px solid white;outline-offset:2px}
    #rdmMusicWidget input{width:100%;accent-color:#00c8ff;margin-top:9px}
    #rdmMusicWidget .rdm-m-status{font-size:11px;color:#b6c9dc;margin-top:7px;line-height:1.35}
    @media(max-width:600px){#rdmMusicWidget{width:205px;left:10px;bottom:10px}}
  `;
  document.head.appendChild(style);
  const panel = document.createElement('section');
  panel.id='rdmMusicWidget';
  panel.innerHTML = `<div class="rdm-m-title">♫ Ambiance TEAM RDM</div><div class="rdm-m-row"><button type="button" id="rdmMusicToggle">▶ Lecture</button><button type="button" id="rdmMusicMute" aria-pressed="false">🔊 Son</button></div><label style="display:block;font-size:11px;margin-top:8px" for="rdmMusicVolume">Volume</label><input id="rdmMusicVolume" type="range" min="0" max="0.25" step="0.01" value="0.08"><div class="rdm-m-status" id="rdmMusicStatus">Clique sur Lecture pour démarrer la musique.</div>`;
  document.body.appendChild(panel);
  const audio = new Audio(new URL('assets/rdm-ambiance.mp3', document.baseURI).href);
  audio.loop=true; audio.volume=0.08; audio.preload='none';
  const toggle=panel.querySelector('#rdmMusicToggle'), mute=panel.querySelector('#rdmMusicMute'), volume=panel.querySelector('#rdmMusicVolume'), status=panel.querySelector('#rdmMusicStatus');
  let stoppedForLive=false;
  function stop(reason){ audio.pause(); toggle.textContent='▶ Lecture'; status.textContent=reason; }
  toggle.addEventListener('click', async()=>{ if(!audio.paused){stop('Musique en pause.');return;} try { await audio.play(); toggle.textContent='⏸ Pause'; status.textContent='Musique d’ambiance en cours.'; stoppedForLive=false; } catch(e){status.textContent='Lecture impossible : vérifie que assets/rdm-ambiance.mp3 est bien publié.';} });
  mute.addEventListener('click',()=>{audio.muted=!audio.muted;mute.textContent=audio.muted?'🔇 Muet':'🔊 Son';mute.setAttribute('aria-pressed',String(audio.muted));});
  volume.addEventListener('input',()=>{audio.volume=Number(volume.value); if(audio.volume>0 && audio.muted){audio.muted=false;mute.textContent='🔊 Son';mute.setAttribute('aria-pressed','false');}});
  // Arrête la musique si le visiteur ouvre Twitch ou clique sur un lien/bouton de visionnage.
  document.addEventListener('click',e=>{const el=e.target.closest('a,button');if(!el||panel.contains(el))return;const label=((el.innerText||el.getAttribute('aria-label')||'')+' '+(el.href||'')).toLowerCase();if(/twitch\.tv|regarder le live|ouvrir twitch|voir le live/.test(label))stop('Musique coupée pour le live.');},true);
  // Vérifie les membres de la team à intervalle modéré. L’API publique peut parfois être indisponible.
  const members=['kenshin5996','c_djo','manimang0','fandeipromxtrollmod','theoherlintw','maszoks'];
  async function checkLive(){
    try {
      const results=await Promise.all(members.map(async name=>{const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),5000);try{const r=await fetch('https://decapi.me/twitch/uptime/'+encodeURIComponent(name),{cache:'no-store',signal:controller.signal});return (await r.text()).trim();}finally{clearTimeout(timer);}}));
      const live=results.some(t=>t && !/offline|not found|error|invalid|not streaming/i.test(t));
      if(live){stoppedForLive=true;stop('Musique coupée : un membre est en direct.');}
      else if(stoppedForLive){status.textContent='Aucun live détecté. Clique sur Lecture pour relancer la musique.';}
    } catch(e) { /* Une indisponibilité de l’API ne bloque pas le lecteur. */ }
  }
  checkLive(); setInterval(checkLive,120000);
})();
