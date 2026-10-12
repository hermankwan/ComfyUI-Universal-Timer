"""
ComfyUI-Universal-Timer
A universal, real-time 7-segment LED timer node for multi-modal workflows (Images, Video, Audio, Steps).
"""

__version__ = "0.1.0"

from .universal_timer import UniversalTimer

NODE_CLASS_MAPPINGS = {"UniversalTimer": UniversalTimer}

NODE_DISPLAY_NAME_MAPPINGS = {"UniversalTimer": "🎛️ Universal Timer"}

WEB_DIRECTORY = "./web"

__all__ = [
    "NODE_CLASS_MAPPINGS",
    "NODE_DISPLAY_NAME_MAPPINGS",
    "WEB_DIRECTORY",
    "__version__",
]
