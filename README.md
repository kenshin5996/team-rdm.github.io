# Assistant vocal Team RDM

Petit panneau d'assistance futuriste en français. Il lit des textes prédéfinis au clic sur un lien ou bouton dont le libellé contient « Assistance ». Il n'utilise ni IA distante, ni micro, ni clé API : la voix vient de la synthèse vocale du navigateur.

## Fichiers
- `assistant-vocal.js` : logique et textes à prononcer.
- `assistant-vocal.css` : apparence néon futuriste.
- `integration.html.txt` : exemple de code à ajouter à la page.
- `README.md` : ces instructions.

## Installation sur GitHub
1. Ouvre le dépôt `kenshin5996/team-rdm.github.io`.
2. Ajoute `assistant-vocal.js` et `assistant-vocal.css` à la racine publiée du site, au même niveau que `index.html`.
3. Ouvre `index.html` et ajoute, juste avant `</body>` :

   ```html
   <link rel="stylesheet" href="./assistant-vocal.css">
   <script src="./assistant-vocal.js" defer></script>
   ```

4. Enregistre les changements avec **Commit changes**.
5. Attends la publication GitHub Pages, puis recharge le site. La publication peut prendre quelques minutes.

Documentation officielle : https://docs.github.com/en/pages

## Important
- Le script repère les liens/boutons existants contenant le mot « Assistance » et intercepte leur clic pour ouvrir l'assistant. Si ce bouton doit aussi conserver une action existante (ouvrir une page, un formulaire ou un autre panneau), adapte `openAssistant` dans le fichier JS pour ne pas bloquer cette action.
- La voix et les voix françaises disponibles varient selon le navigateur et le système d'exploitation. Le style « gaming » est simulé par un débit légèrement ralenti et une tonalité plus grave ; le navigateur ne permet pas de créer une vraie voix synthétique de jeu à partir de rien.
- La lecture démarre après un clic explicite de l'utilisateur, ce qui évite les blocages de lecture automatique.
- Modifie les phrases dans le tableau `script` en haut de `assistant-vocal.js` pour qu'elles correspondent aux vraies règles et procédures de Team RDM.
- Teste sur ordinateur et mobile. Aucun accès au micro n'est demandé.
