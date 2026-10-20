/* Assistant vocal TEAM RDM — réponses naturelles en français */
(() => {
  const closing = " N’hésitez pas à rejoindre les réseaux de mon créateur, Kenshin5996. Les liens disponibles sont sur le site. Merci d’être passé chez la TEAM RDM, et à bientôt !";
  const scripts = {
    welcome: "Salut et bienvenue sur le site de la TEAM RDM ! Je suis l’assistant vocal, et je vais vous présenter le site en quelques instants. Dans la rubrique Règlement, vous trouverez les règles essentielles pour garder une bonne ambiance : respect, fair-play, pas d’insultes, pas de harcèlement et pas de triche. Dans la rubrique Candidature, vous pouvez découvrir comment proposer votre profil pour rejoindre la team. Il faut avoir au moins 100 followers sur Twitch et être affilié Twitch avant d’envoyer votre candidature. Préparez votre pseudo, le lien de votre chaîne, les jeux auxquels vous jouez et votre motivation. Dans la rubrique Crews GTA, vous trouverez les informations et les liens disponibles pour découvrir les crews RDM et demander à les rejoindre. Dans la rubrique Soutenir la team, vous pouvez aider les streamers RDM en suivant leurs chaînes, en passant sur leurs lives, en partageant leurs contenus et en les encourageant dans le chat. Si vous souhaitez soutenir le site lui-même, le bouton PayPal vous permet de faire un don facultatif. Même un euro ou cinq euros sont appréciés, mais ce n’est absolument pas obligatoire. Prenez le temps de parcourir les rubriques et de cliquer sur les liens qui vous intéressent. Vous pouvez également rejoindre les réseaux sociaux de mon créateur, Kenshin5996, grâce aux liens présents sur le site. Merci pour votre visite, profitez bien de votre passage chez TEAM RDM, et à bientôt !",
    rules: "Voici le règlement de la TEAM RDM. Premièrement, respectez les membres et les autres joueurs. Gardez une bonne ambiance, restez fair-play, et évitez les insultes, le harcèlement et la triche. Respectez aussi les consignes des responsables ainsi que les règles des jeux et des plateformes. Ne partagez pas d’informations privées. En cas de problème, adressez-vous calmement à un responsable. Les candidatures sont étudiées par le créateur de la team." + closing,
    apply: "Vous souhaitez candidater pour rejoindre la TEAM RDM ? Merci pour votre intérêt ! Pour envoyer une candidature, vous devez avoir au moins 100 followers sur Twitch et être déjà affilié Twitch. Préparez votre pseudo, le lien de votre chaîne, les jeux auxquels vous jouez et quelques phrases pour expliquer votre motivation. Remplissez ensuite le formulaire. Si vous n’avez pas encore les 100 followers ou si vous n’êtes pas encore affilié, ce n’est pas grave : continuez à développer votre chaîne et revenez quand les deux conditions seront remplies." + closing,
    gta: "Vous aimez GTA et vous aimeriez jouer avec la communauté RDM ? Cliquez sur l’un des liens des crews affichés dans cette rubrique, consultez la page Rockstar et suivez les instructions pour demander à rejoindre le crew. Nous vous souhaitons de bonnes sessions, du respect et une bonne ambiance. Si vous êtes intéressé par la communauté RDM, vous êtes au bon endroit !" + closing,
    support: "Pour soutenir la TEAM RDM, vous pouvez suivre les streamers de la team, passer sur leurs lives, leur laisser un petit message et partager leurs contenus. Votre présence et vos encouragements font déjà une vraie différence. Merci de soutenir les créateurs de la team !" + closing,
    paypal: "Si vous aimez le site et souhaitez aider le projet à continuer, vous pouvez faire un petit don via PayPal. Même 1 euro, ou 5 euros si vous le pouvez, est apprécié. C’est totalement facultatif : votre visite et votre soutien comptent déjà beaucoup. Merci énormément pour votre générosité !" + closing,
    eligible: "Merci ! Votre formulaire est prêt. Vérifiez les informations dans votre application de messagerie, puis appuyez sur Envoyer pour transmettre votre candidature." + closing,
    notEligibleFollowers: "Merci pour votre intérêt. Pour envoyer une candidature à la TEAM RDM, il faut avoir au moins 100 followers Twitch. Vous pourrez revenir candidater dès que vous aurez atteint ce seuil. Bonne chance pour votre chaîne !" + closing,
    notEligibleAffiliate: "Merci pour votre intérêt. Pour envoyer une candidature, vous devez déjà être affilié Twitch. Continuez à développer votre chaîne et revenez nous voir lorsque l’affiliation sera validée." + closing
  };
  let utterance = null;
  const $ = id => document.getElementById(id);

  function status(message) {
    const panel = $('rdmHelpPanel');
    if (!panel) return;
    let node = $('rdm-voice-status');
    if (!node) {
      node = document.createElement('p');
      node.id = 'rdm-voice-status';
      node.setAttribute('aria-live', 'polite');
      node.style.cssText = 'margin:10px 0 0;color:#6ee7ff;font-size:13px';
      (panel.querySelector('.rdmBody') || panel).appendChild(node);
    }
    node.textContent = message;
  }

  function stop() {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    utterance = null;
  }

  function speak(text) {
    if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) {
      status('La lecture vocale n’est pas disponible dans ce navigateur.');
      return;
    }
    stop();
    utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fr-FR';
    utterance.rate = 0.92;
    utterance.pitch = 1.0;
    utterance.volume = 1;
    const chooseVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      const french = voices.filter(v => /^fr([-_]|$)/i.test(v.lang));
      const voice = french.find(v => /fr[-_]FR/i.test(v.lang) && /natural|neural|premium|google|denise|hortense|amelie|amélie|julie/i.test(v.name))
        || french.find(v => /fr[-_]FR/i.test(v.lang)) || french[0];
      if (voice) utterance.voice = voice;
      status('🔊 Je vous explique la rubrique…');
      window.speechSynthesis.speak(utterance);
    };
    utterance.onend = () => status('Vous pouvez choisir une autre rubrique.');
    utterance.onerror = () => status('La voix ne démarre pas ? Cliquez sur Écouter pour réessayer.');
    if (window.speechSynthesis.getVoices().length) chooseVoice();
    else {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.onvoiceschanged = null;
        chooseVoice();
      };
      chooseVoice();
    }
  }

  function init() {
    const launcher = $('rdmHelpButton');
    const panel = $('rdmHelpPanel');
    if (!launcher || !panel || panel.dataset.naturalVoiceReady === 'true') return;
    panel.dataset.naturalVoiceReady = 'true';

    // Un seul bouton d’ouverture : le bouton créé par le site est réutilisé.
    launcher.innerHTML = '<img src="assets/wolf-logo.png" alt="" style="width:22px;height:22px;object-fit:contain;vertical-align:middle;margin-right:8px">✦ Assistance';
    launcher.setAttribute('aria-label', 'Ouvrir l’assistance vocale TEAM RDM');

    const header = panel.querySelector('header');
    if (header && !$('rdm-voice-play')) {
      const play = document.createElement('button');
      play.type = 'button';
      play.id = 'rdm-voice-play';
      play.textContent = '🔊 Écouter';
      play.setAttribute('aria-label', 'Écouter à nouveau');
      header.appendChild(play);
      play.addEventListener('click', e => { e.stopPropagation(); speak(scripts.welcome); });
    }

    launcher.addEventListener('click', () => {
      window.setTimeout(() => {
        if (!panel.classList.contains('rdmHidden')) speak(scripts.welcome);
        else stop();
      }, 30);
    });

    // Les rubriques restent cliquables, mais ne déclenchent plus de voix.
    // La seule narration est la présentation générale au moment de l’ouverture.
    panel.addEventListener('click', event => {
      const button = event.target.closest('button, a');
      if (button && (button.id === 'rdmClose' || button.classList.contains('rdmClose'))) stop();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
