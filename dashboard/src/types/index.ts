// === Vector types ===

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

// === Camera & IMU ===

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

// === WebSocket incoming messages ===

export interface FrameUpdateMessage {
  type: 'frame_update'
  source: string
  device_id: string
  timestamp_ns: number
  frame_number: number
  rgb_frame?: string
  depth_frame?: string
  camera_pose?: CameraPose
  camera_intrinsics?: CameraIntrinsics
  imu?: ImuData
  inferred_geometry?: InferredGeometry
}

export type DashboardMessage = FrameUpdateMessage

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

// === Theme ===

export type ThemeMode = 'light' | 'dark'

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
