import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
const base = import.meta.env.VITE_BASE_URL || '/'

const Dashboard = () => {
    const [statistics, setStatistics] = useState({
        total_books: 0,
        total_users: 0,
        total_emprunts: 0,
        emprunts_en_cours: 0,
        emprunts_en_retard: 0,
        emprunts_retournes: 0
    })
    const [userStats, setUserStats] = useState({
        mes_emprunts_actifs: 0,
        mes_emprunts_en_retard: 0,
        mes_emprunts_total: 0,
        livres_disponibles: 0
    })
    const [isLoading, setIsLoading] = useState(true)
    const [recentEmprunts, setRecentEmprunts] = useState([])
    const [mesEmprunts, setMesEmprunts] = useState([])
    const [userRole, setUserRole] = useState('')

    useEffect(() => {
        checkAuthAndFetchData()
    }, [])

    const checkAuthAndFetchData = async () => {
        setIsLoading(true)
        try {
            // Check user role
            const authResponse = await fetch(base + 'api/session', {
                credentials: 'include'
            })

            if (authResponse.ok) {
                const authData = await authResponse.json()
                setUserRole(authData.user.role)

                if (authData.user.role === 'admin') {
                    await fetchAdminStatistics()
                } else {
                    await fetchUserStatistics()
                }
            }
        } catch (error) {
            console.error('Erreur:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const fetchAdminStatistics = async () => {
        try {
            // Fetch general statistics
            const statsResponse = await fetch(base + 'api/statistics', {
                credentials: 'include'
            })

            if (statsResponse.ok) {
                const statsData = await statsResponse.json()

                // Fetch borrow statistics
                const empruntsStatsResponse = await fetch(base + 'api/emprunts/statistiques', {
                    credentials: 'include'
                })

                if (empruntsStatsResponse.ok) {
                    const empruntsData = await empruntsStatsResponse.json()
                    setStatistics({ ...statsData, ...empruntsData })
                } else {
                    setStatistics(statsData)
                }

                // Fetch recent emprunts
                const empruntsResponse = await fetch(base + 'api/emprunts/all', {
                    credentials: 'include'
                })

                if (empruntsResponse.ok) {
                    const emprunts = await empruntsResponse.json()
                    setRecentEmprunts(emprunts.slice(0, 5))
                }
            }
        } catch (error) {
            console.error('Erreur:', error)
        }
    }

    const fetchUserStatistics = async () => {
        try {
            // Fetch user's emprunts
            const empruntsResponse = await fetch(base + 'api/emprunts/mes-emprunts', {
                credentials: 'include'
            })

            if (empruntsResponse.ok) {
                const emprunts = await empruntsResponse.json()
                setMesEmprunts(emprunts.slice(0, 5))

                // Calculate user statistics
                const actifs = emprunts.filter(e => e.statut === 'en_cours').length
                const retard = emprunts.filter(e => e.statut === 'en_retard').length

                setUserStats({
                    mes_emprunts_actifs: actifs,
                    mes_emprunts_en_retard: retard,
                    mes_emprunts_total: emprunts.length,
                    livres_disponibles: 0 // Will be fetched from books API
                })
            }

            // Fetch total available books
            const booksResponse = await fetch(base + 'api/books', {
                credentials: 'include'
            })

            if (booksResponse.ok) {
                const books = await booksResponse.json()
                const disponibles = books.filter(b => b.statut === 'disponible').length
                setUserStats(prev => ({ ...prev, livres_disponibles: disponibles }))
            }
        } catch (error) {
            console.error('Erreur:', error)
        }
    }

    const handleSendReminders = async () => {
        if (!confirm('Envoyer les rappels automatiques maintenant ?')) {
            return
        }

        try {
            const response = await fetch(base + 'api/emprunts/envoyer-rappels', {
                method: 'POST',
                credentials: 'include'
            })

            if (response.ok) {
                alert('✓ Rappels envoyés avec succès ! Consultez les logs du serveur.')
            } else {
                alert('❌ Erreur lors de l\'envoi des rappels')
            }
        } catch (error) {
            console.error('Erreur:', error)
            alert('❌ Erreur réseau')
        }
    }

    if (isLoading) {
        return (
            <div className="container">
                <h1>Dashboard</h1>
                <div className="loading-spinner"></div>
            </div>
        )
    }

    // User Dashboard
    if (userRole === 'utilisateur') {
        return (
            <div className="container">
                <h1 style={{ marginBottom: '30px' }}>Mon Dashboard</h1>

                {/* User Statistics Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '20px',
                    marginBottom: '40px'
                }}>
                    {/* Emprunts Actifs */}
                    <div className="stat-card" style={{
                        backgroundColor: '#fff',
                        padding: '24px',
                        borderRadius: '12px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        border: '2px solid #007BFF'
                    }}>
                        <div style={{ fontSize: '48px', marginBottom: '8px' }}>📖</div>
                        <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#007BFF', marginBottom: '8px' }}>
                            {userStats.mes_emprunts_actifs}
                        </div>
                        <div style={{ fontSize: '14px', color: '#666', textTransform: 'uppercase', fontWeight: '600' }}>
                            Emprunts Actifs
                        </div>
                    </div>

                    {/* En Retard */}
                    <div className="stat-card" style={{
                        backgroundColor: '#fff',
                        padding: '24px',
                        borderRadius: '12px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        border: '2px solid #f44336'
                    }}>
                        <div style={{ fontSize: '48px', marginBottom: '8px' }}>⚠️</div>
                        <div style={{
                            fontSize: '36px',
                            fontWeight: 'bold',
                            color: '#f44336',
                            marginBottom: '8px',
                            animation: userStats.mes_emprunts_en_retard > 0 ? 'pulse 2s infinite' : 'none'
                        }}>
                            {userStats.mes_emprunts_en_retard}
                        </div>
                        <div style={{ fontSize: '14px', color: '#666', textTransform: 'uppercase', fontWeight: '600' }}>
                            En Retard
                        </div>
                    </div>

                    {/* Total Emprunts */}
                    <div className="stat-card" style={{
                        backgroundColor: '#fff',
                        padding: '24px',
                        borderRadius: '12px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        border: '2px solid #9C27B0'
                    }}>
                        <div style={{ fontSize: '48px', marginBottom: '8px' }}>📚</div>
                        <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#9C27B0', marginBottom: '8px' }}>
                            {userStats.mes_emprunts_total}
                        </div>
                        <div style={{ fontSize: '14px', color: '#666', textTransform: 'uppercase', fontWeight: '600' }}>
                            Total Emprunts
                        </div>
                    </div>

                    {/* Livres Disponibles */}
                    <div className="stat-card" style={{
                        backgroundColor: '#fff',
                        padding: '24px',
                        borderRadius: '12px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        border: '2px solid #4CAF50'
                    }}>
                        <div style={{ fontSize: '48px', marginBottom: '8px' }}>✅</div>
                        <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#4CAF50', marginBottom: '8px' }}>
                            {userStats.livres_disponibles}
                        </div>
                        <div style={{ fontSize: '14px', color: '#666', textTransform: 'uppercase', fontWeight: '600' }}>
                            Livres Disponibles
                        </div>
                    </div>
                </div>

                {/* Quick Actions for Users */}
                <div style={{
                    backgroundColor: '#f8f9fa',
                    padding: '24px',
                    borderRadius: '12px',
                    marginBottom: '40px'
                }}>
                    <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Actions Rapides</h3>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '12px'
                    }}>
                        <Link
                            to="/books"
                            style={{
                                padding: '12px 20px',
                                backgroundColor: '#2196F3',
                                color: '#fff',
                                textDecoration: 'none',
                                borderRadius: '6px',
                                textAlign: 'center',
                                fontWeight: '500',
                                fontSize: '14px',
                                transition: 'all 0.2s'
                            }}
                        >
                            📚 Parcourir les livres
                        </Link>

                        <Link
                            to="/mes-emprunts"
                            style={{
                                padding: '12px 20px',
                                backgroundColor: '#4CAF50',
                                color: '#fff',
                                textDecoration: 'none',
                                borderRadius: '6px',
                                textAlign: 'center',
                                fontWeight: '500',
                                fontSize: '14px',
                                transition: 'all 0.2s'
                            }}
                        >
                            📋 Mes emprunts
                        </Link>
                    </div>
                </div>

                {/* Recent User Emprunts */}
                {mesEmprunts.length > 0 && (
                    <div>
                        <h3 style={{ marginBottom: '16px' }}>Mes Emprunts Récents</h3>

                        <div style={{
                            backgroundColor: '#fff',
                            borderRadius: '8px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                            overflow: 'hidden'
                        }}>
                            <table style={{
                                width: '100%',
                                borderCollapse: 'collapse'
                            }}>
                                <thead style={{
                                    backgroundColor: '#f8f9fa',
                                    borderBottom: '2px solid #e0e0e0'
                                }}>
                                    <tr>
                                        <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600' }}>Livre</th>
                                        <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600' }}>Date emprunt</th>
                                        <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600' }}>Retour prévu</th>
                                        <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600' }}>Statut</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {mesEmprunts.map(emprunt => (
                                        <tr key={emprunt.id} style={{
                                            borderBottom: '1px solid #f0f0f0'
                                        }}>
                                            <td style={{ padding: '12px', fontSize: '14px' }}>{emprunt.livre_titre}</td>
                                            <td style={{ padding: '12px', fontSize: '14px' }}>
                                                {new Date(emprunt.date_emprunt).toLocaleDateString('fr-FR')}
                                            </td>
                                            <td style={{ padding: '12px', fontSize: '14px' }}>
                                                {new Date(emprunt.date_retour_prevue).toLocaleDateString('fr-FR')}
                                            </td>
                                            <td style={{ padding: '12px' }}>
                                                <span style={{
                                                    backgroundColor: emprunt.statut === 'en_retard'
                                                        ? '#f4433630'
                                                        : emprunt.statut === 'retourne'
                                                            ? '#4CAF5020'
                                                            : '#2196F320',
                                                    color: emprunt.statut === 'en_retard'
                                                        ? '#f44336'
                                                        : emprunt.statut === 'retourne'
                                                            ? '#4CAF50'
                                                            : '#2196F3',
                                                    padding: '4px 10px',
                                                    borderRadius: '12px',
                                                    fontSize: '12px',
                                                    fontWeight: '600'
                                                }}>
                                                    {emprunt.statut === 'en_retard' ? '⚠️ En retard' : emprunt.statut === 'retourne' ? '✓ Retourné' : '📖 En cours'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <div style={{ padding: '16px', textAlign: 'center', borderTop: '1px solid #e0e0e0' }}>
                                <Link
                                    to="/mes-emprunts"
                                    style={{
                                        color: '#007BFF',
                                        textDecoration: 'none',
                                        fontSize: '14px',
                                        fontWeight: '500'
                                    }}
                                >
                                    Voir tous mes emprunts →
                                </Link>
                            </div>
                        </div>
                    </div>
                )}

                {mesEmprunts.length === 0 && (
                    <div style={{
                        backgroundColor: '#fff',
                        padding: '40px',
                        borderRadius: '12px',
                        textAlign: 'center',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}>
                        <div style={{ fontSize: '64px', marginBottom: '16px' }}>📚</div>
                        <h3 style={{ color: '#666', marginBottom: '12px' }}>Aucun emprunt en cours</h3>
                        <p style={{ color: '#999', marginBottom: '24px' }}>
                            Commencez à explorer notre catalogue de livres !
                        </p>
                        <Link
                            to="/books"
                            style={{
                                display: 'inline-block',
                                padding: '12px 24px',
                                backgroundColor: '#2196F3',
                                color: '#fff',
                                textDecoration: 'none',
                                borderRadius: '6px',
                                fontWeight: '500'
                            }}
                        >
                            Découvrir les livres
                        </Link>
                    </div>
                )}
            </div>
        )
    }

    // Admin Dashboard
    return (
        <div className="container">
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '30px',
                flexWrap: 'wrap',
                gap: '16px'
            }}>
                <h1 style={{ margin: 0 }}>Dashboard Administrateur</h1>

                <button
                    onClick={handleSendReminders}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: '#FF9800',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                >
                    📧 Envoyer rappels maintenant
                </button>
            </div>

            {/* Statistics Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '20px',
                marginBottom: '40px'
            }}>
                {/* Total Books */}
                <div className="stat-card" style={{
                    backgroundColor: '#fff',
                    padding: '24px',
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    border: '2px solid #2196F3'
                }}>
                    <div style={{ fontSize: '48px', marginBottom: '8px' }}>📚</div>
                    <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#2196F3', marginBottom: '8px' }}>
                        {statistics.total_books}
                    </div>
                    <div style={{ fontSize: '14px', color: '#666', textTransform: 'uppercase', fontWeight: '600' }}>
                        Total Livres
                    </div>
                </div>

                {/* Total Users */}
                <div className="stat-card" style={{
                    backgroundColor: '#fff',
                    padding: '24px',
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    border: '2px solid #4CAF50'
                }}>
                    <div style={{ fontSize: '48px', marginBottom: '8px' }}>👥</div>
                    <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#4CAF50', marginBottom: '8px' }}>
                        {statistics.total_users}
                    </div>
                    <div style={{ fontSize: '14px', color: '#666', textTransform: 'uppercase', fontWeight: '600' }}>
                        Utilisateurs
                    </div>
                </div>

                {/* Total Emprunts */}
                <div className="stat-card" style={{
                    backgroundColor: '#fff',
                    padding: '24px',
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    border: '2px solid #9C27B0'
                }}>
                    <div style={{ fontSize: '48px', marginBottom: '8px' }}>📖</div>
                    <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#9C27B0', marginBottom: '8px' }}>
                        {statistics.total_emprunts}
                    </div>
                    <div style={{ fontSize: '14px', color: '#666', textTransform: 'uppercase', fontWeight: '600' }}>
                        Total Emprunts
                    </div>
                </div>

                {/* En Cours */}
                <div className="stat-card" style={{
                    backgroundColor: '#fff',
                    padding: '24px',
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    border: '2px solid #007BFF'
                }}>
                    <div style={{ fontSize: '48px', marginBottom: '8px' }}>⏳</div>
                    <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#007BFF', marginBottom: '8px' }}>
                        {statistics.emprunts_en_cours}
                    </div>
                    <div style={{ fontSize: '14px', color: '#666', textTransform: 'uppercase', fontWeight: '600' }}>
                        En Cours
                    </div>
                </div>

                {/* En Retard */}
                <div className="stat-card" style={{
                    backgroundColor: '#fff',
                    padding: '24px',
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    border: '2px solid #f44336'
                }}>
                    <div style={{ fontSize: '48px', marginBottom: '8px' }}>⚠️</div>
                    <div style={{
                        fontSize: '36px',
                        fontWeight: 'bold',
                        color: '#f44336',
                        marginBottom: '8px',
                        animation: statistics.emprunts_en_retard > 0 ? 'pulse 2s infinite' : 'none'
                    }}>
                        {statistics.emprunts_en_retard}
                    </div>
                    <div style={{ fontSize: '14px', color: '#666', textTransform: 'uppercase', fontWeight: '600' }}>
                        En Retard
                    </div>
                </div>

                {/* Retournés */}
                <div className="stat-card" style={{
                    backgroundColor: '#fff',
                    padding: '24px',
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    border: '2px solid #00BCD4'
                }}>
                    <div style={{ fontSize: '48px', marginBottom: '8px' }}>✅</div>
                    <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#00BCD4', marginBottom: '8px' }}>
                        {statistics.emprunts_retournes}
                    </div>
                    <div style={{ fontSize: '14px', color: '#666', textTransform: 'uppercase', fontWeight: '600' }}>
                        Retournés
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div style={{
                backgroundColor: '#f8f9fa',
                padding: '24px',
                borderRadius: '12px',
                marginBottom: '40px'
            }}>
                <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Actions Rapides</h3>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '12px'
                }}>
                    <Link
                        to="/add_book"
                        style={{
                            padding: '12px 20px',
                            backgroundColor: '#2196F3',
                            color: '#fff',
                            textDecoration: 'none',
                            borderRadius: '6px',
                            textAlign: 'center',
                            fontWeight: '500',
                            fontSize: '14px',
                            transition: 'all 0.2s'
                        }}
                    >
                        ➕ Ajouter un livre
                    </Link>

                    <Link
                        to="/borrow-history"
                        style={{
                            padding: '12px 20px',
                            backgroundColor: '#4CAF50',
                            color: '#fff',
                            textDecoration: 'none',
                            borderRadius: '6px',
                            textAlign: 'center',
                            fontWeight: '500',
                            fontSize: '14px',
                            transition: 'all 0.2s'
                        }}
                    >
                        📋 Historique complet
                    </Link>

                    <Link
                        to="/books"
                        style={{
                            padding: '12px 20px',
                            backgroundColor: '#9C27B0',
                            color: '#fff',
                            textDecoration: 'none',
                            borderRadius: '6px',
                            textAlign: 'center',
                            fontWeight: '500',
                            fontSize: '14px',
                            transition: 'all 0.2s'
                        }}
                    >
                        📚 Gérer les livres
                    </Link>
                </div>
            </div>

            {/* Recent Emprunts */}
            {recentEmprunts.length > 0 && (
                <div>
                    <h3 style={{ marginBottom: '16px' }}>Emprunts Récents</h3>

                    <div style={{
                        backgroundColor: '#fff',
                        borderRadius: '8px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        overflow: 'hidden'
                    }}>
                        <table style={{
                            width: '100%',
                            borderCollapse: 'collapse'
                        }}>
                            <thead style={{
                                backgroundColor: '#f8f9fa',
                                borderBottom: '2px solid #e0e0e0'
                            }}>
                                <tr>
                                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600' }}>Livre</th>
                                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600' }}>Emprunteur</th>
                                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600' }}>Date</th>
                                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600' }}>Statut</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentEmprunts.map(emprunt => (
                                    <tr key={emprunt.id} style={{
                                        borderBottom: '1px solid #f0f0f0'
                                    }}>
                                        <td style={{ padding: '12px', fontSize: '14px' }}>{emprunt.livre_titre}</td>
                                        <td style={{ padding: '12px', fontSize: '14px' }}>
                                            {emprunt.utilisateur_nom} {emprunt.utilisateur_prenom}
                                        </td>
                                        <td style={{ padding: '12px', fontSize: '14px' }}>
                                            {new Date(emprunt.date_emprunt).toLocaleDateString('fr-FR')}
                                        </td>
                                        <td style={{ padding: '12px' }}>
                                            <span style={{
                                                backgroundColor: emprunt.statut === 'en_retard'
                                                    ? '#f4433630'
                                                    : emprunt.statut === 'retourne'
                                                        ? '#4CAF5020'
                                                        : '#2196F320',
                                                color: emprunt.statut === 'en_retard'
                                                    ? '#f44336'
                                                    : emprunt.statut === 'retourne'
                                                        ? '#4CAF50'
                                                        : '#2196F3',
                                                padding: '4px 10px',
                                                borderRadius: '12px',
                                                fontSize: '12px',
                                                fontWeight: '600'
                                            }}>
                                                {emprunt.statut === 'en_retard' ? 'En retard' : emprunt.statut === 'retourne' ? 'Retourné' : 'En cours'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div style={{ padding: '16px', textAlign: 'center', borderTop: '1px solid #e0e0e0' }}>
                            <Link
                                to="/borrow-history"
                                style={{
                                    color: '#007BFF',
                                    textDecoration: 'none',
                                    fontSize: '14px',
                                    fontWeight: '500'
                                }}
                            >
                                Voir tout l'historique →
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Dashboard