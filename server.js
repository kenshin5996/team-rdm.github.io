require("dotenv").config();
const express = require("express");
const path = require("path");
const crypto = require("crypto");
const Database = require("better-sqlite3");

const app = express();
app.use(express.json());
// Les pages du site sont à la racine du ZIP. Bloquer les fichiers serveur/config avant le static.
app.use((req, res, next) => {
  const blocked = /^\/(?:server\.js|package(?:-lock)?\.json|env\.example|.*\.sqlite(?:-shm|-wal)?|README[^/]*|INSTALLATION[^/]*|CONFIGURER-[^/]*)$/i;
  if (blocked.test(decodeURIComponent(req.path))) return res.status(404).end();
  next();
});
app.use(express.static(path.join(__dirname), { dotfiles: "deny", index: "index.html" }));

const db = new Database(path.join(__dirname, "donations.sqlite"));
db.exec(`
  CREATE TABLE IF NOT EXISTS donations (
    id TEXT PRIMARY KEY,
    pseudo TEXT NOT NULL,
    amount REAL NOT NULL,
    currency TEXT NOT NULL DEFAULT 'EUR',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);

const mode = process.env.PAYPAL_MODE === "live" ? "live" : "sandbox";
const paypalBase = mode === "live"
  ? "https://api-m.paypal.com"
  : "https://api-m.sandbox.paypal.com";

async function paypalAccessToken() {
  const id = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  if (!id || !secret || id.startsWith("COLLE_ICI")) {
    throw new Error("Les identifiants PayPal ne sont pas configurés dans .env");
  }
  const auth = Buffer.from(`${id}:${secret}`).toString("base64");
  const response = await fetch(`${paypalBase}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: "grant_type=client_credentials"
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error_description || "Échec d'authentification PayPal");
  return data.access_token;
}

app.get("/api/config", (req, res) => {
  res.json({
    clientId: process.env.PAYPAL_CLIENT_ID || "",
    mode,
    goal: 100,
    currency: "EUR"
  });
});

app.get("/api/donations", (req, res) => {
  const rows = db.prepare(
    "SELECT pseudo, amount, currency, created_at AS createdAt FROM donations ORDER BY created_at DESC LIMIT 100"
  ).all();
  const total = db.prepare("SELECT COALESCE(SUM(amount), 0) AS total FROM donations").get().total;
  res.json({ total: Math.round(total * 100) / 100, goal: 100, donations: rows });
});

