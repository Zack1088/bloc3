const nodemailer = require('nodemailer')
require('dotenv').config()

// Validation des variables d'environnement
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('⚠️  ERREUR: Variables EMAIL_USER et EMAIL_PASS manquantes dans .env')
}

// Configuration sécurisée du transporteur email
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 465,
    secure: process.env.EMAIL_SECURE === 'true', // true pour port 465, false pour autres ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        // Ne pas échouer sur des certificats invalides en dev
        rejectUnauthorized: process.env.NODE_ENV === 'production'
    }
})

// Fonction pour envoyer un email de rappel
async function envoyerRappelRetard(utilisateur, livre, emprunt) {
    const joursRetard = Math.abs(Math.floor((new Date() - new Date(emprunt.date_retour_prevue)) / (1000 * 60 * 60 * 24)))
    
    const mailOptions = {
        from: '"Bibliothèque" <noreply@bibliotheque.fr>',
        to: utilisateur.email,
        subject: `⚠️ Rappel : Retour de livre en retard`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #f44336; color: white; padding: 20px; text-align: center; }
                    .content { background-color: #f9f9f9; padding: 20px; margin-top: 20px; }
                    .book-info { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #f44336; }
                    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                    .button { display: inline-block; background-color: #2196F3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 15px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>⚠️ Rappel de Retour</h1>
                    </div>
                    
                    <div class="content">
                        <p>Bonjour ${utilisateur.prenom} ${utilisateur.nom},</p>
                        
                        <p>Nous vous rappelons que le livre suivant aurait dû être retourné :</p>
                        
                        <div class="book-info">
                            <h3>📚 ${livre.titre}</h3>
                            <p><strong>Auteur :</strong> ${livre.auteur}</p>
                            <p><strong>Date d'emprunt :</strong> ${new Date(emprunt.date_emprunt).toLocaleDateString('fr-FR')}</p>
                            <p><strong>Date de retour prévue :</strong> ${new Date(emprunt.date_retour_prevue).toLocaleDateString('fr-FR')}</p>
                            <p style="color: #f44336; font-weight: bold;">
                                ⏰ Retard : ${joursRetard} jour(s)
                            </p>
                        </div>
                        
                        <p>Merci de retourner ce livre dès que possible.</p>
                        
                        <p>Vous pouvez signaler le retour directement depuis votre espace personnel :</p>
                        
                        <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/mes-emprunts" class="button">
                            📖 Voir mes emprunts
                        </a>
                    </div>
                    
                    <div class="footer">
                        <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
                        <p>© 2025 Bibliothèque - Système de gestion des emprunts</p>
                    </div>
                </div>
            </body>
            </html>
        `
    }

    try {
        const info = await transporter.sendMail(mailOptions)
        console.log('✅ Email envoyé:', info.messageId)
        return { success: true, messageId: info.messageId }
    } catch (error) {
        console.error('❌ Erreur envoi email:', error)
        return { success: false, error: error.message }
    }
}

// Fonction de test
async function testerConnexionEmail() {
    try {
        await transporter.verify()
        console.log('✅ Serveur email prêt')
        return true
    } catch (error) {
        console.error('❌ Erreur connexion email:', error)
        return false
    }
}

module.exports = {
    envoyerRappelRetard,
    testerConnexionEmail
}