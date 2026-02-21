import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import type {
  ConnectionStatus, DecodedFrame, DecodedAnnotation, CoverageStats,
  CameraPose, CameraIntrinsics, ImuData, InferredGeometry, Vec3,
} from '../types'
import { dashboardWs } from '../services/websocket'
import { bytesToBlobUrl, maskToBlobUrl } from '../services/proto'
import { bayesmech } from '../proto/bundle'

// =====================================================================
// Proto decoding
// =====================================================================

const ImageFormat = bayesmech.vision.ImageFrame.ImageFormat

const DepthFormat = bayesmech.vision.DepthFrame.DepthFormat

class FrameDecoder {
  private cachedIntrinsics: CameraIntrinsics | null = null
  private depthLogCount = 0

  /** Try to recover width×height from pixel count by testing common aspect ratios. */
  private static inferDepthDimensions(numPixels: number): [number, number] | null {
    for (const [wr, hr] of [[16, 9], [4, 3], [1, 1]] as [number, number][]) {
      const h = Math.round(Math.sqrt(numPixels * hr / wr))
      if (h > 0 && numPixels % h === 0) {
        const w = numPixels / h
        if (w > 0) return [w, h]
      }
    }
    return null
  }

  private static vec3(v: bayesmech.vision.IVector3 | null | undefined): Vec3 | undefined {
    if (!v) return undefined
    return { x: v.x ?? 0, y: v.y ?? 0, z: v.z ?? 0 }
  }

  /**
   * Convert raw depth bytes to a grayscale data URL (closer = brighter).
   * Uses a regular HTMLCanvasElement so toDataURL() can be called synchronously.
   */
  private decodeDepthToDataUrl(
    data: Uint8Array,
    format: number,
    width: number,
    height: number,
  ): string | null {
    const bytesPerPixel = format === DepthFormat.FLOAT32_METERS ? 4 : 2
    if (data.length < width * height * bytesPerPixel) return null

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    const imageData = ctx.createImageData(width, height)
    const px = imageData.data
    const view = new DataView(data.buffer, data.byteOffset, data.byteLength)
    const n = width * height
    let lo = Infinity, hi = 0

    if (format === DepthFormat.FLOAT32_METERS) {
      for (let i = 0; i < n; i++) {
        const d = view.getFloat32(i * 4, true)
        if (d > 0 && isFinite(d)) { if (d < lo) lo = d; if (d > hi) hi = d }
      }
      const range = hi - lo || 1
      for (let i = 0; i < n; i++) {
        const d = view.getFloat32(i * 4, true)
        const v = (d > 0 && isFinite(d)) ? Math.round((1 - (d - lo) / range) * 255) : 0
        px[i * 4] = v; px[i * 4 + 1] = v; px[i * 4 + 2] = v; px[i * 4 + 3] = 255
      }
    } else {
      // UINT16_MILLIMETERS, little-endian
      for (let i = 0; i < n; i++) {
        const d = view.getUint16(i * 2, true)
        if (d > 0) { if (d < lo) lo = d; if (d > hi) hi = d }
      }
      const range = hi - lo || 1
      for (let i = 0; i < n; i++) {
        const d = view.getUint16(i * 2, true)
        const v = d === 0 ? 0 : Math.round((1 - (d - lo) / range) * 255)
        px[i * 4] = v; px[i * 4 + 1] = v; px[i * 4 + 2] = v; px[i * 4 + 3] = 255
      }
    }

    ctx.putImageData(imageData, 0, 0)
    return canvas.toDataURL('image/png')
  }

