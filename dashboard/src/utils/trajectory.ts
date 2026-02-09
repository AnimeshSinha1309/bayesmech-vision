import type { Vec3, TrajectoryPoint } from '../types'

/**
 * Computes a 3x3 rotation matrix (as a flat 9-element array, row-major) that
 * aligns the given gravity vector with the -Z axis.  Uses Rodrigues' rotation
 * formula.
 *
 * Returns null when the input is invalid (zero-length vector).
 */
export function computeGravityRotation(gravity: Vec3): number[] | null {
  const gx = gravity.x
  const gy = gravity.y
  const gz = gravity.z

  const len = Math.sqrt(gx * gx + gy * gy + gz * gz)
  if (len < 1e-9) return null

  // Normalised gravity direction
  const nx = gx / len
  const ny = gy / len
  const nz = gz / len

  // We want to rotate the gravity direction onto -Z = (0, 0, -1).
  // Target direction
  const tx = 0
  const ty = 0
  const tz = -1

  // Dot product  (cos of angle between n and t)
  const dot = nx * tx + ny * ty + nz * tz

  // If gravity is already aligned with -Z (or very close), return identity
  if (dot > 1 - 1e-9) {
    return [1, 0, 0, 0, 1, 0, 0, 0, 1]
  }

  // If gravity is exactly opposite to -Z (pointing +Z), pick an arbitrary perpendicular axis
  if (dot < -1 + 1e-9) {
    // 180-degree rotation about X axis
    return [1, 0, 0, 0, -1, 0, 0, 0, -1]
  }

  // Cross product  k = n x t  (rotation axis)
  let kx = ny * tz - nz * ty
  let ky = nz * tx - nx * tz
  let kz = nx * ty - ny * tx

  // Normalise the rotation axis
  const kLen = Math.sqrt(kx * kx + ky * ky + kz * kz)
  kx /= kLen
  ky /= kLen
  kz /= kLen

  const cosA = dot
  const sinA = kLen // |n x t| = sin(angle)  since both n,t are unit vectors

  // Rodrigues' formula:  R = I * cos(a) + (1 - cos(a)) * (k kT) + sin(a) * [k]x
  // where [k]x is the skew-symmetric cross-product matrix of k.

  const oneMinusCos = 1 - cosA

  // Row-major 3x3
  const r00 = cosA + kx * kx * oneMinusCos
  const r01 = kx * ky * oneMinusCos - kz * sinA
  const r02 = kx * kz * oneMinusCos + ky * sinA

  const r10 = ky * kx * oneMinusCos + kz * sinA
  const r11 = cosA + ky * ky * oneMinusCos
  const r12 = ky * kz * oneMinusCos - kx * sinA

  const r20 = kz * kx * oneMinusCos - ky * sinA
  const r21 = kz * ky * oneMinusCos + kx * sinA
  const r22 = cosA + kz * kz * oneMinusCos

  return [r00, r01, r02, r10, r11, r12, r20, r21, r22]
}

/**
 * Applies a 3x3 rotation matrix (flat 9-element row-major array) to a 3-vector.
 * Returns null if the inputs have incorrect lengths.
 */
export function rotateVector(v: number[], rotation: number[]): number[] | null {
  if (v.length < 3 || rotation.length < 9) return null

  const x = rotation[0] * v[0] + rotation[1] * v[1] + rotation[2] * v[2]
  const y = rotation[3] * v[0] + rotation[4] * v[1] + rotation[5] * v[2]
  const z = rotation[6] * v[0] + rotation[7] * v[1] + rotation[8] * v[2]

  return [x, y, z]
}

/**
 * Recalculates scale and offset so that all trajectory points fit within the
 * canvas with some padding.
 */
