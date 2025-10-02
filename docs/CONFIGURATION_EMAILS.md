# 📧 Guide de Configuration des Emails - Système de Bibliothèque

## 🔒 Sécurité et Bonnes Pratiques

### ⚠️ Règles Critiques de Sécurité

1. **JAMAIS de credentials en dur dans le code**
   - ✅ Utiliser `.env` pour toutes les variables sensibles
   - ❌ Ne JAMAIS commit le fichier `.env` dans Git
   - ✅ Le `.env` est protégé par `.gitignore`

2. **Mot de passe d'application Gmail**
   - Ne PAS utiliser votre mot de passe Gmail principal
   - Créer un "App Password" dédié (voir ci-dessous)

---

## 📝 Configuration Gmail - Étape par Étape

### Étape 1 : Activer la validation en 2 étapes

1. Aller sur [Google Account Security](https://myaccount.google.com/security)
2. Activer "Validation en 2 étapes" si ce n'est pas déjà fait

### Étape 2 : Générer un mot de passe d'application

1. Aller sur [App Passwords](https://myaccount.google.com/apppasswords)
2. Sélectionner "Autre (nom personnalisé)"
3. Taper "Bibliothèque XYZ" ou un nom descriptif
4. Cliquer sur "Générer"
5. **Copier le mot de passe de 16 caractères généré** (format: `xxxx xxxx xxxx xxxx`)

### Étape 3 : Configurer le fichier .env

1. Copier `exemple.env` vers `.env` (si pas déjà fait)
   ```bash
   cp exemple.env .env
   ```

2. Éditer `.env` et remplir :
   ```env
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=465
   EMAIL_SECURE=true
   EMAIL_USER=votre-email@gmail.com
   EMAIL_PASS=xxxx xxxx xxxx xxxx  # Mot de passe d'application généré
   ```

3. **Vérifier que `.env` est dans `.gitignore`** ✅

---

## 🚀 Configuration du Système CRON

### Envoi Automatique des Rappels

Le système envoie automatiquement des emails de rappel pour les livres en retard :

- **Fréquence :** Tous les jours à 9h00 du matin
- **Critères :** Emprunts dépassant la date de retour prévue
- **Template :** Email HTML professionnel avec informations du livre

### Configuration dans `services/rappelsCron.js`

```javascript
// Modification de l'horaire (ligne 77)
cron.schedule('0 9 * * *', () => {  // 9h00 tous les jours
    verifierEmpruntsEnRetard()
})

// Pour tester : Toutes les minutes
// cron.schedule('* * * * *', verifierEmpruntsEnRetard)

// Pour tester : Toutes les heures
// cron.schedule('0 * * * *', verifierEmpruntsEnRetard)
```

### Déclenchement Manuel (Admin uniquement)

Route API pour tester immédiatement :
```bash
POST /api/emprunts/envoyer-rappels
Headers: Cookie avec token JWT admin
```

---

## 🧪 Test du Système Email

### 1. Test de Connexion

Démarrer le serveur et vérifier les logs :
```bash
npm run dev
```

Logs attendus :
```
✅ Serveur démarré sur le port 3000
✅ Database Connected! (library)
✅ Tâche CRON démarrée : Rappels quotidiens à 9h00
```

### 2. Test d'Envoi Manuel

Depuis Postman/Thunder Client/cURL :
```bash
curl -X POST http://localhost:3000/api/emprunts/envoyer-rappels \
  -H "Cookie: token=VOTRE_TOKEN_JWT_ADMIN"
```

Réponse attendue :
```json
{
  "message": "Envoi des rappels en cours. Consultez les logs du serveur.",
  "timestamp": "2025-10-02T21:00:00.000Z"
}
```

### 3. Vérifier les Logs Serveur

```bash
🔍 Vérification des emprunts en retard...
📧 2 rappel(s) à envoyer
✅ Email envoyé: <message-id>
✅ Rappel envoyé à user@example.com pour "Titre du Livre"
```

---

## 🎨 Template Email

Le template HTML inclut :
- En-tête rouge d'alerte
- Informations du livre (titre, auteur, ISBN)
- Date d'emprunt et date de retour prévue
- **Nombre de jours de retard** en surbrillance
- Bouton CTA vers l'espace utilisateur
- Design responsive et professionnel

### Personnalisation du Template

Fichier : `services/mailer.js` (lignes 38-93)

Variables disponibles :
- `utilisateur.prenom`, `utilisateur.nom`, `utilisateur.email`
- `livre.titre`, `livre.auteur`
- `emprunt.date_emprunt`, `emprunt.date_retour_prevue`
- `joursRetard` (calculé automatiquement)

---

## 🔧 Alternatives à Gmail

### Option 1 : SendGrid (Production recommandée)

```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=apikey
EMAIL_PASS=VOTRE_CLE_API_SENDGRID
```

### Option 2 : Mailtrap (Tests uniquement)

```env
EMAIL_HOST=smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_SECURE=false
EMAIL_USER=votre-username-mailtrap
EMAIL_PASS=votre-password-mailtrap
```

### Option 3 : SMTP Personnalisé

```env
EMAIL_HOST=smtp.votre-domaine.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=noreply@votre-domaine.com
EMAIL_PASS=votre-mot-de-passe
```

---

## ❓ Dépannage

### Erreur : "Invalid login"

**Causes possibles :**
- Mot de passe d'application incorrect
- Validation en 2 étapes non activée
- Compte Gmail bloqué pour "accès moins sécurisé"

**Solution :**
1. Régénérer un nouveau mot de passe d'application
2. Vérifier que EMAIL_USER est correct
3. Tester avec Mailtrap en attendant

### Erreur : "self signed certificate"

**Solution :**
Modifier `services/mailer.js` :
```javascript
tls: {
    rejectUnauthorized: false  // Accepter les certificats auto-signés
}
```

### CRON ne s'exécute pas

**Vérifications :**
1. Vérifier que `demarrerTacheCron()` est appelé dans `app.js`
2. Vérifier l'heure système du serveur
3. Tester avec `executerRappelsImmediatement()` manuellement

### Aucun email envoyé malgré emprunts en retard

**Vérifications :**
1. Vérifier que `rappel_envoye = FALSE` dans la DB
2. Vérifier que `statut != 'retourne'`
3. Vérifier que `date_retour_prevue < NOW()`
4. Consulter les logs serveur pour erreurs

---

## 📊 Base de Données

### Table `emprunts` - Champ `rappel_envoye`

```sql
ALTER TABLE emprunts ADD COLUMN rappel_envoye TINYINT(1) DEFAULT 0;
```

**Important :** Un rappel n'est envoyé qu'UNE SEULE FOIS par emprunt.
- Après envoi : `rappel_envoye = TRUE`
- Pour renvoyer : Réinitialiser manuellement à `FALSE` dans la DB

### Reset manuel des rappels

```sql
-- Réinitialiser tous les rappels
UPDATE emprunts SET rappel_envoye = FALSE WHERE statut = 'en_retard';

-- Réinitialiser un emprunt spécifique
UPDATE emprunts SET rappel_envoye = FALSE WHERE id = 123;
```

---

## 🎯 Checklist Déploiement Production

- [ ] Remplacer `JWT_SECRET` par une clé aléatoire forte (32+ caractères)
- [ ] Utiliser un service email professionnel (SendGrid, AWS SES)
- [ ] Configurer `NODE_ENV=production` dans `.env`
- [ ] Vérifier que `.env` est dans `.gitignore`
- [ ] Tester l'envoi manuel avant d'activer le CRON
- [ ] Configurer `CLIENT_URL` avec l'URL HTTPS de production
- [ ] Activer `secure: true` pour les cookies en HTTPS
- [ ] Configurer des alertes en cas d'échec d'envoi email
- [ ] Logger les envois dans une table `logs_emails` (optionnel)

---

## 📚 Ressources Supplémentaires

- [Nodemailer Documentation](https://nodemailer.com/about/)
- [Node-cron Syntax](https://www.npmjs.com/package/node-cron)
- [Gmail App Passwords](https://support.google.com/accounts/answer/185833)
- [Crontab Guru - Tester expressions CRON](https://crontab.guru/)

---

**Auteur :** Système de Bibliothèque XYZ
**Dernière mise à jour :** 2025-10-01
**Version :** 1.0.0