  decodeFrame(proto: bayesmech.vision.PerceiverDataFrame): DecodedFrame {
    const id = proto.frameIdentifier
    const frame: DecodedFrame = {
      source: 'file',
      device_id: id?.deviceId ?? '',
      timestamp_ns: Number(id?.timestampNs ?? 0),
      frame_number: id?.frameNumber ?? 0,
    }

    // Intrinsics first — depth decoding needs depth_width / depth_height
    const intr = proto.cameraIntrinsics
    if (intr) {
      this.cachedIntrinsics = {
        fx: intr.fx ?? 0, fy: intr.fy ?? 0,
        cx: intr.cx ?? 0, cy: intr.cy ?? 0,
        image_width: intr.imageWidth ?? 0, image_height: intr.imageHeight ?? 0,
        depth_width: intr.depthWidth ?? 0, depth_height: intr.depthHeight ?? 0,
      }
    }
    if (this.cachedIntrinsics) {
      frame.camera_intrinsics = this.cachedIntrinsics
    }

    const rgb = proto.rgbFrame
    if (rgb?.data && rgb.data.length > 0) {
      const mime = rgb.format === ImageFormat.JPEG ? 'image/jpeg' : 'image/png'
      frame.rgbBlobUrl = bytesToBlobUrl(rgb.data as Uint8Array, mime)
    }

    const depth = proto.depthFrame
    frame.hasDepthData = (depth?.data?.length ?? 0) > 0
    if (frame.hasDepthData && depth?.data) {
      this.depthLogCount++

      const bytesPerPixel = depth.format === DepthFormat.FLOAT32_METERS ? 4 : 2
      let dw = Math.round(this.cachedIntrinsics?.depth_width ?? 0)
      let dh = Math.round(this.cachedIntrinsics?.depth_height ?? 0)
      const dimSource = (dw > 0 && dh > 0) ? 'intrinsics' : (() => {
        const dims = FrameDecoder.inferDepthDimensions((depth.data as Uint8Array).length / bytesPerPixel)
        if (dims) { [dw, dh] = dims }
        return dims ? 'inferred' : 'unknown'
      })()

      if (this.depthLogCount === 1 || this.depthLogCount % 100 === 0) {
        console.log(
          `[FrameDecoder] depth #${this.depthLogCount}:`,
          `${(depth.data as Uint8Array).length} bytes,`,
          `format=${depth.format === DepthFormat.FLOAT32_METERS ? 'FLOAT32_METERS' : 'UINT16_MM'},`,
          `dims ${dw}×${dh} (${dimSource})`,
        )
      }

      if (dw > 0 && dh > 0) {
        const dataUrl = this.decodeDepthToDataUrl(depth.data as Uint8Array, depth.format, dw, dh)
        if (dataUrl) frame.depthBlobUrl = dataUrl
      }
    }

    const pose = proto.cameraPose
    if (pose) {
      frame.camera_pose = {
        position: { x: pose.position?.x ?? 0, y: pose.position?.y ?? 0, z: pose.position?.z ?? 0 },
        rotation: { x: pose.rotation?.x ?? 0, y: pose.rotation?.y ?? 0, z: pose.rotation?.z ?? 0, w: pose.rotation?.w ?? 0 },
      } as CameraPose
    }

    const imu = proto.imuData
    if (imu) {
      frame.imu = {
        angular_velocity: FrameDecoder.vec3(imu.angularVelocity),
        linear_acceleration: FrameDecoder.vec3(imu.linearAcceleration),
        gravity: FrameDecoder.vec3(imu.gravity),
        magnetic_field: FrameDecoder.vec3(imu.magneticField),
      } as ImuData
    }

    const geom = proto.inferredGeometry
    if (geom) {
      frame.inferred_geometry = {
        plane_count: geom.planes?.length ?? 0,
        point_cloud_count: geom.pointCloud?.length ?? 0,
      } as InferredGeometry
    }

    return frame
  }

  decodeAnnotation(proto: bayesmech.vision.SegmentationResponse): DecodedAnnotation | null {
    const frameNumber = proto.frameIdentifier?.frameNumber ?? 0
    const firstMask = proto.masks?.[0]
    if (!firstMask?.maskData || firstMask.maskData.length === 0) return null
    return { frameNumber, blobUrl: maskToBlobUrl(firstMask.maskData as Uint8Array) }
  }
}

// =====================================================================
// Frame buffer — ring buffer keyed by frame_number
// =====================================================================

const FRAME_BUFFER_CAPACITY = 500

class FrameBuffer {
  private frames = new Map<number, DecodedFrame>()
  private insertionOrder: number[] = []
  readonly capacity: number

  constructor(capacity = FRAME_BUFFER_CAPACITY) {
    this.capacity = capacity
  }

