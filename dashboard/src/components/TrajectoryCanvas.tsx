import React, { useRef, useEffect } from 'react'
import { useDashboard } from '../context/DashboardContext'
import { useTrajectory } from '../hooks/useTrajectory'
import { drawTrajectory } from '../utils/trajectory'

const CANVAS_WIDTH = 800
const CANVAS_HEIGHT = 600

const TrajectoryCanvas: React.FC = () => {
  const { latestFrame } = useDashboard()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const trajectory = useTrajectory(CANVAS_WIDTH, CANVAS_HEIGHT)

  // Add position when new frame arrives with camera + motion data
  useEffect(() => {
    if (!latestFrame?.camera || !latestFrame?.motion) return
    trajectory.addPosition(latestFrame.camera, latestFrame.motion)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latestFrame])

  // Redraw trajectory when state changes
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    drawTrajectory(ctx, canvas, trajectory.points, trajectory.scale, trajectory.offset)
  }, [trajectory.points, trajectory.scale, trajectory.offset])

  const currentPos = trajectory.currentPosition

  return (
    <div className="stream-card">
      <div className="stream-header">
        <span className="stream-title">Camera Trajectory</span>
        <button
          className="theme-toggle"
          onClick={trajectory.clear}
          style={{ marginLeft: 'auto', fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
        >
          Clear
        </button>
      </div>
      <div style={{ padding: '0.5rem' }}>
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          style={{ width: '100%', height: 'auto', borderRadius: 4 }}
        />
        <div
          className="trajectory-info"
          style={{
            display: 'flex',
            gap: '1.5rem',
            fontSize: '0.8rem',
            opacity: 0.7,
            marginTop: '0.5rem',
            fontFamily: 'monospace',
          }}
        >
          <span>
            Position: {currentPos ? `(${currentPos.x.toFixed(3)}, ${currentPos.y.toFixed(3)})` : 'N/A'}
          </span>
          <span>Points: {trajectory.points.length}</span>
          <span>Scale: {trajectory.scale.toFixed(2)}</span>
        </div>
      </div>
    </div>
  )
}

export default TrajectoryCanvas
