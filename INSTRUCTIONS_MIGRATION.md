# 🔧 Instructions de Migration - Panel Admin

## ❌ Problème Actuel

L'erreur `"Champ 'e.rappels_envoyes' inconnu dans field list"` indique que la table `emprunts` n'a pas encore les nouvelles colonnes.

## ✅ Solution : Exécuter la Migration SQL

### Option 1 : Via MySQL Workbench (Recommandé)

1. Ouvrez **MySQL Workbench**
2. Connectez-vous à votre serveur MySQL
3. Sélectionnez la base de données `library` :
   ```sql
   USE library;
   ```

4. Copiez et exécutez ce script SQL :

```sql
-- Ajouter les colonnes pour le système de rappels
ALTER TABLE emprunts
ADD COLUMN rappels_envoyes INT DEFAULT 0 COMMENT 'Nombre de rappels manuels envoyés';

ALTER TABLE emprunts
ADD COLUMN derniere_date_rappel DATETIME NULL COMMENT 'Date du dernier rappel envoyé';

-- Créer des index pour améliorer les performances
CREATE INDEX idx_emprunts_statut ON emprunts(statut);
CREATE INDEX idx_emprunts_utilisateur ON emprunts(utilisateur_id);
CREATE INDEX idx_emprunts_livre ON emprunts(livre_id);

-- Vérifier que tout s'est bien passé
SHOW COLUMNS FROM emprunts;
```

### Option 2 : Via Ligne de Commande

```bash
# Depuis le dossier du projet
cd C:\Users\HP\Desktop\BLOC3-ZAKARIA-LAHOUALI\BC3SJ1-JAVASCRIPT

# Se connecter à MySQL (remplacez 'root' par votre utilisateur)
mysql -u libr -p

# Dans le shell MySQL
USE library;

# Coller les commandes ci-dessous
ALTER TABLE emprunts ADD COLUMN rappels_envoyes INT DEFAULT 0;
ALTER TABLE emprunts ADD COLUMN derniere_date_rappel DATETIME NULL;
CREATE INDEX idx_emprunts_statut ON emprunts(statut);
CREATE INDEX idx_emprunts_utilisateur ON emprunts(utilisateur_id);
CREATE INDEX idx_emprunts_livre ON emprunts(livre_id);

# Vérifier
SHOW COLUMNS FROM emprunts;

# Quitter
EXIT;
```

### Option 3 : Via le fichier SQL fourni

```bash
# Depuis le terminal
mysql -u libr -p library < database/migrations/add_rappel_columns.sql
```

## ✅ Vérification

Après la migration, vérifiez que les colonnes existent :

```sql
DESCRIBE emprunts;
```

Vous devriez voir :
```
+-------------------------+--------------+------+-----+---------+----------------+
| Field                   | Type         | Null | Key | Default | Extra          |
+-------------------------+--------------+------+-----+---------+----------------+
| id                      | int          | NO   | PRI | NULL    | auto_increment |
| livre_id                | int          | NO   | MUL | NULL    |                |
| utilisateur_id          | int          | NO   | MUL | NULL    |                |
| date_emprunt            | datetime     | NO   |     | NULL    |                |
| date_retour_prevue      | datetime     | NO   |     | NULL    |                |
| date_retour_effective   | datetime     | YES  |     | NULL    |                |
| statut                  | enum(...)    | NO   | MUL | ...     |                |
| rappel_envoye           | tinyint(1)   | YES  |     | 0       |                |
| rappels_envoyes         | int          | YES  |     | 0       |  ← NOUVELLE    |
| derniere_date_rappel    | datetime     | YES  |     | NULL    |  ← NOUVELLE    |
+-------------------------+--------------+------+-----+---------+----------------+
```

## 🔄 Redémarrer l'Application

Après la migration SQL :

1. **Redémarrer le serveur backend :**
   - Arrêter le serveur (Ctrl+C dans le terminal)
   - Relancer : `npm run dev`

2. **Rafraîchir le frontend :**
   - Recharger la page (F5)

## 🧪 Tester les Nouvelles Fonctionnalités

### 1. Test Auto-remplissage EditBook

1. Login en tant qu'admin
2. Aller sur la liste des livres
3. Cliquer "Éditer" sur n'importe quel livre
4. ✅ Le formulaire doit se pré-remplir automatiquement
5. ✅ Un skeleton loader doit apparaître brièvement

### 2. Test Historique des Emprunts

1. Aller sur `/borrow-history` ou cliquer "Historique complet" depuis le Dashboard
2. ✅ Vous devez voir la page avec :
   - 4 cartes de statistiques
   - Filtres (livre, utilisateur, statut, dates)
   - Tableau paginé
   - Bouton "📊 Exporter CSV"

### 3. Test Rappels Manuels

1. Dans l'historique des emprunts
2. Trouver un emprunt "En retard"
3. Cliquer sur le bouton "📧 Rappel"
4. ✅ Modal de confirmation doit apparaître
5. Confirmer
6. ✅ Toast de succès doit s'afficher
7. ✅ Compteur "Rappels" doit augmenter

### 4. Test Modal & Toast

1. N'importe quelle action (éditer, envoyer rappel)
2. ✅ Modal doit apparaître avec animation
3. ✅ Toast notifications doivent s'afficher en haut à droite
4. ✅ ESC doit fermer la modal

## 🐛 Dépannage

### Erreur "Cannot find module './contexts/ToastContext.jsx'"

Le ToastProvider a été ajouté dans `main.jsx`. Si erreur, vérifier :
```bash
# Le fichier existe ?
dir client\src\contexts\ToastContext.jsx
```

### Erreur 404 sur /borrow-history

La route a été ajoutée dans `App.jsx`. Vérifier l'import :
```javascript
import BorrowHistory from './components/admin/BorrowHistory.jsx'
```

### Modal ne s'affiche pas

Vérifier la console browser (F12). Le ToastProvider doit wrapper toute l'app dans `main.jsx`.

---

## 📝 Résumé des Changements

### Backend
- ✅ Route `GET /api/emprunts/all` (historique admin)
- ✅ Route `POST /api/emprunts/:id/rappel` (rappel manuel)
- ✅ Middleware `authAdmin` pour sécurité

### Frontend
- ✅ ToastProvider dans `main.jsx`
- ✅ Route `/borrow-history` dans `App.jsx`
- ✅ Composants UI : Modal, Toast, ConfirmDialog, DataTable, SkeletonLoader
- ✅ BorrowHistory.jsx (page historique)
- ✅ EditBook amélioré (auto-fill)
- ✅ Dashboard amélioré (6 stats)

### Database
- ✅ Colonne `rappels_envoyes` (INT DEFAULT 0)
- ✅ Colonne `derniere_date_rappel` (DATETIME NULL)
- ✅ Index pour performances

---

Une fois la migration SQL exécutée et l'application redémarrée, tout devrait fonctionner correctement ! 🚀
