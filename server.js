require("dotenv").config();
const express = require("express");
const path = require("path");
const Database = require("better-sqlite3");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

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

const port = Number(process.env.PORT || 3000);
app.listen(port, () => console.log(`TEAM RDM cagnotte disponible sur http://localhost:${port}`));
