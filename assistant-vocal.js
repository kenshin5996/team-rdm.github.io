/* Team RDM — Assistant vocal prédéfini
   Aucun service externe ni clé API requis.
   Déclenchement : clic sur un lien/bouton dont le texte contient « Assistance ».
*/
(() => {
  "use strict";

  if (window.__teamRdmVoiceAssistantLoaded) return;
  window.__teamRdmVoiceAssistantLoaded = true;

  const script = [
    "Salut et bienvenue sur Team RDM !",
    "Je suis l’assistant vocal de la team. Je vais t’expliquer comment demander de l’aide et découvrir comment nous rejoindre.",
    "Pour commencer, consulte les informations présentées sur le site et les règles de la team.",
    "Si tu souhaites rejoindre l’équipe, suis les consignes de candidature indiquées sur le site ou contacte un responsable via les moyens officiels proposés.",
    "Prépare une présentation claire de toi et explique pourquoi tu souhaites rejoindre Team RDM.",
    "Attention : je suis un assistant automatique. Je ne valide pas les candidatures et je ne remplace pas un responsable de la team.",
    "Tu peux relancer cette explication ou arrêter la voix avec les boutons ci-dessous. Bonne chance, et à bientôt sur Team RDM !"
  ];

  const style = document.createElement("link");
  style.rel = "stylesheet";
  style.href = new URL("./assistant-vocal.css", document.currentScript?.src || window.location.href).href;
  document.head.appendChild(style);

  const panel = document.createElement("section");
  panel.className = "trdm-voice";
  panel.setAttribute("aria-label", "Assistant vocal Team RDM");
  panel.setAttribute("aria-live", "polite");
  panel.hidden = true;
  panel.innerHTML = `
    <div class="trdm-voice__top">
      <div class="trdm-voice__orb" aria-hidden="true"><span>RDM</span></div>
      <div class="trdm-voice__heading">
        <strong>ASSISTANT RDM</strong>
        <small><span class="trdm-voice__dot"></span> SYSTÈME EN LIGNE</small>
      </div>
      <button class="trdm-voice__close" type="button" aria-label="Fermer l’assistant">×</button>
    </div>
    <p class="trdm-voice__message">Prêt à te guider. Lance l’explication vocale quand tu veux.</p>
    <div class="trdm-voice__progress" aria-hidden="true"><span></span></div>
    <div class="trdm-voice__actions">
      <button class="trdm-voice__play" type="button">▶ ÉCOUTER L’EXPLICATION</button>
      <button class="trdm-voice__stop" type="button">■ ARRÊTER</button>
    </div>
    <small class="trdm-voice__note">Voix générée par ton navigateur · aucun micro utilisé</small>
  `;
  document.body.appendChild(panel);

  const message = panel.querySelector(".trdm-voice__message");
  const progress = panel.querySelector(".trdm-voice__progress span");
  const playButton = panel.querySelector(".trdm-voice__play");
  const stopButton = panel.querySelector(".trdm-voice__stop");
  let currentPart = 0;
  let isSpeaking = false;

  function chooseFrenchVoice(utterance) {
    const voices = window.speechSynthesis?.getVoices?.() || [];
    const french = voices.filter(v => /^fr([_-]|$)/i.test(v.lang));
    const preferred = french.find(v => /natural|premium|google|microsoft|enhanced|amelie|thomas|audrey/i.test(v.name));
    utterance.voice = preferred || french[0] || null;
    utterance.lang = "fr-FR";
    utterance.rate = 0.94;
    utterance.pitch = 0.82;
    utterance.volume = 1;
  }

  function speakPart(index) {
    if (!("speechSynthesis" in window)) {
      message.textContent = "La synthèse vocale n’est pas prise en charge par ce navigateur. Essaie une version récente de Chrome, Edge, Firefox ou Safari.";
      return;
    }
    if (index >= script.length) {
      isSpeaking = false;
      currentPart = 0;
      progress.style.width = "100%";
      message.textContent = "Explication terminée. Tu peux la réécouter quand tu veux.";
      playButton.textContent = "↻ RÉÉCOUTER";
      return;
    }
    currentPart = index;
    const utterance = new SpeechSynthesisUtterance(script[index]);
    chooseFrenchVoice(utterance);
    message.textContent = script[index];
    progress.style.width = `${Math.round((index / script.length) * 100)}%`;
    utterance.onend = () => {
      if (isSpeaking) speakPart(index + 1);
    };
    utterance.onerror = (event) => {
      if (event.error !== "canceled" && event.error !== "interrupted") {
        isSpeaking = false;
        message.textContent = "Impossible de lire la voix. Vérifie le son de ton appareil.";
      }
    };
    window.speechSynthesis.speak(utterance);
  }

  function startSpeaking() {
    if (!("speechSynthesis" in window)) {
      message.textContent = "La synthèse vocale n’est pas prise en charge par ce navigateur.";
      return;
    }
    window.speechSynthesis.cancel();
    isSpeaking = true;
    playButton.textContent = "▶ RECOMMENCER";
    speakPart(0);
  }

  function stopSpeaking() {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    isSpeaking = false;
    progress.style.width = "0%";
    message.textContent = "Lecture arrêtée. Tu peux reprendre l’explication quand tu veux.";
    playButton.textContent = "▶ REPRENDRE L’EXPLICATION";
  }

  function openAssistant(event) {
    // Intercepte le clic sur « Assistance » pour ouvrir le panneau vocal.
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    panel.hidden = false;
    panel.classList.add("trdm-voice--visible");
    message.textContent = "Bienvenue ! Clique sur « Écouter l’explication » pour démarrer la voix.";
    playButton.focus({ preventScroll: true });
  }

  function closeAssistant() {
    stopSpeaking();
    panel.hidden = true;
    panel.classList.remove("trdm-voice--visible");
  }

  panel.querySelector(".trdm-voice__close").addEventListener("click", closeAssistant);
  playButton.addEventListener("click", startSpeaking);
  stopButton.addEventListener("click", stopSpeaking);

  function isAssistanceLabel(element) {
    const label = (element.innerText || element.textContent || element.getAttribute("aria-label") || "").trim();
    return /\bassistance\b/i.test(label) && label.length < 100;
  }

  function attachTriggers(root = document) {
    root.querySelectorAll('a, button, [role="button"]').forEach(element => {
      if (element.closest(".trdm-voice") || element.dataset.trdmVoiceBound) return;
      if (isAssistanceLabel(element)) {
        element.dataset.trdmVoiceBound = "true";
        element.addEventListener("click", openAssistant, true);
      }
    });
  }

  attachTriggers();
  // Prend aussi en charge les menus ou boutons ajoutés plus tard par le site.
  const observer = new MutationObserver(() => attachTriggers());
  observer.observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener("pagehide", () => {
    observer.disconnect();
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  });
})();
