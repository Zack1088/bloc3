const mysql = require('mysql2')
require('dotenv').config()

// Validation des variables d'environnement
if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_PASSWORD || !process.env.DB_NAME) {
    console.error('⚠️  ERREUR: Variables de base de données manquantes dans .env')
    console.error('Vérifiez que DB_HOST, DB_USER, DB_PASSWORD et DB_NAME sont définis')
}

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
})

db.connect((err) => {
    if (err) {
        console.error('❌ Erreur de connexion à la base de données:', err.message)
        throw err
    }
    console.log(`✅ Database Connected! (${process.env.DB_NAME})`)
})

module.exports = db