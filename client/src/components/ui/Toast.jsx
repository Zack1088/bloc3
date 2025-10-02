import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

/**
 * Toast notification component
 * @param {Object} props
 * @param {string} props.message - Toast message
 * @param {string} [props.type='info'] - Toast type: 'success' | 'error' | 'warning' | 'info'
 * @param {number} [props.duration=4000] - Duration in ms before auto-dismiss
 * @param {Function} props.onClose - Callback when toast closes
 * @param {string} [props.position='top-right'] - Position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
 */
const Toast = ({
    message,
    type = 'info',
    duration = 4000,
    onClose,
    position = 'top-right'
}) => {
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        // Trigger entrance animation
        setIsVisible(true)

        // Auto-dismiss
        if (duration > 0) {
            const timer = setTimeout(() => {
                handleClose()
            }, duration)

            return () => clearTimeout(timer)
        }
    }, [duration])

    const handleClose = () => {
        setIsVisible(false)
        setTimeout(() => {
            onClose()
        }, 300) // Wait for exit animation
    }

    const typeStyles = {
        success: {
            backgroundColor: '#4CAF50',
            icon: '✓'
        },
        error: {
            backgroundColor: '#f44336',
            icon: '✕'
        },
        warning: {
            backgroundColor: '#FF9800',
            icon: '⚠'
        },
        info: {
            backgroundColor: '#2196F3',
            icon: 'ℹ'
        }
    }

    const positionStyles = {
        'top-right': { top: '20px', right: '20px' },
        'top-left': { top: '20px', left: '20px' },
        'bottom-right': { bottom: '20px', right: '20px' },
        'bottom-left': { bottom: '20px', left: '20px' }
    }

    const currentStyle = typeStyles[type] || typeStyles.info

    const toastContent = (
        <div
            role="alert"
            aria-live="polite"
            style={{
                position: 'fixed',
                ...positionStyles[position],
                zIndex: 10000,
                minWidth: '300px',
                maxWidth: '500px',
                backgroundColor: currentStyle.backgroundColor,
                color: 'white',
                padding: '16px 20px',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transform: isVisible ? 'translateX(0)' : 'translateX(400px)',
                opacity: isVisible ? 1 : 0,
                transition: 'all 0.3s ease-out',
                cursor: 'pointer'
            }}
            onClick={handleClose}
        >
            {/* Icon */}
            <div style={{
                fontSize: '20px',
                fontWeight: 'bold',
                flexShrink: 0
            }}>
                {currentStyle.icon}
            </div>

            {/* Message */}
            <div style={{
                flex: 1,
                fontSize: '14px',
                lineHeight: '1.5'
            }}>
                {message}
            </div>

            {/* Close button */}
            <button
                onClick={(e) => {
                    e.stopPropagation()
                    handleClose()
                }}
                aria-label="Fermer la notification"
                style={{
                    background: 'none',
                    border: 'none',
                    color: 'white',
                    fontSize: '20px',
                    cursor: 'pointer',
                    padding: '0',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '4px',
                    transition: 'background-color 0.2s',
                    flexShrink: 0
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
            >
                ×
            </button>
        </div>
    )

    return createPortal(toastContent, document.body)
}

/**
 * Toast container to manage multiple toasts
 */
export const ToastContainer = ({ toasts, removeToast }) => {
    return (
        <>
            {toasts.map((toast, index) => (
                <Toast
                    key={toast.id}
                    message={toast.message}
                    type={toast.type}
                    duration={toast.duration}
                    position={toast.position}
                    onClose={() => removeToast(toast.id)}
                />
            ))}
        </>
    )
}

/**
 * Hook to manage toasts
 */
export const useToast = () => {
    const [toasts, setToasts] = useState([])

    const addToast = (message, type = 'info', duration = 4000, position = 'top-right') => {
        const id = Date.now() + Math.random()
        setToasts(prev => [...prev, { id, message, type, duration, position }])
    }

    const removeToast = (id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id))
    }

    return {
        toasts,
        addToast,
        removeToast,
        showSuccess: (msg, duration) => addToast(msg, 'success', duration),
        showError: (msg, duration) => addToast(msg, 'error', duration),
        showWarning: (msg, duration) => addToast(msg, 'warning', duration),
        showInfo: (msg, duration) => addToast(msg, 'info', duration)
    }
}

export default Toast
