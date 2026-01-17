from collections import defaultdict
import numpy as np
import logging

logger = logging.getLogger(__name__)

class ObjectTracker:
    """Multi-object tracking using simple IoU-based tracking"""

    def __init__(self, max_age: int = 30, min_hits: int = 3, iou_threshold: float = 0.3):
        self.max_age = max_age  # Frames to keep track alive without detection
        self.min_hits = min_hits  # Minimum detections before track confirmed
        self.iou_threshold = iou_threshold

        self.tracks = {}
        self.next_track_id = 0
        self.frame_count = 0

    def update(self, detections: list, frame_number: int) -> list:
        """
        Update tracks with new detections

        Returns list of active tracks:
        [
            {
                'track_id': 5,
                'class': 'person',
                'bbox': [x1, y1, x2, y2],
                'center': [cx, cy],
                'confidence': 0.95,
                'age': 10,  # Frames since first detection
                'hits': 8,   # Number of successful detections
                'position_history': [(x, y), ...],  # Last N positions
            },
            ...
        ]
        """
        self.frame_count = frame_number

        # Match detections to existing tracks using IoU
        matched_tracks = set()
        updated_tracks = []

        for detection in detections:
            det_bbox = detection['bbox']
            best_match = None
            best_iou = self.iou_threshold

            # Find best matching track
            for track_id, track in self.tracks.items():
                if track_id in matched_tracks:
                    continue

                # Only match same class
                if track['class'] != detection['class']:
                    continue

                iou = self._compute_iou(det_bbox, track['bbox'])
                if iou > best_iou:
                    best_iou = iou
                    best_match = track_id

            if best_match is not None:
                # Update existing track
                track = self.tracks[best_match]
                track['bbox'] = det_bbox
                track['center'] = detection['center']
                track['confidence'] = detection['confidence']
                track['hits'] += 1
                track['age'] += 1
                track['last_seen'] = frame_number
                track['position_history'].append(tuple(detection['center']))

                # Keep only last 30 positions
                if len(track['position_history']) > 30:
                    track['position_history'].pop(0)

                matched_tracks.add(best_match)

                # Only return confirmed tracks
                if track['hits'] >= self.min_hits:
                    updated_tracks.append(track)
            else:
                # Create new track
                new_track = {
                    'track_id': self.next_track_id,
                    'class': detection['class'],
                    'class_id': detection['class_id'],
                    'bbox': detection['bbox'],
                    'center': detection['center'],
                    'confidence': detection['confidence'],
                    'age': 1,
                    'hits': 1,
                    'first_seen': frame_number,
                    'last_seen': frame_number,
                    'position_history': [tuple(detection['center'])],
                }
                self.tracks[self.next_track_id] = new_track
                self.next_track_id += 1

        # Remove old tracks
        tracks_to_remove = []
        for track_id, track in self.tracks.items():
            if frame_number - track['last_seen'] > self.max_age:
                tracks_to_remove.append(track_id)

        for track_id in tracks_to_remove:
            del self.tracks[track_id]

        return updated_tracks

    def _compute_iou(self, bbox1: list, bbox2: list) -> float:
        """Compute Intersection over Union between two bboxes"""
        x1_1, y1_1, x2_1, y2_1 = bbox1
        x1_2, y1_2, x2_2, y2_2 = bbox2

        # Intersection
        x1_i = max(x1_1, x1_2)
        y1_i = max(y1_1, y1_2)
        x2_i = min(x2_1, x2_2)
        y2_i = min(y2_1, y2_2)

        if x2_i < x1_i or y2_i < y1_i:
            return 0.0

        intersection = (x2_i - x1_i) * (y2_i - y1_i)

        # Union
        area1 = (x2_1 - x1_1) * (y2_1 - y1_1)
        area2 = (x2_2 - x1_2) * (y2_2 - y1_2)
        union = area1 + area2 - intersection

        return intersection / union if union > 0 else 0.0

    def get_active_tracks(self) -> list:
        """Get all currently active tracks"""
        return [
            track for track in self.tracks.values()
            if track['hits'] >= self.min_hits
        ]
