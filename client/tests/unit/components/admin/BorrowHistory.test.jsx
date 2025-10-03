import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders, createMockEmprunt } from '../../../utils/testUtils'
import BorrowHistory from '../../../../src/components/admin/BorrowHistory'

describe('BorrowHistory Component - Simple Tests', () => {
  const mockEmprunts = [
    createMockEmprunt({
      id: 1,
      livre_titre: 'Book 1',
      utilisateur_nom: 'Doe',
      utilisateur_prenom: 'John',
      statut: 'en_cours',
      rappels_envoyes: 0,
    }),
    createMockEmprunt({
      id: 2,
      livre_titre: 'Book 2',
      utilisateur_nom: 'Smith',
      utilisateur_prenom: 'Jane',
      statut: 'en_retard',
      rappels_envoyes: 2,
    }),
  ]

  beforeEach(() => {
    global.fetch = vi.fn()
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => mockEmprunts,
    })
  })

  it('should fetch and display borrow history', async () => {
    renderWithProviders(<BorrowHistory />)

    await waitFor(() => {
      expect(screen.getByText('Book 1')).toBeInTheDocument()
      expect(screen.getByText('Book 2')).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('should display title', () => {
    renderWithProviders(<BorrowHistory />)
    expect(screen.getByText('Historique des Emprunts')).toBeInTheDocument()
  })

  it('should display statistics cards', async () => {
    renderWithProviders(<BorrowHistory />)

    await waitFor(() => {
      expect(screen.getByText('Total Emprunts')).toBeInTheDocument()
      expect(screen.getByText('En Cours')).toBeInTheDocument()
      expect(screen.getByText('En Retard')).toBeInTheDocument()
      expect(screen.getByText('Retournés')).toBeInTheDocument()
    })
  })

  it('should handle empty emprunts list', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => [],
    })

    renderWithProviders(<BorrowHistory />)

    await waitFor(() => {
      expect(screen.getByText(/Aucun emprunt/i)).toBeInTheDocument()
    })
  })
})
