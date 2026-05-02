TEAM RDM - VERSION FINALE CONNEXION + CLIPS + STATS

1) Envoie TOUS les fichiers sur GitHub :
- index.html
- script.js
- style.css
- firebase-config.js
- README-CONNEXION-STATS.txt
- dossier assets

2) Firebase Authentication :
Authentication > Methode de connexion > Adresse e-mail/Mot de passe > Active

3) Firestore > Regles : colle ceci puis Publier :

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /clips/{clipId} {
      allow read: if true;
      allow write: if true;
    }
    match /visits/{visitId} {
      allow read: if true;
      allow write: if true;
    }
    match /users/{userId} {
      allow read: if true;
      allow write: if true;
    }
  }
}

4) Apres upload GitHub :
- attends le deploiement GitHub Pages vert
- ouvre le site
- fais CTRL + SHIFT + R

5) Test inscription :
Pseudo : kenshin5996
Code membre : RDM5996
Mot de passe : 6 caracteres minimum

Cette version affiche la vraie erreur Firebase si l'inscription bloque.
