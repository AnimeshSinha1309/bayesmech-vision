import { useDashboard } from '../context/DashboardContext'
import StreamViewer from './StreamViewer'
import PlaybackControls from './PlaybackControls'
import MotionChart from './MotionChart'
import InfoCard from './InfoCard'
import CoveragePanel from './CoveragePanel'
import TrajectoryCanvas from './TrajectoryCanvas'
import type { ImuData } from '../types'

const XYZ = ['X', 'Y', 'Z']

const SENSOR_CHARTS: {
  field: keyof ImuData
  title: string
  yAxisLabel: string
  axisLabels: string[]
}[] = [
  { field: 'linear_acceleration', title: 'Linear Acceleration', yAxisLabel: 'm/s²', axisLabels: XYZ },
  { field: 'angular_velocity', title: 'Angular Velocity', yAxisLabel: 'rad/s', axisLabels: XYZ },
  { field: 'gravity', title: 'Gravity', yAxisLabel: 'm/s²', axisLabels: XYZ },
  { field: 'magnetic_field', title: 'Magnetic Field', yAxisLabel: 'µT', axisLabels: XYZ },
]

const DashboardPage = () => {
  const { latestFrame, latestSegBlobUrl, frameCount, fps } = useDashboard()

  const source = latestFrame?.source ?? 'none'
  const deviceId = latestFrame?.device_id
    ? latestFrame.device_id.slice(0, 8)
    : 'N/A'

  return (
    <section className="stream-section">
      {/* Video streams */}
      <div
        className="streams-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <StreamViewer
          title="RGB Stream"
          badge="RGB"
          blobUrl={latestFrame?.rgbBlobUrl}
          placeholderIcon={'🎥'}
          placeholderText="Waiting for RGB frames..."
        />

        <StreamViewer
          title="Depth Map"
          badge="DEPTH"
          blobUrl={latestFrame?.depthBlobUrl}
          placeholderIcon={'🌊'}
          placeholderText="Waiting for depth frames..."
        />

        <StreamViewer
          title="Segmentation"
          badge="SEG"
          blobUrl={latestSegBlobUrl ?? undefined}
          placeholderIcon={'🧩'}
          placeholderText="Waiting for segmentation masks..."
        />
      </div>

      {/* Playback controls */}
      <PlaybackControls />

      {/* Info cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <InfoCard value={frameCount} label="Frames Received" />
        <InfoCard value={fps.toFixed(1)} label="FPS" />
        <InfoCard value={source} label="Source" />
        <InfoCard value={deviceId} label="Device ID" />
      </div>

      {/* Signal coverage */}
      <div style={{ marginBottom: '1.5rem' }}>
        <CoveragePanel />
      </div>

      {/* Sensor charts */}
      <h3 className="section-title" style={{ marginBottom: '1rem' }}>Sensor Data</h3>
      <div
        className="sensor-charts-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        {SENSOR_CHARTS.map((chart) => (
          <MotionChart key={chart.field} {...chart} />
        ))}
      </div>

      {/* Trajectory */}
      <TrajectoryCanvas />
    </section>
  )
}

export default DashboardPage
