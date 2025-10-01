const cron = require('node-cron')
const db = require('./database')
const { envoyerRappelRetard } = require('./mailer')

// Fonction pour vérifier et envoyer les rappels
async function verifierEmpruntsEnRetard() {
    console.log('🔍 Vérification des emprunts en retard...', new Date().toISOString())
    
    const query = `
        SELECT 
            e.*,
            u.email,
            u.nom,
            u.prenom,
            l.titre,
            l.auteur,
            DATEDIFF(NOW(), e.date_retour_prevue) as jours_retard
        FROM emprunts e
        JOIN utilisateurs u ON e.utilisateur_id = u.id
        JOIN livres l ON e.livre_id = l.id
        WHERE e.statut IN ('en_cours', 'en_retard')
        AND e.date_retour_prevue < NOW()
        AND e.rappel_envoye = FALSE
    `
    
    db.query(query, async (err, empruntsEnRetard) => {
        if (err) {
            console.error('❌ Erreur requête:', err)
            return
        }
        
        if (empruntsEnRetard.length === 0) {
            console.log('✅ Aucun emprunt en retard sans rappel')
            return
        }
        
        console.log(`📧 ${empruntsEnRetard.length} rappel(s) à envoyer`)
        
        // Envoyer un email pour chaque emprunt en retard
        for (const emprunt of empruntsEnRetard) {
            const utilisateur = {
                email: emprunt.email,
                nom: emprunt.nom,
                prenom: emprunt.prenom
            }
            
            const livre = {
                titre: emprunt.titre,
                auteur: emprunt.auteur
            }
            
            // Envoyer l'email
            const resultat = await envoyerRappelRetard(utilisateur, livre, emprunt)
            
            if (resultat.success) {
                // Marquer le rappel comme envoyé
                db.query(
                    'UPDATE emprunts SET rappel_envoye = TRUE, statut = "en_retard" WHERE id = ?',
                    [emprunt.id],
                    (err) => {
                        if (err) {
                            console.error(`❌ Erreur mise à jour emprunt ${emprunt.id}:`, err)
                        } else {
                            console.log(`✅ Rappel envoyé à ${utilisateur.email} pour "${livre.titre}"`)
                        }
                    }
                )
            }
        }
    })
}

// Planifier la vérification tous les jours à 9h00
function demarrerTacheCron() {
    // Format : seconde minute heure jour mois jour-semaine
    // '0 9 * * *' = Tous les jours à 9h00
    cron.schedule('0 9 * * *', () => {
        console.log('⏰ Tâche CRON : Vérification des rappels')
        verifierEmpruntsEnRetard()
    })
    
    console.log('✅ Tâche CRON démarrée : Rappels quotidiens à 9h00')
    
    // Pour les tests : vérifier toutes les minutes
    // cron.schedule('* * * * *', verifierEmpruntsEnRetard)
}

// Fonction pour test manuel immédiat
function executerRappelsImmediatement() {
    console.log('🚀 Exécution manuelle des rappels...')
    verifierEmpruntsEnRetard()
}

module.exports = {
    demarrerTacheCron,
    executerRappelsImmediatement
}