-- Clients (AR devices)
CREATE TABLE IF NOT EXISTS clients (
    client_id TEXT PRIMARY KEY,
    connected_at REAL NOT NULL,
    disconnected_at REAL,
    total_frames INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active'  -- active, disconnected
);

-- Frames metadata (don't store image data, only references)
CREATE TABLE IF NOT EXISTS frames (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id TEXT NOT NULL,
    frame_number INTEGER NOT NULL,
    timestamp REAL NOT NULL,  -- Unix timestamp in seconds
    camera_pose_json TEXT,     -- JSON: 4x4 matrix
    processed_at REAL,
    FOREIGN KEY (client_id) REFERENCES clients(client_id),
    UNIQUE(client_id, frame_number)
);
CREATE INDEX IF NOT EXISTS idx_frames_client_timestamp ON frames(client_id, timestamp);

-- Object detections (per frame)
CREATE TABLE IF NOT EXISTS detections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    frame_id INTEGER NOT NULL,
    class_name TEXT NOT NULL,
    class_id INTEGER NOT NULL,
    confidence REAL NOT NULL,
    bbox_x1 REAL NOT NULL,
    bbox_y1 REAL NOT NULL,
    bbox_x2 REAL NOT NULL,
    bbox_y2 REAL NOT NULL,
    center_x REAL NOT NULL,
    center_y REAL NOT NULL,
    area REAL NOT NULL,
    FOREIGN KEY (frame_id) REFERENCES frames(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_detections_frame ON detections(frame_id);
CREATE INDEX IF NOT EXISTS idx_detections_class ON detections(class_name);

-- Object tracks (persistent across frames)
CREATE TABLE IF NOT EXISTS tracks (
    track_id INTEGER PRIMARY KEY,
    client_id TEXT NOT NULL,
    class_name TEXT NOT NULL,
    first_seen_frame INTEGER NOT NULL,
    last_seen_frame INTEGER NOT NULL,
    first_seen_timestamp REAL NOT NULL,
    last_seen_timestamp REAL NOT NULL,
    total_hits INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active',  -- active, lost, completed
    FOREIGN KEY (client_id) REFERENCES clients(client_id),
    FOREIGN KEY (first_seen_frame) REFERENCES frames(id),
    FOREIGN KEY (last_seen_frame) REFERENCES frames(id)
);
CREATE INDEX IF NOT EXISTS idx_tracks_client ON tracks(client_id);
CREATE INDEX IF NOT EXISTS idx_tracks_status ON tracks(status);

-- Track positions over time (3D positions)
CREATE TABLE IF NOT EXISTS track_positions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    track_id INTEGER NOT NULL,
    frame_id INTEGER NOT NULL,
    timestamp REAL NOT NULL,
    pos_x REAL,
    pos_y REAL,
    pos_z REAL,
    bbox_x1 REAL,
    bbox_y1 REAL,
    bbox_x2 REAL,
    bbox_y2 REAL,
    confidence REAL,
    FOREIGN KEY (track_id) REFERENCES tracks(track_id) ON DELETE CASCADE,
    FOREIGN KEY (frame_id) REFERENCES frames(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_track_positions_track ON track_positions(track_id, timestamp);

-- Motion data (velocities, trajectories)
CREATE TABLE IF NOT EXISTS motion_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    track_id INTEGER NOT NULL,
    timestamp REAL NOT NULL,
    velocity_x REAL,
    velocity_y REAL,
    velocity_z REAL,
    speed REAL,
    avg_speed REAL,
    FOREIGN KEY (track_id) REFERENCES tracks(track_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_motion_track ON motion_data(track_id, timestamp);

-- Collision events
CREATE TABLE IF NOT EXISTS collision_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    track_id_1 INTEGER NOT NULL,
    track_id_2 INTEGER NOT NULL,
    detected_at REAL NOT NULL,
    time_to_collision REAL,
    distance REAL,
    FOREIGN KEY (track_id_1) REFERENCES tracks(track_id),
    FOREIGN KEY (track_id_2) REFERENCES tracks(track_id)
);
CREATE INDEX IF NOT EXISTS idx_collisions_time ON collision_events(detected_at);

-- Scene snapshots (periodic 3D scene state)
CREATE TABLE IF NOT EXISTS scene_snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id TEXT NOT NULL,
    timestamp REAL NOT NULL,
    active_tracks_count INTEGER,
    scene_data_json TEXT,  -- JSON: full scene state with all objects
    FOREIGN KEY (client_id) REFERENCES clients(client_id)
);
CREATE INDEX IF NOT EXISTS idx_snapshots_client_time ON scene_snapshots(client_id, timestamp);
