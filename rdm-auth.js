/* Connexion Discord + association Twitch. L'autorisation membre est décidée côté serveur. */
(function () {
  const cfg = window.RDM_AUTH_CONFIG || {};
  const base = String(cfg.apiBase || "").replace(/\/$/, "");
  const modal = () => document.getElementById('rdmAccountModal');
  const content = () => document.getElementById('rdmAccountContent');
  let currentUser = null;
  const esc = (v) => String(v || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  async function request(path) {
    const r = await fetch(base + path, { credentials: 'include', headers: { 'Accept': 'application/json' } });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.error || 'Connexion au serveur impossible.');
    return data;
  }
  function setLoginState(user) {
    currentUser = user || null;
    const btn = document.getElementById('rdmDiscordLogin');
    if (btn) btn.innerHTML = user ? '<span class="discordMark">●</span> Connecté' : '<span class="discordMark">☁</span> Connexion';
  }
  function showMessage(message) {
    if (!content()) return;
    content().innerHTML = `<p>${esc(message)}</p><button class="rdmAuthAction rdmAuthSecondary" onclick="RDMAuth.closeProfile()">Fermer</button>`;
  }
  async function refresh() {
    try { const data = await request('/api/auth/me'); setLoginState(data.user); return data.user; }
    catch (e) { setLoginState(null); return null; }
  }
  function login() { window.location.href = base + '/auth/discord'; }
  function openProfile() {
    if (!modal()) return;
    modal().hidden = false;
    renderProfile();
  }
  function closeProfile() { if (modal()) modal().hidden = true; }
  async function renderProfile() {
    content().innerHTML = '<p>Chargement du compte…</p>';
    const user = await refresh();
    if (!user) {
      content().innerHTML = '<p>Connecte-toi avec Discord pour ouvrir ton profil RDM.</p><button class="rdmAuthAction" onclick="RDMAuth.login()">☁ Se connecter avec Discord</button><p class="rdmAccountSmall">La connexion seule ne donne pas accès à l’espace membre. Il faut aussi associer le compte Twitch officiel d’un membre RDM.</p>';
      return;
    }
    const discordAvatar = user.discord.avatarUrl || '';
    let html = `<div><img class="rdmAccountAvatar" src="${esc(discordAvatar || 'assets/wolf-logo.png')}" alt="Avatar"><b>${esc(user.discord.username)}</b><p class="rdmAccountSmall">Compte Discord associé</p></div>`;
    if (!user.twitch) {
      html += '<p>Associe ton compte Twitch pour vérifier si tu fais partie de la TEAM RDM.</p><a class="rdmAuthAction" href="' + esc(base + '/auth/twitch') + '">🎮 Associer mon compte Twitch</a>';
    } else {
      html += `<div class="rdmAccountStatus ${user.isTeamMember ? 'member' : 'denied'}"><b>${user.isTeamMember ? '✅ Membre officiel TEAM RDM' : '🔒 Pas d’accès à l’espace membre'}</b><p>Compte Twitch : <b>${esc(user.twitch.displayName || user.twitch.login)}</b></p>${user.isTeamMember ? 'Ton compte est reconnu dans la liste officielle des membres.' : 'Ce compte Twitch n’est pas dans la liste officielle des membres RDM.'}</div>`;
      if (!user.isTeamMember) html += '<a class="rdmAuthAction rdmAuthSecondary" href="' + esc(base + '/auth/twitch') + '">Associer un autre compte Twitch</a>';
    }
    if (user.isTeamMember) {
      html += '<div class="rdmAccountStatus member"><b>🔐 Espace membre</b><p>Ton accès membre est activé. Les informations privées sont chargées par le serveur après vérification.</p><button class="rdmAuthAction" id="rdmLoadMemberArea">Ouvrir mon espace membre</button><div id="rdmMemberArea"></div></div>';
    }
    html += '<button class="rdmAuthAction rdmAuthSecondary" onclick="RDMAuth.logout()">Se déconnecter</button>';
    content().innerHTML = html;
    const areaBtn = document.getElementById('rdmLoadMemberArea');
    if (areaBtn) areaBtn.addEventListener('click', async () => {
      const area = document.getElementById('rdmMemberArea'); area.innerHTML = '<p>Vérification des droits…</p>';
      try { const data = await request('/api/member-area'); area.innerHTML = `<p>${esc(data.message)}</p><p class="rdmAccountSmall">Accès vérifié côté serveur.</p>`; }
      catch (e) { area.innerHTML = `<p>${esc(e.message)}</p>`; }
    });
  }
  async function logout() {
    try { await fetch(base + '/api/auth/logout', { method: 'POST', credentials: 'include' }); } catch (_) {}
    setLoginState(null); renderProfile();
  }
  document.addEventListener('DOMContentLoaded', async () => {
    await refresh();
    const url = new URL(window.location.href);
    const result = url.searchParams.get('auth');
    if (result) {
      openProfile();
      if (result === 'discord-ok' || result === 'twitch-ok') renderProfile();
      else if (result === 'not-team') setTimeout(() => showMessage('Le compte Twitch est bien associé, mais il ne fait pas partie de la liste officielle TEAM RDM.'), 100);
      else if (result === 'error') setTimeout(() => showMessage(url.searchParams.get('message') || 'La connexion a échoué. Vérifie la configuration du serveur.'), 100);
      url.searchParams.delete('auth'); url.searchParams.delete('message'); history.replaceState({}, '', url.pathname + url.search + url.hash);
    }
  });
  window.RDMAuth = { login, openProfile, closeProfile, logout, refresh };
})();
