require('dotenv').config()
const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET

/**
 * Middleware to verify JWT token and admin role
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const authAdmin = (req, res, next) => {
    const token = req.cookies.token

    if (!token) {
        return res.status(401).json({
            message: 'Authentification requise'
        })
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET)

        // Check if user has admin role
        if (decoded.role !== 'admin') {
            return res.status(403).json({
                message: 'Accès refusé - Droits administrateur requis'
            })
        }

        // Attach user info to request
        req.user = decoded

        next()
    } catch (error) {
        console.error('Erreur de vérification JWT:', error)
        return res.status(401).json({
            message: 'Token invalide ou expiré'
        })
    }
}

module.exports = authAdmin
