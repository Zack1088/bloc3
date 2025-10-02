const express = require('express')
const router = express.Router()
const db = require('./../services/database')
const jwt = require('jsonwebtoken')
require('dotenv').config()

const JWT_SECRET = process.env.JWT_SECRET

// ✅ Middleware d'authentification
function authenticateToken(req, res, next) {
    const token = req.cookies.token
    if (!token) return res.status(401).json({ message: 'Non authentifié' })

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'Token invalide' })
        req.user = user
        next()
    })
}

// ✅ Middleware admin
function isAdmin(req, res, next) {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Accès refusé - Admin uniquement' })
    }
    next()
}

// ========================================
// 1️⃣ EMPRUNTER UN LIVRE (30 jours)
// ========================================
router.post('/emprunter/:livreId', authenticateToken, (req, res) => {
    const livreId = req.params.livreId
    const utilisateurId = req.user.id

    // Vérifier que le livre existe et est disponible
    const checkLivreQuery = 'SELECT * FROM livres WHERE id = ? AND statut = "disponible"'
    
    db.query(checkLivreQuery, [livreId], (err, livres) => {
        if (err) {
            console.error(err)
            return res.status(500).json({ message: 'Erreur serveur' })
        }

        if (livres.length === 0) {
            return res.status(400).json({ message: 'Ce livre n\'est pas disponible pour l\'emprunt' })
        }

        // Vérifier que l'utilisateur n'a pas déjà emprunté ce livre
        const checkEmpruntQuery = `
            SELECT * FROM emprunts 
            WHERE livre_id = ? AND utilisateur_id = ? AND statut = 'en_cours'
        `
        
        db.query(checkEmpruntQuery, [livreId, utilisateurId], (err, empruntsExistants) => {
            if (err) {
                console.error(err)
                return res.status(500).json({ message: 'Erreur serveur' })
            }

            if (empruntsExistants.length > 0) {
                return res.status(400).json({ message: 'Vous avez déjà emprunté ce livre' })
            }

            // ✅ Calculer la date de retour prévue (30 jours)
            const dateEmprunt = new Date()
            const dateRetourPrevue = new Date()
            dateRetourPrevue.setDate(dateRetourPrevue.getDate() + 30)

            // Créer l'emprunt
            const insertEmpruntQuery = `
                INSERT INTO emprunts 
                (livre_id, utilisateur_id, date_emprunt, date_retour_prevue, statut) 
                VALUES (?, ?, ?, ?, 'en_cours')
            `

            db.query(
                insertEmpruntQuery, 
                [livreId, utilisateurId, dateEmprunt, dateRetourPrevue],
                (err, result) => {
                    if (err) {
                        console.error(err)
                        return res.status(500).json({ message: 'Erreur lors de l\'emprunt' })
                    }

                    // Mettre à jour le statut du livre
                    const updateLivreQuery = 'UPDATE livres SET statut = "emprunté" WHERE id = ?'
                    
                    db.query(updateLivreQuery, [livreId], (err) => {
                        if (err) {
                            console.error(err)
                            return res.status(500).json({ message: 'Erreur lors de la mise à jour du livre' })
                        }

                        res.json({ 
                            message: 'Livre emprunté avec succès',
                            empruntId: result.insertId,
                            dateRetourPrevue: dateRetourPrevue,
                            dureeJours: 30
                        })
                    })
                }
            )
        })
    })
})

