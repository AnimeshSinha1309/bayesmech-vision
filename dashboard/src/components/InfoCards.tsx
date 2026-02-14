import React from 'react'
import { useDashboard } from '../context/DashboardContext'
import InfoCard from './InfoCard'

const InfoCards: React.FC = () => {
  const { frameCount, fps, latestFrame } = useDashboard()

  const resolution = latestFrame?.resolution
    ? `${latestFrame.resolution.width}x${latestFrame.resolution.height}`
    : 'N/A'

  const trackingStateLabels: Record<number, string> = {
    0: 'Not Available',
    1: 'Limited',
    2: 'Normal',
    3: 'Extended',
  }

  const trackingState = latestFrame?.tracking_state !== undefined
    ? trackingStateLabels[latestFrame.tracking_state] ?? `State ${latestFrame.tracking_state}`
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
      <InfoCard value={resolution} label="Resolution" />
      <InfoCard value={trackingState} label="Tracking State" />
    </div>
  )
}

export default InfoCards
