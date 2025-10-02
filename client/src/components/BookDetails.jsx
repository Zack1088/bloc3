import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
const base = import.meta.env.VITE_BASE_URL || '/'

const BookDetails = () => {
    const { bookId } = useParams()
    const navigate = useNavigate()
    const [book, setBook] = useState(null)
    const [userRole, setUserRole] = useState('')
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [loading, setLoading] = useState(true)
    const [borrowing, setBorrowing] = useState(false)
    const [userHasActiveLoan, setUserHasActiveLoan] = useState(false)

    useEffect(() => {
        fetchBook()
        checkAuth()
        checkUserLoans()
    }, [bookId]);

    const fetchBook = () => {
        fetch(`${base}api/books/${bookId}`, {
            credentials: 'include'
        })
            .then(response => response.json())
            .then(data => {
                setBook(data[0] || data)
                setLoading(false)
            })
            .catch(error => {
                console.error('Erreur:', error)
                setLoading(false)
            });
    }

    const checkAuth = () => {
        fetch(base+'api/session', {
            credentials: 'include'
        })
            .then(response => {
                if (response.ok) {
                    return response.json()
                }
                throw new Error('Non authentifié')
            })
            .then(data => {
                setUserRole(data.user.role)
                setIsAuthenticated(true)
            })
            .catch(error => {
                setUserRole('Guest')
                setIsAuthenticated(false)
            });
    }

    const checkUserLoans = async () => {
        try {
            const response = await fetch(`${base}api/emprunts/mes-emprunts`, {
                credentials: 'include'
            })
            if (response.ok) {
                const emprunts = await response.json()
                const hasActiveLoan = emprunts.some(e =>
                    e.livre_id === parseInt(bookId) &&
                    (e.statut === 'en_cours' || e.statut === 'en_retard')
                )
                setUserHasActiveLoan(hasActiveLoan)
            }
        } catch (error) {
            console.error('Erreur vérification emprunts:', error)
        }
    }

    const handleEmprunter = async () => {
        if (!isAuthenticated) {
            alert('⚠️ Vous devez être connecté pour emprunter un livre')
            navigate('/login')
            return
        }

        setBorrowing(true)

        try {
            const response = await fetch(`${base}api/emprunts/emprunter/${bookId}`, {
                method: 'POST',
                credentials: 'include'
            })

            const data = await response.json()

            if (response.ok) {
                alert(`✅ Livre emprunté avec succès !\n\n📅 À rendre avant le ${new Date(data.dateRetourPrevue).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                })}\n⏰ Durée: ${data.dureeJours} jours\n\n💡 Vous recevrez un email de rappel automatique en cas de retard.`)
                fetchBook()
                checkUserLoans()
            } else {
                alert('❌ ' + (data.message || 'Erreur lors de l\'emprunt'))
            }
        } catch (error) {
            console.error('Erreur:', error)
            alert('❌ Erreur réseau')
        } finally {
            setBorrowing(false)
        }
    }

    const handleBack = () => {
        navigate('/books');
    };

    const handleEdit = () => {
        navigate(`/edit_book/${bookId}`);
    };

    const handleDelete = () => {
        if (confirm('⚠️ Êtes-vous sûr de vouloir supprimer ce livre ?')) {
            fetch(`${base}api/books/${bookId}`, {
                method: 'DELETE',
                credentials: 'include'
            })
                .then(response => {
                    if (response.ok) {
                        alert('✅ Livre supprimé')
                        navigate('/books')
                    } else {
                        alert('❌ Erreur lors de la suppression')
                    }
                })
                .catch(error => console.error('Erreur:', error))
        }
    };

    if (loading) {
        return <div className="container"><p>⏳ Chargement...</p></div>
    }

    if (!book) {
        return <div className="container"><p>❌ Livre non trouvé</p></div>
    }

    return (
        <div className="container">
            <div className="details" style={{ 
                backgroundColor: '#fff',
                padding: '30px',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
                <h2 style={{ color: '#333', marginBottom: '20px' }}>{book.titre}</h2>
                
                <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
                    <img 
                        className="book-image" 
                        src={book.photo_url} 
                        alt={book.titre} 
                        style={{ 
                            maxWidth: '300px',
                            width: '100%',
                            height: 'auto',
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                        }} 
                    />
                    
                    <div style={{ flex: 1, minWidth: '300px' }}>
                        <div style={{ marginBottom: '15px' }}>
                            <strong style={{ color: '#555' }}>👤 Auteur:</strong>
                            <p style={{ margin: '5px 0', fontSize: '18px' }}>{book.auteur}</p>
                        </div>
                        
                        <div style={{ marginBottom: '15px' }}>
                            <strong style={{ color: '#555' }}>📅 Année de publication:</strong>
                            <p style={{ margin: '5px 0' }}>{new Date(book.date_publication).getFullYear()}</p>
                        </div>
                        
                        <div style={{ marginBottom: '15px' }}>
                            <strong style={{ color: '#555' }}>🔢 ISBN:</strong>
                            <p style={{ margin: '5px 0' }}>{book.isbn}</p>
                        </div>
                        
                        <div style={{ marginBottom: '15px' }}>
                            <strong style={{ color: '#555' }}>📊 Statut:</strong>
                            <p style={{ margin: '5px 0' }}>
                                <span style={{ 
                                    color: book.statut === 'disponible' ? '#4CAF50' : '#f44336',
                                    fontWeight: 'bold',
                                    fontSize: '18px',
                                    padding: '8px 16px',
                                    borderRadius: '4px',
                                    backgroundColor: book.statut === 'disponible' ? '#4CAF5015' : '#f4433615',
                                    display: 'inline-block'
                                }}>
                                    {book.statut === 'disponible' ? '✓ Disponible' : '✗ Emprunté'}
                                </span>
                            </p>
                        </div>
                        
                        <div style={{ marginBottom: '15px' }}>
                            <strong style={{ color: '#555' }}>📝 Description:</strong>
                            <p style={{ 
                                margin: '10px 0',
                                lineHeight: '1.6',
                                textAlign: 'justify'
                            }}>
                                {book.description}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="back-button" style={{ 
                marginTop: '30px',
                display: 'flex',
                gap: '10px',
                flexWrap: 'wrap'
            }}>
                <button
                    onClick={handleBack}
                    style={{
                        backgroundColor: '#757575',
                        color: 'white',
                        padding: '12px 24px',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px'
                    }}
                >
                    ← Retour à la liste
                </button>

                {userHasActiveLoan && (
                    <button
                        onClick={() => navigate('/mes-emprunts')}
                        style={{
                            backgroundColor: '#FF9800',
                            color: 'white',
                            padding: '12px 24px',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: 'bold'
                        }}
                    >
                        📖 Vous avez déjà emprunté ce livre
                    </button>
                )}

                {isAuthenticated && book.statut === 'disponible' && !userHasActiveLoan && (
                    <button
                        onClick={handleEmprunter}
                        disabled={borrowing}
                        style={{
                            backgroundColor: borrowing ? '#ccc' : '#2196F3',
                            color: 'white',
                            padding: '12px 24px',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: borrowing ? 'not-allowed' : 'pointer',
                            fontSize: '14px',
                            fontWeight: 'bold'
                        }}
                    >
                        {borrowing ? '⏳ Emprunt en cours...' : '📚 Emprunter ce livre (30 jours)'}
                    </button>
                )}

                {!isAuthenticated && book.statut === 'disponible' && (
                    <button
                        onClick={() => navigate('/login')}
                        style={{
                            backgroundColor: '#4CAF50',
                            color: 'white',
                            padding: '12px 24px',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: 'bold'
                        }}
                    >
                        🔒 Connectez-vous pour emprunter
                    </button>
                )}
                
                {userRole === 'admin' && (
                    <>
                        <button 
                            onClick={handleEdit}
                            style={{
                                backgroundColor: '#FF9800',
                                color: 'white',
                                padding: '12px 24px',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '14px'
                            }}
                        >
                            ✏️ Modifier
                        </button>
                        <button 
                            onClick={handleDelete}
                            style={{
                                backgroundColor: '#f44336',
                                color: 'white',
                                padding: '12px 24px',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '14px'
                            }}
                        >
                            🗑️ Supprimer
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default BookDetails