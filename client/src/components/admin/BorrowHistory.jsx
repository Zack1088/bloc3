import React, { useState, useEffect } from 'react'
import DataTable from '../ui/DataTable'
import { TableSkeleton } from '../ui/SkeletonLoader'
import { useToast } from '../../contexts/ToastContext'
import ConfirmDialog, { useConfirm } from '../ui/ConfirmDialog'
const base = import.meta.env.VITE_BASE_URL || '/'

/**
 * Export data to CSV
 */
const exportToCSV = (data, filename = 'emprunts') => {
    if (data.length === 0) {
        alert('Aucune donnée à exporter')
        return
    }

    const headers = ['Livre', 'Emprunteur', 'Email', 'Date Emprunt', 'Retour Prévu', 'Retour Effectif', 'Statut', 'Jours Restants', 'Rappels Envoyés']

    const csvContent = [
        headers.join(','),
        ...data.map(row => [
            `"${row.livre_titre}"`,
            `"${row.utilisateur_nom} ${row.utilisateur_prenom}"`,
            `"${row.utilisateur_email}"`,
            new Date(row.date_emprunt).toLocaleDateString('fr-FR'),
            new Date(row.date_retour_prevue).toLocaleDateString('fr-FR'),
            row.date_retour_effective ? new Date(row.date_retour_effective).toLocaleDateString('fr-FR') : 'N/A',
            row.statut,
            row.jours_restants || 'N/A',
            row.rappels_envoyes || 0
        ].join(','))
    ].join('\n')

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)

    link.setAttribute('href', url)
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
}

