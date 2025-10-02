import React, { useState, useMemo } from 'react'

/**
 * Generic DataTable component with sorting, filtering, and pagination
 * @param {Object} props
 * @param {Array} props.data - Array of data objects
 * @param {Array} props.columns - Column definitions
 * @param {number} [props.pageSize=10] - Items per page
 * @param {boolean} [props.showSearch=true] - Show search input
 * @param {string} [props.emptyMessage='Aucune donnée disponible'] - Message when no data
 */
const DataTable = ({
    data = [],
    columns = [],
    pageSize = 10,
    showSearch = true,
    emptyMessage = 'Aucune donnée disponible'
}) => {
    const [currentPage, setCurrentPage] = useState(1)
    const [searchTerm, setSearchTerm] = useState('')
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })

    // Filtering
    const filteredData = useMemo(() => {
        if (!searchTerm) return data

        return data.filter(row =>
            columns.some(col => {
                const value = col.accessor(row)
                return value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
            })
        )
    }, [data, searchTerm, columns])

    // Sorting
    const sortedData = useMemo(() => {
        if (!sortConfig.key) return filteredData

        const sorted = [...filteredData].sort((a, b) => {
            const column = columns.find(col => col.key === sortConfig.key)
            if (!column) return 0

            const aValue = column.accessor(a)
            const bValue = column.accessor(b)

            if (aValue === null || aValue === undefined) return 1
            if (bValue === null || bValue === undefined) return -1

            if (aValue < bValue) {
                return sortConfig.direction === 'asc' ? -1 : 1
            }
            if (aValue > bValue) {
                return sortConfig.direction === 'asc' ? 1 : -1
            }
            return 0
        })

        return sorted
    }, [filteredData, sortConfig, columns])

    // Pagination
    const totalPages = Math.ceil(sortedData.length / pageSize)
    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize
        return sortedData.slice(startIndex, startIndex + pageSize)
    }, [sortedData, currentPage, pageSize])

    // Handlers
    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }))
    }

    const handleSearch = (e) => {
        setSearchTerm(e.target.value)
        setCurrentPage(1) // Reset to first page
    }

    const handlePageChange = (page) => {
        setCurrentPage(page)
    }

    return (
        <div style={{ width: '100%' }}>
            {/* Search */}
            {showSearch && (
                <div style={{ marginBottom: '20px' }}>
                    <input
                        type="text"
                        placeholder="🔍 Rechercher..."
                        value={searchTerm}
                        onChange={handleSearch}
                        style={{
                            width: '100%',
                            maxWidth: '400px',
                            padding: '10px 16px',
                            border: '1px solid #ddd',
                            borderRadius: '6px',
                            fontSize: '14px'
                        }}
                    />
                </div>
            )}

            {/* Table */}
            <div style={{
                overflowX: 'auto',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                backgroundColor: '#fff'
            }}>
                <table style={{
                    width: '100%',
                    borderCollapse: 'collapse'
                }}>
                    <thead>
                        <tr style={{
                            backgroundColor: '#f8f9fa',
                            borderBottom: '2px solid #e0e0e0'
                        }}>
                            {columns.map(column => (
                                <th
                                    key={column.key}
                                    onClick={() => column.sortable && handleSort(column.key)}
                                    style={{
                                        padding: '14px 16px',
                                        textAlign: 'left',
                                        fontSize: '13px',
                                        fontWeight: '600',
                                        color: '#555',
                                        cursor: column.sortable ? 'pointer' : 'default',
                                        userSelect: 'none',
                                        whiteSpace: 'nowrap'
                                    }}
                                >
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}>
                                        {column.header}
                                        {column.sortable && (
                                            <span style={{
                                                fontSize: '12px',
                                                color: sortConfig.key === column.key ? '#007BFF' : '#ccc'
                                            }}>
                                                {sortConfig.key === column.key && sortConfig.direction === 'asc' ? '▲' : '▼'}
                                            </span>
                                        )}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedData.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={columns.length}
                                    style={{
                                        padding: '40px',
                                        textAlign: 'center',
                                        color: '#999',
                                        fontSize: '14px'
                                    }}
                                >
                                    {emptyMessage}
                                </td>
                            </tr>
                        ) : (
                            paginatedData.map((row, rowIndex) => (
                                <tr
                                    key={rowIndex}
                                    style={{
                                        borderBottom: '1px solid #f0f0f0',
                                        transition: 'background-color 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                    {columns.map(column => (
                                        <td
                                            key={column.key}
                                            style={{
                                                padding: '12px 16px',
                                                fontSize: '14px',
                                                color: '#333'
                                            }}
                                        >
                                            {column.render
                                                ? column.render(row, rowIndex)
                                                : column.accessor(row)
                                            }
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div style={{
                    marginTop: '20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '10px'
                }}>
                    <div style={{
                        fontSize: '14px',
                        color: '#666'
                    }}>
                        Page {currentPage} sur {totalPages} • {sortedData.length} résultat{sortedData.length > 1 ? 's' : ''}
                    </div>

                    <div style={{
                        display: 'flex',
                        gap: '8px'
                    }}>
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            style={{
                                padding: '8px 12px',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                backgroundColor: currentPage === 1 ? '#f5f5f5' : '#fff',
                                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                                fontSize: '14px'
                            }}
                        >
                            ← Précédent
                        </button>

                        {/* Page numbers */}
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum
                            if (totalPages <= 5) {
                                pageNum = i + 1
                            } else if (currentPage <= 3) {
                                pageNum = i + 1
                            } else if (currentPage >= totalPages - 2) {
                                pageNum = totalPages - 4 + i
                            } else {
                                pageNum = currentPage - 2 + i
                            }

                            return (
                                <button
                                    key={pageNum}
                                    onClick={() => handlePageChange(pageNum)}
                                    style={{
                                        padding: '8px 12px',
                                        border: '1px solid #ddd',
                                        borderRadius: '4px',
                                        backgroundColor: currentPage === pageNum ? '#007BFF' : '#fff',
                                        color: currentPage === pageNum ? '#fff' : '#333',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        minWidth: '40px'
                                    }}
                                >
                                    {pageNum}
                                </button>
                            )
                        })}

                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            style={{
                                padding: '8px 12px',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                backgroundColor: currentPage === totalPages ? '#f5f5f5' : '#fff',
                                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                                fontSize: '14px'
                            }}
                        >
                            Suivant →
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default DataTable
