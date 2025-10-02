/**
 * Script de Test - Connexion Email
 *
 * Utilisation : node test-email.js
 *
 * Ce script teste :
 * 1. Chargement des variables d'environnement
 * 2. Connexion au serveur SMTP
 * 3. (Optionnel) Envoi d'un email de test
 */

require('dotenv').config()
const nodemailer = require('nodemailer')

console.log('🔍 Test de Configuration Email\n')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

// Vérification des variables d'environnement
console.log('📋 Vérification des variables d\'environnement :')
console.log(`   EMAIL_HOST: ${process.env.EMAIL_HOST || '❌ MANQUANT'}`)
console.log(`   EMAIL_PORT: ${process.env.EMAIL_PORT || '❌ MANQUANT'}`)
console.log(`   EMAIL_SECURE: ${process.env.EMAIL_SECURE || '❌ MANQUANT'}`)
console.log(`   EMAIL_USER: ${process.env.EMAIL_USER || '❌ MANQUANT'}`)
console.log(`   EMAIL_PASS: ${process.env.EMAIL_PASS ? '✅ Défini (masqué)' : '❌ MANQUANT'}`)
console.log()

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('❌ ERREUR : Variables EMAIL_USER et/ou EMAIL_PASS manquantes')
    console.error('   Vérifiez votre fichier .env\n')
    process.exit(1)
}

// Configuration du transporteur
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 465,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: process.env.NODE_ENV === 'production'
    }
})

console.log('🔌 Test de connexion au serveur SMTP...\n')

// Test de connexion
transporter.verify(function(error, success) {
    if (error) {
        console.error('❌ ERREUR de connexion SMTP :')
        console.error(`   ${error.message}\n`)

        if (error.message.includes('Invalid login')) {
            console.error('💡 Solutions possibles :')
            console.error('   1. Vérifiez que EMAIL_USER est correct')
            console.error('   2. Vérifiez que EMAIL_PASS est un mot de passe d\'application Gmail')
            console.error('   3. Activez la validation en 2 étapes sur votre compte Gmail')
            console.error('   4. Générez un nouveau mot de passe d\'application :')
            console.error('      https://myaccount.google.com/apppasswords\n')
        } else if (error.message.includes('ECONNREFUSED')) {
            console.error('💡 Solutions possibles :')
            console.error('   1. Vérifiez votre connexion Internet')
            console.error('   2. Vérifiez que EMAIL_HOST et EMAIL_PORT sont corrects')
            console.error('   3. Vérifiez votre pare-feu\n')
        }

        process.exit(1)
    } else {
        console.log('✅ Connexion SMTP réussie !')
        console.log(`   Serveur : ${process.env.EMAIL_HOST}`)
        console.log(`   Port : ${process.env.EMAIL_PORT}`)
        console.log(`   Utilisateur : ${process.env.EMAIL_USER}`)
        console.log(`   Sécurisé (SSL/TLS) : ${process.env.EMAIL_SECURE}\n`)

        // Demander si on veut envoyer un email de test
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
        console.log('✅ Configuration email valide et fonctionnelle !')
        console.log('\n💡 Pour envoyer un email de test, décommentez la section')
        console.log('   "ENVOI EMAIL DE TEST" dans ce fichier.\n')

        // ========================================
        // ENVOI EMAIL DE TEST (décommenter pour tester)
        // ========================================
        /*
        const testEmail = {
            from: `"Bibliothèque Test" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER, // S'envoyer à soi-même pour test
            subject: '✅ Test Email - Système Bibliothèque',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
                        .content { background-color: #f9f9f9; padding: 20px; margin-top: 20px; }
                        .success { color: #4CAF50; font-weight: bold; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>✅ Test Réussi !</h1>
                        </div>
                        <div class="content">
                            <p class="success">Félicitations !</p>
                            <p>La configuration email de votre système de bibliothèque fonctionne parfaitement.</p>
                            <p><strong>Détails :</strong></p>
                            <ul>
                                <li>Serveur SMTP : ${process.env.EMAIL_HOST}</li>
                                <li>Port : ${process.env.EMAIL_PORT}</li>
                                <li>Date : ${new Date().toLocaleString('fr-FR')}</li>
                            </ul>
                            <p>Vous pouvez maintenant activer les rappels automatiques pour les emprunts en retard.</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        }

        console.log('📧 Envoi de l\'email de test...\n')

        transporter.sendMail(testEmail, (error, info) => {
            if (error) {
                console.error('❌ Erreur lors de l\'envoi :')
                console.error(`   ${error.message}\n`)
                process.exit(1)
            } else {
                console.log('✅ Email de test envoyé avec succès !')
                console.log(`   ID du message : ${info.messageId}`)
                console.log(`   Destinataire : ${process.env.EMAIL_USER}\n`)
                console.log('📬 Vérifiez votre boîte de réception.\n')
            }
        })
        */
    }
})
