import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
const base = import.meta.env.VITE_BASE_URL || '/'

const NotificationBanner = () => {
    const [notifications, setNotifications] = useState([])
    const [show, setShow] = useState(false)
    const [isAuthenticated, setIsAuthenticated] = useState(false)

    useEffect(() => {
        checkAuthAndFetchNotifications()
    }, [])

    const checkAuthAndFetchNotifications = async () => {
        try {
            const sessionResponse = await fetch(base + 'api/session', {
                credentials: 'include'
            })

            if (sessionResponse.ok) {
                setIsAuthenticated(true)
                fetchNotifications()
            }
        } catch (error) {
            console.error('Erreur session:', error)
        }
    }

    const fetchNotifications = async () => {
        try {
            const response = await fetch(base + 'api/emprunts/mes-emprunts', {
                credentials: 'include'
            })

            if (response.ok) {
                const emprunts = await response.json()

                // Filtrer les emprunts en retard ou à rendre bientôt
                const urgentLoans = emprunts.filter(e => {
                    if (e.statut === 'retourne') return false
                    if (e.statut === 'en_retard') return true
                    if (e.jours_restants <= 3 && e.jours_restants >= 0) return true
                    return false
                })

                setNotifications(urgentLoans)
                setShow(urgentLoans.length > 0)
            }
        } catch (error) {
            console.error('Erreur notifications:', error)
        }
    }

    if (!isAuthenticated || !show || notifications.length === 0) {
        return null
    }

    const enRetard = notifications.filter(e => e.statut === 'en_retard' || e.jours_restants < 0)
    const bientot = notifications.filter(e => e.jours_restants <= 3 && e.jours_restants >= 0)

    return (
        <div style={{
            backgroundColor: enRetard.length > 0 ? '#f44336' : '#FF9800',
            color: 'white',
            padding: '15px 20px',
            textAlign: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            position: 'relative',
            marginBottom: '20px',
            borderRadius: '8px'
        }}>
            <button
                onClick={() => setShow(false)}
                style={{
                    position: 'absolute',
                    right: '15px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'rgba(255,255,255,0.3)',
                    border: 'none',
                    color: 'white',
                    borderRadius: '50%',
                    width: '30px',
                    height: '30px',
                    cursor: 'pointer',
                    fontSize: '18px',
                    fontWeight: 'bold'
                }}
            >
                ×
            </button>

            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                {enRetard.length > 0 && (
                    <div style={{ marginBottom: bientot.length > 0 ? '10px' : '0' }}>
                        <strong style={{ fontSize: '16px' }}>
                            ⚠️ Attention ! Vous avez {enRetard.length} livre{enRetard.length > 1 ? 's' : ''} en retard
                        </strong>
                        <div style={{ marginTop: '5px', fontSize: '14px' }}>
                            📧 Des emails de rappel automatiques ont été envoyés
                        </div>
                    </div>
                )}

                {bientot.length > 0 && (
                    <div>
                        <strong style={{ fontSize: '16px' }}>
                            ⏰ {bientot.length} livre{bientot.length > 1 ? 's' : ''} à rendre prochainement
                        </strong>
                    </div>
                )}

                <Link
                    to="/mes-emprunts"
                    style={{
                        display: 'inline-block',
                        marginTop: '10px',
                        backgroundColor: 'rgba(255,255,255,0.3)',
                        color: 'white',
                        padding: '8px 20px',
                        borderRadius: '20px',
                        textDecoration: 'none',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        transition: 'background-color 0.3s'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.5)'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.3)'}
                >
                    📚 Voir mes emprunts →
                </Link>
            </div>
        </div>
    )
}

export default NotificationBanner
