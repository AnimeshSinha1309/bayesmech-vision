import React from 'react'

interface EmptyStateProps {
  icon?: string
  title: string
  subtitle?: string
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, subtitle }) => {
  return (
    <div className="empty-state" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
      {icon && (
        <div
          className="empty-state-icon"
          style={{ fontSize: '3rem', opacity: 0.3, marginBottom: '1rem' }}
        >
          {icon}
        </div>
      )}
      <h3 className="empty-state-title" style={{ opacity: 0.7, marginBottom: '0.5rem' }}>
        {title}
      </h3>
      {subtitle && (
        <p className="empty-state-subtitle" style={{ opacity: 0.5, fontSize: '0.9rem' }}>
          {subtitle}
        </p>
      )}
    </div>
  )
}

export default EmptyState
