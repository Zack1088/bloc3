import React from 'react'

/**
 * Skeleton loader component for loading states
 * @param {Object} props
 * @param {string} [props.variant='text'] - Variant: 'text' | 'rect' | 'circle'
 * @param {string} [props.width='100%'] - Width
 * @param {string} [props.height='20px'] - Height
 * @param {number} [props.count=1] - Number of skeleton items
 */
const SkeletonLoader = ({
    variant = 'text',
    width = '100%',
    height = '20px',
    count = 1
}) => {
    const getStyles = () => {
        const baseStyles = {
            backgroundColor: '#e0e0e0',
            backgroundImage: 'linear-gradient(90deg, #e0e0e0 0px, #f0f0f0 40px, #e0e0e0 80px)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite',
            display: 'inline-block'
        }

        switch (variant) {
            case 'circle':
                return {
                    ...baseStyles,
                    width: width,
                    height: height,
                    borderRadius: '50%'
                }
            case 'rect':
                return {
                    ...baseStyles,
                    width: width,
                    height: height,
                    borderRadius: '4px'
                }
            case 'text':
            default:
                return {
                    ...baseStyles,
                    width: width,
                    height: height,
                    borderRadius: '4px'
                }
        }
    }

    return (
        <>
            <style>{`
                @keyframes shimmer {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
            `}</style>

            {Array.from({ length: count }).map((_, index) => (
                <div
                    key={index}
                    style={{
                        ...getStyles(),
                        marginBottom: index < count - 1 ? '8px' : '0'
                    }}
                />
            ))}
        </>
    )
}

/**
 * Form skeleton loader
 */
export const FormSkeleton = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
            <SkeletonLoader width="120px" height="16px" />
            <div style={{ marginTop: '8px' }}>
                <SkeletonLoader width="100%" height="40px" variant="rect" />
            </div>
        </div>
        <div>
            <SkeletonLoader width="100px" height="16px" />
            <div style={{ marginTop: '8px' }}>
                <SkeletonLoader width="100%" height="40px" variant="rect" />
            </div>
        </div>
        <div>
            <SkeletonLoader width="140px" height="16px" />
            <div style={{ marginTop: '8px' }}>
                <SkeletonLoader width="100%" height="80px" variant="rect" />
            </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
            <SkeletonLoader width="120px" height="40px" variant="rect" />
            <SkeletonLoader width="100px" height="40px" variant="rect" />
        </div>
    </div>
)

/**
 * Table skeleton loader
 */
export const TableSkeleton = ({ rows = 5, columns = 4 }) => (
    <div style={{ width: '100%' }}>
        {/* Header */}
        <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
            gap: '16px',
            padding: '14px 16px',
            borderBottom: '2px solid #e0e0e0'
        }}>
            {Array.from({ length: columns }).map((_, i) => (
                <SkeletonLoader key={i} width="80px" height="16px" />
            ))}
        </div>

        {/* Rows */}
        {Array.from({ length: rows }).map((_, rowIndex) => (
            <div
                key={rowIndex}
                style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${columns}, 1fr)`,
                    gap: '16px',
                    padding: '12px 16px',
                    borderBottom: '1px solid #f0f0f0'
                }}
            >
                {Array.from({ length: columns }).map((_, colIndex) => (
                    <SkeletonLoader key={colIndex} width="90%" height="14px" />
                ))}
            </div>
        ))}
    </div>
)

export default SkeletonLoader
