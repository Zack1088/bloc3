import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom' // ✅ Importer Link

const BookList = () => {
    const [books, setBooks] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const API_BASE = 'http://localhost:3000/'

    useEffect(() => {
        fetchBooks()
    }, [])

    const fetchBooks = async () => {
        try {
            const response = await fetch(`${API_BASE}api/books`, {
                credentials: 'include'
            })

            if (response.ok) {
                const data = await response.json()
                setBooks(data)
            } else {
                setError('Erreur lors du chargement des livres')
            }
        } catch (err) {
            console.error('Erreur:', err)
            setError('Erreur réseau')
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <div className="container"><p>⏳ Chargement...</p></div>
    if (error) return <div className="container"><p style={{ color: 'red' }}>❌ {error}</p></div>

    return (
        <div className="container">
            <h2>📚 Liste des Livres</h2>
            
            {books.length === 0 ? (
                <p>Aucun livre disponible pour le moment.</p>
            ) : (
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                    gap: '20px',
                    marginTop: '20px'
                }}>
                    {books.map(book => (
                        <div key={book.id} style={{
                            border: '1px solid #ddd',
                            borderRadius: '8px',
                            padding: '15px',
                            backgroundColor: '#fff',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            transition: 'transform 0.2s',
                            cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            <img 
                                src={book.photo_url} 
                                alt={book.titre}
                                style={{
                                    width: '100%',
                                    height: '300px',
                                    objectFit: 'cover',
                                    borderRadius: '4px',
                                    marginBottom: '10px'
                                }}
                            />
                            
                            <h3 style={{ 
                                fontSize: '18px', 
                                marginBottom: '10px',
                                height: '50px',
                                overflow: 'hidden'
                            }}>
                                {book.titre}
                            </h3>
                            
                            <p style={{ 
                                color: '#666',
                                marginBottom: '10px'
                            }}>
                                <strong>👤</strong> {book.auteur}
                            </p>
                            
                            <p style={{ 
                                marginBottom: '15px',
                                fontWeight: 'bold'
                            }}>
                                <span style={{
                                    color: book.statut === 'disponible' ? '#4CAF50' : '#f44336',
                                    padding: '5px 10px',
                                    borderRadius: '4px',
                                    backgroundColor: book.statut === 'disponible' ? '#4CAF5015' : '#f4433615',
                                    fontSize: '14px'
                                }}>
                                    {book.statut === 'disponible' ? '✓ Disponible' : '✗ Emprunté'}
                                </span>
                            </p>
        
                            <Link 
                                to={`/book/${book.id}`}
                                style={{
                                    display: 'block',
                                    textAlign: 'center',
                                    backgroundColor: '#2196F3',
                                    color: 'white',
                                    padding: '10px',
                                    borderRadius: '4px',
                                    textDecoration: 'none',
                                    fontWeight: 'bold'
                                }}
                            >
                                📖 Voir les détails
                            </Link>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default BookList