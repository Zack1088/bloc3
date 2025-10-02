# 🧪 Guide de Test Rapide - Panel Admin

## ⚠️ IMPORTANT : Migration SQL d'Abord !

**Avant tout test, exécutez cette commande SQL :**

```sql
USE library;

ALTER TABLE emprunts ADD COLUMN rappels_envoyes INT DEFAULT 0;
ALTER TABLE emprunts ADD COLUMN derniere_date_rappel DATETIME NULL;

CREATE INDEX idx_emprunts_statut ON emprunts(statut);
CREATE INDEX idx_emprunts_utilisateur ON emprunts(utilisateur_id);
CREATE INDEX idx_emprunts_livre ON emprunts(livre_id);
```

Sans cette migration, **RIEN ne fonctionnera** !

---

## 🚀 Démarrage

### 1. Backend
```bash
# Terminal 1
npm run dev
```

✅ Doit afficher : `✅ Serveur démarré sur le port 3000`

### 2. Frontend
```bash
# Terminal 2
cd client
npm run dev
```

✅ Doit afficher : `➜ Local: http://localhost:5174/`

---

## 📝 Test 1 : Auto-remplissage EditBook

### Étapes :
1. Ouvrez le navigateur : `http://localhost:5174`
2. **Connectez-vous** (important !)
3. Allez sur un livre (ex: `http://localhost:5174/book/1`)
4. Cliquez sur **"Éditer"** ou allez directement sur `/edit_book/1`

### ✅ Comportement Attendu :
- Un **skeleton loader** apparaît brièvement (~200ms)
- Le **formulaire se remplit automatiquement** avec :
  - URL image
  - Titre
  - Auteur
  - Description
  - Date de publication
  - ISBN
- Une **prévisualisation de l'image** s'affiche

### ❌ Si ça ne marche pas :
1. Ouvrez la **Console** (F12)
2. Cherchez les erreurs
3. Vérifiez que l'API répond : `http://localhost:3000/api/books/1`

**Erreurs courantes :**
- `Cannot find module ToastContext` → Le ToastProvider n'est pas chargé (normal, on a un fallback)
- `404 Not Found` → Le backend n'est pas démarré
- Formulaire vide → L'API ne retourne pas de données

---

## 📋 Test 2 : Historique des Emprunts (Admin)

### Étapes :
1. Assurez-vous d'être **connecté en tant qu'admin**
2. Allez sur : `http://localhost:5174/borrow-history`

### ✅ Comportement Attendu :
- **4 cartes de statistiques** en haut
- **Filtres** : livre, utilisateur, statut, dates
- **Tableau paginé** avec colonnes :
  - Livre
  - Emprunteur
  - Date emprunt
  - Retour prévu
  - Retour effectif
  - Statut (badges colorés)
  - Rappels (compteur)
  - Actions (bouton 📧)
- **Bouton "Exporter CSV"** en haut à droite

### ❌ Si ça ne marche pas :
1. Vérifiez la **migration SQL** (colonnes `rappels_envoyes`)
2. Console (F12) → Erreur `rappels_envoyes inconnu` = Migration pas faite
3. Vérifiez que l'API répond : `http://localhost:3000/api/emprunts/all`

---

## 🔔 Test 3 : Modal & Toast

### Test Modal :
1. Sur la page `/borrow-history`
2. Trouvez un emprunt **en retard**
3. Cliquez sur **"📧 Rappel"**

### ✅ Comportement Attendu :
- **Modal** s'ouvre avec animation
- Titre : "Envoyer un rappel"
- Message de confirmation
- Boutons "Annuler" et "Envoyer"
- **ESC** ferme la modal
- **Clic sur overlay** ferme la modal

### Test Toast :
1. Sur `/edit_book/1`
2. Modifiez le titre
3. Cliquez **"Mettre à jour"**

### ✅ Comportement Attendu :
- **Toast vert** apparaît en haut à droite
- Message : "✓ Livre mis à jour avec succès"
- Auto-disparaît après 3s
- Bouton ✕ pour fermer manuellement

### ⚠️ Si Toast ne s'affiche pas :
Le fallback utilise des **alerts** classiques, donc vous verrez quand même un message.

---

## 📊 Test 4 : Export CSV

### Étapes :
1. Sur `/borrow-history`
2. (Optionnel) Appliquez des filtres
3. Cliquez **"📊 Exporter CSV"**

