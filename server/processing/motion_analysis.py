import numpy as np
from scipy.spatial.distance import cdist
import logging

logger = logging.getLogger(__name__)

class MotionAnalyzer:
    """Analyze object motion in 3D space"""

    def compute_velocity(
        self,
        trajectory: np.ndarray,  # Nx4 array (x, y, z, t)
        window_size: int = 5
    ) -> tuple:
        """
        Compute velocity vectors from trajectory

        Returns:
            velocities: (N-1)x3 array of velocity vectors
            speeds: (N-1) array of speeds in m/s
        """
        if len(trajectory) < 2:
            return np.array([]), np.array([])

        positions = trajectory[:, :3]
        timestamps = trajectory[:, 3]

        # Compute velocities using finite differences
        velocities = []
        speeds = []

        for i in range(len(trajectory) - 1):
            dt = timestamps[i+1] - timestamps[i]
            if dt <= 0:
                continue

            dp = positions[i+1] - positions[i]
            velocity = dp / dt
            speed = np.linalg.norm(velocity)

            velocities.append(velocity)
            speeds.append(speed)

        return np.array(velocities), np.array(speeds)

    def predict_future_position(
        self,
        trajectory: np.ndarray,
        time_ahead: float = 1.0,  # seconds
        method: str = 'linear'
    ):
        """Predict future position based on recent trajectory"""

        if len(trajectory) < 2:
            return None

        if method == 'linear':
            # Simple linear extrapolation
            recent_positions = trajectory[-5:, :3]  # Last 5 positions
            recent_times = trajectory[-5:, 3]

            # Fit linear trend
            velocities, _ = self.compute_velocity(trajectory[-5:])
            if len(velocities) == 0:
                return trajectory[-1, :3]

            avg_velocity = np.mean(velocities, axis=0)
            last_position = trajectory[-1, :3]

            predicted = last_position + avg_velocity * time_ahead
            return predicted

        # Can add more sophisticated methods (Kalman filter, etc.)
        return None

    def detect_collision_risk(
        self,
        trajectories: dict,  # track_id -> trajectory
        time_horizon: float = 2.0,  # seconds
        collision_threshold: float = 1.0  # meters
    ) -> list:
        """
        Detect potential collisions between tracked objects

        Returns list of (track_id_1, track_id_2, time_to_collision)
        """
        collisions = []

        track_ids = list(trajectories.keys())
        for i, id1 in enumerate(track_ids):
            for id2 in track_ids[i+1:]:
                # Predict future positions
                pred1 = self.predict_future_position(trajectories[id1], time_horizon)
                pred2 = self.predict_future_position(trajectories[id2], time_horizon)

                if pred1 is None or pred2 is None:
                    continue

                distance = np.linalg.norm(pred1 - pred2)

                if distance < collision_threshold:
                    # Estimate time to collision
                    current_pos1 = trajectories[id1][-1, :3]
                    current_pos2 = trajectories[id2][-1, :3]
                    current_dist = np.linalg.norm(current_pos1 - current_pos2)

                    # Simple linear estimate
                    if current_dist > distance:
                        relative_speed = (current_dist - distance) / time_horizon
                        ttc = current_dist / relative_speed if relative_speed > 0 else float('inf')
                        collisions.append((id1, id2, ttc))

        return collisions
