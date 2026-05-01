TEAM RDM - VERSION SIMPLE QUI MARCHE

Cette version enlève Firebase Authentication / inscription, car c'est ce qui bloquait.
Elle garde :
- publication de clips Twitch en ligne avec Firebase Firestore
- compteur de visites simple
- vocal privé avec code membre

IMPORTANT FIRESTORE > REGLES :
Colle ces règles puis clique Publier :

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

A mettre sur GitHub :
- index.html
- script.js
- style.css
- firebase-config.js
- dossier assets

Après upload : attendre GitHub Pages vert, puis CTRL + SHIFT + R.
