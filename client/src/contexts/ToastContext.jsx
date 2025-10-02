import React, { createContext, useContext } from 'react'
import { useToast as useToastHook, ToastContainer } from '../components/ui/Toast'

const ToastContext = createContext(null)

/**
 * Toast Provider to wrap the application
 */
export const ToastProvider = ({ children }) => {
    const toastMethods = useToastHook()

    return (
        <ToastContext.Provider value={toastMethods}>
            {children}
            <ToastContainer
                toasts={toastMethods.toasts}
                removeToast={toastMethods.removeToast}
            />
        </ToastContext.Provider>
    )
}

/**
 * Hook to use toast notifications
 * @returns {Object} Toast methods (showSuccess, showError, showWarning, showInfo, addToast)
 */
export const useToast = () => {
    const context = useContext(ToastContext)
    if (!context) {
        throw new Error('useToast must be used within ToastProvider')
    }
    return context
}