### ✅ Comportement Attendu :
- Un fichier `historique_emprunts_2025-10-03.csv` se télécharge
- Ouvrez-le avec Excel
- Vérifiez :
  - Headers en français
  - Accents corrects (UTF-8 avec BOM)
  - Données filtrées seulement

---

## 🔍 Vérifications Rapides

### Console Browser (F12)

**Sans erreurs :**
```
✅ Pas d'erreur rouge
✅ Requêtes API en vert (200)
```

**Avec erreurs :**
```
❌ "Cannot find module" → Vérifier imports
❌ "404" → Backend pas démarré
❌ "rappels_envoyes unknown" → Migration SQL pas faite
❌ "useToast must be used within ToastProvider" → Normal, fallback actif
```

### Network Tab (F12)

Vérifier les requêtes :
```
✅ GET /api/books/1 → 200 OK
✅ GET /api/emprunts/all → 200 OK
✅ PUT /api/books/1 → 200 OK
✅ POST /api/emprunts/123/rappel → 200 OK
```

---

## 🐛 Dépannage Rapide

### Problème : Formulaire EditBook vide

**Causes possibles :**
1. Backend pas démarré → Vérifier terminal 1
2. Mauvais bookId → Vérifier URL
3. API ne retourne rien → Tester : `http://localhost:3000/api/books/1`

**Solution :**
```bash
# Relancer le backend
cd C:\Users\HP\Desktop\BLOC3-ZAKARIA-LAHOUALI\BC3SJ1-JAVASCRIPT
npm run dev
```

### Problème : Erreur "rappels_envoyes inconnu"

**Cause :** Migration SQL pas exécutée

**Solution :**
```sql
-- Connectez-vous à MySQL et exécutez :
USE library;
ALTER TABLE emprunts ADD COLUMN rappels_envoyes INT DEFAULT 0;
ALTER TABLE emprunts ADD COLUMN derniere_date_rappel DATETIME NULL;
```

### Problème : 404 sur /borrow-history

**Cause :** Route pas ajoutée ou import incorrect

**Vérification :**
```javascript
// Dans client/src/App.jsx, vérifier :
import BorrowHistory from './components/admin/BorrowHistory.jsx'

<Route path="/borrow-history" element={...} />
```

### Problème : Modal ne s'affiche pas

**Causes possibles :**
1. CSS pas chargé
2. Portal ne trouve pas `document.body`
3. `isOpen` reste `false`

**Debug :**
```javascript
// Dans le composant qui utilise Modal
console.log('Modal isOpen:', isOpen)
```

---

## 📋 Checklist Complète

Avant de dire "ça ne marche pas" :

- [ ] Migration SQL exécutée (`rappels_envoyes` existe ?)
- [ ] Backend démarré (`port 3000` ?)
- [ ] Frontend démarré (`port 5174` ?)
- [ ] Connecté en tant qu'utilisateur/admin ?
- [ ] Console browser vérifiée (F12) ?
- [ ] Network tab vérifiée (requêtes API 200 OK) ?

---

## 🎯 Résumé des URLs

| Fonctionnalité | URL |
|----------------|-----|
| Frontend | http://localhost:5174 |
| Backend | http://localhost:3000 |
| Éditer livre | http://localhost:5174/edit_book/1 |
| Historique emprunts | http://localhost:5174/borrow-history |
| Dashboard | http://localhost:5174/dashboard |
| API livres | http://localhost:3000/api/books |
| API emprunts | http://localhost:3000/api/emprunts/all |

---

## 💡 Astuces

1. **Hard Reload** : `Ctrl + Shift + R` (vide le cache)
2. **Console claire** : `Ctrl + L` dans la console
3. **Tester API** : Utilisez Postman ou `curl`
4. **Logs backend** : Regardez le terminal 1
5. **Logs frontend** : Regardez la console (F12)

---

✅ **Si tout est OK, vous devriez voir :**
- FormulareEditBook pré-rempli ✓
- Page BorrowHistory avec tableau ✓
- Modal qui s'ouvre ✓
- Toast/Alert de succès ✓
- Export CSV fonctionnel ✓

❌ **Si rien ne marche :**
1. Vérifiez la **migration SQL** d'abord !
2. Redémarrez **backend + frontend**
3. Consultez `INSTRUCTIONS_MIGRATION.md` pour plus de détails
