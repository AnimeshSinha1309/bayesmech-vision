import React from 'react'
import { useDashboard } from '../context/DashboardContext'
import InfoCard from './InfoCard'

const InfoCards: React.FC = () => {
  const { frameCount, fps, latestFrame } = useDashboard()

  const source = latestFrame?.source ?? 'none'
  const deviceId = latestFrame?.device_id
    ? latestFrame.device_id.slice(0, 8)
    : 'N/A'

  return (
    <div
      className="info-cards-grid"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
        gap: '1rem',
      }}
    >
      <InfoCard value={frameCount} label="Frames Received" />
      <InfoCard value={fps.toFixed(1)} label="FPS" />
      <InfoCard value={source} label="Source" />
      <InfoCard value={deviceId} label="Device ID" />
    </div>
  )
}

export default InfoCards
