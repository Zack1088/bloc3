import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
const base = import.meta.env.VITE_BASE_URL || '/'

const MesEmprunts = () => {
    const [emprunts, setEmprunts] = useState([])
    const [filteredEmprunts, setFilteredEmprunts] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [filterStatus, setFilterStatus] = useState('tous')
    const navigate = useNavigate()

    useEffect(() => {
        fetchEmprunts()
    }, [])

    useEffect(() => {
        applyFilter()
    }, [filterStatus, emprunts])

    const fetchEmprunts = async () => {
        try {
            const response = await fetch(base + 'api/emprunts/mes-emprunts', {
                credentials: 'include'
            })

            if (response.ok) {
                const data = await response.json()
                setEmprunts(data)
                setFilteredEmprunts(data)
            } else if (response.status === 401) {
                setError('Vous devez être connecté pour voir vos emprunts')
                setTimeout(() => navigate('/login'), 2000)
            } else {
                setError('Erreur lors du chargement des emprunts')
            }
        } catch (err) {
            console.error('Erreur:', err)
            setError('Erreur réseau')
        } finally {
            setLoading(false)
        }
    }

    const applyFilter = () => {
        if (filterStatus === 'tous') {
            setFilteredEmprunts(emprunts)
        } else if (filterStatus === 'en_cours') {
            setFilteredEmprunts(emprunts.filter(e => e.statut === 'en_cours' || e.statut === 'en_retard'))
        } else if (filterStatus === 'retournes') {
            setFilteredEmprunts(emprunts.filter(e => e.statut === 'retourne'))
        } else if (filterStatus === 'en_retard') {
            setFilteredEmprunts(emprunts.filter(e => e.statut === 'en_retard' || e.jours_restants < 0))
        }
    }

    const handleRetour = async (empruntId, titreLivre) => {
        if (!confirm(`Confirmer le retour de "${titreLivre}" ?`)) return

        try {
            const response = await fetch(base + `api/emprunts/retourner/${empruntId}`, {
                method: 'POST',
                credentials: 'include'
            })

            if (response.ok) {
                alert('✅ Livre retourné avec succès !')
                fetchEmprunts()
            } else {
                const data = await response.json()
                alert(data.message || 'Erreur lors du retour')
            }
        } catch (err) {
            console.error('Erreur:', err)
            alert('Erreur réseau')
        }
    }

    const getStatutBadge = (emprunt) => {
        const styles = {
            retourne: { color: '#4CAF50', icon: '✓', text: 'Retourné' },
            en_retard: { color: '#f44336', icon: '⚠', text: `En retard (${Math.abs(emprunt.jours_restants)} jours)` },
            bientot: { color: '#FF9800', icon: '⏰', text: `À rendre bientôt (${emprunt.jours_restants} jours)` },
            en_cours: { color: '#2196F3', icon: '📖', text: `En cours (${emprunt.jours_restants} jours restants)` }
        }

        let style = styles.en_cours
        if (emprunt.statut === 'retourne') style = styles.retourne
        else if (emprunt.statut === 'en_retard' || emprunt.jours_restants < 0) style = styles.en_retard
        else if (emprunt.jours_restants <= 3) style = styles.bientot

        return (
            <span style={{ 
                color: style.color, 
                fontWeight: 'bold',
                padding: '5px 10px',
                borderRadius: '4px',
                backgroundColor: `${style.color}15`,
                display: 'inline-block'
            }}>
                {style.icon} {style.text}
            </span>
        )
    }

    if (loading) return <div className="container"><p>⏳ Chargement...</p></div>
    if (error) return <div className="container"><p style={{ color: 'red' }}>❌ {error}</p></div>

    const getStatistics = () => {
        return {
            total: emprunts.length,
            enCours: emprunts.filter(e => e.statut === 'en_cours').length,
            enRetard: emprunts.filter(e => e.statut === 'en_retard' || e.jours_restants < 0).length,
            retournes: emprunts.filter(e => e.statut === 'retourne').length
        }
    }

    const stats = getStatistics()

    return (
        <div className="container">
            <h2>📚 Mes Emprunts</h2>

            {emprunts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                    <p style={{ fontSize: '18px', color: '#666' }}>
                        Vous n'avez aucun emprunt en cours ou passé.
                    </p>
                    <Link to="/books">
                        <button style={{
                            backgroundColor: '#2196F3',
                            color: 'white',
                            padding: '12px 24px',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '16px',
                            marginTop: '20px'
                        }}>
                            📖 Découvrir les livres disponibles
                        </button>
                    </Link>
                </div>
            ) : (
                <>
                    {/* Statistiques */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '15px',
                        marginBottom: '30px'
                    }}>
                        <div style={{
                            backgroundColor: '#fff',
                            padding: '20px',
                            borderRadius: '8px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            border: '2px solid #2196F3'
                        }}>
                            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#2196F3' }}>{stats.total}</div>
                            <div style={{ color: '#666', marginTop: '5px' }}>📚 Total emprunts</div>
                        </div>

                        <div style={{
                            backgroundColor: '#fff',
                            padding: '20px',
                            borderRadius: '8px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            border: '2px solid #4CAF50'
                        }}>
                            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#4CAF50' }}>{stats.enCours}</div>
                            <div style={{ color: '#666', marginTop: '5px' }}>📖 En cours</div>
                        </div>

                        <div style={{
                            backgroundColor: '#fff',
                            padding: '20px',
                            borderRadius: '8px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            border: '2px solid #f44336'
                        }}>
                            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#f44336' }}>{stats.enRetard}</div>
                            <div style={{ color: '#666', marginTop: '5px' }}>⚠ En retard</div>
                        </div>

                        <div style={{
                            backgroundColor: '#fff',
                            padding: '20px',
                            borderRadius: '8px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            border: '2px solid #757575'
                        }}>
                            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#757575' }}>{stats.retournes}</div>
                            <div style={{ color: '#666', marginTop: '5px' }}>✓ Retournés</div>
                        </div>
                    </div>

                    {/* Filtres */}
                    <div style={{ marginBottom: '20px' }}>
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            {[
                                { key: 'tous', label: '📋 Tous', count: stats.total },
                                { key: 'en_cours', label: '📖 En cours', count: stats.enCours },
                                { key: 'en_retard', label: '⚠ En retard', count: stats.enRetard },
                                { key: 'retournes', label: '✓ Retournés', count: stats.retournes }
                            ].map(filter => (
                                <button
                                    key={filter.key}
                                    onClick={() => setFilterStatus(filter.key)}
                                    style={{
                                        backgroundColor: filterStatus === filter.key ? '#2196F3' : '#fff',
                                        color: filterStatus === filter.key ? 'white' : '#333',
                                        padding: '10px 20px',
                                        border: '2px solid #2196F3',
                                        borderRadius: '20px',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        fontWeight: filterStatus === filter.key ? 'bold' : 'normal',
                                        transition: 'all 0.3s',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '5px'
                                    }}
                                >
                                    {filter.label} <span style={{
                                        backgroundColor: filterStatus === filter.key ? 'rgba(255,255,255,0.3)' : '#2196F3',
                                        color: filterStatus === filter.key ? 'white' : 'white',
                                        padding: '2px 8px',
                                        borderRadius: '10px',
                                        fontSize: '12px',
                                        fontWeight: 'bold'
                                    }}>
                                        {filter.count}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <p style={{ color: '#666', marginBottom: '20px' }}>
                        Affichage de <strong>{filteredEmprunts.length}</strong> emprunt(s)
                    </p>

                    <div className="emprunts-list">
                        {filteredEmprunts.map(emprunt => (
                            <div key={emprunt.id} style={{
                                border: '2px solid #ddd',
                                padding: '20px',
                                marginBottom: '20px',
                                borderRadius: '8px',
                                backgroundColor: '#fff',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                transition: 'transform 0.2s',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                                    <img 
                                        src={emprunt.photo_url} 
                                        alt={emprunt.titre}
                                        style={{ 
                                            width: '120px', 
                                            height: '180px', 
                                            objectFit: 'cover',
                                            borderRadius: '6px',
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                                        }}
                                    />
                                    <div style={{ flex: 1 }}>
                                        <h3 style={{ marginTop: 0, marginBottom: '10px' }}>
                                            <Link 
                                                to={`/book/${emprunt.livre_id}`} 
                                                style={{ 
                                                    color: '#333', 
                                                    textDecoration: 'none',
                                                    fontSize: '20px'
                                                }}
                                            >
                                                {emprunt.titre}
                                            </Link>
                                        </h3>
                                        
                                        <p style={{ margin: '8px 0', color: '#555' }}>
                                            <strong>👤 Auteur:</strong> {emprunt.auteur}
                                        </p>
                                        
                                        <p style={{ margin: '8px 0', color: '#555' }}>
                                            <strong>📅 Emprunté le:</strong> {new Date(emprunt.date_emprunt).toLocaleDateString('fr-FR', {
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric'
                                            })}
                                        </p>
                                        
                                        <p style={{ margin: '8px 0', color: '#555' }}>
                                            <strong>🔖 À rendre le:</strong> {new Date(emprunt.date_retour_prevue).toLocaleDateString('fr-FR', {
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric'
                                            })}
                                            <span style={{ 
                                                marginLeft: '10px',
                                                fontSize: '12px',
                                                color: '#888'
                                            }}>
                                                (Durée: 30 jours)
                                            </span>
                                        </p>
                                        
                                        {emprunt.date_retour_effective && (
                                            <p style={{ margin: '8px 0', color: '#4CAF50', fontWeight: 'bold' }}>
                                                <strong>✅ Retourné le:</strong> {new Date(emprunt.date_retour_effective).toLocaleDateString('fr-FR', {
                                                    day: 'numeric',
                                                    month: 'long',
                                                    year: 'numeric'
                                                })}
                                            </p>
                                        )}
                                        
                                        <div style={{ marginTop: '15px' }}>
                                            <strong>📊 Statut: </strong>
                                            {getStatutBadge(emprunt)}
                                        </div>
                                        
                                        {(emprunt.statut === 'en_cours' || emprunt.statut === 'en_retard') && (
                                            <button 
                                                onClick={() => handleRetour(emprunt.id, emprunt.titre)}
                                                style={{
                                                    backgroundColor: '#4CAF50',
                                                    color: 'white',
                                                    padding: '12px 24px',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    marginTop: '15px',
                                                    fontSize: '14px',
                                                    fontWeight: 'bold',
                                                    transition: 'background-color 0.3s'
                                                }}
                                                onMouseEnter={(e) => e.target.style.backgroundColor = '#45a049'}
                                                onMouseLeave={(e) => e.target.style.backgroundColor = '#4CAF50'}
                                            >
                                                ✓ Retourner ce livre
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}

export default MesEmprunts