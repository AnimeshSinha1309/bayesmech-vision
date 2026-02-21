// Re-export proto types for convenience
import { bayesmech } from '../proto/bundle'

export type PerceiverDataFrame = bayesmech.vision.PerceiverDataFrame
export type IPerceiverDataFrame = bayesmech.vision.IPerceiverDataFrame
export type SegmentationResponse = bayesmech.vision.SegmentationResponse
export type ISegmentationResponse = bayesmech.vision.ISegmentationResponse

// === Legacy interfaces used by existing components ===

export interface Vec3 {
  x: number
  y: number
  z: number
}

export interface Quaternion {
  x: number
  y: number
  z: number
  w: number
}

export interface CameraPose {
  position: Vec3
  rotation: Quaternion
}

export interface CameraIntrinsics {
  fx: number
  fy: number
  cx: number
  cy: number
  image_width: number
  image_height: number
  depth_width: number
  depth_height: number
}

export interface ImuData {
  angular_velocity?: Vec3
  linear_acceleration?: Vec3
  gravity?: Vec3
  magnetic_field?: Vec3
}

export interface InferredGeometry {
  plane_count: number
  point_cloud_count: number
}

// === Chart data ===

export interface ChartPoint {
  x: number
  y: number
}

// === Trajectory ===

export interface TrajectoryPoint {
  x: number
  y: number
}

// === Connection ===

export type ConnectionStatus = 'Connected' | 'Disconnected' | 'Connecting'

// === API responses ===

export interface StreamStats {
  source: string
  device_id: string | null
  frame_count: number
  buffered_frames: number
  fps: number
  is_replaying: boolean
  intrinsics: CameraIntrinsics | null
}

export interface RecordingInfo {
  filename: string
  size_mb: number
  modified: number
}

// === Decoded frame for UI consumption ===

export interface DecodedFrame {
  source: string
  device_id: string
  timestamp_ns: number
  frame_number: number
  rgbBlobUrl?: string
  depthBlobUrl?: string
  hasDepthData?: boolean   // true when depth_frame bytes are present in the proto
  camera_pose?: CameraPose
  camera_intrinsics?: CameraIntrinsics
  imu?: ImuData
  inferred_geometry?: InferredGeometry
}

// === Signal coverage over a rolling window of frames ===

export interface CoverageStats {
  windowSize: number        // number of frames in the rolling window
  depth: number             // 0-100%
  pose: number
  linearAccel: number
  angularVelocity: number
  gravity: number
  magneticField: number
  intrinsicsCount: number   // cumulative frames that carried intrinsics
  geometry: number
}

export interface DecodedAnnotation {
  frameNumber: number
  blobUrl: string
}