export function rescaleIfNeeded(
  points: TrajectoryPoint[],
  canvasWidth: number,
  canvasHeight: number,
  _currentScale: number
): { scale: number; offsetX: number; offsetY: number } {
  if (points.length === 0) {
    return { scale: 1, offsetX: canvasWidth / 2, offsetY: canvasHeight / 2 }
  }

  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity

  for (const p of points) {
    if (p.x < minX) minX = p.x
    if (p.x > maxX) maxX = p.x
    if (p.y < minY) minY = p.y
    if (p.y > maxY) maxY = p.y
  }

  const rangeX = maxX - minX || 1
  const rangeY = maxY - minY || 1

  const padding = 0.15 // 15% padding on each side
  const usableWidth = canvasWidth * (1 - 2 * padding)
  const usableHeight = canvasHeight * (1 - 2 * padding)

  const scaleX = usableWidth / rangeX
  const scaleY = usableHeight / rangeY
  const scale = Math.min(scaleX, scaleY)

  const centerX = (minX + maxX) / 2
  const centerY = (minY + maxY) / 2

  const offsetX = canvasWidth / 2 - centerX * scale
  const offsetY = canvasHeight / 2 - centerY * scale

  return { scale, offsetX, offsetY }
}

/**
 * Draws the full trajectory visualisation on a 2D canvas context.
 * Includes: background grid, crosshair, path with gradient opacity,
 * start marker (green), end marker (red), and current-position dot.
 */
export function drawTrajectory(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  points: TrajectoryPoint[],
  scale: number,
  offset: { x: number; y: number }
): void {
  const w = canvas.width
  const h = canvas.height

  // Clear canvas
  ctx.clearRect(0, 0, w, h)

  // --- Background ---
  ctx.fillStyle = '#1a1a2e'
  ctx.fillRect(0, 0, w, h)

  // --- Grid ---
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)'
  ctx.lineWidth = 1

  const gridSpacing = 50
  for (let x = 0; x < w; x += gridSpacing) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, h)
    ctx.stroke()
  }
  for (let y = 0; y < h; y += gridSpacing) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(w, y)
    ctx.stroke()
  }

  // --- Crosshair at origin ---
  const originX = offset.x
  const originY = offset.y

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
  ctx.lineWidth = 1
  ctx.setLineDash([5, 5])

  ctx.beginPath()
  ctx.moveTo(originX, 0)
  ctx.lineTo(originX, h)
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(0, originY)
  ctx.lineTo(w, originY)
  ctx.stroke()

  ctx.setLineDash([])

  if (points.length === 0) return

  // Helper: project a trajectory point to canvas coordinates
  const toCanvas = (p: TrajectoryPoint) => ({
    cx: p.x * scale + offset.x,
    cy: p.y * scale + offset.y,
  })

  // --- Path with gradient opacity ---
  const totalPoints = points.length
  if (totalPoints >= 2) {
    for (let i = 1; i < totalPoints; i++) {
      const alpha = 0.2 + 0.8 * (i / (totalPoints - 1)) // fade from 0.2 to 1.0
      const prev = toCanvas(points[i - 1])
      const curr = toCanvas(points[i])

      ctx.strokeStyle = `rgba(0, 200, 255, ${alpha})`
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(prev.cx, prev.cy)
      ctx.lineTo(curr.cx, curr.cy)
      ctx.stroke()
    }
  }

  // --- Gradient opacity dots along the path ---
  for (let i = 0; i < totalPoints; i++) {
    const alpha = 0.1 + 0.9 * (i / Math.max(totalPoints - 1, 1))
    const { cx, cy } = toCanvas(points[i])

    ctx.fillStyle = `rgba(0, 200, 255, ${alpha})`
    ctx.beginPath()
    ctx.arc(cx, cy, 2, 0, Math.PI * 2)
    ctx.fill()
  }

  // --- Start marker (green) ---
  const start = toCanvas(points[0])
  ctx.fillStyle = '#00ff88'
  ctx.beginPath()
  ctx.arc(start.cx, start.cy, 6, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#fff'
  ctx.font = '10px monospace'
  ctx.fillText('START', start.cx + 10, start.cy - 6)

  // --- End marker / current position (red) ---
  const end = toCanvas(points[totalPoints - 1])
  ctx.fillStyle = '#ff4444'
  ctx.beginPath()
  ctx.arc(end.cx, end.cy, 6, 0, Math.PI * 2)
  ctx.fill()

  // Pulsing ring effect for current position
  ctx.strokeStyle = 'rgba(255, 68, 68, 0.5)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(end.cx, end.cy, 10, 0, Math.PI * 2)
  ctx.stroke()

  ctx.fillStyle = '#fff'
  ctx.font = '10px monospace'
  ctx.fillText('NOW', end.cx + 14, end.cy - 6)
}