  push(frame: DecodedFrame): void {
    const key = frame.frame_number
    if (this.frames.has(key)) {
      const old = this.frames.get(key)!
      if (old.rgbBlobUrl) URL.revokeObjectURL(old.rgbBlobUrl)
      if (old.depthBlobUrl) URL.revokeObjectURL(old.depthBlobUrl)
      this.frames.set(key, frame)
      return
    }
    if (this.insertionOrder.length >= this.capacity) {
      const oldest = this.insertionOrder.shift()!
      const evicted = this.frames.get(oldest)
      if (evicted) {
        if (evicted.rgbBlobUrl) URL.revokeObjectURL(evicted.rgbBlobUrl)
        if (evicted.depthBlobUrl) URL.revokeObjectURL(evicted.depthBlobUrl)
        this.frames.delete(oldest)
      }
    }
    this.insertionOrder.push(key)
    this.frames.set(key, frame)
  }

  get(frameNumber: number): DecodedFrame | null {
    return this.frames.get(frameNumber) ?? null
  }

  has(frameNumber: number): boolean {
    return this.frames.has(frameNumber)
  }

  latest(): DecodedFrame | null {
    if (this.insertionOrder.length === 0) return null
    return this.frames.get(this.insertionOrder[this.insertionOrder.length - 1]) ?? null
  }

  destroy(): void {
    for (const frame of this.frames.values()) {
      if (frame.rgbBlobUrl) URL.revokeObjectURL(frame.rgbBlobUrl)
      if (frame.depthBlobUrl) URL.revokeObjectURL(frame.depthBlobUrl)
    }
    this.frames.clear()
    this.insertionOrder = []
  }
}

// =====================================================================
// Annotation buffer — ring buffer keyed by frame_number
// =====================================================================

const ANNOTATION_BUFFER_CAPACITY = 200

class AnnotationBuffer {
  private annotations = new Map<number, DecodedAnnotation>()
  private insertionOrder: number[] = []
  readonly capacity: number

  constructor(capacity = ANNOTATION_BUFFER_CAPACITY) {
    this.capacity = capacity
  }

  set(annotation: DecodedAnnotation): void {
    const key = annotation.frameNumber
    if (this.annotations.has(key)) {
      URL.revokeObjectURL(this.annotations.get(key)!.blobUrl)
      this.annotations.set(key, annotation)
      return
    }
    if (this.insertionOrder.length >= this.capacity) {
      const oldest = this.insertionOrder.shift()!
      const evicted = this.annotations.get(oldest)
      if (evicted) {
        URL.revokeObjectURL(evicted.blobUrl)
        this.annotations.delete(oldest)
      }
    }
    this.insertionOrder.push(key)
    this.annotations.set(key, annotation)
  }

  get(frameNumber: number): DecodedAnnotation | null {
    return this.annotations.get(frameNumber) ?? null
  }

  has(frameNumber: number): boolean {
    return this.annotations.has(frameNumber)
  }

  latest(): DecodedAnnotation | null {
    if (this.insertionOrder.length === 0) return null
    return this.annotations.get(this.insertionOrder[this.insertionOrder.length - 1]) ?? null
  }

  destroy(): void {
    for (const annotation of this.annotations.values()) {
      URL.revokeObjectURL(annotation.blobUrl)
    }
    this.annotations.clear()
    this.insertionOrder = []
  }
}

// =====================================================================
// Coverage tracker — rolling window of frame signal presence
// =====================================================================

const COVERAGE_WINDOW = 150   // ~5 s at 30 fps

interface FrameRecord {
  hasDepth: boolean
  hasPose: boolean
  hasAccel: boolean
  hasGyro: boolean
  hasGravity: boolean
  hasMag: boolean
  hasIntrinsics: boolean
  hasGeometry: boolean
}

const ZERO_COVERAGE: CoverageStats = {
  windowSize: 0, depth: 0, pose: 0, linearAccel: 0,
  angularVelocity: 0, gravity: 0, magneticField: 0,
  intrinsicsCount: 0, geometry: 0,
}

class CoverageTracker {
  private records: FrameRecord[] = []
  private totalIntrinsics = 0

