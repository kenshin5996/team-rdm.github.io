TEAM RDM - SITE PROPRE FINAL

Corrections incluses :
- Site refait proprement et responsive
- MASZOKS ajouté une seule fois dans l'équipe
- Logo MASZOKS ajouté dans assets/maszoks.png
- Section LIVE propre : affiche seulement les membres en direct, pas de doublons
- Bouton "Actualiser" et vérification live automatique toutes les 2 minutes
- Lecteur Twitch intégré
- Clips avec identifiant Twitch + titre + lien du clip + mot de passe RDM5996
- Compteur visiteurs : personnes en ligne, visites totales, visites aujourd'hui
- Vocal privé avec code RDM5996

Upload GitHub Pages :
1) Supprime les anciens fichiers du dépôt si besoin.
2) Envoie TOUT le contenu du dossier à la racine du dépôt :
   index.html, script.js, style.css, firebase-config.js, start.bat, README.txt et le dossier assets.
3) GitHub > Settings > Pages : Source = Deploy from a branch / Branch = main / Folder = / root.
4) Attends le déploiement vert.
5) Ouvre ton site puis fais CTRL + SHIFT + R.

Règles Firebase / Firestore nécessaires pour clips + visiteurs :

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /clips/{clipId} { allow read, write: if true; }
    match /visits/{visitId} { allow read, write: if true; }
    match /presence/{visitorId} { allow read, write: if true; }
  }
}

Mot de passe clips et vocal : RDM5996
Membres : kenshin5996, c_djo, manimang0, fandeipromxtrollmod, theoherlintw, maszoks