// ========================================
// 2️⃣ RETOURNER UN LIVRE
// ========================================
router.post('/retourner/:empruntId', authenticateToken, (req, res) => {
    const empruntId = req.params.empruntId
    const utilisateurId = req.user.id

    // Vérifier que l'emprunt existe et appartient à l'utilisateur
    const checkEmpruntQuery = `
        SELECT e.*, l.titre 
        FROM emprunts e
        JOIN livres l ON e.livre_id = l.id
        WHERE e.id = ? AND e.utilisateur_id = ? AND e.statut IN ('en_cours', 'en_retard')
    `

    db.query(checkEmpruntQuery, [empruntId, utilisateurId], (err, emprunts) => {
        if (err) {
            console.error(err)
            return res.status(500).json({ message: 'Erreur serveur' })
        }

        if (emprunts.length === 0) {
            return res.status(404).json({ message: 'Emprunt non trouvé ou déjà retourné' })
        }

        const emprunt = emprunts[0]
        const dateRetourEffective = new Date()

        // Mettre à jour l'emprunt
        const updateEmpruntQuery = `
            UPDATE emprunts 
            SET date_retour_effective = ?, statut = 'retourne' 
            WHERE id = ?
        `

        db.query(updateEmpruntQuery, [dateRetourEffective, empruntId], (err) => {
            if (err) {
                console.error(err)
                return res.status(500).json({ message: 'Erreur lors du retour' })
            }

            // Remettre le livre disponible
            const updateLivreQuery = 'UPDATE livres SET statut = "disponible" WHERE id = ?'
            
            db.query(updateLivreQuery, [emprunt.livre_id], (err) => {
                if (err) {
                    console.error(err)
                    return res.status(500).json({ message: 'Erreur lors de la mise à jour du livre' })
                }

                res.json({ 
                    message: 'Livre retourné avec succès',
                    livre: emprunt.titre
                })
            })
        })
    })
})

// ========================================
// 3️⃣ HISTORIQUE DES EMPRUNTS DE L'UTILISATEUR
// ========================================
router.get('/mes-emprunts', authenticateToken, (req, res) => {
    const utilisateurId = req.user.id

    const query = `
        SELECT 
            e.id,
            e.date_emprunt,
            e.date_retour_prevue,
            e.date_retour_effective,
            e.statut,
            l.id as livre_id,
            l.titre,
            l.auteur,
            l.photo_url,
            DATEDIFF(e.date_retour_prevue, NOW()) as jours_restants,
            CASE 
                WHEN e.statut = 'retourne' THEN 'Retourné'
                WHEN DATEDIFF(e.date_retour_prevue, NOW()) < 0 THEN 'En retard'
                WHEN DATEDIFF(e.date_retour_prevue, NOW()) <= 3 THEN 'À rendre bientôt'
                ELSE 'En cours'
            END as statut_libelle
        FROM emprunts e
        JOIN livres l ON e.livre_id = l.id
        WHERE e.utilisateur_id = ?
        ORDER BY 
            CASE 
                WHEN e.statut = 'en_cours' THEN 1
                WHEN e.statut = 'en_retard' THEN 2
                ELSE 3
            END,
            e.date_emprunt DESC
    `

    db.query(query, [utilisateurId], (err, results) => {
        if (err) {
            console.error(err)
            return res.status(500).json({ message: 'Erreur serveur' })
        }

        // Mettre à jour automatiquement les emprunts en retard
        results.forEach(emprunt => {
            if (emprunt.statut === 'en_cours' && emprunt.jours_restants < 0) {
                db.query(
                    'UPDATE emprunts SET statut = "en_retard" WHERE id = ?',
                    [emprunt.id]
                )
                emprunt.statut = 'en_retard'
            }
        })

        res.json(results)
    })
})

// ========================================
// 4️⃣ TOUS LES EMPRUNTS (Admin uniquement)
// ========================================
router.get('/tous', authenticateToken, isAdmin, (req, res) => {
    const query = `
        SELECT 
            e.*,
            u.nom,
            u.prenom,
            u.email,
            l.titre,
            l.auteur,
            DATEDIFF(e.date_retour_prevue, NOW()) as jours_restants
        FROM emprunts e
        JOIN utilisateurs u ON e.utilisateur_id = u.id
        JOIN livres l ON e.livre_id = l.id
        ORDER BY e.date_emprunt DESC
    `

    db.query(query, (err, results) => {
        if (err) {
            console.error(err)
            return res.status(500).json({ message: 'Erreur serveur' })
        }
        res.json(results)
    })
})

