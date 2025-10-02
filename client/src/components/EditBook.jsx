import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { FormSkeleton } from './ui/SkeletonLoader'
import { useToast } from '../contexts/ToastContext'
const base = import.meta.env.VITE_BASE_URL || '/'

/**
 * Validation schema for book form
 */
const validateBook = (book) => {
    const errors = {}

    if (!book.title || book.title.trim().length < 2) {
        errors.title = 'Le titre doit contenir au moins 2 caractères'
    }

    if (!book.author || book.author.trim().length < 2) {
        errors.author = 'L\'auteur doit contenir au moins 2 caractères'
    }

    if (!book.description || book.description.trim().length < 10) {
        errors.description = 'La description doit contenir au moins 10 caractères'
    }

    if (!book.cover || !book.cover.match(/^https?:\/\/.+/)) {
        errors.cover = 'L\'URL de l\'image doit être valide (http:// ou https://)'
    }

    if (!book.isbn || book.isbn.trim().length < 10) {
        errors.isbn = 'L\'ISBN doit contenir au moins 10 caractères'
    }

    if (!book.date_publication) {
        errors.date_publication = 'La date de publication est requise'
    } else {
        const year = new Date(book.date_publication).getFullYear()
        if (year < 1000 || year > new Date().getFullYear()) {
            errors.date_publication = 'La date de publication semble incorrecte'
        }
    }

    return errors
}

