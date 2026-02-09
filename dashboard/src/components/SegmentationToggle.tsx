import React from 'react'

interface SegmentationToggleProps {
  enabled: boolean
  maskCount: number
  onToggle: () => void
}

const SegmentationToggle: React.FC<SegmentationToggleProps> = ({
  enabled,
  maskCount,
  onToggle,
}) => {
  let statusText: string
  let statusClass: string

  if (!enabled) {
    statusText = 'Disabled'
    statusClass = 'seg-disabled'
  } else if (maskCount > 0) {
    statusText = `Active (${maskCount} objects)`
    statusClass = 'seg-active'
  } else {
    statusText = 'Waiting'
    statusClass = 'seg-waiting'
  }

  return (
    <div className="segmentation-toggle" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <button
        className={`seg-toggle-btn ${enabled ? 'seg-on' : 'seg-off'}`}
        onClick={onToggle}
        style={{
          padding: '0.25rem 0.75rem',
          borderRadius: 4,
          border: 'none',
          cursor: 'pointer',
          fontWeight: 'bold',
          fontSize: '0.8rem',
          color: '#fff',
          backgroundColor: enabled ? '#00ff88' : '#ff4466',
        }}
      >
        {enabled ? 'ON' : 'OFF'}
      </button>
      <span className={`seg-status ${statusClass}`} style={{ fontSize: '0.8rem', opacity: 0.8 }}>
        {statusText}
      </span>
    </div>
  )
}

export default SegmentationToggle
