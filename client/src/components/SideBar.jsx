import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './../styles/sidebar.css'

const Sidebar = ({userT}) => {
    const [user, setUser] = useState(null)
    const navigate = useNavigate()
    const API_BASE = 'http://localhost:3000/'

    useEffect(() => {
        fetchUser()
    }, [])
    
    useEffect(() => {
        fetchUser()
    }, [userT])

    const fetchUser = () => {
        fetch(`${API_BASE}api/session`, {
            credentials: 'include'
        })
        .then(response => {
            if(response.status === 200) return response.json()
            else throw new Error("Account not found")
        })
        .then(data => {
            console.log('✅ User logged in:', data.user)
            setUser(data.user)
        })
        .catch(error => {
            console.log('❌ Not authenticated')
            setUser(null)
        })
    }

    const handleLogout = async () => {
        console.log('🚪 Logout initiated...')
        
        try {
            const response = await fetch(`${API_BASE}api/logout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            })

            console.log('Logout response:', response.status)

            if (response.ok) {
                console.log('✅ Logout successful')
                setUser(null)
                navigate('/')
                
            } else {
                console.error('❌ Logout failed:', response.status)
                alert('Erreur lors de la déconnexion')
            }
        } catch (error) {
            console.error('❌ Logout error:', error)
            alert('Erreur réseau lors de la déconnexion')
        }
    }

    return (
        <nav id="sidebar">
            <ul>
                {user?.role ? (
                    <>
                        <li style={{ fontWeight: 'bold', borderBottom: '1px solid #ddd', paddingBottom: '10px' }}>
                            👤 {user.email}
                        </li>
                        <li style={{textAlign: 'right', fontSize: '12px', color: '#666', marginBottom: '15px'}}>
                            <i>{user.role}</i>
                        </li>
                        <li><Link to="/books">📚 Liste des livres</Link></li>
                        <li><Link to="/mes-emprunts">📖 Mes Emprunts</Link></li>
                        <li><Link to="/dashboard">📊 Tableau de bord</Link></li>
                        {user.role === 'admin' && (
                            <li><Link to="/add_book">➕ Ajouter un livre</Link></li>
                        )}
                        <li style={{ marginTop: '20px' }}>
                            <button 
                                onClick={handleLogout}
                                style={{
                                    width: '100%',
                                    backgroundColor: '#f44336',
                                    color: 'white',
                                    border: 'none',
                                    padding: '10px',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    fontWeight: 'bold'
                                }}
                            >
                                🚪 Déconnexion
                            </button>
                        </li>
                    </>
                ) : (
                    <>
                        <li><Link to="/books">📚 Liste des livres</Link></li>
                        <li><Link to="/login">🔐 Connexion</Link></li>
                        <li><Link to="/register">📝 Inscription</Link></li>
                    </>
                )}
            </ul>
        </nav>
    )
}

export default Sidebar