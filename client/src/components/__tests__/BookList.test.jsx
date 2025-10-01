import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import BookList from '../BookList'

// Mock de fetch
global.fetch = vi.fn()

const mockBooks = [
  {
    id: 1,
    titre: 'Développement Web mobile',
    auteur: 'William HARREL',
    isbn: 'DHIDZH1374R',
    description: 'Un livre indispensable',
    statut: 'disponible',
    photo_url: 'https://example.com/book1.jpg',
    date_publication: '2023-11-09'
  },
  {
    id: 2,
    titre: 'PHP et MySQL pour les Nuls',
    auteur: 'Janet VALADE',
    isbn: '23R32R2R4',
    description: 'Le livre best-seller',
    statut: 'emprunté',
    photo_url: 'https://example.com/book2.jpg',
    date_publication: '2023-11-14'
  }
]

describe('Composant BookList', () => {
  beforeEach(() => {
    fetch.mockClear()
  })

  test('Devrait afficher le loader pendant le chargement', () => {
    // Mock qui ne résout jamais (simule un chargement en cours)
    fetch.mockImplementationOnce(() => new Promise(() => {}))

    render(
      <BrowserRouter>
        <BookList />
      </BrowserRouter>
    )

    expect(screen.getByText(/⏳ Chargement.../i)).toBeInTheDocument()
  })

  test('Devrait afficher le titre "Liste des Livres" après chargement', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockBooks
    })

    render(
      <BrowserRouter>
        <BookList />
      </BrowserRouter>
    )

    // ✅ Attendre que le chargement soit terminé
    await waitFor(() => {
      expect(screen.queryByText(/⏳ Chargement.../i)).not.toBeInTheDocument()
    })

    // ✅ Vérifier que le titre est affiché
    expect(screen.getByText(/📚 Liste des Livres/i)).toBeInTheDocument()
  })

  test('Devrait afficher la liste des livres après le chargement', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockBooks
    })

    render(
      <BrowserRouter>
        <BookList />
      </BrowserRouter>
    )

    // ✅ Attendre que les livres soient affichés
    await waitFor(() => {
      expect(screen.getByText('Développement Web mobile')).toBeInTheDocument()
    })

    expect(screen.getByText('PHP et MySQL pour les Nuls')).toBeInTheDocument()
    expect(screen.getByText('William HARREL')).toBeInTheDocument()
    expect(screen.getByText('Janet VALADE')).toBeInTheDocument()
  })

  test('Devrait afficher les statuts corrects (disponible/emprunté)', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockBooks
    })

    render(
      <BrowserRouter>
        <BookList />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Développement Web mobile')).toBeInTheDocument()
    })

    // ✅ Vérifier les badges de statut
    expect(screen.getByText(/✓ Disponible/i)).toBeInTheDocument()
    expect(screen.getByText(/✗ Emprunté/i)).toBeInTheDocument()
  })

  test('Devrait afficher un message si aucun livre', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => []
    })

    render(
      <BrowserRouter>
        <BookList />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.queryByText(/⏳ Chargement.../i)).not.toBeInTheDocument()
    })

    expect(screen.getByText(/Aucun livre disponible/i)).toBeInTheDocument()
  })

  test('Devrait afficher une erreur en cas de problème réseau', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'))

    render(
      <BrowserRouter>
        <BookList />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/Erreur réseau/i)).toBeInTheDocument()
    })
  })

  test('Devrait afficher une erreur si la réponse API n\'est pas ok', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 500
    })

    render(
      <BrowserRouter>
        <BookList />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/Erreur lors du chargement/i)).toBeInTheDocument()
    })
  })

  test('Devrait contenir des liens vers les détails des livres', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockBooks
    })

    render(
      <BrowserRouter>
        <BookList />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Développement Web mobile')).toBeInTheDocument()
    })

    const links = screen.getAllByText(/Voir les détails/i)
    expect(links).toHaveLength(2)
    
    // Vérifier que les liens pointent vers les bonnes URLs
    links.forEach((link, index) => {
      expect(link.closest('a')).toHaveAttribute('href', `/book/${mockBooks[index].id}`)
    })
  })

  test('Devrait afficher les images des livres', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockBooks
    })

    render(
      <BrowserRouter>
        <BookList />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Développement Web mobile')).toBeInTheDocument()
    })

    const images = screen.getAllByRole('img')
    expect(images).toHaveLength(2)
    expect(images[0]).toHaveAttribute('src', mockBooks[0].photo_url)
    expect(images[0]).toHaveAttribute('alt', mockBooks[0].titre)
  })

  test('Devrait appeler l\'API avec les bons paramètres', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockBooks
    })

    render(
      <BrowserRouter>
        <BookList />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1)
    })

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/books',
      expect.objectContaining({
        credentials: 'include'
      })
    )
  })
})