import logging

logger = logging.getLogger(__name__)

class ObjectSegmenter:
    """Stubbed segmentation class - no YOLO dependencies"""

    def __init__(self, model_name: str = None):
        logger.info("ObjectSegmenter initialized (segmentation disabled)")

    def segment_frame(self, rgb_image, conf_threshold: float = 0.5) -> list:
        """
        Returns empty list of detections (segmentation disabled)
        """
        return []
