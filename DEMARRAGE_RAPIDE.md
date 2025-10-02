# 🚀 Démarrage Rapide - Système Email Sécurisé

## ⚡ En 5 Minutes

### Étape 1 : Configuration (2 min)

```bash
# 1. Copier le fichier d'exemple
cp exemple.env .env

# 2. Générer un JWT_SECRET fort
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Copier le résultat dans .env
```

### Étape 2 : Gmail App Password (3 min)

1. Aller sur : https://myaccount.google.com/apppasswords
2. Créer "Bibliothèque" → Copier le code (16 caractères)
3. Mettre dans `.env` :
   ```
   EMAIL_USER=votre-email@gmail.com
   EMAIL_PASS=xxxx xxxx xxxx xxxx
   ```

### Étape 3 : Tester

```bash
# Test connexion email
node test-email.js
# Attendu : ✅ Connexion SMTP réussie !

# Démarrer serveur
npm run dev
# Attendu : ✅ Tâche CRON démarrée
```

## ✅ C'est Prêt !

Le système envoie maintenant automatiquement des emails chaque jour à 9h00 pour les livres en retard.

### Test Manuel (Admin uniquement)

```bash
# Depuis Postman/Thunder Client
POST http://localhost:3000/api/emprunts/envoyer-rappels
Cookie: token=VOTRE_TOKEN_ADMIN
```

## 📚 Documentation Complète

- **Guide détaillé :** `docs/CONFIGURATION_EMAILS.md`
- **Sécurité :** `SECURITE_COMPLETE.md`
- **Installation :** `README.md`

---

**Besoin d'aide ?** Consultez `docs/CONFIGURATION_EMAILS.md` section "Dépannage"