const EditBook = () => {
    const { bookId } = useParams()
    const navigate = useNavigate()
    const { showSuccess, showError } = useToast()

    const [book, setBook] = useState({
        cover: '',
        title: '',
        author: '',
        description: '',
        date_publication: '',
        isbn: '',
        statut: 'disponible'
    })

    const [fieldErrors, setFieldErrors] = useState({})
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        const fetchBook = async () => {
            setIsLoading(true)
            const startTime = Date.now()

            try {
                const response = await fetch(`${base}api/books/${bookId}`, {
                    credentials: 'include'
                })

                if (!response.ok) {
                    throw new Error('Livre non trouvé')
                }

                let data = await response.json()

                // L'API retourne un tableau, prendre le premier élément
                if (Array.isArray(data)) {
                    data = data[0]
                }

                if (!data) {
                    throw new Error('Livre non trouvé')
                }

                // Mapper les champs de l'API vers le format du formulaire
                const bookData = {
                    cover: data.photo_url || '',
                    title: data.titre || '',
                    author: data.auteur || '',
                    description: data.description || '',
                    date_publication: data.date_publication || '',
                    isbn: data.isbn || '',
                    statut: data.statut || 'disponible'
                }

                // Format date for input type="date"
                if (bookData.date_publication) {
                    const date = new Date(bookData.date_publication)
                    bookData.date_publication = date.toISOString().split('T')[0]
                }

                setBook(bookData)

                // Ensure minimum loading time for smooth skeleton transition (200ms)
                const elapsed = Date.now() - startTime
                if (elapsed < 200) {
                    await new Promise(resolve => setTimeout(resolve, 200 - elapsed))
                }

            } catch (error) {
                console.error('Erreur:', error)
                showError('Impossible de charger le livre')
                setTimeout(() => navigate('/books'), 2000)
            } finally {
                setIsLoading(false)
            }
        }

        fetchBook()
    }, [bookId])

    const handleChange = (e) => {
        const { name, value } = e.target
        setBook(prevBook => ({
            ...prevBook,
            [name]: value
        }))

        // Clear field error on change
        if (fieldErrors[name]) {
            setFieldErrors(prev => {
                const newErrors = { ...prev }
                delete newErrors[name]
                return newErrors
            })
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        // Validate
        const errors = validateBook(book)
        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors)
            showError('Veuillez corriger les erreurs dans le formulaire')
            return
        }

        setIsSubmitting(true)
        setFieldErrors({})

        // Mapper les champs du formulaire vers le format de l'API
        const apiData = {
            photo_url: book.cover,
            titre: book.title,
            auteur: book.author,
            description: book.description,
            date_publication: book.date_publication,
            isbn: book.isbn,
            statut: book.statut
        }

        try {
            const response = await fetch(`${base}api/books/${bookId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(apiData),
                credentials: 'include'
            })

            if (response.ok) {
                showSuccess('✓ Livre mis à jour avec succès', 3000)
                setTimeout(() => navigate('/books'), 1500)
            } else {
                const errorData = await response.json()
                if (errorData.errors) {
                    setFieldErrors(errorData.errors)
                }
                showError(errorData.message || 'Erreur lors de la mise à jour')
            }
        } catch (error) {
            console.error('Erreur:', error)
            showError('Erreur réseau - Veuillez réessayer')
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isLoading) {
        return (
            <div className="container">
                <h2 style={{ marginBottom: '24px' }}>Éditer le livre</h2>
                <FormSkeleton />
            </div>
        )
    }

    return (
        <div className="container">
            <h2 style={{ marginBottom: '24px' }}>Éditer le livre</h2>

            <form onSubmit={handleSubmit} style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                maxWidth: '600px'
            }}>
                {/* Cover URL */}
                <div>
                    <label htmlFor="cover" style={{
                        display: 'block',
                        marginBottom: '6px',
                        fontWeight: '500',
                        fontSize: '14px'
                    }}>
                        URL de l'image :
                    </label>
                    <input
                        type="text"
                        id="cover"
                        name="cover"
                        value={book.cover}
                        onChange={handleChange}
                        disabled={isSubmitting}
                        style={{
                            width: '100%',
                            padding: '10px',
                            border: fieldErrors.cover ? '2px solid #f44336' : '1px solid #ddd',
                            borderRadius: '6px',
                            fontSize: '14px'
                        }}
                    />
                    {fieldErrors.cover && (
                        <p style={{
                            color: '#f44336',
                            fontSize: '13px',
                            marginTop: '4px',
                            marginBottom: 0
                        }}>
                            {fieldErrors.cover}
                        </p>
                    )}
                    {book.cover && !fieldErrors.cover && (
                        <img
                            src={book.cover}
                            alt="Aperçu"
                            style={{
                                marginTop: '10px',
                                maxWidth: '150px',
                                borderRadius: '4px'
                            }}
                            onError={(e) => e.target.style.display = 'none'}
                        />
                    )}
                </div>

                {/* Title */}
                <div>
                    <label htmlFor="title" style={{
                        display: 'block',
                        marginBottom: '6px',
                        fontWeight: '500',
                        fontSize: '14px'
                    }}>
                        Titre :
                    </label>
                    <input
                        type="text"
                        id="title"
                        name="title"
                        value={book.title}
                        onChange={handleChange}
                        disabled={isSubmitting}
                        style={{
                            width: '100%',
                            padding: '10px',
                            border: fieldErrors.title ? '2px solid #f44336' : '1px solid #ddd',
                            borderRadius: '6px',
                            fontSize: '14px'
                        }}
                    />
                    {fieldErrors.title && (
                        <p style={{
                            color: '#f44336',
                            fontSize: '13px',
                            marginTop: '4px',
                            marginBottom: 0
                        }}>
                            {fieldErrors.title}
                        </p>
                    )}
                </div>

                {/* Author */}
                <div>
                    <label htmlFor="author" style={{
                        display: 'block',
                        marginBottom: '6px',
                        fontWeight: '500',
                        fontSize: '14px'
                    }}>
                        Auteur :
                    </label>
                    <input
                        type="text"
                        id="author"
                        name="author"
                        value={book.author}
                        onChange={handleChange}
                        disabled={isSubmitting}
                        style={{
                            width: '100%',
                            padding: '10px',
                            border: fieldErrors.author ? '2px solid #f44336' : '1px solid #ddd',
                            borderRadius: '6px',
                            fontSize: '14px'
                        }}
                    />
                    {fieldErrors.author && (
                        <p style={{
                            color: '#f44336',
                            fontSize: '13px',
                            marginTop: '4px',
                            marginBottom: 0
                        }}>
                            {fieldErrors.author}
                        </p>
                    )}
                </div>

                {/* Description */}
                <div>
                    <label htmlFor="description" style={{
                        display: 'block',
                        marginBottom: '6px',
                        fontWeight: '500',
                        fontSize: '14px'
                    }}>
                        Description :
                    </label>
                    <textarea
                        id="description"
                        name="description"
                        value={book.description}
                        onChange={handleChange}
                        disabled={isSubmitting}
                        rows={5}
                        style={{
                            width: '100%',
                            padding: '10px',
                            border: fieldErrors.description ? '2px solid #f44336' : '1px solid #ddd',
                            borderRadius: '6px',
                            fontSize: '14px',
                            resize: 'vertical',
                            fontFamily: 'inherit'
                        }}
                    />
                    {fieldErrors.description && (
                        <p style={{
                            color: '#f44336',
                            fontSize: '13px',
                            marginTop: '4px',
                            marginBottom: 0
                        }}>
                            {fieldErrors.description}
                        </p>
                    )}
                </div>

                {/* Date Publication */}
                <div>
                    <label htmlFor="date_publication" style={{
                        display: 'block',
                        marginBottom: '6px',
                        fontWeight: '500',
                        fontSize: '14px'
                    }}>
                        Date de Publication :
                    </label>
                    <input
                        type="date"
                        id="date_publication"
                        name="date_publication"
                        value={book.date_publication}
                        onChange={handleChange}
                        disabled={isSubmitting}
                        style={{
                            width: '100%',
                            padding: '10px',
                            border: fieldErrors.date_publication ? '2px solid #f44336' : '1px solid #ddd',
                            borderRadius: '6px',
                            fontSize: '14px'
                        }}
                    />
                    {fieldErrors.date_publication && (
                        <p style={{
                            color: '#f44336',
                            fontSize: '13px',
                            marginTop: '4px',
                            marginBottom: 0
                        }}>
                            {fieldErrors.date_publication}
                        </p>
                    )}
                </div>

                {/* ISBN */}
                <div>
                    <label htmlFor="isbn" style={{
                        display: 'block',
                        marginBottom: '6px',
                        fontWeight: '500',
                        fontSize: '14px'
                    }}>
                        ISBN :
                    </label>
                    <input
                        type="text"
                        id="isbn"
                        name="isbn"
                        value={book.isbn}
                        onChange={handleChange}
                        disabled={isSubmitting}
                        style={{
                            width: '100%',
                            padding: '10px',
                            border: fieldErrors.isbn ? '2px solid #f44336' : '1px solid #ddd',
                            borderRadius: '6px',
                            fontSize: '14px'
                        }}
                    />
                    {fieldErrors.isbn && (
                        <p style={{
                            color: '#f44336',
                            fontSize: '13px',
                            marginTop: '4px',
                            marginBottom: 0
                        }}>
                            {fieldErrors.isbn}
                        </p>
                    )}
                </div>

                {/* Action Buttons */}
                <div style={{
                    display: 'flex',
                    gap: '12px',
                    marginTop: '10px'
                }}>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        style={{
                            padding: '12px 24px',
                            backgroundColor: isSubmitting ? '#ccc' : '#007BFF',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: isSubmitting ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        {isSubmitting ? (
                            <>
                                <span className="loading-spinner-small"></span>
                                Mise à jour...
                            </>
                        ) : (
                            'Mettre à jour le Livre'
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={() => navigate('/books')}
                        disabled={isSubmitting}
                        style={{
                            padding: '12px 24px',
                            backgroundColor: '#fff',
                            color: '#333',
                            border: '1px solid #ddd',
                            borderRadius: '6px',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: isSubmitting ? 'not-allowed' : 'pointer'
                        }}
                    >
                        Annuler
                    </button>
                </div>
            </form>
        </div>
    )
}

export default EditBook