  record(frame: DecodedFrame): void {
    const hasIntrinsics = !!frame.camera_intrinsics
    if (hasIntrinsics) this.totalIntrinsics++
    this.records.push({
      hasDepth: frame.hasDepthData ?? false,
      hasPose: !!frame.camera_pose,
      hasAccel: !!frame.imu?.linear_acceleration,
      hasGyro: !!frame.imu?.angular_velocity,
      hasGravity: !!frame.imu?.gravity,
      hasMag: !!frame.imu?.magnetic_field,
      hasIntrinsics,
      hasGeometry:
        (frame.inferred_geometry?.plane_count ?? 0) > 0 ||
        (frame.inferred_geometry?.point_cloud_count ?? 0) > 0,
    })
    if (this.records.length > COVERAGE_WINDOW) this.records.shift()
  }

  getStats(): CoverageStats {
    const n = this.records.length
    if (n === 0) return { ...ZERO_COVERAGE, intrinsicsCount: this.totalIntrinsics }
    const pct = (fn: (r: FrameRecord) => boolean) =>
      Math.round(this.records.filter(fn).length * 100 / n)
    return {
      windowSize: n,
      depth: pct(r => r.hasDepth),
      pose: pct(r => r.hasPose),
      linearAccel: pct(r => r.hasAccel),
      angularVelocity: pct(r => r.hasGyro),
      gravity: pct(r => r.hasGravity),
      magneticField: pct(r => r.hasMag),
      intrinsicsCount: this.totalIntrinsics,
      geometry: pct(r => r.hasGeometry),
    }
  }

  destroy(): void {
    this.records = []
    this.totalIntrinsics = 0
  }
}

// =====================================================================
// Context
// =====================================================================

interface DashboardState {
  connectionStatus: ConnectionStatus
  latestFrame: DecodedFrame | null
  latestSegBlobUrl: string | null
  frameCount: number
  fps: number
  coverageStats: CoverageStats
  // Buffer access
  getFrame: (frameNumber: number) => DecodedFrame | null
  getAnnotation: (frameNumber: number) => DecodedAnnotation | null
  requestFrame: (frameNumber: number) => void
  requestAnnotation: (frameNumber: number) => void
  // Playback
  currentIndex: number
  totalFrames: number
  isPlaying: boolean
  serverFps: number
  play: () => void
  pause: () => void
  seekTo: (index: number) => void
  skipForward: () => void
  skipBackward: () => void
}

const DashboardContext = createContext<DashboardState | undefined>(undefined)

const FPS_WINDOW_SIZE = 10

