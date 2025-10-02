const express = require('express')
const server = require('./server')
const { demarrerTacheCron } = require('./services/rappelsCron')
require('dotenv').config()

const app = express()
const PORT = process.env.PORT || 3000

app.use(`/`,server)

app.get(`/*`, (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

app.listen(PORT, () => {
    console.info(`✅ Serveur démarré sur le port ${PORT}`)
    console.info(`🌍 Environnement: ${process.env.NODE_ENV || 'development'}`)

    // Démarrer la tâche CRON pour les rappels automatiques
    demarrerTacheCron()
})