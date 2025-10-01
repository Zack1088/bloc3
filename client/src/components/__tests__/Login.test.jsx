import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Login from '../Login'

const mockNavigate = vi.fn()
const mockSetUserT = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate
  }
})

global.fetch = vi.fn()

describe('Composant Login', () => {
  beforeEach(() => {
    fetch.mockClear()
    mockNavigate.mockClear()
    mockSetUserT.mockClear()
  })

  test('Devrait afficher le formulaire de connexion', () => {
    render(
      <BrowserRouter>
        <Login setUserT={mockSetUserT} />
      </BrowserRouter>
    )

    expect(screen.getByPlaceholderText(/Email/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Mot de passe/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Se connecter/i })).toBeInTheDocument()
  })

  test('Devrait permettre de saisir email et mot de passe', () => {
    render(
      <BrowserRouter>
        <Login setUserT={mockSetUserT} />
      </BrowserRouter>
    )

    const emailInput = screen.getByPlaceholderText(/Email/i)
    const passwordInput = screen.getByPlaceholderText(/Mot de passe/i)

    fireEvent.change(emailInput, { target: { value: 'test@test.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })

    expect(emailInput.value).toBe('test@test.com')
    expect(passwordInput.value).toBe('password123')
  })

  test('Devrait se connecter avec succès', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ token: 'fake-token', user: { id: 1, email: 'test@test.com' } })
    })

    render(
      <BrowserRouter>
        <Login setUserT={mockSetUserT} />
      </BrowserRouter>
    )

    const emailInput = screen.getByPlaceholderText(/Email/i)
    const passwordInput = screen.getByPlaceholderText(/Mot de passe/i)
    const submitButton = screen.getByRole('button', { name: /Se connecter/i })

    fireEvent.change(emailInput, { target: { value: 'marc@lord.com' } })
    fireEvent.change(passwordInput, { target: { value: 'azerty' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
    })
  })

  test('Devrait afficher une erreur si les identifiants sont incorrects', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Email ou mot de passe incorrect' })
    })

    render(
      <BrowserRouter>
        <Login setUserT={mockSetUserT} />
      </BrowserRouter>
    )

    const emailInput = screen.getByPlaceholderText(/Email/i)
    const passwordInput = screen.getByPlaceholderText(/Mot de passe/i)
    const submitButton = screen.getByRole('button', { name: /Se connecter/i })

    fireEvent.change(emailInput, { target: { value: 'wrong@test.com' } })
    fireEvent.change(passwordInput, { target: { value: 'wrongpass' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/Email ou mot de passe incorrect/i)).toBeInTheDocument()
    })
  })

  test('Devrait afficher un lien vers l\'inscription', () => {
    render(
      <BrowserRouter>
        <Login setUserT={mockSetUserT} />
      </BrowserRouter>
    )

    expect(screen.getByText(/S'inscrire/i)).toBeInTheDocument()
  })
})