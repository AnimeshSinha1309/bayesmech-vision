import numpy as np
import logging

logger = logging.getLogger(__name__)

class Reconstruction3D:
    """Reconstruct 3D positions of detected objects using camera pose"""

    def __init__(self):
        self.object_positions_3d = {}  # track_id -> [(x,y,z,t), ...]

    def project_to_3d(
        self,
        detection_2d: dict,
        camera_pose: np.ndarray,
        intrinsic_matrix: np.ndarray,
        assumed_height: float = 1.7  # meters (for people, adjust per class)
    ):
        """
        Project 2D detection to 3D world space

        Simple approach: Assume object is on ground plane (y=0)
        or has known height for the object class

        More advanced: Use depth map if available
        """
        cx, cy = detection_2d['center']

        # Camera intrinsics
        fx = intrinsic_matrix[0, 0]
        fy = intrinsic_matrix[1, 1]
        cx_intrinsic = intrinsic_matrix[0, 2]
        cy_intrinsic = intrinsic_matrix[1, 2]

        # Normalized image coordinates
        x_norm = (cx - cx_intrinsic) / fx
        y_norm = (cy - cy_intrinsic) / fy

        # Ray direction in camera space
        ray_camera = np.array([x_norm, y_norm, 1.0])
        ray_camera = ray_camera / np.linalg.norm(ray_camera)

        # Transform to world space
        camera_rotation = camera_pose[:3, :3]
        camera_translation = camera_pose[:3, 3]

        ray_world = camera_rotation @ ray_camera

        # Intersect with ground plane (y = 0) or assumed height
        # Ray equation: P = camera_pos + t * ray_world
        # Ground plane: P.y = 0
        # Solve for t: camera_pos.y + t * ray_world.y = 0

        if abs(ray_world[1]) < 1e-6:
            # Ray is parallel to ground
            return None

        t = -camera_translation[1] / ray_world[1]

        if t < 0:
            # Intersection behind camera
            return None

        # 3D position on ground plane
        position_3d = camera_translation + t * ray_world

        return position_3d

    def update_object_position(
        self,
        track_id: int,
        position_3d: np.ndarray,
        timestamp: float
    ):
        """Store 3D position for tracked object"""
        if track_id not in self.object_positions_3d:
            self.object_positions_3d[track_id] = []

        self.object_positions_3d[track_id].append(
            (*position_3d, timestamp)
        )

        # Keep only last 100 positions
        if len(self.object_positions_3d[track_id]) > 100:
            self.object_positions_3d[track_id].pop(0)

    def get_object_trajectory(self, track_id: int) -> np.ndarray:
        """Get full 3D trajectory of tracked object"""
        if track_id not in self.object_positions_3d:
            return np.array([])

        return np.array(self.object_positions_3d[track_id])
