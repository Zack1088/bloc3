const express = require('express')
const bodyParser = require('body-parser')
const booksrouter = require('./router/books')
const usersRouter = require('./router/users')
const empruntsRouter = require('./router/emprunts')
const cors = require('cors')
const path = require('path')
const cookieParser = require('cookie-parser')
const jwt = require('jsonwebtoken')
const db = require('./services/database')
const fs = require('fs')
require('dotenv').config()

// Validation du JWT_SECRET
if (!process.env.JWT_SECRET) {
    console.error('⚠️  ERREUR: JWT_SECRET manquant dans .env')
    process.exit(1)
}

const JWT_SECRET = process.env.JWT_SECRET

function authenticateToken(req, res, next) {
    const token = req.cookies.token
    if (!token) return res.sendStatus(401)

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403)
        req.user = user
        next()
    })
}

const corsOptions = {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    optionsSuccessStatus: 204
}

const router = express.Router()
router.use(bodyParser.json());
router.use(cors(corsOptions));
router.use(cookieParser());
router.use('/api/books', booksrouter);
router.use('/api/users', usersRouter);
router.use('/api/emprunts', empruntsRouter);

router.post('/api/logout', (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/'
    });
    res.json({ message: 'Déconnexion réussie' });
});

router.get('/api/session', authenticateToken, (req, res) => {
    if (req?.user) {
        res.json({ user: req.user });
    } else {
        res.status(401).json({ message: 'Non authentifié' });
    }
});

router.get('/api/statistics', (req, res) => {
    const totalBooksQuery = 'SELECT COUNT(*) AS total_books FROM livres';
    const totalUsersQuery = 'SELECT COUNT(*) AS total_users FROM utilisateurs';

    db.query(totalBooksQuery, (err, booksResult) => {
        if (err) throw err;
        db.query(totalUsersQuery, (err, usersResult) => {
            if (err) throw err;
            res.json({
                total_books: booksResult[0].total_books,
                total_users: usersResult[0].total_users
            });
        });
    });
});

// Servir les fichiers statiques uniquement si le dossier existe
const webpubPath = path.join(__dirname, "./webpub")
if (fs.existsSync(webpubPath)) {
    console.log('📁 Serving static files from webpub/')
    router.use('/', express.static(webpubPath))
    router.use(express.static(webpubPath))
    router.get('/*', (_, res) => {
        res.sendFile(path.join(webpubPath, 'index.html'));
    })
} else {
    console.log('⚠️  webpub folder not found - Running in development mode (API only)')
    // En développement, renvoyer un message pour les routes non-API
    router.get('/*', (req, res) => {
        res.json({ 
            message: 'API Server - Frontend should be accessed at http://localhost:5173',
            timestamp: new Date().toISOString()
        });
    })
}

module.exports = router;