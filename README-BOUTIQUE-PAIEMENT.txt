TEAM RDM - PETITE BOUTIQUE + TICKETS + PAIEMENT SECURISE

Ce pack ajoute une petite boutique dans le site :
- produit Stickers PS5 TEAM RDM
- formulaire de commande avec pseudo, email, téléphone, adresse, code postal, ville, pays
- ticket sauvegardé dans Firebase Firestore collection orders
- paiement par carte via Stripe Payment Link quand la boutique est disponible

IMPORTANT SECURITE :
Le site ne demande JAMAIS le numéro de carte. Le paiement doit se faire sur Stripe.

Pour activer la vente :
1) Crée un compte Stripe.
2) Crée un Payment Link pour le sticker PS5.
3) Dans script.js, remplace :
   const STRIPE_PAYMENT_LINK = '';
   par ton lien Stripe, exemple :
   const STRIPE_PAYMENT_LINK = 'https://buy.stripe.com/xxxxx';
4) Dans script.js, remplace :
   const SHOP_AVAILABLE = false;
   par :
   const SHOP_AVAILABLE = true;

Règles Firestore conseillées :

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /clips/{clipId} {
      allow read, write: if true;
    }
    match /visits/{visitId} {
      allow read, write: if true;
    }
    match /orders/{orderId} {
      allow create: if true;
      allow read, update, delete: if false;
    }
  }
}

Tu verras les tickets dans Firebase Console > Firestore > orders.
Pour relier automatiquement paiement confirme + email, il faudra ensuite ajouter Stripe Webhook / Cloud Function.