app.post("/api/create-order", async (req, res) => {
  try {
    const pseudo = String(req.body.pseudo || "").trim().replace(/[<>]/g, "").slice(0, 24);
    const amount = Number(req.body.amount);
    if (!pseudo || pseudo.length < 2) return res.status(400).json({ error: "Entre un pseudo de 2 à 24 caractères." });
    if (!Number.isFinite(amount) || amount < 1 || amount > 1000 || Math.round(amount * 100) !== amount * 100) {
      return res.status(400).json({ error: "Le don doit être compris entre 1 € et 1 000 €." });
    }
    const token = await paypalAccessToken();
    const response = await fetch(`${paypalBase}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "PayPal-Request-Id": `rdm-${crypto.randomUUID()}`
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [{
          custom_id: pseudo,
          description: "Don de soutien TEAM RDM",
          amount: { currency_code: "EUR", value: amount.toFixed(2) }
        }],
        application_context: {
          brand_name: "TEAM RDM",
          user_action: "PAY_NOW",
          shipping_preference: "NO_SHIPPING"
        }
      })
    });
    const data = await response.json();
    if (!response.ok) return res.status(502).json({ error: data.message || "PayPal n'a pas pu créer le paiement." });
    res.json({ id: data.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || "Erreur serveur." });
  }
});

app.post("/api/capture-order", async (req, res) => {
  try {
    const orderId = String(req.body.orderId || "").trim();
    if (!orderId || !/^[A-Z0-9-]+$/i.test(orderId)) return res.status(400).json({ error: "Commande invalide." });

    // Capture côté serveur : ne jamais faire confiance à un montant envoyé par le navigateur.
    const token = await paypalAccessToken();
    const response = await fetch(`${paypalBase}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    });
    const data = await response.json();

    // Une commande déjà capturée peut être renvoyée par PayPal ; on vérifie toujours son état.
    if (!response.ok && data.name !== "UNPROCESSABLE_ENTITY") {
      return res.status(502).json({ error: data.message || "La confirmation PayPal a échoué." });
    }

    const verifiedResponse = await fetch(`${paypalBase}/v2/checkout/orders/${encodeURIComponent(orderId)}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const verified = await verifiedResponse.json();
    if (!verifiedResponse.ok || verified.status !== "COMPLETED") {
      return res.status(402).json({ error: "Le paiement n'est pas confirmé par PayPal." });
    }

    const unit = (verified.purchase_units || [])[0];
    const capture = unit && unit.payments && unit.payments.captures && unit.payments.captures[0];
    if (!unit || !capture || capture.status !== "COMPLETED" || capture.amount.currency_code !== "EUR") {
      return res.status(402).json({ error: "La capture du paiement n'est pas confirmée." });
    }

    const pseudo = String(unit.custom_id || "").trim().replace(/[<>]/g, "").slice(0, 24);
    const amount = Number(capture.amount.value);
    if (!pseudo || !Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ error: "Données de don invalides." });
    }

    // L'identifiant de capture rend l'enregistrement idempotent.
    db.prepare("INSERT OR IGNORE INTO donations (id, pseudo, amount, currency) VALUES (?, ?, ?, 'EUR')")
      .run(capture.id, pseudo, amount);

    const total = db.prepare("SELECT COALESCE(SUM(amount), 0) AS total FROM donations").get().total;
    res.json({ ok: true, total: Math.round(total * 100) / 100 });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || "Erreur serveur." });
  }
});


// --- Authentification Discord + liaison Twitch (session signée, cookies HttpOnly) ---
const authSecret = process.env.SESSION_SECRET || "";
const siteUrl = String(process.env.SITE_URL || "http://localhost:3000").replace(/\/$/, "");
const secureCookies = siteUrl.startsWith("https://");
const teamLogins = new Set(String(process.env.TEAM_MEMBER_TWITCH_LOGINS || "kenshin5996,c_djo,manimang0,fandeipromxtrollmod,theoherlintw,maszoks")
  .split(",").map(x => x.trim().toLowerCase()).filter(Boolean));
const cookieOpts = `Path=/; HttpOnly; SameSite=Lax; Max-Age=604800${secureCookies ? "; Secure" : ""}`;
function b64url(value) { return Buffer.from(value).toString("base64url"); }
function sign(value) { return crypto.createHmac("sha256", authSecret).update(value).digest("base64url"); }
function safeEqual(a, b) {
  const aa = Buffer.from(String(a || "")); const bb = Buffer.from(String(b || ""));
  return aa.length === bb.length && crypto.timingSafeEqual(aa, bb);
}
function setSession(res, session) {
  const payload = b64url(JSON.stringify({ ...session, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 }));
  res.append("Set-Cookie", `rdm_session=${payload}.${sign(payload)}; ${cookieOpts}`);
}
function getSession(req) {
  if (!authSecret) return null;
  const raw = String(req.headers.cookie || "").split(";").map(x => x.trim()).find(x => x.startsWith("rdm_session="));
  if (!raw) return null;
  const value = raw.slice("rdm_session=".length); const dot = value.lastIndexOf(".");
  if (dot < 1) return null;
  const payload = value.slice(0, dot); if (!safeEqual(value.slice(dot + 1), sign(payload))) return null;
  try { const data = JSON.parse(Buffer.from(payload, "base64url").toString()); return data.exp > Date.now() ? data : null; } catch (_) { return null; }
}
function setOAuthState(res, state) {
  res.setHeader("Set-Cookie", [`rdm_oauth_state=${state}; Path=/auth; HttpOnly; SameSite=Lax; Max-Age=600${secureCookies ? "; Secure" : ""}`,
    `rdm_session_clear=1; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secureCookies ? "; Secure" : ""}`]);
}
function cookieValue(req, name) {
  const row = String(req.headers.cookie || "").split(";").map(x => x.trim()).find(x => x.startsWith(name + "="));
  return row ? decodeURIComponent(row.slice(name.length + 1)) : "";
}
function validOAuthState(req, res) {
  const state = String(req.query.state || ""); const saved = cookieValue(req, "rdm_oauth_state");
  res.append("Set-Cookie", `rdm_oauth_state=; Path=/auth; HttpOnly; SameSite=Lax; Max-Age=0${secureCookies ? "; Secure" : ""}`);
  return Boolean(state && saved && safeEqual(state, saved));
}
function authConfigured() {
  const values = [authSecret, process.env.DISCORD_CLIENT_ID, process.env.DISCORD_CLIENT_SECRET, process.env.TWITCH_CLIENT_ID, process.env.TWITCH_CLIENT_SECRET];
  return values.every(value => value && !/^(REMPLACER|COLLE_ICI)/i.test(String(value).trim()));
}
function authReady() { return authConfigured(); }
function isTeamMember(session) { return Boolean(session && session.twitch && teamLogins.has(String(session.twitch.login || "").toLowerCase())); }
function redirectAuth(res, result, message) {
  const target = new URL(siteUrl);
  target.searchParams.set("auth", result);
  if (message) target.searchParams.set("message", String(message).slice(0, 180));
  res.redirect(target.toString());
}
function oauthRedirect(req, provider) {
  const fixed = process.env.SITE_URL;
  const origin = fixed ? String(fixed).replace(/\/$/, "") : `${req.protocol}://${req.get("host")}`;
  return `${origin}/auth/${provider}/callback`;
}
async function readJson(response) { return response.json().catch(() => ({})); }

app.get("/auth/discord", (req, res) => {
  if (!authReady()) return redirectAuth(res, "error", "Authentification non configurée : renseigne SESSION_SECRET et les identifiants Discord/Twitch dans .env.");
  const state = crypto.randomBytes(24).toString("hex");
  res.append("Set-Cookie", `rdm_oauth_state=${state}; Path=/auth; HttpOnly; SameSite=Lax; Max-Age=600${secureCookies ? "; Secure" : ""}`);
  const url = new URL("https://discord.com/oauth2/authorize");
  url.searchParams.set("client_id", process.env.DISCORD_CLIENT_ID);
  url.searchParams.set("redirect_uri", oauthRedirect(req, "discord"));
  url.searchParams.set("response_type", "code"); url.searchParams.set("scope", "identify"); url.searchParams.set("state", state);
  res.redirect(url.toString());
});

app.get("/auth/discord/callback", async (req, res) => {
  if (!authReady()) return redirectAuth(res, "error", "Authentification non configurée sur le serveur.");
  if (!validOAuthState(req, res)) return redirectAuth(res, "error", "État de connexion invalide. Réessaie.");
  if (req.query.error || !req.query.code) return redirectAuth(res, "error", "Connexion Discord annulée.");
  try {
    const tokenRes = await fetch("https://discord.com/api/oauth2/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ client_id: process.env.DISCORD_CLIENT_ID, client_secret: process.env.DISCORD_CLIENT_SECRET,
        grant_type: "authorization_code", code: String(req.query.code), redirect_uri: oauthRedirect(req, "discord") }) });
    const token = await readJson(tokenRes); if (!tokenRes.ok || !token.access_token) throw new Error("Échange du code Discord impossible.");
    const userRes = await fetch("https://discord.com/api/users/@me", { headers: { Authorization: `Bearer ${token.access_token}` } });
    const user = await readJson(userRes); if (!userRes.ok || !user.id) throw new Error("Profil Discord inaccessible.");
    const avatarUrl = user.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128` : "";
    setSession(res, { discord: { id: String(user.id), username: String(user.global_name || user.username || "Discord"), avatarUrl }, twitch: null });
    redirectAuth(res, "discord-ok");
  } catch (e) { console.error("Discord OAuth:", e.message); redirectAuth(res, "error", "La connexion Discord a échoué."); }
});

app.get("/auth/twitch", (req, res) => {
  if (!authReady()) return redirectAuth(res, "error", "Authentification non configurée sur le serveur.");
  const session = getSession(req); if (!session || !session.discord) return redirectAuth(res, "error", "Connecte-toi d’abord avec Discord.");
  const state = crypto.randomBytes(24).toString("hex");
  res.append("Set-Cookie", `rdm_oauth_state=${state}; Path=/auth; HttpOnly; SameSite=Lax; Max-Age=600${secureCookies ? "; Secure" : ""}`);
  const url = new URL("https://id.twitch.tv/oauth2/authorize");
  url.searchParams.set("client_id", process.env.TWITCH_CLIENT_ID); url.searchParams.set("redirect_uri", oauthRedirect(req, "twitch"));
  url.searchParams.set("response_type", "code"); url.searchParams.set("scope", "user:read:email"); url.searchParams.set("state", state);
  res.redirect(url.toString());
});

app.get("/auth/twitch/callback", async (req, res) => {
  if (!authReady()) return redirectAuth(res, "error", "Authentification non configurée sur le serveur.");
  if (!validOAuthState(req, res)) return redirectAuth(res, "error", "État de connexion invalide. Réessaie.");
  const session = getSession(req); if (!session || !session.discord) return redirectAuth(res, "error", "Session Discord expirée. Reconnecte-toi.");
  if (req.query.error || !req.query.code) return redirectAuth(res, "error", "Association Twitch annulée.");
  try {
    const tokenRes = await fetch("https://id.twitch.tv/oauth2/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ client_id: process.env.TWITCH_CLIENT_ID, client_secret: process.env.TWITCH_CLIENT_SECRET,
        grant_type: "authorization_code", code: String(req.query.code), redirect_uri: oauthRedirect(req, "twitch") }) });
    const token = await readJson(tokenRes); if (!tokenRes.ok || !token.access_token) throw new Error("Échange du code Twitch impossible.");
    const userRes = await fetch("https://api.twitch.tv/helix/users", { headers: { Authorization: `Bearer ${token.access_token}`, "Client-Id": process.env.TWITCH_CLIENT_ID } });
    const result = await readJson(userRes); const user = (result.data || [])[0]; if (!user || !user.id || !user.login) throw new Error("Profil Twitch inaccessible.");
    session.twitch = { id: String(user.id), login: String(user.login).toLowerCase(), displayName: String(user.display_name || user.login), profileImageUrl: String(user.profile_image_url || "") };
    setSession(res, session);
    redirectAuth(res, isTeamMember(session) ? "twitch-ok" : "not-team");
  } catch (e) { console.error("Twitch OAuth:", e.message); redirectAuth(res, "error", "L’association Twitch a échoué."); }
});

app.get("/api/auth/me", (req, res) => {
  if (!authConfigured()) return res.status(503).json({ error: "Authentification non configurée." });
  const session = getSession(req);
  if (!session || !session.discord) return res.json({ user: null });
  res.set("Cache-Control", "no-store");
  res.json({ user: { discord: session.discord, twitch: session.twitch || null, isTeamMember: isTeamMember(session) } });
});
app.post("/api/auth/logout", (req, res) => {
  res.setHeader("Set-Cookie", `rdm_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secureCookies ? "; Secure" : ""}`);
  res.json({ ok: true });
});
app.get("/api/member-area", (req, res) => {
  const session = getSession(req);
  if (!session || !session.discord) return res.status(401).json({ error: "Connecte-toi avec Discord." });
  if (!isTeamMember(session)) return res.status(403).json({ error: "Accès réservé aux membres officiels TEAM RDM ayant associé leur compte Twitch." });
  res.set("Cache-Control", "no-store");
  res.json({ ok: true, message: `Bienvenue dans l’espace membre RDM, ${session.twitch.displayName} !` });
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () => console.log(`TEAM RDM cagnotte disponible sur http://localhost:${port}`));