export const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('Disconnected')
  const [latestFrame, setLatestFrame] = useState<DecodedFrame | null>(null)
  const [latestSegBlobUrl, setLatestSegBlobUrl] = useState<string | null>(null)
  const [frameCount, setFrameCount] = useState(0)
  const [fps, setFps] = useState(0)

  // Playback state
  const [currentIndex, setCurrentIndex] = useState(0)
  const [totalFrames, setTotalFrames] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [serverFps, setServerFps] = useState(30)
  const playIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [coverageStats, setCoverageStats] = useState<CoverageStats>(ZERO_COVERAGE)

  const frameTimestamps = useRef<number[]>([])
  const frameBuffer = useRef(new FrameBuffer())
  const annotationBuffer = useRef(new AnnotationBuffer())
  const decoder = useRef(new FrameDecoder())
  const coverageTracker = useRef(new CoverageTracker())

  const handleFrames = useCallback((frames: bayesmech.vision.PerceiverDataFrame[]) => {
    for (const proto of frames) {
      const frame = decoder.current.decodeFrame(proto)
      frameBuffer.current.push(frame)
      coverageTracker.current.record(frame)
    }
    setLatestFrame(frameBuffer.current.latest())
    setFrameCount((c) => c + frames.length)

    const now = performance.now()
    frameTimestamps.current.push(now)
    if (frameTimestamps.current.length > FPS_WINDOW_SIZE) {
      frameTimestamps.current.shift()
    }
    const ts = frameTimestamps.current
    if (ts.length >= 2) {
      const elapsed = (ts[ts.length - 1] - ts[0]) / 1000
      setFps(Math.round(((ts.length - 1) / elapsed) * 10) / 10)
    }
  }, [])

  const handleAnnotations = useCallback((annotations: bayesmech.vision.SegmentationResponse[]) => {
    for (const proto of annotations) {
      const annotation = decoder.current.decodeAnnotation(proto)
      if (annotation) annotationBuffer.current.set(annotation)
    }
    setLatestSegBlobUrl(annotationBuffer.current.latest()?.blobUrl ?? null)
  }, [])

  const handleStats = useCallback((stats: Record<string, unknown>) => {
    const bf = stats.buffered_frames as number | undefined
    const rfps = stats.recording_fps as number | undefined
    if (bf !== undefined) setTotalFrames(bf)
    if (rfps !== undefined && rfps > 0) setServerFps(rfps)
  }, [])

  const getFrame = useCallback((frameNumber: number): DecodedFrame | null => {
    return frameBuffer.current.get(frameNumber)
  }, [])

  const getAnnotation = useCallback((frameNumber: number): DecodedAnnotation | null => {
    return annotationBuffer.current.get(frameNumber)
  }, [])

  const requestFrame = useCallback((frameNumber: number): void => {
    if (!frameBuffer.current.has(frameNumber)) {
      dashboardWs.seek(frameNumber, frameNumber + 1)
    }
  }, [])

  const requestAnnotation = useCallback((frameNumber: number): void => {
    if (!annotationBuffer.current.has(frameNumber)) {
      dashboardWs.getAnnotationForFrame(frameNumber)
    }
  }, [])

  const seekTo = useCallback((index: number) => {
    const clamped = Math.max(0, Math.min(index, totalFrames - 1))
    setCurrentIndex(clamped)
    dashboardWs.seek(clamped, clamped + 1)
  }, [totalFrames])

  const play = useCallback(() => {
    setIsPlaying(true)
  }, [])

  const pause = useCallback(() => {
    setIsPlaying(false)
    if (playIntervalRef.current) {
      clearInterval(playIntervalRef.current)
      playIntervalRef.current = null
    }
  }, [])

  const skipForward = useCallback(() => {
    const jump = Math.round(10 * serverFps)
    seekTo(currentIndex + jump)
  }, [currentIndex, serverFps, seekTo])

  const skipBackward = useCallback(() => {
    const jump = Math.round(10 * serverFps)
    seekTo(currentIndex - jump)
  }, [currentIndex, serverFps, seekTo])

  // Auto-advance when playing
  useEffect(() => {
    if (isPlaying) {
      playIntervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => {
          const next = prev + 1
          if (next >= totalFrames) {
            setIsPlaying(false)
            return prev
          }
          dashboardWs.seek(next, next + 1)
          return next
        })
      }, 1000 / serverFps)
    } else if (playIntervalRef.current) {
      clearInterval(playIntervalRef.current)
      playIntervalRef.current = null
    }
    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current)
        playIntervalRef.current = null
      }
    }
  }, [isPlaying, serverFps, totalFrames])

  useEffect(() => {
    const timer = setInterval(() => {
      setCoverageStats(coverageTracker.current.getStats())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    dashboardWs.connect()
    const unsubFrames = dashboardWs.addFrameListener(handleFrames)
    const unsubAnnotations = dashboardWs.addAnnotationListener(handleAnnotations)
    const unsubStatus = dashboardWs.addStatusListener(setConnectionStatus)
    const unsubStats = dashboardWs.addStatsListener(handleStats)

    dashboardWs.getStats()

    return () => {
      unsubFrames()
      unsubAnnotations()
      unsubStatus()
      unsubStats()
      dashboardWs.disconnect()
      frameBuffer.current.destroy()
      annotationBuffer.current.destroy()
      coverageTracker.current.destroy()
      if (playIntervalRef.current) clearInterval(playIntervalRef.current)
    }
  }, [handleFrames, handleAnnotations, handleStats])

  return (
    <DashboardContext.Provider value={{
      connectionStatus, latestFrame, latestSegBlobUrl, frameCount, fps, coverageStats,
      getFrame, getAnnotation, requestFrame, requestAnnotation,
      currentIndex, totalFrames, isPlaying, serverFps,
      play, pause, seekTo, skipForward, skipBackward,
    }}>
      {children}
    </DashboardContext.Provider>
  )
}

export function useDashboard(): DashboardState {
  const ctx = useContext(DashboardContext)
  if (!ctx) throw new Error('useDashboard must be used within a DashboardProvider')
  return ctx
}
