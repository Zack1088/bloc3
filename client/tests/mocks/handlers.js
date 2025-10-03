import { rest } from 'msw'

const base = 'http://localhost:3000/'

export const handlers = [
  // Books endpoints
  rest.get(`${base}api/books`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
        {
          id: 1,
          titre: 'Test Book 1',
          auteur: 'Test Author 1',
          isbn: '1234567890',
          description: 'Test description 1',
          date_publication: '2023-01-01',
          photo_url: 'https://example.com/book1.jpg',
          statut: 'disponible',
        },
        {
          id: 2,
          titre: 'Test Book 2',
          auteur: 'Test Author 2',
          isbn: '0987654321',
          description: 'Test description 2',
          date_publication: '2023-02-01',
          photo_url: 'https://example.com/book2.jpg',
          statut: 'emprunte',
        },
      ])
    )
  }),

  rest.get(`${base}api/books/:id`, (req, res, ctx) => {
    const { id } = req.params
    return res(
      ctx.status(200),
      ctx.json([
        {
          id: parseInt(id),
          titre: `Test Book ${id}`,
          auteur: `Test Author ${id}`,
          isbn: '1234567890',
          description: 'Test description',
          date_publication: '2023-01-01',
          photo_url: 'https://example.com/book.jpg',
          statut: 'disponible',
        },
      ])
    )
  }),

  rest.put(`${base}api/books/:id`, (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ message: 'Livre mis à jour' }))
  }),

  rest.delete(`${base}api/books/:id`, (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ message: 'Livre supprimé' }))
  }),

  rest.post(`${base}api/books`, (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({ message: 'Livre ajouté', id: 999 })
    )
  }),

  // Emprunts endpoints
  rest.get(`${base}api/emprunts/all`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
        {
          id: 1,
          livre_id: 1,
          livre_titre: 'Test Book 1',
          utilisateur_id: 1,
          utilisateur_nom: 'Doe',
          utilisateur_prenom: 'John',
          date_emprunt: '2023-10-01',
          date_retour_prevue: '2023-10-31',
          date_retour_effective: null,
          statut: 'en_cours',
          rappels_envoyes: 0,
          derniere_date_rappel: null,
        },
        {
          id: 2,
          livre_id: 2,
          livre_titre: 'Test Book 2',
          utilisateur_id: 2,
          utilisateur_nom: 'Smith',
          utilisateur_prenom: 'Jane',
          date_emprunt: '2023-09-01',
          date_retour_prevue: '2023-09-30',
          date_retour_effective: null,
          statut: 'en_retard',
          rappels_envoyes: 2,
          derniere_date_rappel: '2023-10-02',
        },
      ])
    )
  }),

  rest.get(`${base}api/emprunts/mes-emprunts`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
        {
          id: 1,
          livre_id: 1,
          livre_titre: 'Test Book 1',
          date_emprunt: '2023-10-01',
          date_retour_prevue: '2023-10-31',
          date_retour_effective: null,
          statut: 'en_cours',
        },
      ])
    )
  }),

  rest.post(`${base}api/emprunts/:id/rappel`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        message: 'Rappel envoyé avec succès',
        sentAt: new Date().toISOString(),
      })
    )
  }),

  rest.get(`${base}api/emprunts/statistiques`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        total_emprunts: 100,
        emprunts_en_cours: 45,
        emprunts_en_retard: 10,
        emprunts_retournes: 45,
      })
    )
  }),

  // Users endpoints
  rest.get(`${base}api/session`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        user: {
          id: 1,
          email: 'admin@test.fr',
          nom: 'Admin',
          prenom: 'Test',
          role: 'admin',
        },
      })
    )
  }),

  rest.post(`${base}api/logout`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({ message: 'Déconnexion réussie' })
    )
  }),

  // Statistics
  rest.get(`${base}api/statistics`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        total_books: 150,
        total_users: 75,
      })
    )
  }),
]
