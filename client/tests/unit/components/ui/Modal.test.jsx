import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '../../../utils/testUtils'
import Modal from '../../../../src/components/ui/Modal'

describe('Modal Component - Simple Tests', () => {
  const mockOnClose = vi.fn()

  it('should not render when isOpen is false', () => {
    renderWithProviders(
      <Modal isOpen={false} onClose={mockOnClose} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    )

    expect(screen.queryByText('Test Modal')).not.toBeInTheDocument()
  })

  it('should render when isOpen is true', () => {
    renderWithProviders(
      <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    )

    expect(screen.getByText('Test Modal')).toBeInTheDocument()
    expect(screen.getByText('Modal content')).toBeInTheDocument()
  })

  it('should have dialog role', () => {
    renderWithProviders(
      <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
        <p>Content</p>
      </Modal>
    )

    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('should render children correctly', () => {
    renderWithProviders(
      <Modal isOpen={true} onClose={mockOnClose} title="Test">
        <button>Click me</button>
        <p>Some text</p>
      </Modal>
    )

    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
    expect(screen.getByText('Some text')).toBeInTheDocument()
  })
})
