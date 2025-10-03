import React from 'react'
import { render } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { ToastProvider } from '../../src/contexts/ToastContext'

/**
 * Custom render function that wraps components with necessary providers
 */
export function renderWithProviders(
  ui,
  {
    route = '/',
    ...renderOptions
  } = {}
) {
  window.history.pushState({}, 'Test page', route)

  function Wrapper({ children }) {
    return (
      <BrowserRouter>
        <ToastProvider>
          {children}
        </ToastProvider>
      </BrowserRouter>
    )
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  }
}

/**
 * Wait for async updates
 */
export const waitForLoadingToFinish = () =>
  new Promise(resolve => setTimeout(resolve, 0))

/**
 * Mock fetch response
 */
export function mockFetchSuccess(data) {
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok: true,
      status: 200,
      json: async () => data,
    })
  )
}

/**
 * Mock fetch error
 */
export function mockFetchError(status = 500, message = 'Error') {
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok: false,
      status,
      json: async () => ({ message }),
    })
  )
}

/**
 * Create mock book
 */
export function createMockBook(overrides = {}) {
  return {
    id: 1,
    titre: 'Test Book',
    auteur: 'Test Author',
    isbn: '1234567890',
    description: 'Test description',
    date_publication: '2023-01-01',
    photo_url: 'https://example.com/book.jpg',
    statut: 'disponible',
    ...overrides,
  }
}

/**
 * Create mock emprunt
 */
export function createMockEmprunt(overrides = {}) {
  return {
    id: 1,
    livre_id: 1,
    livre_titre: 'Test Book',
    utilisateur_id: 1,
    utilisateur_nom: 'Doe',
    utilisateur_prenom: 'John',
    date_emprunt: '2023-10-01',
    date_retour_prevue: '2023-10-31',
    date_retour_effective: null,
    statut: 'en_cours',
    rappels_envoyes: 0,
    derniere_date_rappel: null,
    ...overrides,
  }
}

/**
 * Create mock user
 */
export function createMockUser(overrides = {}) {
  return {
    id: 1,
    email: 'test@example.com',
    nom: 'Doe',
    prenom: 'John',
    role: 'utilisateur',
    ...overrides,
  }
}

// Re-export everything from testing-library
export * from '@testing-library/react'
export { default as userEvent } from '@testing-library/user-event'
