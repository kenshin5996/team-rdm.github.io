TEAM RDM - PACK SITE TWITCH CORRIGÉ

Correction incluse :
- Plus d'overlay custom sur la vidéo Twitch.
- Plus de pseudo / jeu / vues affichés en double.
- Player Twitch propre avec aspect-ratio 16/9.
- Firebase Firestore pour enregistrer les clips.

INSTALLATION :
1) Mets tous les fichiers dans ton dépôt GitHub.
2) Remplace la config dans firebase-config.js.
3) Dans Firebase, active Firestore Database.
4) Dans script.js, modifie MEMBER_CODES avec tes codes membre.
5) Publie avec GitHub Pages.

IMPORTANT TWITCH :
Le player utilise automatiquement :
parent=${location.hostname}

Donc ça marche avec GitHub Pages sans devoir écrire le domaine à la main.
