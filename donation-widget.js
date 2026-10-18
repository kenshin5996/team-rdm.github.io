(function () {
  const config = window.RDM_DONATION_CONFIG || { objectif: 100, total: 0, donateurs: [] };
  const objectif = Math.max(1, Number(config.objectif) || 100);
  const total = Math.max(0, Number(config.total) || 0);
  const pct = Math.min(100, Math.round((total / objectif) * 100));
  const totalEl = document.getElementById('donationTotal');
  const bar = document.getElementById('donationProgressBar');
  const track = document.querySelector('.donationProgressTrack');
  const msg = document.getElementById('donationMessage');
  const list = document.getElementById('donorList');
  if (totalEl) totalEl.textContent = total.toLocaleString('fr-FR', { maximumFractionDigits: 2 });
  if (bar) bar.style.width = pct + '%';
  if (track) track.setAttribute('aria-valuenow', String(pct));
  if (msg) msg.textContent = total >= objectif ? 'Objectif atteint ! Merci énormément à tous les soutiens 💜' : 'La cagnotte est à ' + pct + ' % de son objectif. Merci pour votre soutien !';
  if (list) {
    list.replaceChildren();
    const donors = Array.isArray(config.donateurs) ? config.donateurs : [];
    if (!donors.length) {
      const li = document.createElement('li'); li.textContent = 'Les donateurs apparaîtront ici après mise à jour.'; list.appendChild(li);
    } else {
      donors.forEach(function (donor) {
        const li = document.createElement('li');
        const name = document.createElement('span'); name.textContent = String(donor.pseudo || 'Donateur');
        const amount = document.createElement('span'); amount.className = 'donorAmount'; amount.textContent = (Math.max(0, Number(donor.montant) || 0)).toLocaleString('fr-FR', { maximumFractionDigits: 2 }) + ' €';
        li.append(name, amount); list.appendChild(li);
      });
    }
  }
})();
