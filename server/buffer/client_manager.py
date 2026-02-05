from threading import Lock
import time
import logging
from .frame_buffer import FrameBuffer

logger = logging.getLogger(__name__)

class ClientManager:
    """Manages multiple AR clients and their frame buffers"""

    def __init__(self):
        self.clients = {}
        self.lock = Lock()

    def add_client(self, client_id: str, websocket, device_id: str = None, connection_info: str = None):
        """Register new client"""
        with self.lock:
            self.clients[client_id] = {
                'websocket': websocket,
                'frame_buffer': FrameBuffer(max_size=60, client_id=client_id),
                'connected_at': time.time(),
                'last_frame_at': None,
                'device_id': device_id,  # Stable device identifier
                'connection_info': connection_info,  # IP:port for logging
                'seg_requests_sent': 0,  # Counter for segmentation requests sent
                'seg_outputs_received': 0,  # Counter for segmentation outputs received
            }

    def remove_client(self, client_id: str):
        """Unregister client"""
        with self.lock:
            if client_id in self.clients:
                del self.clients[client_id]

    def find_client_by_device_id(self, device_id: str):
        """Find a client by device_id (returns client_id if found)"""
        with self.lock:
            for client_id, client_data in self.clients.items():
                if client_data.get('device_id') == device_id:
                    return client_id
            return None

    def get_frame_buffer(self, client_id: str):
        """Get frame buffer for specific client"""
        with self.lock:
            return self.clients[client_id]['frame_buffer'] if client_id in self.clients else None

    def get_all_clients(self) -> list:
        """Get list of all connected client IDs"""
        with self.lock:
            return list(self.clients.keys())

    def update_last_frame_time(self, client_id: str):
        """Update last frame received timestamp"""
        with self.lock:
            if client_id in self.clients:
                self.clients[client_id]['last_frame_at'] = time.time()

    def increment_seg_request(self, client_id: str):
        """Increment segmentation request counter"""
        with self.lock:
            if client_id in self.clients:
                self.clients[client_id]['seg_requests_sent'] += 1

    def increment_seg_output(self, client_id: str):
        """Increment segmentation output counter"""
        with self.lock:
            if client_id in self.clients:
                self.clients[client_id]['seg_outputs_received'] += 1

    def get_seg_counters(self, client_id: str) -> dict:
        """Get segmentation counters for a client"""
        with self.lock:
            if client_id in self.clients:
                return {
                    'seg_requests_sent': self.clients[client_id]['seg_requests_sent'],
                    'seg_outputs_received': self.clients[client_id]['seg_outputs_received']
                }
            return {'seg_requests_sent': 0, 'seg_outputs_received': 0}
