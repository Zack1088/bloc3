const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const JWT_SECRET = "HelloThereImObiWan"

describe('Tests Unitaires - Authentification', () => {
  describe('Hachage des mots de passe avec Bcrypt', () => {
    test('Devrait hasher un mot de passe', async () => {
      const password = 'testPassword123'
      const hash = await bcrypt.hash(password, 10)

      expect(hash).toBeDefined()
      expect(hash).not.toBe(password)
      expect(hash.length).toBeGreaterThan(50)
    })

    test('Devrait comparer correctement un mot de passe', async () => {
      const password = 'testPassword123'
      const hash = await bcrypt.hash(password, 10)

      const isMatch = await bcrypt.compare(password, hash)
      expect(isMatch).toBe(true)
    })

    test('Devrait rejeter un mauvais mot de passe', async () => {
      const password = 'testPassword123'
      const wrongPassword = 'wrongPassword456'
      const hash = await bcrypt.hash(password, 10)

      const isMatch = await bcrypt.compare(wrongPassword, hash)
      expect(isMatch).toBe(false)
    })
  })

  describe('Génération et vérification JWT', () => {
    test('Devrait générer un token JWT valide', () => {
      const payload = { id: 1, email: 'test@test.com', role: 'utilisateur' }
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' })

      expect(token).toBeDefined()
      expect(typeof token).toBe('string')

      const decoded = jwt.verify(token, JWT_SECRET)
      expect(decoded.id).toBe(1)
      expect(decoded.email).toBe('test@test.com')
      expect(decoded.role).toBe('utilisateur')
    })

    test('Devrait rejeter un token invalide', () => {
      const invalidToken = 'invalid.token.here'

      expect(() => {
        jwt.verify(invalidToken, JWT_SECRET)
      }).toThrow()
    })

    test('Devrait rejeter un token expiré', () => {
      const payload = { id: 1, email: 'test@test.com' }
      const expiredToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '-1s' })

      expect(() => {
        jwt.verify(expiredToken, JWT_SECRET)
      }).toThrow('jwt expired')
    })
  })
})