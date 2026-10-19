(() => {
  const accueil = "Salut et bienvenue chez la TEAM RDM ! Moi, c’est l’assistant du site. Si tu veux, je peux t’aider à découvrir la team, lire le règlement, préparer ta candidature ou retrouver nos crews GTA. Choisis simplement un bouton et je te guide. À bientôt, et merci de soutenir la RDM !";
  let currentUtterance = null;

  function status(text) {
    let node = document.getElementById('rdm-voice-status');
    if (!node) {
      node = document.createElement('p');
      node.id = 'rdm-voice-status';
      node.setAttribute('aria-live', 'polite');
      const panel = document.getElementById('rdmHelpPanel');
      if (panel) (panel.querySelector('.rdmBody') || panel).appendChild(node);
    }
    node.textContent = text;
  }

  function stopVoice() {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    currentUtterance = null;
  }

  function speak(text = accueil) {
    if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) {
      status('La lecture vocale n’est pas disponible dans ce navigateur.');
      return;
    }
    stopVoice();
    currentUtterance = new SpeechSynthesisUtterance(text);
    currentUtterance.lang = 'fr-FR';
    currentUtterance.rate = 0.98;
    currentUtterance.pitch = 1.04;
    currentUtterance.volume = 1;

    const voices = window.speechSynthesis.getVoices();
    const frenchVoices = voices.filter(v => /^fr([-_]|$)/i.test(v.lang));
    const preferred = frenchVoices.find(v => /denise|amelie|am[eé]lie|julie|google français|france/i.test(v.name))
      || frenchVoices.find(v => /fr[-_]FR/i.test(v.lang))
      || frenchVoices[0];
    if (preferred) currentUtterance.voice = preferred;

    currentUtterance.onstart = () => status('🔊 Je vous parle…');
    currentUtterance.onend = () => status('Vous pouvez choisir une rubrique ci-dessus.');
    currentUtterance.onerror = () => status('La voix n’a pas démarré. Cliquez sur « Écouter » pour réessayer.');
    status('Préparation de la voix…');
    window.speechSynthesis.speak(currentUtterance);
  }

  function init() {
    const launcher = document.getElementById('rdmHelpButton');
    const panel = document.getElementById('rdmHelpPanel');
    if (!launcher || !panel || launcher.dataset.voiceReady === 'true') return;
    launcher.dataset.voiceReady = 'true';
    launcher.textContent = '✦ Assistance';
    launcher.setAttribute('aria-label', 'Ouvrir l’assistance TEAM RDM');

    // Une seule pastille d’assistance : on utilise le bouton déjà présent sur le site.
    const header = panel.querySelector('header');
    if (header && !document.getElementById('rdm-voice-play')) {
      const play = document.createElement('button');
      play.type = 'button';
      play.id = 'rdm-voice-play';
      play.textContent = '🔊 Écouter';
      play.setAttribute('aria-label', 'Écouter la présentation de l’assistant');
      header.appendChild(play);
      play.addEventListener('click', (event) => {
        event.stopPropagation();
        speak(accueil);
      });
    }

    launcher.addEventListener('click', () => {
      // Le gestionnaire du site ouvre/ferme le panneau avant celui-ci.
      window.setTimeout(() => {
        if (!panel.classList.contains('rdmHidden')) speak(accueil);
        else stopVoice();
      }, 0);
    });

    panel.addEventListener('click', (event) => {
      const target = event.target;
      if (target && (target.id === 'rdmClose' || target.classList.contains('rdmClose'))) stopVoice();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
  // Certains navigateurs chargent leur liste de voix après l’affichage de la page.
  if ('speechSynthesis' in window) window.speechSynthesis.onvoiceschanged = () => {};
})();
