(() => {
  const message = "Bienvenue sur le site de la TEAM RDM ! Je suis votre assistant vocal. Retrouvez les membres de la team, consultez les lives, découvrez les clips et accédez au vocal privé. Vous pouvez utiliser les boutons du site pour naviguer. Merci de soutenir la TEAM RDM et bon moment parmi nous !";
  let speaking = false;
  function speak(text) {
    const status = document.getElementById("rdm-assist-status");
    if (!("speechSynthesis" in window)) {
      if (status) status.textContent = "La synthèse vocale n’est pas disponible sur ce navigateur.";
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "fr-FR";
    utterance.rate = 0.94;
    utterance.pitch = 0.92;
    utterance.onstart = () => { speaking = true; if(status) status.textContent = "Assistant vocal en cours…"; };
    utterance.onend = () => { speaking = false; if(status) status.textContent = "Message terminé."; };
    utterance.onerror = () => { speaking = false; if(status) status.textContent = "La voix n’a pas pu démarrer. Réessayez."; };
    window.speechSynthesis.speak(utterance);
  }
  function init() {
    if (document.getElementById("rdm-assistance-button")) return;
    const button = document.createElement("button");
    button.id = "rdm-assistance-button";
    button.type = "button";
    button.textContent = "✦ Assistance";
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-controls", "rdm-assistance-panel");
    const panel = document.createElement("section");
    panel.id = "rdm-assistance-panel";
    panel.setAttribute("aria-label", "Assistant vocal TEAM RDM");
    panel.innerHTML = '<h3>✦ Assistant TEAM RDM</h3><p>Bonjour ! Je peux vous présenter le site à voix haute.</p><div class="rdm-assist-actions"><button type="button" id="rdm-assist-play">▶ Écouter l’accueil</button><button type="button" id="rdm-assist-stop">■ Arrêter</button></div><p class="rdm-assist-status" id="rdm-assist-status" aria-live="polite">Prêt à vous aider.</p>';
    button.addEventListener("click", () => {
      const open = panel.classList.toggle("open");
      button.setAttribute("aria-expanded", String(open));
      if (open) speak(message);
      else if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    });
    panel.querySelector("#rdm-assist-play").addEventListener("click", () => speak(message));
    panel.querySelector("#rdm-assist-stop").addEventListener("click", () => {
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
      const status = document.getElementById("rdm-assist-status");
      if (status) status.textContent = "Lecture arrêtée.";
    });
    document.body.append(button, panel);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
