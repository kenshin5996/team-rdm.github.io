CONNEXION DISCORD + COMPTE TWITCH — TEAM RDM

Fonctionnement
- Le bouton Connexion ouvre l'authentification Discord officielle.
- Dans Mon compte, le visiteur peut associer son compte Twitch officiel.
- Le serveur vérifie le pseudo Twitch reçu de l'API officielle Twitch.
- Seuls les pseudos listés dans TEAM_MEMBER_TWITCH_LOGINS voient l'accès à l'espace membre.
- La vérification des droits se fait côté serveur, pas uniquement dans le navigateur.
- Un visiteur connecté qui n'est pas membre peut voir son profil, mais pas l'espace membre.

Configuration nécessaire
1. Installer Node.js 18 ou plus récent.
2. Copier env.example vers .env et remplacer les valeurs de démonstration.
3. Générer SESSION_SECRET avec une longue valeur aléatoire (au moins 32 caractères).
4. Discord Developer Portal : créer une application, ouvrir OAuth2, ajouter comme Redirect URL exacte :
   https://VOTRE-DOMAINE/auth/discord/callback
   Copier le Client ID et le Client Secret dans .env.
5. Twitch Developer Console : créer une application, catégorie Website Integration, OAuth Redirect URL exacte :
   https://VOTRE-DOMAINE/auth/twitch/callback
   Copier le Client ID et le Client Secret dans .env.
6. Dans .env, définir SITE_URL=https://VOTRE-DOMAINE (sans slash final).
7. Dans TEAM_MEMBER_TWITCH_LOGINS, garder uniquement les pseudos Twitch officiels de l'équipe.
8. Lancer npm install puis npm start. Le site et l'API d'authentification doivent être servis par ce serveur Node sous le même domaine.

Important pour GitHub Pages
GitHub Pages ne peut pas exécuter server.js. Si le site reste sur GitHub Pages, héberger le serveur Node sur un hébergeur compatible et définir auth-config.js ainsi :
window.RDM_AUTH_CONFIG = { apiBase: "https://VOTRE-API-DOMAINE" };
Le serveur doit alors être configuré pour autoriser les requêtes CORS credentialed depuis le domaine exact du site et utiliser des cookies adaptés au déploiement. La configuration actuelle recommande de servir site et API sous le même domaine.

Sécurité
- Ne publiez jamais le fichier .env ni les secrets Discord/Twitch.
- La liste des membres est administrée dans .env, pas par une valeur envoyée par le navigateur.
- Pour retirer un membre, retirer son pseudo de TEAM_MEMBER_TWITCH_LOGINS puis redémarrer le serveur.
- Ce système vérifie l'appartenance via le login Twitch renvoyé par Twitch; pour une politique durable, utilisez aussi les identifiants Twitch immuables (user IDs) dans une liste administrée côté serveur.
