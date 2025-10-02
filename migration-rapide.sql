-- ============================================
-- MIGRATION RAPIDE - Panel Admin
-- Ajoute les colonnes nécessaires pour les rappels manuels
-- ============================================

USE library;

-- Ajouter les colonnes (sans IF NOT EXISTS pour MySQL 5.x)
ALTER TABLE emprunts
ADD COLUMN rappels_envoyes INT DEFAULT 0 COMMENT 'Nombre de rappels manuels envoyés';

ALTER TABLE emprunts
ADD COLUMN derniere_date_rappel DATETIME NULL COMMENT 'Date du dernier rappel envoyé';

-- Créer les index pour améliorer les performances
CREATE INDEX idx_emprunts_statut ON emprunts(statut);
CREATE INDEX idx_emprunts_utilisateur ON emprunts(utilisateur_id);
CREATE INDEX idx_emprunts_livre ON emprunts(livre_id);

-- Afficher le résultat
SELECT 'Migration terminée avec succès !' AS Status;
SHOW COLUMNS FROM emprunts;
