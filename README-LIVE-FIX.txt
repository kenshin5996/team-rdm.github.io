TEAM RDM - CORRECTION SITE + SYSTEME LIVE

Ce pack corrige la structure GitHub Pages et ajoute :
- section QUI EST EN LIVE ?
- affichage EN DIRECT / HORS LIVE pour chaque membre
- actualisation automatique toutes les 2 minutes
- bouton pour regarder le membre directement sur le site
- bouton pour ouvrir Twitch
- assets rangés dans le dossier assets pour éviter les images cassées

Upload GitHub :
1) Supprime les anciens fichiers du dépôt si besoin.
2) Envoie tout le contenu du dossier/zip à la racine du dépôt :
   index.html, script.js, style.css, firebase-config.js, start.bat, README, dossier assets.
3) GitHub > Settings > Pages :
   Source = Deploy from a branch
   Branch = main
   Folder = / root
4) Attends le déploiement vert.
5) Ouvre : https://kenshin5996.github.io/team-rdm.github.io/
6) Recharge avec CTRL + SHIFT + R.

Important : le système live utilise un service public sans clé Twitch.
Si le service est bloqué, le site reste fonctionnel et affiche un message pour ouvrir Twitch.
