import { useDashboard } from '../context/DashboardContext'
import { formatMatrix } from '../utils/matrix'

interface MatrixConfig {
  key: string
  name: string
  field: 'pose_matrix' | 'view_matrix' | 'projection_matrix' | 'intrinsic_matrix'
  rows: number
  cols: number
}

const MATRICES: MatrixConfig[] = [
  { key: 'pose', name: 'Pose Matrix', field: 'pose_matrix', rows: 4, cols: 4 },
  { key: 'view', name: 'View Matrix', field: 'view_matrix', rows: 4, cols: 4 },
  { key: 'projection', name: 'Projection Matrix', field: 'projection_matrix', rows: 4, cols: 4 },
  { key: 'intrinsic', name: 'Intrinsic Matrix', field: 'intrinsic_matrix', rows: 3, cols: 3 },
]

const CameraMatrices = () => {
  const { latestFrame } = useDashboard()
  const camera = latestFrame?.camera

  if (!camera) return null

  const availableMatrices = MATRICES.filter((m) => camera[m.field] && camera[m.field]!.length > 0)

  if (availableMatrices.length === 0) return null

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
        {availableMatrices.map((m) => (
          <div key={m.key} className="matrix-item">
            <div className="matrix-name">{m.name}</div>
            <pre className="matrix-content">{formatMatrix(camera[m.field]!, m.rows, m.cols)}</pre>
          </div>
        ))}
      </div>
    </div>
  )
}

export default CameraMatrices
