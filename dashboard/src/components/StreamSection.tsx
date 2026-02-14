import { useDashboard } from '../context/DashboardContext'
import StreamViewer from './StreamViewer'
import SegmentationToggle from './SegmentationToggle'
import CameraMatrices from './CameraMatrices'
import MotionChart from './MotionChart'
import InfoCards from './InfoCards'
import TrajectoryCanvas from './TrajectoryCanvas'
import type { MotionData } from '../types'

const XYZ = ['X', 'Y', 'Z']
const XYZW = ['X', 'Y', 'Z', 'W']

const SENSOR_CHARTS: {
  field: keyof MotionData
  title: string
  yAxisLabel: string
  axisLabels: string[]
  yMin?: number
  yMax?: number
}[] = [
  { field: 'linear_acceleration', title: 'Linear Acceleration', yAxisLabel: 'm/s\u00B2', axisLabels: XYZ },
  { field: 'linear_velocity_pose', title: 'Linear Velocity - Pose', yAxisLabel: 'm/s', axisLabels: XYZ },
  { field: 'linear_velocity_accel', title: 'Linear Velocity - Accel', yAxisLabel: 'm/s', axisLabels: XYZ },
  { field: 'angular_velocity', title: 'Angular Velocity', yAxisLabel: 'rad/s', axisLabels: XYZ },
  { field: 'gravity', title: 'Gravity', yAxisLabel: 'm/s\u00B2', axisLabels: XYZ },
  { field: 'orientation', title: 'Orientation (Quaternion)', yAxisLabel: 'Quaternion', axisLabels: XYZW, yMin: -1, yMax: 1 },
]

const StreamSection = () => {
  const {
    selectedClientId,
    latestFrame,
    segmentationEnabled,
    segmentationMaskCount,
    toggleSegmentation,
  } = useDashboard()

  if (!selectedClientId) return null

  return (
    <section className="stream-section">
      <h2 className="section-title" style={{ marginBottom: '1rem' }}>
        Streaming: {selectedClientId}
      </h2>

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
          placeholderIcon={'\u{1F3A5}'}
          placeholderText="Waiting for RGB frames..."
        />

        <StreamViewer
          title="Segmentation"
          badge="SEG"
          imageData={latestFrame?.segmentation_frame}
          imageFormat="png"
          placeholderIcon={'\u{1F3AD}'}
          placeholderText="Waiting for segmentation..."
          headerExtra={
            <SegmentationToggle
              enabled={segmentationEnabled}
              maskCount={segmentationMaskCount}
              onToggle={toggleSegmentation}
            />
          }
        />

        <StreamViewer
          title="Depth Map"
          badge="DEPTH"
          imageData={latestFrame?.depth_frame}
          imageFormat="jpeg"
          placeholderIcon={'\u{1F30A}'}
          placeholderText="Waiting for depth frames..."
        />
      </div>

      {/* Camera matrices */}
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
