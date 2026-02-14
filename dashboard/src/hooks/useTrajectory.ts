import { useRef, useCallback, useState } from 'react'
import type { TrajectoryPoint, CameraData, MotionData } from '../types'
import { computeGravityRotation, rotateVector, rescaleIfNeeded } from '../utils/trajectory'

const MAX_POINTS = 10000

interface TrajectoryState {
  points: TrajectoryPoint[]
  scale: number
  offset: { x: number; y: number }
  currentPosition: TrajectoryPoint | null
  addPosition: (camera: CameraData, motion: MotionData) => void
  clear: () => void
}

/**
 * Custom hook for managing camera trajectory state.
 *
 * Extracts position from the camera pose matrix, applies a gravity-based
 * rotation so the trajectory is shown in a gravity-aligned top-down view,
 * and auto-scales to fit the canvas.
 */
export function useTrajectory(
  canvasWidth = 400,
  canvasHeight = 400
): TrajectoryState {
  const [points, setPoints] = useState<TrajectoryPoint[]>([])
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [currentPosition, setCurrentPosition] = useState<TrajectoryPoint | null>(null)

  const rotationRef = useRef<number[] | null>(null)
  const scaleRef = useRef(1)
  const pointsRef = useRef<TrajectoryPoint[]>([])

  const addPosition = useCallback(
    (camera: CameraData, motion: MotionData) => {
      if (!camera.pose_matrix || camera.pose_matrix.length < 15) return

      // Extract translation from the pose matrix (column-major indices 12, 13, 14)
      const rawX = camera.pose_matrix[12]
      const rawY = camera.pose_matrix[13]
      const rawZ = camera.pose_matrix[14]

      // Compute gravity rotation once (on first valid gravity reading)
      if (!rotationRef.current && motion.gravity) {
        rotationRef.current = computeGravityRotation(motion.gravity)
      }

      let projX = rawX
      let projY = rawZ // default: use XZ plane

      if (rotationRef.current) {
        const rotated = rotateVector([rawX, rawY, rawZ], rotationRef.current)
        if (rotated) {
          // After gravity alignment, X and Y form the horizontal plane
          projX = rotated[0]
          projY = rotated[1]
        }
      }

      const newPoint: TrajectoryPoint = { x: projX, y: projY }

      pointsRef.current.push(newPoint)

      // Enforce max points
      if (pointsRef.current.length > MAX_POINTS) {
        pointsRef.current.shift()
      }

      // Rescale periodically (every 20 points or first point)
      if (pointsRef.current.length === 1 || pointsRef.current.length % 20 === 0) {
        const { scale: newScale, offsetX, offsetY } = rescaleIfNeeded(
          pointsRef.current,
          canvasWidth,
          canvasHeight,
          scaleRef.current
        )
        scaleRef.current = newScale
        setScale(newScale)
        setOffset({ x: offsetX, y: offsetY })
      }

      setCurrentPosition(newPoint)
      setPoints([...pointsRef.current])
    },
    [canvasWidth, canvasHeight]
  )

  const clear = useCallback(() => {
    pointsRef.current = []
    rotationRef.current = null
    scaleRef.current = 1
    setPoints([])
    setScale(1)
    setOffset({ x: canvasWidth / 2, y: canvasHeight / 2 })
    setCurrentPosition(null)
  }, [canvasWidth, canvasHeight])

  return {
    points,
    scale,
    offset,
    currentPosition,
    addPosition,
    clear,
  }
}
