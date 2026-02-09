import React from 'react'
import type { ClientInfo } from '../types'

interface ClientCardProps {
  client: ClientInfo
  isActive: boolean
  onSelect: () => void
}

const ClientCard: React.FC<ClientCardProps> = ({ client, isActive, onSelect }) => {
  const depthPct = client.depth_percentage
  let depthColor = '#ff4466'
  if (depthPct > 80) {
    depthColor = '#00ff88'
  } else if (depthPct > 50) {
    depthColor = '#ffaa00'
  }

  return (
    <div
      className={`client-card${isActive ? ' active' : ''}`}
      onClick={onSelect}
      style={{
        cursor: 'pointer',
        border: isActive ? '2px solid var(--accent)' : '2px solid transparent',
        backgroundColor: isActive ? 'rgba(0, 212, 255, 0.08)' : undefined,
        borderRadius: 8,
        padding: '1rem',
        transition: 'border-color 0.2s, background-color 0.2s',
      }}
    >
      <div className="client-id" style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
        {client.client_id}
      </div>
      <div className="client-stats" style={{ fontSize: '0.85rem', lineHeight: 1.8 }}>
        <div>Frames: <strong>{client.frame_count}</strong></div>
        <div>FPS: <strong>{client.current_fps.toFixed(1)}</strong></div>
        <div>
          Buffer: <strong>{client.buffer_size}/{client.max_buffer_size}</strong>
        </div>
        <div>
          Depth:{' '}
          <strong style={{ color: depthColor }}>
            {depthPct.toFixed(1)}%
          </strong>
        </div>
        <div>Seg Sent: <strong>{client.seg_requests_sent}</strong></div>
        <div>Seg Recv: <strong>{client.seg_outputs_received}</strong></div>
      </div>
    </div>
  )
}

export default ClientCard
