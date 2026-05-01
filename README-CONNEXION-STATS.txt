TEAM RDM - CONNEXION MEMBRE + STATS

Cette version ajoute :
- Connexion membre avec Firebase Authentication (email + mot de passe)
- Inscription membre avec pseudo Twitch + code RDM5996
- Publication des clips seulement pour les membres connectés
- Compteur de visites Firestore : total + aujourd’hui
- Compteur de comptes membres
- Google Analytics optionnel si tu ajoutes measurementId dans firebase-config.js

A FAIRE DANS FIREBASE :
1) Authentication > Commencer > Email/Mot de passe > Activer > Enregistrer
2) Firestore > Règles :

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /clips/{clipId} { allow read, write: if true; }
    match /users/{userId} { allow read, write: if true; }
    match /stats/{docId} { allow read, write: if true; }
  }
}

3) Publie tous les fichiers sur GitHub Pages.
4) Recharge le site avec Ctrl + Shift + R.

IMPORTANT : ces règles sont simples pour tester. Pour un vrai site très sécurisé, il faudra des règles plus strictes.
