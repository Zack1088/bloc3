import React, { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

/**
 * Modal component with accessibility features
 * @param {Object} props
 * @param {boolean} props.isOpen - Controls modal visibility
 * @param {Function} props.onClose - Callback when modal closes
 * @param {string} props.title - Modal title
 * @param {React.ReactNode} props.children - Modal content
 * @param {string} [props.size='medium'] - Modal size: 'small' | 'medium' | 'large'
 * @param {boolean} [props.closeOnOverlayClick=true] - Allow closing by clicking overlay
 */
const Modal = ({
    isOpen,
    onClose,
    title,
    children,
    size = 'medium',
    closeOnOverlayClick = true
}) => {
    const modalRef = useRef(null)
    const previousFocusRef = useRef(null)

    // Focus trap
    useEffect(() => {
        if (!isOpen) return

        // Store previously focused element
        previousFocusRef.current = document.activeElement

        // Focus modal
        const focusableElements = modalRef.current?.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )

        if (focusableElements?.length > 0) {
            focusableElements[0].focus()
        }

        // Handle Tab key for focus trap
        const handleTab = (e) => {
            if (e.key !== 'Tab') return

            const firstElement = focusableElements[0]
            const lastElement = focusableElements[focusableElements.length - 1]

            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    lastElement.focus()
                    e.preventDefault()
                }
            } else {
                if (document.activeElement === lastElement) {
                    firstElement.focus()
                    e.preventDefault()
                }
            }
        }

        document.addEventListener('keydown', handleTab)

        // Cleanup
        return () => {
            document.removeEventListener('keydown', handleTab)
            // Restore focus
            if (previousFocusRef.current) {
                previousFocusRef.current.focus()
            }
        }
    }, [isOpen])

    // Handle ESC key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose()
            }
        }

        document.addEventListener('keydown', handleEscape)
        return () => document.removeEventListener('keydown', handleEscape)
    }, [isOpen, onClose])

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }

        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [isOpen])

    if (!isOpen) return null

    const sizeClasses = {
        small: { maxWidth: '400px' },
        medium: { maxWidth: '600px' },
        large: { maxWidth: '900px' }
    }

    const modalContent = (
        <div
            className="modal-overlay"
            onClick={closeOnOverlayClick ? onClose : undefined}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                padding: '20px',
                animation: 'fadeIn 0.2s ease-in-out'
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
        >
            <div
                ref={modalRef}
                className="modal-content"
                onClick={(e) => e.stopPropagation()}
                style={{
                    backgroundColor: '#fff',
                    borderRadius: '12px',
                    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
                    width: '100%',
                    ...sizeClasses[size],
                    maxHeight: '90vh',
                    display: 'flex',
                    flexDirection: 'column',
                    animation: 'modalSlideIn 0.3s ease-out'
                }}
            >
                {/* Header */}
                <div style={{
                    padding: '20px 24px',
                    borderBottom: '1px solid #e0e0e0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <h2
                        id="modal-title"
                        style={{
                            margin: 0,
                            fontSize: '20px',
                            fontWeight: '600',
                            color: '#333'
                        }}
                    >
                        {title}
                    </h2>
                    <button
                        onClick={onClose}
                        aria-label="Fermer la fenêtre"
                        style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '24px',
                            cursor: 'pointer',
                            color: '#666',
                            padding: '0',
                            width: '32px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '4px',
                            transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                        ×
                    </button>
                </div>

                {/* Body */}
                <div style={{
                    padding: '24px',
                    overflow: 'auto',
                    flex: 1
                }}>
                    {children}
                </div>
            </div>
        </div>
    )

    return createPortal(modalContent, document.body)
}

export default Modal
