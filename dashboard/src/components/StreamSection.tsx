import { useDashboard } from '../context/DashboardContext'
import StreamViewer from './StreamViewer'
import CameraMatrices from './CameraMatrices'
import MotionChart from './MotionChart'
import InfoCards from './InfoCards'
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

const StreamSection = () => {
  const { latestFrame } = useDashboard()

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
          imageData={latestFrame?.rgb_frame}
          imageFormat="jpeg"
          placeholderIcon={'🎥'}
          placeholderText="Waiting for RGB frames..."
        />

        <StreamViewer
          title="Depth Map"
          badge="DEPTH"
          imageData={latestFrame?.depth_frame}
          imageFormat="png"
          placeholderIcon={'🌊'}
          placeholderText="Waiting for depth frames..."
        />
      </div>

      {/* Camera pose + intrinsics */}
      <div style={{ marginBottom: '1.5rem' }}>
        <CameraMatrices />
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

      {/* Info cards */}
      <div style={{ marginBottom: '1.5rem' }}>
        <InfoCards />
      </div>

      {/* Trajectory */}
      <TrajectoryCanvas />
    </section>
  )
}

export default StreamSection
