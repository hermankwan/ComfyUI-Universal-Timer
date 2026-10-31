"""
ComfyUI-Universal-Timer
A universal execution timer for ComfyUI workflows that provides real-time duration tracking with dynamic unit mapping for any generation pipeline.

Version: 0.2.3
Copyright (c) 2026 Herman Kwan
Licensed under the MIT License. See LICENSE file for details.
"""

__version__ = "0.2.3"

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
