import sqlite3
import json
from pathlib import Path
from contextlib import contextmanager
import logging
import time
import numpy as np

logger = logging.getLogger(__name__)

class InferenceDatabase:
    """SQLite database for storing inference results"""

    def __init__(self, db_path: str = "ar_inference.db"):
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._initialize_db()

    def _initialize_db(self):
        """Create tables if they don't exist"""
        schema_path = Path(__file__).parent / "schema.sql"
        with open(schema_path) as f:
            schema = f.read()

        with self.get_connection() as conn:
            conn.executescript(schema)

        logger.info(f"Database initialized at {self.db_path}")

    @contextmanager
    def get_connection(self):
        """Context manager for database connections"""
        conn = sqlite3.connect(str(self.db_path))
        conn.row_factory = sqlite3.Row
        try:
            yield conn
            conn.commit()
        except Exception as e:
            conn.rollback()
            logger.error(f"Database error: {e}")
            raise
        finally:
            conn.close()

    def register_client(self, client_id: str) -> None:
        """Register new AR client"""
        with self.get_connection() as conn:
            conn.execute(
                "INSERT OR REPLACE INTO clients (client_id, connected_at, status) VALUES (?, ?, 'active')",
                (client_id, time.time())
            )

    def disconnect_client(self, client_id: str) -> None:
        """Mark client as disconnected"""
        with self.get_connection() as conn:
            conn.execute(
                "UPDATE clients SET disconnected_at = ?, status = 'disconnected' WHERE client_id = ?",
                (time.time(), client_id)
            )

    def insert_frame(self, client_id: str, frame_number: int, timestamp: float, camera_pose) -> int:
        """Insert frame metadata, returns frame_id"""
        camera_pose_json = None
        if camera_pose is not None:
            if isinstance(camera_pose, np.ndarray):
                camera_pose_json = json.dumps(camera_pose.tolist())
            else:
                camera_pose_json = json.dumps(camera_pose)

        with self.get_connection() as conn:
            cursor = conn.execute(
                """INSERT INTO frames (client_id, frame_number, timestamp, camera_pose_json, processed_at)
                   VALUES (?, ?, ?, ?, ?)
                   ON CONFLICT(client_id, frame_number) DO UPDATE SET processed_at = excluded.processed_at
                   RETURNING id""",
                (client_id, frame_number, timestamp, camera_pose_json, time.time())
            )
            frame_id = cursor.fetchone()[0]

            # Update client frame count
            conn.execute(
                "UPDATE clients SET total_frames = total_frames + 1 WHERE client_id = ?",
                (client_id,)
            )

            return frame_id

    def insert_detections(self, frame_id: int, detections: list) -> None:
        """Insert all detections for a frame"""
        with self.get_connection() as conn:
            for det in detections:
                conn.execute(
                    """INSERT INTO detections
                       (frame_id, class_name, class_id, confidence, bbox_x1, bbox_y1, bbox_x2, bbox_y2, center_x, center_y, area)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                    (
                        frame_id,
                        det['class'],
                        det['class_id'],
                        det['confidence'],
                        det['bbox'][0], det['bbox'][1], det['bbox'][2], det['bbox'][3],
                        det['center'][0], det['center'][1],
                        det['area']
                    )
                )

    def upsert_track(self, client_id: str, track: dict, frame_id: int, timestamp: float) -> None:
        """Insert or update track information"""
        with self.get_connection() as conn:
            # Check if track exists
            existing = conn.execute(
                "SELECT track_id FROM tracks WHERE track_id = ?",
                (track['track_id'],)
            ).fetchone()

            if existing:
                # Update existing track
                conn.execute(
                    """UPDATE tracks
                       SET last_seen_frame = ?, last_seen_timestamp = ?, total_hits = ?, status = 'active'
                       WHERE track_id = ?""",
                    (frame_id, timestamp, track['hits'], track['track_id'])
                )
            else:
                # Insert new track
                conn.execute(
                    """INSERT INTO tracks
                       (track_id, client_id, class_name, first_seen_frame, last_seen_frame,
                        first_seen_timestamp, last_seen_timestamp, total_hits, status)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')""",
                    (
                        track['track_id'],
                        client_id,
                        track['class'],
                        frame_id,
                        frame_id,
                        timestamp,
                        timestamp,
                        track['hits']
                    )
                )

    def insert_track_position(self, track_id: int, frame_id: int, timestamp: float, track: dict) -> None:
        """Insert track position for a specific frame"""
        with self.get_connection() as conn:
            pos_3d = track.get('position_3d')
            conn.execute(
                """INSERT INTO track_positions
                   (track_id, frame_id, timestamp, pos_x, pos_y, pos_z, bbox_x1, bbox_y1, bbox_x2, bbox_y2, confidence)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    track_id,
                    frame_id,
                    timestamp,
                    float(pos_3d[0]) if pos_3d is not None else None,
                    float(pos_3d[1]) if pos_3d is not None else None,
                    float(pos_3d[2]) if pos_3d is not None else None,
                    track['bbox'][0], track['bbox'][1], track['bbox'][2], track['bbox'][3],
                    track['confidence']
                )
            )

    def insert_motion_data(self, track_id: int, timestamp: float, motion: dict) -> None:
        """Insert motion data for a track"""
        with self.get_connection() as conn:
            velocity = motion['velocity']
            conn.execute(
                """INSERT INTO motion_data
                   (track_id, timestamp, velocity_x, velocity_y, velocity_z, speed, avg_speed)
                   VALUES (?, ?, ?, ?, ?, ?, ?)""",
                (
                    track_id,
                    timestamp,
                    float(velocity[0]), float(velocity[1]), float(velocity[2]),
                    float(motion['speed']),
                    float(motion['avg_speed'])
                )
            )

    def insert_collision_event(self, track_id_1: int, track_id_2: int, timestamp: float, ttc: float, distance: float = None) -> None:
        """Insert collision event"""
        with self.get_connection() as conn:
            conn.execute(
                """INSERT INTO collision_events
                   (track_id_1, track_id_2, detected_at, time_to_collision, distance)
                   VALUES (?, ?, ?, ?, ?)""",
                (track_id_1, track_id_2, timestamp, ttc, distance)
            )

    def save_scene_snapshot(self, client_id: str, timestamp: float, scene_data: dict) -> None:
        """Save complete scene state snapshot"""
        with self.get_connection() as conn:
            conn.execute(
                """INSERT INTO scene_snapshots
                   (client_id, timestamp, active_tracks_count, scene_data_json)
                   VALUES (?, ?, ?, ?)""",
                (
                    client_id,
                    timestamp,
                    len(scene_data.get('tracks_3d', [])),
                    json.dumps(scene_data, default=str)
                )
            )

    # Query methods

    def get_track_trajectory(self, track_id: int) -> list:
        """Get full trajectory of a track"""
        with self.get_connection() as conn:
            cursor = conn.execute(
                """SELECT timestamp, pos_x, pos_y, pos_z, bbox_x1, bbox_y1, bbox_x2, bbox_y2
                   FROM track_positions
                   WHERE track_id = ?
                   ORDER BY timestamp ASC""",
                (track_id,)
            )
            return [dict(row) for row in cursor.fetchall()]

    def get_active_tracks(self, client_id: str) -> list:
        """Get all active tracks for a client"""
        with self.get_connection() as conn:
            cursor = conn.execute(
                """SELECT * FROM tracks
                   WHERE client_id = ? AND status = 'active'
                   ORDER BY last_seen_timestamp DESC""",
                (client_id,)
            )
            return [dict(row) for row in cursor.fetchall()]

    def get_frame_detections(self, frame_id: int) -> list:
        """Get all detections for a specific frame"""
        with self.get_connection() as conn:
            cursor = conn.execute(
                "SELECT * FROM detections WHERE frame_id = ?",
                (frame_id,)
            )
            return [dict(row) for row in cursor.fetchall()]

    def export_to_json(self, client_id: str, output_path: str) -> None:
        """Export all data for a client to JSON file"""
        with self.get_connection() as conn:
            # Get all tracks
            tracks = conn.execute(
                "SELECT * FROM tracks WHERE client_id = ?",
                (client_id,)
            ).fetchall()

            export_data = {
                'client_id': client_id,
                'tracks': []
            }

            for track in tracks:
                track_dict = dict(track)
                track_id = track['track_id']

                # Get positions
                positions = self.get_track_trajectory(track_id)
                track_dict['positions'] = positions

                # Get motion data
                motion = conn.execute(
                    "SELECT * FROM motion_data WHERE track_id = ? ORDER BY timestamp",
                    (track_id,)
                ).fetchall()
                track_dict['motion'] = [dict(m) for m in motion]

                export_data['tracks'].append(track_dict)

            # Write to file
            Path(output_path).parent.mkdir(parents=True, exist_ok=True)
            with open(output_path, 'w') as f:
                json.dump(export_data, f, indent=2)

            logger.info(f"Exported data to {output_path}")
