import { expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom'

// Nettoyage automatique après chaque test
afterEach(() => {
  cleanup()
})

// Mock de window.matchMedia (nécessaire pour certains composants)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock de window.scrollTo
window.scrollTo = vi.fn()

// Configuration globale de fetch mock
global.fetch = vi.fn()