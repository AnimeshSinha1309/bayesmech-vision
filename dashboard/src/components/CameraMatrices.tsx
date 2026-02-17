import { useDashboard } from '../context/DashboardContext'

const fmt = (n: number) => n.toFixed(4)

const CameraMatrices = () => {
  const { latestFrame } = useDashboard()
  const pose = latestFrame?.camera_pose
  const intr = latestFrame?.camera_intrinsics

  if (!pose && !intr) return null

  return (
    <div className="camera-matrices-section">
      <h3 className="section-title" style={{ marginBottom: '1rem' }}>Camera Data</h3>
      <div
        className="matrix-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '1rem',
        }}
      >
        {pose && (
          <div className="matrix-item">
            <div className="matrix-name">Camera Pose</div>
            <pre className="matrix-content">{[
              `position:`,
              `  x: ${fmt(pose.position.x)}`,
              `  y: ${fmt(pose.position.y)}`,
              `  z: ${fmt(pose.position.z)}`,
              `rotation:`,
              `  x: ${fmt(pose.rotation.x)}`,
              `  y: ${fmt(pose.rotation.y)}`,
              `  z: ${fmt(pose.rotation.z)}`,
              `  w: ${fmt(pose.rotation.w)}`,
            ].join('\n')}</pre>
          </div>
        )}
        {intr && (
          <div className="matrix-item">
            <div className="matrix-name">Camera Intrinsics</div>
            <pre className="matrix-content">{[
              `fx: ${fmt(intr.fx)}   fy: ${fmt(intr.fy)}`,
              `cx: ${fmt(intr.cx)}   cy: ${fmt(intr.cy)}`,
              `image: ${intr.image_width}×${intr.image_height}`,
              `depth: ${intr.depth_width}×${intr.depth_height}`,
            ].join('\n')}</pre>
          </div>
        )}
      </div>
    </div>
  )
}

export default CameraMatrices
