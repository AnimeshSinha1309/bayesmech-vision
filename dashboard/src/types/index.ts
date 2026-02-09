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

export interface Resolution {
  width: number
  height: number
}

// === Camera & Motion ===

export interface CameraData {
  pose_matrix?: number[]
  view_matrix?: number[]
  projection_matrix?: number[]
  intrinsic_matrix?: number[]
}

export interface MotionData {
  linear_acceleration?: Vec3
  linear_velocity_pose?: Vec3
  linear_velocity_accel?: Vec3
  angular_velocity?: Vec3
  gravity?: Vec3
  orientation?: Quaternion
}

// === WebSocket incoming messages ===

export interface FrameUpdateMessage {
  type: 'frame_update'
  client_id: string
  timestamp: number
  frame_number: number
  rgb_frame?: string
  segmentation_frame?: string
  depth_frame?: string
  camera?: CameraData
  resolution?: Resolution
  tracking_state?: number
  motion?: MotionData
}

export interface ClientInfo {
  client_id: string
  frame_count: number
  current_fps: number
  buffer_size: number
  max_buffer_size: number
  depth_percentage: number
  frames_with_depth: number
  frames_without_depth: number
  seg_requests_sent: number
  seg_outputs_received: number
}

export interface ClientsUpdateMessage {
  type: 'clients_update'
  clients: ClientInfo[]
}

export interface SegmentationUpdateMessage {
  type: 'segmentation_update'
  client_id: string
  masks: Record<string, string>
  prompt?: string
}

export type DashboardMessage =
  | FrameUpdateMessage
  | ClientsUpdateMessage
  | SegmentationUpdateMessage

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

export interface ClientsResponse {
  clients: ClientInfo[]
  count: number
}
