const request = require('supertest')
const express = require('express')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const jwt = require('jsonwebtoken')

// Mock de la base de données
jest.mock('../../services/database', () => ({
  query: jest.fn()
}))

const db = require('../../services/database')
const empruntsRouter = require('../../router/emprunts')

const JWT_SECRET = "HelloThereImObiWan"

// Configuration de l'app de test
const app = express()
app.use(bodyParser.json())
app.use(cookieParser())
app.use('/api/emprunts', empruntsRouter)

describe('Tests Unitaires - Routes Emprunts', () => {
  let token
  let userToken

  beforeAll(() => {
    // Créer des tokens JWT pour les tests
    token = jwt.sign(
      { id: 1, email: 'john@smith.com', role: 'admin' },
      JWT_SECRET,
      { expiresIn: '1h' }
    )

    userToken = jwt.sign(
      { id: 2, email: 'marc@lord.com', role: 'utilisateur' },
      JWT_SECRET,
      { expiresIn: '1h' }
    )
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/emprunts/emprunter/:livreId', () => {
    test('Devrait emprunter un livre disponible avec succès', async () => {
      // Mock des requêtes DB
      db.query
        .mockImplementationOnce((query, params, callback) => {
          // Vérifier que le livre est disponible
          callback(null, [{ id: 1, titre: 'Test Book', statut: 'disponible' }])
        })
        .mockImplementationOnce((query, params, callback) => {
          // Vérifier qu'il n'y a pas d'emprunt existant
          callback(null, [])
        })
        .mockImplementationOnce((query, params, callback) => {
          // Créer l'emprunt
          callback(null, { insertId: 1 })
        })
        .mockImplementationOnce((query, params, callback) => {
          // Mettre à jour le statut du livre
          callback(null, {})
        })

      const response = await request(app)
        .post('/api/emprunts/emprunter/1')
        .set('Cookie', [`token=${userToken}`])
        .expect(200)

      expect(response.body).toHaveProperty('message', 'Livre emprunté avec succès')
      expect(response.body).toHaveProperty('dureeJours', 30)
      expect(response.body).toHaveProperty('dateRetourPrevue')
    })

    test('Devrait retourner une erreur si le livre n\'est pas disponible', async () => {
      db.query.mockImplementationOnce((query, params, callback) => {
        callback(null, []) // Aucun livre disponible
      })

      const response = await request(app)
        .post('/api/emprunts/emprunter/1')
        .set('Cookie', [`token=${userToken}`])
        .expect(400)

      expect(response.body).toHaveProperty('message', 'Ce livre n\'est pas disponible pour l\'emprunt')
    })

    test('Devrait retourner une erreur si l\'utilisateur a déjà emprunté ce livre', async () => {
      db.query
        .mockImplementationOnce((query, params, callback) => {
          callback(null, [{ id: 1, titre: 'Test Book', statut: 'disponible' }])
        })
        .mockImplementationOnce((query, params, callback) => {
          // Emprunt existant
          callback(null, [{ id: 1, livre_id: 1, utilisateur_id: 2 }])
        })

      const response = await request(app)
        .post('/api/emprunts/emprunter/1')
        .set('Cookie', [`token=${userToken}`])
        .expect(400)

      expect(response.body).toHaveProperty('message', 'Vous avez déjà emprunté ce livre')
    })

    test('Devrait retourner 401 sans authentification', async () => {
      const response = await request(app)
        .post('/api/emprunts/emprunter/1')
        .expect(401)
    })
  })

  describe('POST /api/emprunts/retourner/:empruntId', () => {
    test('Devrait retourner un livre avec succès', async () => {
      db.query
        .mockImplementationOnce((query, params, callback) => {
          // Vérifier que l'emprunt existe
          callback(null, [{
            id: 1,
            livre_id: 1,
            utilisateur_id: 2,
            titre: 'Test Book',
            statut: 'en_cours'
          }])
        })
        .mockImplementationOnce((query, params, callback) => {
          // Mettre à jour l'emprunt
          callback(null, {})
        })
        .mockImplementationOnce((query, params, callback) => {
          // Mettre à jour le livre
          callback(null, {})
        })

      const response = await request(app)
        .post('/api/emprunts/retourner/1')
        .set('Cookie', [`token=${userToken}`])
        .expect(200)

      expect(response.body).toHaveProperty('message', 'Livre retourné avec succès')
      expect(response.body).toHaveProperty('livre', 'Test Book')
    })

    test('Devrait retourner 404 si l\'emprunt n\'existe pas', async () => {
      db.query.mockImplementationOnce((query, params, callback) => {
        callback(null, []) // Aucun emprunt trouvé
      })

      const response = await request(app)
        .post('/api/emprunts/retourner/999')
        .set('Cookie', [`token=${userToken}`])
        .expect(404)

      expect(response.body).toHaveProperty('message', 'Emprunt non trouvé ou déjà retourné')
    })
  })

  describe('GET /api/emprunts/mes-emprunts', () => {
    test('Devrait retourner la liste des emprunts de l\'utilisateur', async () => {
      const mockEmprunts = [
        {
          id: 1,
          livre_id: 1,
          titre: 'Test Book 1',
          auteur: 'Author 1',
          statut: 'en_cours',
          jours_restants: 25
        },
        {
          id: 2,
          livre_id: 2,
          titre: 'Test Book 2',
          auteur: 'Author 2',
          statut: 'retourne',
          jours_restants: null
        }
      ]

      db.query.mockImplementationOnce((query, params, callback) => {
        callback(null, mockEmprunts)
      })

      const response = await request(app)
        .get('/api/emprunts/mes-emprunts')
        .set('Cookie', [`token=${userToken}`])
        .expect(200)

      expect(Array.isArray(response.body)).toBe(true)
      expect(response.body).toHaveLength(2)
      expect(response.body[0]).toHaveProperty('titre', 'Test Book 1')
    })

    test('Devrait retourner un tableau vide si aucun emprunt', async () => {
      db.query.mockImplementationOnce((query, params, callback) => {
        callback(null, [])
      })

      const response = await request(app)
        .get('/api/emprunts/mes-emprunts')
        .set('Cookie', [`token=${userToken}`])
        .expect(200)

      expect(Array.isArray(response.body)).toBe(true)
      expect(response.body).toHaveLength(0)
    })
  })

  describe('GET /api/emprunts/tous', () => {
    test('Admin devrait pouvoir voir tous les emprunts', async () => {
      const mockEmprunts = [
        { id: 1, utilisateur_id: 1, livre_id: 1, statut: 'en_cours' },
        { id: 2, utilisateur_id: 2, livre_id: 2, statut: 'retourne' }
      ]

      db.query.mockImplementationOnce((query, callback) => {
        callback(null, mockEmprunts)
      })

      const response = await request(app)
        .get('/api/emprunts/tous')
        .set('Cookie', [`token=${token}`]) // Token admin
        .expect(200)

      expect(Array.isArray(response.body)).toBe(true)
      expect(response.body).toHaveLength(2)
    })

    test('Utilisateur normal ne devrait pas pouvoir voir tous les emprunts', async () => {
      const response = await request(app)
        .get('/api/emprunts/tous')
        .set('Cookie', [`token=${userToken}`]) // Token user
        .expect(403)

      expect(response.body).toHaveProperty('message', 'Accès refusé - Admin uniquement')
    })
  })
})