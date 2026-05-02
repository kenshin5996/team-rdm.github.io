TEAM RDM - PACK MODIFIÉ

Ajouts demandés :
- maszoks ajouté dans la TEAM RDM : https://www.twitch.tv/maszoks
- système EN DIRECT / HORS LIVE pour les membres Twitch
- compteur de visiteurs : personnes en ligne, visites totales, visites aujourd'hui
- système pour poster des clips avec : identifiant Twitch, titre du clip, lien du clip, mot de passe RDM5996

Upload GitHub Pages :
1) Envoie index.html, script.js, style.css, firebase-config.js et le dossier assets à la racine du dépôt.
2) Dans GitHub > Settings > Pages : Branch main / root.
3) Attends le déploiement vert.
4) Recharge le site avec Ctrl + Shift + R.

Firebase / Firestore requis pour les clips et le compteur visiteurs :
Colle ces règles dans Firestore > Règles puis Publier :

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /clips/{clipId} { allow read, write: if true; }
    match /visits/{visitId} { allow read, write: if true; }
    match /presence/{visitorId} { allow read, write: if true; }
  }
}

Code membre / mot de passe clips : RDM5996
