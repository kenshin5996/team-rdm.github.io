import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

import { firebaseConfig } from "./firebase-config.js";

/* Mets ici les codes autorisés */
const MEMBER_CODES = ["rdm2026", "kenshin5996"];

const form = document.getElementById("clipForm");
const grid = document.getElementById("clipsGrid");
const statusEl = document.getElementById("firebaseStatus");
const messageEl = document.getElementById("message");

let db = null;

try {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  statusEl.textContent = "État Firebase : Firebase connecté ✅";
  loadClips();
} catch (error) {
  console.error(error);
  statusEl.textContent = "État Firebase : erreur de connexion ❌";
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!db) {
    showMessage("Firebase n'est pas connecté.");
    return;
  }

  const pseudo = document.getElementById("pseudo").value.trim();
  const title = document.getElementById("title").value.trim();
  const clipUrl = document.getElementById("clipUrl").value.trim();
  const memberCode = document.getElementById("memberCode").value.trim();

  if (!MEMBER_CODES.includes(memberCode)) {
    showMessage("Code membre incorrect.");
    return;
  }

  const clipSlug = extractTwitchClipSlug(clipUrl);

  if (!clipSlug) {
    showMessage("Lien Twitch invalide. Copie le lien complet du clip.");
    return;
  }

  try {
    await addDoc(collection(db, "clips"), {
      pseudo,
      title,
      clipUrl,
      clipSlug,
      createdAt: serverTimestamp()
    });

    form.reset();
    showMessage("Clip publié ✅");
  } catch (error) {
    console.error(error);
    showMessage("Erreur pendant la publication.");
  }
});

function loadClips() {
  const q = query(collection(db, "clips"), orderBy("createdAt", "desc"));

  onSnapshot(q, (snapshot) => {
    grid.innerHTML = "";

    if (snapshot.empty) {
      grid.innerHTML = `<p>Aucun clip publié pour le moment.</p>`;
      return;
    }

    snapshot.forEach((doc) => {
      const clip = doc.data();
      grid.appendChild(createClipCard(clip));
    });
  }, (error) => {
    console.error(error);
    showMessage("Impossible de charger les clips.");
  });
}

function createClipCard(clip) {
  const card = document.createElement("article");
  card.className = "clip-card";

  const safeTitle = escapeHtml(clip.title || "Clip Twitch");
  const safePseudo = escapeHtml(clip.pseudo || "Membre RDM");
  const safeUrl = escapeHtml(clip.clipUrl || "#");
  const slug = encodeURIComponent(clip.clipSlug);

  // IMPORTANT :
  // On met seulement l'iframe Twitch, sans texte par-dessus la vidéo.
  // Ça corrige le bug des infos affichées en double.
  card.innerHTML = `
    <div class="clip-info">
      <h3>${safeTitle}</h3>
      <p>${safePseudo}</p>
    </div>

    <div class="player-wrap">
      <iframe
        src="https://clips.twitch.tv/embed?clip=${slug}&parent=${location.hostname}&autoplay=false"
        allowfullscreen
        scrolling="no">
      </iframe>
    </div>

    <div class="clip-actions">
      <a href="${safeUrl}" target="_blank" rel="noopener">Voir le clip sur Twitch</a>
    </div>
  `;

  return card;
}

function extractTwitchClipSlug(url) {
  try {
    const parsed = new URL(url);

    // Format : https://clips.twitch.tv/SlugDuClip
    if (parsed.hostname.includes("clips.twitch.tv")) {
      return parsed.pathname.split("/").filter(Boolean)[0] || null;
    }

    // Format : https://www.twitch.tv/user/clip/SlugDuClip
    if (parsed.hostname.includes("twitch.tv")) {
      const parts = parsed.pathname.split("/").filter(Boolean);
      const clipIndex = parts.indexOf("clip");
      if (clipIndex !== -1 && parts[clipIndex + 1]) {
        return parts[clipIndex + 1];
      }
    }

    return null;
  } catch {
    return null;
  }
}

function showMessage(text) {
  messageEl.textContent = text;
  setTimeout(() => {
    messageEl.textContent = "";
  }, 3500);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}
