import React, { useState } from 'react'
import Modal from './Modal'

/**
 * Confirmation dialog for destructive actions
 * @param {Object} props
 * @param {boolean} props.isOpen - Controls dialog visibility
 * @param {Function} props.onClose - Callback when dialog closes
 * @param {Function} props.onConfirm - Callback when user confirms
 * @param {string} props.title - Dialog title
 * @param {string} props.message - Confirmation message
 * @param {string} [props.confirmText='Confirmer'] - Confirm button text
 * @param {string} [props.cancelText='Annuler'] - Cancel button text
 * @param {string} [props.type='danger'] - Dialog type: 'danger' | 'warning' | 'info'
 */
const ConfirmDialog = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirmer',
    cancelText = 'Annuler',
    type = 'danger'
}) => {
    const [isConfirming, setIsConfirming] = useState(false)

    const handleConfirm = async () => {
        setIsConfirming(true)
        try {
            await onConfirm()
            onClose()
        } catch (error) {
            console.error('Confirmation error:', error)
        } finally {
            setIsConfirming(false)
        }
    }

    const typeConfig = {
        danger: {
            color: '#f44336',
            icon: '⚠️'
        },
        warning: {
            color: '#FF9800',
            icon: '⚡'
        },
        info: {
            color: '#2196F3',
            icon: 'ℹ️'
        }
    }

    const config = typeConfig[type] || typeConfig.danger

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            size="small"
            closeOnOverlayClick={!isConfirming}
        >
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '20px'
            }}>
                {/* Icon and Message */}
                <div style={{
                    display: 'flex',
                    gap: '16px',
                    alignItems: 'flex-start'
                }}>
                    <div style={{
                        fontSize: '32px',
                        flexShrink: 0
                    }}>
                        {config.icon}
                    </div>
                    <p style={{
                        margin: 0,
                        fontSize: '15px',
                        lineHeight: '1.6',
                        color: '#555'
                    }}>
                        {message}
                    </p>
                </div>

                {/* Action Buttons */}
                <div style={{
                    display: 'flex',
                    gap: '12px',
                    justifyContent: 'flex-end'
                }}>
                    <button
                        onClick={onClose}
                        disabled={isConfirming}
                        style={{
                            padding: '10px 20px',
                            border: '1px solid #ddd',
                            borderRadius: '6px',
                            backgroundColor: '#fff',
                            color: '#333',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: isConfirming ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s',
                            opacity: isConfirming ? 0.6 : 1
                        }}
                        onMouseEnter={(e) => {
                            if (!isConfirming) {
                                e.target.style.backgroundColor = '#f5f5f5'
                            }
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.backgroundColor = '#fff'
                        }}
                    >
                        {cancelText}
                    </button>

                    <button
                        onClick={handleConfirm}
                        disabled={isConfirming}
                        style={{
                            padding: '10px 20px',
                            border: 'none',
                            borderRadius: '6px',
                            backgroundColor: isConfirming ? '#ccc' : config.color,
                            color: '#fff',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: isConfirming ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                        onMouseEnter={(e) => {
                            if (!isConfirming) {
                                e.target.style.opacity = '0.9'
                            }
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.opacity = '1'
                        }}
                    >
                        {isConfirming ? (
                            <>
                                <span className="loading-spinner-small"></span>
                                En cours...
                            </>
                        ) : (
                            confirmText
                        )}
                    </button>
                </div>
            </div>
        </Modal>
    )
}

/**
 * Hook to manage confirm dialogs
 */
export const useConfirm = () => {
    const [confirmState, setConfirmState] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: null,
        confirmText: 'Confirmer',
        cancelText: 'Annuler',
        type: 'danger'
    })

    const confirm = ({
        title,
        message,
        onConfirm,
        confirmText = 'Confirmer',
        cancelText = 'Annuler',
        type = 'danger'
    }) => {
        return new Promise((resolve) => {
            setConfirmState({
                isOpen: true,
                title,
                message,
                onConfirm: async () => {
                    try {
                        await onConfirm()
                        resolve(true)
                    } catch (error) {
                        resolve(false)
                        throw error
                    }
                },
                confirmText,
                cancelText,
                type
            })
        })
    }

    const closeConfirm = () => {
        setConfirmState(prev => ({ ...prev, isOpen: false }))
    }

    return {
        confirmState,
        confirm,
        closeConfirm
    }
}

export default ConfirmDialog
