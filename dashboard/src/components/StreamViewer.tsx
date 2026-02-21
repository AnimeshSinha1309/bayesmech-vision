import React from 'react'

interface StreamViewerProps {
  title: string
  badge: string
  blobUrl?: string
  placeholderIcon: string
  placeholderText: string
  headerExtra?: React.ReactNode
}

const StreamViewer: React.FC<StreamViewerProps> = ({
  title,
  badge,
  blobUrl,
  placeholderIcon,
  placeholderText,
  headerExtra,
}) => {
  return (
    <div className="stream-card">
      <div className="stream-header">
        <span className="stream-title">{title}</span>
        <span className="stream-badge">{badge}</span>
        {headerExtra && <div className="stream-header-extra">{headerExtra}</div>}
      </div>
      <div
        className="stream-viewer"
        style={{
          aspectRatio: '16 / 9',
          backgroundColor: '#000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 4,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {blobUrl ? (
          <img
            src={blobUrl}
            alt={title}
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        ) : (
          <div className="no-stream" style={{ textAlign: 'center', opacity: 0.5 }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{placeholderIcon}</div>
            <div>{placeholderText}</div>
          </div>
        )}
      </div>
    </div>
  )
}

export default StreamViewer