const BorrowHistory = () => {
    const { showSuccess, showError } = useToast()
    const { confirmState, confirm, closeConfirm } = useConfirm()

    const [emprunts, setEmprunts] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [filters, setFilters] = useState({
        livre: '',
        utilisateur: '',
        statut: '',
        dateDebut: '',
        dateFin: ''
    })

    useEffect(() => {
        fetchEmprunts()
    }, [])

    const fetchEmprunts = async () => {
        setIsLoading(true)
        try {
            const response = await fetch(`${base}api/emprunts/all`, {
                credentials: 'include'
            })

            if (!response.ok) {
                throw new Error('Erreur de chargement')
            }

            const data = await response.json()
            setEmprunts(data)
        } catch (error) {
            console.error('Erreur:', error)
            showError('Impossible de charger l\'historique')
        } finally {
            setIsLoading(false)
        }
    }

    const handleSendReminder = async (empruntId, livreTitre) => {
        confirm({
            title: 'Envoyer un rappel',
            message: `Voulez-vous envoyer un email de rappel pour le livre "${livreTitre}" ?`,
            confirmText: 'Envoyer',
            type: 'info',
            onConfirm: async () => {
                try {
                    const response = await fetch(`${base}api/emprunts/${empruntId}/rappel`, {
                        method: 'POST',
                        credentials: 'include'
                    })

                    if (!response.ok) {
                        const error = await response.json()
                        throw new Error(error.message || 'Erreur d\'envoi')
                    }

                    showSuccess('✓ Rappel envoyé avec succès')
                    fetchEmprunts() // Refresh to update reminder count
                } catch (error) {
                    console.error('Erreur:', error)
                    showError(error.message || 'Erreur lors de l\'envoi du rappel')
                }
            }
        })
    }

    const filteredEmprunts = emprunts.filter(e => {
        if (filters.livre && !e.livre_titre.toLowerCase().includes(filters.livre.toLowerCase())) {
            return false
        }
        if (filters.utilisateur) {
            const fullName = `${e.utilisateur_nom} ${e.utilisateur_prenom}`.toLowerCase()
            if (!fullName.includes(filters.utilisateur.toLowerCase())) {
                return false
            }
        }
        if (filters.statut && e.statut !== filters.statut) {
            return false
        }
        if (filters.dateDebut) {
            const empruntDate = new Date(e.date_emprunt)
            const filterDate = new Date(filters.dateDebut)
            if (empruntDate < filterDate) {
                return false
            }
        }
        if (filters.dateFin) {
            const empruntDate = new Date(e.date_emprunt)
            const filterDate = new Date(filters.dateFin)
            if (empruntDate > filterDate) {
                return false
            }
        }
        return true
    })

    const columns = [
        {
            key: 'livre',
            header: 'Livre',
            accessor: (row) => row.livre_titre,
            sortable: true
        },
        {
            key: 'emprunteur',
            header: 'Emprunteur',
            accessor: (row) => `${row.utilisateur_nom} ${row.utilisateur_prenom}`,
            sortable: true
        },
        {
            key: 'date_emprunt',
            header: 'Date Emprunt',
            accessor: (row) => new Date(row.date_emprunt).toLocaleDateString('fr-FR'),
            sortable: true
        },
        {
            key: 'date_retour_prevue',
            header: 'Retour Prévu',
            accessor: (row) => new Date(row.date_retour_prevue).toLocaleDateString('fr-FR'),
            sortable: true
        },
        {
            key: 'date_retour_effective',
            header: 'Retour Effectif',
            accessor: (row) => row.date_retour_effective
                ? new Date(row.date_retour_effective).toLocaleDateString('fr-FR')
                : '-',
            sortable: false
        },
        {
            key: 'statut',
            header: 'Statut',
            sortable: true,
            accessor: (row) => row.statut,
            render: (row) => {
                const statusColors = {
                    'en_cours': { bg: '#2196F320', color: '#2196F3', label: 'En cours' },
                    'en_retard': { bg: '#f4433630', color: '#f44336', label: 'En retard' },
                    'retourne': { bg: '#4CAF5020', color: '#4CAF50', label: 'Retourné' }
                }
                const status = statusColors[row.statut] || statusColors['en_cours']

                return (
                    <span style={{
                        backgroundColor: status.bg,
                        color: status.color,
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600'
                    }}>
                        {status.label}
                    </span>
                )
            }
        },
        {
            key: 'rappels',
            header: 'Rappels',
            accessor: (row) => row.rappels_envoyes || 0,
            sortable: true
        },
        {
            key: 'actions',
            header: 'Actions',
            sortable: false,
            accessor: () => '',
            render: (row) => {
                const canSendReminder = row.statut === 'en_retard'

                return (
                    <button
                        onClick={() => handleSendReminder(row.id, row.livre_titre)}
                        disabled={!canSendReminder}
                        style={{
                            padding: '6px 12px',
                            fontSize: '12px',
                            borderRadius: '4px',
                            border: 'none',
                            backgroundColor: canSendReminder ? '#007BFF' : '#e0e0e0',
                            color: canSendReminder ? '#fff' : '#999',
                            cursor: canSendReminder ? 'pointer' : 'not-allowed',
                            transition: 'all 0.2s'
                        }}
                        title={canSendReminder ? 'Envoyer un rappel' : 'Rappel possible uniquement pour les retards'}
                    >
                        📧 Rappel
                    </button>
                )
            }
        }
    ]

    const stats = {
        total: emprunts.length,
        enCours: emprunts.filter(e => e.statut === 'en_cours').length,
        enRetard: emprunts.filter(e => e.statut === 'en_retard').length,
        retournes: emprunts.filter(e => e.statut === 'retourne').length
    }

    if (isLoading) {
        return (
            <div className="container">
                <h2 style={{ marginBottom: '24px' }}>Historique des Emprunts</h2>
                <TableSkeleton rows={10} columns={8} />
            </div>
        )
    }

    return (
        <div className="container">
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px',
                flexWrap: 'wrap',
                gap: '16px'
            }}>
                <h2 style={{ margin: 0 }}>Historique des Emprunts</h2>

                <button
                    onClick={() => exportToCSV(filteredEmprunts, 'historique_emprunts')}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: '#4CAF50',
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
                    📊 Exporter CSV
                </button>
            </div>

            {/* Statistics Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '16px',
                marginBottom: '24px'
            }}>
                <div className="stat-card" style={{
                    backgroundColor: '#fff',
                    padding: '20px',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    border: '2px solid #2196F3'
                }}>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#2196F3' }}>
                        {stats.total}
                    </div>
                    <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>
                        Total Emprunts
                    </div>
                </div>

                <div className="stat-card" style={{
                    backgroundColor: '#fff',
                    padding: '20px',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    border: '2px solid #007BFF'
                }}>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#007BFF' }}>
                        {stats.enCours}
                    </div>
                    <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>
                        En Cours
                    </div>
                </div>

                <div className="stat-card" style={{
                    backgroundColor: '#fff',
                    padding: '20px',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    border: '2px solid #f44336'
                }}>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#f44336' }}>
                        {stats.enRetard}
                    </div>
                    <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>
                        En Retard
                    </div>
                </div>

                <div className="stat-card" style={{
                    backgroundColor: '#fff',
                    padding: '20px',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    border: '2px solid #4CAF50'
                }}>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#4CAF50' }}>
                        {stats.retournes}
                    </div>
                    <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>
                        Retournés
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div style={{
                backgroundColor: '#f8f9fa',
                padding: '20px',
                borderRadius: '8px',
                marginBottom: '24px'
            }}>
                <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '16px' }}>Filtres</h3>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '12px'
                }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: '500' }}>
                            Livre
                        </label>
                        <input
                            type="text"
                            placeholder="Rechercher un livre..."
                            value={filters.livre}
                            onChange={(e) => setFilters({ ...filters, livre: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '8px 12px',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                fontSize: '14px'
                            }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: '500' }}>
                            Emprunteur
                        </label>
                        <input
                            type="text"
                            placeholder="Nom ou prénom..."
                            value={filters.utilisateur}
                            onChange={(e) => setFilters({ ...filters, utilisateur: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '8px 12px',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                fontSize: '14px'
                            }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: '500' }}>
                            Statut
                        </label>
                        <select
                            value={filters.statut}
                            onChange={(e) => setFilters({ ...filters, statut: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '8px 12px',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                fontSize: '14px'
                            }}
                        >
                            <option value="">Tous</option>
                            <option value="en_cours">En cours</option>
                            <option value="en_retard">En retard</option>
                            <option value="retourne">Retourné</option>
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: '500' }}>
                            Du
                        </label>
                        <input
                            type="date"
                            value={filters.dateDebut}
                            onChange={(e) => setFilters({ ...filters, dateDebut: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '8px 12px',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                fontSize: '14px'
                            }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: '500' }}>
                            Au
                        </label>
                        <input
                            type="date"
                            value={filters.dateFin}
                            onChange={(e) => setFilters({ ...filters, dateFin: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '8px 12px',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                fontSize: '14px'
                            }}
                        />
                    </div>
                </div>

                <button
                    onClick={() => setFilters({
                        livre: '',
                        utilisateur: '',
                        statut: '',
                        dateDebut: '',
                        dateFin: ''
                    })}
                    style={{
                        marginTop: '12px',
                        padding: '8px 16px',
                        backgroundColor: '#fff',
                        color: '#666',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '13px',
                        cursor: 'pointer'
                    }}
                >
                    Réinitialiser les filtres
                </button>
            </div>

            {/* Data Table */}
            <DataTable
                data={filteredEmprunts}
                columns={columns}
                pageSize={15}
                showSearch={false}
                emptyMessage="Aucun emprunt trouvé"
            />

            {/* Confirm Dialog */}
            <ConfirmDialog
                isOpen={confirmState.isOpen}
                onClose={closeConfirm}
                onConfirm={confirmState.onConfirm}
                title={confirmState.title}
                message={confirmState.message}
                confirmText={confirmState.confirmText}
                cancelText={confirmState.cancelText}
                type={confirmState.type}
            />
        </div>
    )
}

export default BorrowHistory
