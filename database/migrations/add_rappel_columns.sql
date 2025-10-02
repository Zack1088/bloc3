-- Migration: Ajout des colonnes pour le système de rappels manuels
-- Date: 2025-10-03
-- Description: Ajoute les colonnes rappels_envoyes et derniere_date_rappel pour tracker les rappels manuels

-- Vérifier si les colonnes existent avant de les ajouter
ALTER TABLE emprunts
ADD COLUMN IF NOT EXISTS rappels_envoyes INT DEFAULT 0 COMMENT 'Nombre de rappels manuels envoyés',
ADD COLUMN IF NOT EXISTS derniere_date_rappel DATETIME NULL COMMENT 'Date du dernier rappel envoyé';

-- Créer un index pour améliorer les performances des requêtes sur le statut
CREATE INDEX IF NOT EXISTS idx_emprunts_statut ON emprunts(statut);

-- Créer un index pour les recherches par utilisateur
CREATE INDEX IF NOT EXISTS idx_emprunts_utilisateur ON emprunts(utilisateur_id);

-- Créer un index pour les recherches par livre
CREATE INDEX IF NOT EXISTS idx_emprunts_livre ON emprunts(livre_id);

-- Afficher un message de confirmation
SELECT 'Migration terminée: Colonnes rappels_envoyes et derniere_date_rappel ajoutées avec succès' AS message;
