(() => {
  const base = String(window.RDM_DONATION_API_BASE || "").replace(/\/+$/, "");
  const $ = id => document.getElementById(id);
  const status = $("rdmDonationStatus");
  const money = n => new Intl.NumberFormat("fr-FR", {style:"currency",currency:"EUR"}).format(n);
  document.querySelectorAll("[data-rdm-amount]").forEach(b => b.addEventListener("click", () => $("rdmDonationAmount").value = b.dataset.rdmAmount));

  async function loadWall() {
    const response = await fetch(`${base}/api/donations`);
    if (!response.ok) throw new Error("API cagnotte indisponible");
    const data = await response.json();
    $("rdmDonationRaised").textContent = money(data.total || 0);
    const percent = Math.min(100, ((data.total || 0) / 100) * 100);
    $("rdmDonationProgress").style.width = `${percent}%`;
    $("rdmDonationProgressLabel").textContent = `${Math.floor(percent)} % de l’objectif atteint${percent >= 100 ? " — Objectif atteint, merci !" : ""}`;
    const list = $("rdmDonorList");
    list.replaceChildren();
    if (!data.donations || !data.donations.length) {
      const p = document.createElement("p"); p.className = "donorEmpty"; p.textContent = "Pas encore de don confirmé. Tu peux être le premier !"; list.append(p); return;
    }
    data.donations.forEach(d => {
      const row = document.createElement("div"); row.className = "rdmDonorRow";
      const name = document.createElement("span"); name.textContent = d.pseudo;
      const amount = document.createElement("span"); amount.className = "rdmDonorAmount"; amount.textContent = money(d.amount);
      row.append(name, amount); list.append(row);
    });
  }

  async function init() {
    try {
      const configResponse = await fetch(`${base}/api/config`);
      if (!configResponse.ok) throw new Error("API cagnotte non configurée");
      const config = await configResponse.json();
      if (!config.clientId) throw new Error("Configuration PayPal manquante");
      await loadWall();
      const script = document.createElement("script");
      script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(config.clientId)}&currency=EUR&intent=capture`;
      script.onload = () => paypal.Buttons({
        style: {layout:"vertical",shape:"rect",label:"donate"},
        createOrder: async () => {
          const pseudo = $("rdmDonorPseudo").value.trim();
          const amount = Number($("rdmDonationAmount").value);
          if (pseudo.length < 2 || pseudo.length > 24) throw new Error("Entre un pseudo de 2 à 24 caractères.");
          if (!Number.isFinite(amount) || amount < 1 || amount > 1000 || Math.round(amount*100)!==amount*100) throw new Error("Montant invalide (1 à 1 000 €).");
          status.textContent = "Préparation du paiement sécurisé…";
          const r = await fetch(`${base}/api/create-order`, {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({pseudo,amount})});
          const d = await r.json(); if (!r.ok) throw new Error(d.error || "Erreur de création du paiement"); return d.id;
        },
        onApprove: async data => {
          status.textContent = "Vérification du paiement par PayPal…";
          const r = await fetch(`${base}/api/capture-order`, {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({orderId:data.orderID})});
          const d = await r.json(); if (!r.ok || !d.ok) throw new Error(d.error || "Paiement non confirmé");
          status.textContent = "Merci ! Don confirmé, ton pseudo est affiché sur le mur 💙";
          await loadWall();
        },
        onCancel: () => status.textContent = "Paiement annulé. Aucun don ajouté.",
        onError: err => status.textContent = err.message || "Erreur PayPal, réessaie."
      }).render("#rdmPaypalButtonContainer");
      script.onerror = () => { status.textContent = "Impossible de charger PayPal."; };
      document.head.append(script);
    } catch (e) {
      status.textContent = "Cagnotte pas encore activée : le serveur de dons doit être hébergé et son URL ajoutée dans donation-config.js.";
      try { await loadWall(); } catch {}
    }
  }
  init();
})();