// ========================================
// 5️⃣ EMPRUNTS EN RETARD (pour rappels automatiques)
// ========================================
router.get('/en-retard', authenticateToken, isAdmin, (req, res) => {
    const query = `
        SELECT 
            e.*,
            u.email,
            u.nom,
            u.prenom,
            l.titre,
            DATEDIFF(NOW(), e.date_retour_prevue) as jours_retard
        FROM emprunts e
        JOIN utilisateurs u ON e.utilisateur_id = u.id
        JOIN livres l ON e.livre_id = l.id
        WHERE e.statut = 'en_cours' 
        AND e.date_retour_prevue < NOW()
        ORDER BY jours_retard DESC
    `

    db.query(query, (err, results) => {
        if (err) {
            console.error(err)
            return res.status(500).json({ message: 'Erreur serveur' })
        }
        
        // Marquer automatiquement comme en retard
        results.forEach(emprunt => {
            db.query('UPDATE emprunts SET statut = "en_retard" WHERE id = ?', [emprunt.id])
        })
        
        res.json(results)
    })
})

// ========================================
// 6️⃣ MARQUER UN RAPPEL COMME ENVOYÉ
// ========================================
router.post('/rappel-envoye/:empruntId', authenticateToken, isAdmin, (req, res) => {
    const query = 'UPDATE emprunts SET rappel_envoye = TRUE WHERE id = ?'
    
    db.query(query, [req.params.empruntId], (err) => {
        if (err) {
            console.error(err)
            return res.status(500).json({ message: 'Erreur serveur' })
        }
        res.json({ message: 'Rappel marqué comme envoyé' })
    })
})

// ========================================
// 7️⃣ STATISTIQUES DES EMPRUNTS
// ========================================
router.get('/statistiques', authenticateToken, (req, res) => {
    const queries = {
        total: 'SELECT COUNT(*) as count FROM emprunts',
        en_cours: 'SELECT COUNT(*) as count FROM emprunts WHERE statut = "en_cours"',
        en_retard: 'SELECT COUNT(*) as count FROM emprunts WHERE statut = "en_retard"',
        retournes: 'SELECT COUNT(*) as count FROM emprunts WHERE statut = "retourne"'
    }

    Promise.all([
        new Promise((resolve, reject) => {
            db.query(queries.total, (err, result) => err ? reject(err) : resolve(result[0].count))
        }),
        new Promise((resolve, reject) => {
            db.query(queries.en_cours, (err, result) => err ? reject(err) : resolve(result[0].count))
        }),
        new Promise((resolve, reject) => {
            db.query(queries.en_retard, (err, result) => err ? reject(err) : resolve(result[0].count))
        }),
        new Promise((resolve, reject) => {
            db.query(queries.retournes, (err, result) => err ? reject(err) : resolve(result[0].count))
        })
    ])
    .then(([total, en_cours, en_retard, retournes]) => {
        res.json({
            total_emprunts: total,
            emprunts_en_cours: en_cours,
            emprunts_en_retard: en_retard,
            emprunts_retournes: retournes
        })
    })
    .catch(err => {
        console.error(err)
        res.status(500).json({ message: 'Erreur serveur' })
    })
})

//  Route pour déclencher manuellement les rappels (Admin uniquement)
router.post('/envoyer-rappels', authenticateToken, isAdmin, async (req, res) => {
    const { executerRappelsImmediatement } = require('./../services/rappelsCron')
    
    try {
        executerRappelsImmediatement()
        res.json({ 
            message: 'Envoi des rappels en cours. Consultez les logs du serveur.',
            timestamp: new Date().toISOString()
        })
    } catch (error) {
        console.error('Erreur rappels:', error)
        res.status(500).json({ message: 'Erreur lors de l\'envoi des rappels' })
    }
})
module.exports = router