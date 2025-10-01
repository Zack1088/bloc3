const request = require('supertest')
const mysql = require('mysql2/promise')
const jwt = require('jsonwebtoken')

const JWT_SECRET = "HelloThereImObiWan"
const API_URL = 'http://localhost:3000'

// ✅ Configuration de la base de données de test avec root
const dbConfig = {
  host: 'localhost',
  user: 'root',  // ✅ Utiliser root pour les tests
  password: '',  // ✅ Votre mot de passe root (vide si pas de mot de passe)
  database: 'library_test',
  multipleStatements: true  // ✅ Permet d'exécuter plusieurs requêtes à la fois
}

describe('Tests d\'Intégration - Système d\'Emprunts', () => {
  let connection
  let adminToken
  let userToken
  let userId
  let livreId

  beforeAll(async () => {
    try {
      // ✅ Connexion initiale sans base de données spécifique
      connection = await mysql.createConnection({
        host: dbConfig.host,
        user: dbConfig.user,
        password: dbConfig.password,
        multipleStatements: true
      })

      console.log('✅ Connexion MySQL établie')

      // Créer la base de données de test
      await connection.query('DROP DATABASE IF EXISTS library_test')
      await connection.query('CREATE DATABASE library_test')
      await connection.query('USE library_test')

      console.log('✅ Base de données library_test créée')

      // Créer les tables
      await connection.query(`
        CREATE TABLE utilisateurs (
          id INT PRIMARY KEY AUTO_INCREMENT,
          nom VARCHAR(255),
          prenom VARCHAR(255),
          email VARCHAR(255) UNIQUE,
          mot_de_passe VARCHAR(255),
          role VARCHAR(50) DEFAULT 'utilisateur',
          date_inscription TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `)

      await connection.query(`
        CREATE TABLE livres (
          id INT PRIMARY KEY AUTO_INCREMENT,
          titre VARCHAR(255),
          auteur VARCHAR(255),
          isbn VARCHAR(13),
          description TEXT,
          date_publication DATE,
          statut ENUM('disponible', 'emprunté') DEFAULT 'disponible',
          photo_url VARCHAR(255)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `)

      await connection.query(`
        CREATE TABLE emprunts (
          id INT PRIMARY KEY AUTO_INCREMENT,
          livre_id INT,
          utilisateur_id INT,
          date_emprunt DATETIME DEFAULT CURRENT_TIMESTAMP,
          date_retour_prevue DATETIME,
          date_retour_effective DATETIME,
          statut ENUM('en_cours', 'retourne', 'en_retard') DEFAULT 'en_cours',
          rappel_envoye BOOLEAN DEFAULT FALSE,
          FOREIGN KEY (livre_id) REFERENCES livres(id) ON DELETE CASCADE,
          FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `)

      console.log('✅ Tables créées')

      // Insérer des données de test
      const bcrypt = require('bcrypt')
      const hashedPassword = await bcrypt.hash('testpass', 10)

      const [userResult] = await connection.query(
        'INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, role) VALUES (?, ?, ?, ?, ?)',
        ['Test', 'User', 'test@test.com', hashedPassword, 'utilisateur']
      )
      userId = userResult.insertId

      const [livreResult] = await connection.query(
        'INSERT INTO livres (titre, auteur, isbn, description, date_publication, photo_url) VALUES (?, ?, ?, ?, ?, ?)',
        ['Test Book', 'Test Author', '1234567890', 'Description test', '2024-01-01', 'http://test.jpg']
      )
      livreId = livreResult.insertId

      console.log('✅ Données de test insérées')

      // Créer les tokens
      adminToken = jwt.sign({ id: 1, email: 'admin@test.com', role: 'admin' }, JWT_SECRET)
      userToken = jwt.sign({ id: userId, email: 'test@test.com', role: 'utilisateur' }, JWT_SECRET)

      console.log('✅ Configuration des tests terminée')
    } catch (error) {
      console.error('❌ Erreur lors de la configuration des tests:', error)
      throw error
    }
  })

  afterAll(async () => {
    if (connection) {
      try {
        await connection.query('DROP DATABASE IF EXISTS library_test')
        console.log('✅ Base de données de test supprimée')
        await connection.end()
        console.log('✅ Connexion MySQL fermée')
      } catch (error) {
        console.error('❌ Erreur lors du nettoyage:', error)
      }
    }
  })

  // ✅ Nettoyer les données entre chaque test
  afterEach(async () => {
    if (connection) {
      await connection.query('DELETE FROM emprunts')
      await connection.query('UPDATE livres SET statut = "disponible"')
    }
  })

  describe('Workflow complet : Emprunt → Consultation → Retour', () => {
    let empruntId

    test('Étape 1 : Emprunter un livre disponible', async () => {
      const response = await request(API_URL)
        .post(`/api/emprunts/emprunter/${livreId}`)
        .set('Cookie', [`token=${userToken}`])
        .expect(200)

      expect(response.body).toHaveProperty('message', 'Livre emprunté avec succès')
      expect(response.body).toHaveProperty('empruntId')
      empruntId = response.body.empruntId

      // Vérifier en base de données
      const [emprunts] = await connection.query(
        'SELECT * FROM emprunts WHERE id = ?',
        [empruntId]
      )
      expect(emprunts).toHaveLength(1)
      expect(emprunts[0].statut).toBe('en_cours')

      const [livres] = await connection.query(
        'SELECT statut FROM livres WHERE id = ?',
        [livreId]
      )
      expect(livres[0].statut).toBe('emprunté')
    })

    test('Étape 2 : Consulter mes emprunts', async () => {
      // D'abord créer un emprunt
      await request(API_URL)
        .post(`/api/emprunts/emprunter/${livreId}`)
        .set('Cookie', [`token=${userToken}`])

      const response = await request(API_URL)
        .get('/api/emprunts/mes-emprunts')
        .set('Cookie', [`token=${userToken}`])
        .expect(200)

      expect(Array.isArray(response.body)).toBe(true)
      expect(response.body.length).toBeGreaterThan(0)
      expect(response.body[0]).toHaveProperty('titre', 'Test Book')
      expect(response.body[0]).toHaveProperty('statut', 'en_cours')
    })

    test('Étape 3 : Retourner le livre', async () => {
      // Créer un emprunt
      const empruntResponse = await request(API_URL)
        .post(`/api/emprunts/emprunter/${livreId}`)
        .set('Cookie', [`token=${userToken}`])
      
      empruntId = empruntResponse.body.empruntId

      const response = await request(API_URL)
        .post(`/api/emprunts/retourner/${empruntId}`)
        .set('Cookie', [`token=${userToken}`])
        .expect(200)

      expect(response.body).toHaveProperty('message', 'Livre retourné avec succès')

      // Vérifier en base de données
      const [emprunts] = await connection.query(
        'SELECT * FROM emprunts WHERE id = ?',
        [empruntId]
      )
      expect(emprunts[0].statut).toBe('retourne')
      expect(emprunts[0].date_retour_effective).not.toBeNull()

      const [livres] = await connection.query(
        'SELECT statut FROM livres WHERE id = ?',
        [livreId]
      )
      expect(livres[0].statut).toBe('disponible')
    })

    test('Étape 4 : Vérifier qu\'on ne peut plus retourner le même emprunt', async () => {
      // Créer et retourner un emprunt
      const empruntResponse = await request(API_URL)
        .post(`/api/emprunts/emprunter/${livreId}`)
        .set('Cookie', [`token=${userToken}`])
      
      empruntId = empruntResponse.body.empruntId

      await request(API_URL)
        .post(`/api/emprunts/retourner/${empruntId}`)
        .set('Cookie', [`token=${userToken}`])

      // Tenter de retourner à nouveau
      const response = await request(API_URL)
        .post(`/api/emprunts/retourner/${empruntId}`)
        .set('Cookie', [`token=${userToken}`])
        .expect(404)

      expect(response.body).toHaveProperty('message', 'Emprunt non trouvé ou déjà retourné')
    })
  })

  describe('Tests de sécurité et contrôles d\'accès', () => {
    test('Ne devrait pas emprunter un livre déjà emprunté', async () => {
      // Emprunter une première fois
      await request(API_URL)
        .post(`/api/emprunts/emprunter/${livreId}`)
        .set('Cookie', [`token=${userToken}`])

      // Tenter d'emprunter à nouveau
      const response = await request(API_URL)
        .post(`/api/emprunts/emprunter/${livreId}`)
        .set('Cookie', [`token=${userToken}`])
        .expect(400)

      expect(response.body.message).toContain('déjà emprunté')
    })

    test('Ne devrait pas retourner l\'emprunt d\'un autre utilisateur', async () => {
      // Créer un autre utilisateur
      const bcrypt = require('bcrypt')
      const hash = await bcrypt.hash('pass2', 10)
      const [user2] = await connection.query(
        'INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe) VALUES (?, ?, ?, ?)',
        ['User', '2', 'user2@test.com', hash]
      )

      const user2Token = jwt.sign({ id: user2.insertId, email: 'user2@test.com', role: 'utilisateur' }, JWT_SECRET)

      // User1 emprunte
      const empruntResponse = await request(API_URL)
        .post(`/api/emprunts/emprunter/${livreId}`)
        .set('Cookie', [`token=${userToken}`])

      // User2 tente de retourner
      const response = await request(API_URL)
        .post(`/api/emprunts/retourner/${empruntResponse.body.empruntId}`)
        .set('Cookie', [`token=${user2Token}`])
        .expect(404)

      expect(response.body.message).toContain('Emprunt non trouvé')
    })
  })
})