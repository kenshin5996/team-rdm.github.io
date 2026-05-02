TEAM RDM - VERSION SIMPLE QUI MARCHE

Cette version n'utilise PAS Firebase Authentication.
Donc plus d'erreur auth/api-key-not-valid.

Fonctions :
- publication de clips Twitch avec code membre RDM5996
- clips sauvegardés dans Firestore collection clips
- compteur visites sauvegardé dans Firestore collection visits

Firebase requis :
1) Firestore Database activé
2) Règles Firestore :

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /clips/{clipId} {
      allow read, write: if true;
    }
    match /visits/{visitId} {
      allow read, write: if true;
    }
  }
}

Publie TOUS les fichiers sur GitHub : index.html, script.js, style.css, firebase-config.js, assets.
Puis recharge avec Ctrl + Shift + R.
