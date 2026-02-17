import { useRef, useCallback, useState } from 'react'
import type { TrajectoryPoint, CameraPose, ImuData } from '../types'
import { computeGravityRotation, rotateVector, rescaleIfNeeded } from '../utils/trajectory'

const MAX_POINTS = 10000

interface TrajectoryState {
  points: TrajectoryPoint[]
  scale: number
  offset: { x: number; y: number }
  currentPosition: TrajectoryPoint | null
  addPosition: (cameraPose: CameraPose, imu?: ImuData) => void
  clear: () => void
}

/**
 * Custom hook for managing camera trajectory state.
 *
 * Extracts position from camera_pose.position, applies a gravity-based
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
    (cameraPose: CameraPose, imu?: ImuData) => {
      const { x: rawX, y: rawY, z: rawZ } = cameraPose.position

      // Compute gravity rotation once (on first valid gravity reading)
      if (!rotationRef.current && imu?.gravity) {
        rotationRef.current = computeGravityRotation(imu.gravity)
      }

      let projX = rawX
      let projY = rawZ // default: use XZ plane

      if (rotationRef.current) {
        const rotated = rotateVector([rawX, rawY, rawZ], rotationRef.current)
        if (rotated) {
          projX = rotated[0]
          projY = rotated[1]
        }
      }

      const newPoint: TrajectoryPoint = { x: projX, y: projY }

      pointsRef.current.push(newPoint)

      if (pointsRef.current.length > MAX_POINTS) {
        pointsRef.current.shift()
      }

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

  return { points, scale, offset, currentPosition, addPosition, clear }
}
