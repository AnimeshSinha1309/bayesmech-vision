import React from 'react'

interface InfoCardProps {
  value: string | number
  label: string
}

const InfoCard: React.FC<InfoCardProps> = ({ value, label }) => {
  return (
    <div className="info-card">
      <div
        className="info-value"
        style={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
          color: 'var(--accent)',
        }}
      >
        {value}
      </div>
      <div
        className="info-label"
        style={{
          fontSize: '0.8rem',
          opacity: 0.6,
          marginTop: '0.25rem',
        }}
      >
        {label}
      </div>
    </div>
  )
}

export default InfoCard
