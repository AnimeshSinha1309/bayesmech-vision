import asyncio
from concurrent.futures import ThreadPoolExecutor
import logging
import numpy as np

from .segmentation import ObjectSegmenter
from .tracking import ObjectTracker
from .reconstruction_3d import Reconstruction3D
from .motion_analysis import MotionAnalyzer

logger = logging.getLogger(__name__)

class ProcessingPipeline:
    """Orchestrates all processing workers"""

    def __init__(self, config: dict, database=None):
        self.config = config
        self.database = database

        # Initialize components (segmentation disabled)
        # self.segmenter = ObjectSegmenter(config.get('segmentation_model', 'yolov8n-seg.pt'))
        self.tracker = ObjectTracker(
            max_age=config.get('tracker_max_age', 30),
            min_hits=config.get('tracker_min_hits', 3),
            iou_threshold=config.get('tracker_iou_threshold', 0.3)
        )
        self.reconstructor = Reconstruction3D()
        self.motion_analyzer = MotionAnalyzer()

        # Thread pool for CPU-bound tasks
        self.executor = ThreadPoolExecutor(max_workers=4)

        # Processing queue
        self.processing_queue = asyncio.Queue(maxsize=10)

        # State
        self.is_running = False

    async def start(self):
        """Start processing workers"""
        self.is_running = True
        asyncio.create_task(self._process_loop())
        logger.info("Processing pipeline started")

    async def stop(self):
        """Stop processing workers"""
        self.is_running = False
        logger.info("Processing pipeline stopped")

    async def submit_frame(self, frame_data: dict):
        """Submit frame for processing (non-blocking)"""
        try:
            self.processing_queue.put_nowait(frame_data)
        except asyncio.QueueFull:
            logger.warning("Processing queue full, dropping frame")

    async def _process_loop(self):
        """Main processing loop"""
        while self.is_running:
            try:
                # Get next frame from queue
                frame_data = await asyncio.wait_for(
                    self.processing_queue.get(),
                    timeout=1.0
                )

                # Process frame (runs in thread pool to avoid blocking)
                loop = asyncio.get_event_loop()
                result = await loop.run_in_executor(
                    self.executor,
                    self._process_frame,
                    frame_data
                )

                # Store results
                if result and self.database:
                    await self._store_results(result)

            except asyncio.TimeoutError:
                continue
            except Exception as e:
                logger.error(f"Error in processing loop: {e}", exc_info=True)

    def _process_frame(self, frame_data: dict):
        """Process single frame (runs in thread pool)"""
        try:
            frame_number = frame_data['frame_number']
            rgb_image = frame_data.get('rgb_image')
            camera_data = frame_data.get('camera', {})
            camera_pose = camera_data.get('pose_matrix')
            intrinsic = camera_data.get('intrinsic_matrix')
            timestamp = frame_data['timestamp_ns'] / 1e9  # Convert to seconds
            client_id = frame_data.get('client_id', 'default')

            if rgb_image is None:
                return None

            # Step 1: Segment objects (DISABLED - no segmentation)
            detections = []
            # detections = self.segmenter.segment_frame(
            #     rgb_image,
            #     conf_threshold=self.config.get('confidence_threshold', 0.5)
            # )

            # Step 2: Track objects
            tracks = self.tracker.update(detections, frame_number)

            # Step 3: 3D reconstruction (if camera pose available)
            tracks_3d = []
            if camera_pose is not None and intrinsic is not None:
                for track in tracks:
                    # Find corresponding detection
                    detection = next(
                        (d for d in detections if d['center'] == track['center']),
                        None
                    )
                    if detection:
                        pos_3d = self.reconstructor.project_to_3d(
                            detection,
                            camera_pose,
                            intrinsic
                        )
                        if pos_3d is not None:
                            self.reconstructor.update_object_position(
                                track['track_id'],
                                pos_3d,
                                timestamp
                            )
                            track['position_3d'] = pos_3d
                            tracks_3d.append(track)

            # Step 4: Motion analysis
            motion_data = {}
            for track in tracks_3d:
                track_id = track['track_id']
                trajectory = self.reconstructor.get_object_trajectory(track_id)

                if len(trajectory) > 1:
                    velocities, speeds = self.motion_analyzer.compute_velocity(trajectory)
                    if len(velocities) > 0:
                        motion_data[track_id] = {
                            'velocity': velocities[-1],  # Latest velocity
                            'speed': speeds[-1],
                            'avg_speed': np.mean(speeds[-10:]) if len(speeds) >= 10 else np.mean(speeds),
                        }

            # Collision detection
            collisions = []
            if self.config.get('collision_detection_enabled', True):
                trajectories = {
                    track['track_id']: self.reconstructor.get_object_trajectory(track['track_id'])
                    for track in tracks_3d
                }
                collisions = self.motion_analyzer.detect_collision_risk(
                    trajectories,
                    time_horizon=self.config.get('collision_time_horizon', 2.0),
                    collision_threshold=self.config.get('collision_threshold', 1.0)
                )

            return {
                'client_id': client_id,
                'frame_number': frame_number,
                'timestamp': timestamp,
                'camera_pose': camera_pose,
                'detections': detections,
                'tracks': tracks,
                'tracks_3d': tracks_3d,
                'motion_data': motion_data,
                'collision_risks': collisions,
            }

        except Exception as e:
            logger.error(f"Error processing frame {frame_data.get('frame_number')}: {e}", exc_info=True)
            return None

    async def _store_results(self, result: dict):
        """Store processing results to database"""
        try:
            client_id = result.get('client_id', 'default')
            frame_number = result['frame_number']
            timestamp = result['timestamp']
            camera_pose = result.get('camera_pose')

            # Insert frame
            frame_id = self.database.insert_frame(client_id, frame_number, timestamp, camera_pose)

            # Insert detections
            if result.get('detections'):
                self.database.insert_detections(frame_id, result['detections'])

            # Insert/update tracks
            for track in result.get('tracks', []):
                self.database.upsert_track(client_id, track, frame_id, timestamp)
                self.database.insert_track_position(track['track_id'], frame_id, timestamp, track)

            # Insert motion data
            for track_id, motion in result.get('motion_data', {}).items():
                self.database.insert_motion_data(track_id, timestamp, motion)

            # Insert collision events
            for track_id_1, track_id_2, ttc in result.get('collision_risks', []):
                self.database.insert_collision_event(track_id_1, track_id_2, timestamp, ttc)

            # Periodic scene snapshot (e.g., every 10 frames)
            if frame_number % 10 == 0:
                self.database.save_scene_snapshot(client_id, timestamp, result)

            logger.debug(f"Stored results for frame {frame_number}")

        except Exception as e:
            logger.error(f"Error storing results: {e}", exc_info=True)
