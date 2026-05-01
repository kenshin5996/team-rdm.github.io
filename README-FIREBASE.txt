TEAM RDM - CLIPS TWITCH EN LIGNE AVEC FIREBASE

Cette version permet aux membres de publier des clips Twitch visibles par tout le monde sur le site.

1) Crée un projet Firebase
- Va sur https://console.firebase.google.com
- Clique sur Ajouter un projet
- Crée une application Web
- Copie la configuration firebaseConfig

2) Remplis le fichier firebase-config.js
Remplace les valeurs REMPLACE_MOI par les vraies valeurs de Firebase.

3) Active Firestore
- Dans Firebase, ouvre Firestore Database
- Clique sur Créer une base de données
- Choisis le mode test pour commencer
- Région au choix

4) Règles Firestore simples pour tester
Dans Firestore > Règles, tu peux mettre ceci pour tester :

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /clips/{clipId} {
      allow read: if true;
      allow create: if true;
    }
  }
}

Attention : le code membre est visible dans le JavaScript. C'est suffisant pour un petit site de team, mais ce n'est pas une vraie sécurité forte.
Pour une sécurité plus forte, il faudra ajouter une connexion membre ou une fonction serveur.

5) Publie le site
Envoie tous les fichiers sur Netlify, OVH, GitHub Pages ou autre hébergement.
Important : garde bien firebase-config.js avec index.html, script.js, style.css et le dossier assets.

Code membre actuel : RDM5996
Membres autorisés : kenshin5996, c_djo, manimang0, fandeipromxtrollmod, theoherlintw, maszoks
