import time

from aiohttp import web
from server import PromptServer

# 工作流类型到默认单位的映射字典
WORKFLOW_TYPE_TO_UNIT = {
    "Image": "IMAGES",
    "Video": "FRAMES",
    "Audio": "CLIPS",
    "Prompt": "STEPS",
    "Training": "EPOCHS",
    "Custom": "ITEMS",
}


class UniversalTimerManager:
    start_time = None
    is_running = False
    completed_count = 0
    total_count = 0
    last_elapsed = 0.0


@PromptServer.instance.routes.post("/universal_timer/reset")
async def reset_timer(request):
    try:
        data = await request.json()
    except (ValueError, web.HTTPException):
        data = {}

    force = data.get("force", False)

    if UniversalTimerManager.is_running and not force:
        return web.json_response({"status": "ignored"})

    UniversalTimerManager.start_time = time.time()
    UniversalTimerManager.is_running = True
    UniversalTimerManager.completed_count = 0
    UniversalTimerManager.last_elapsed = 0.0

    return web.json_response(
        {"status": "ok", "server_time": UniversalTimerManager.start_time}
    )


class UniversalTimer:
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "workflow_type": (
                    ["Image", "Video", "Audio", "Prompt", "Training", "Custom"],
                    {"default": "Image"},
                ),
                "total_count": ("INT", {"default": 1, "min": 1, "max": 999999}),
            },
            "hidden": {
                "unique_id": "UNIQUE_ID",
            },
        }

    RETURN_TYPES = ()
    RETURN_NAMES = ()
    FUNCTION = "process"
    CATEGORY = "utils/timer"
    OUTPUT_NODE = True

    @classmethod
    def IS_CHANGED(cls, **kwargs):
        return float("nan")

    def process(self, total_count, workflow_type="Image", unique_id=None):
        now = time.time()

        if (
            UniversalTimerManager.start_time is None
            or not UniversalTimerManager.is_running
        ):
            UniversalTimerManager.start_time = now
            UniversalTimerManager.is_running = True
            UniversalTimerManager.completed_count = 0

        UniversalTimerManager.completed_count += 1
        UniversalTimerManager.total_count = total_count
        elapsed_sec = max(0.0, now - UniversalTimerManager.start_time)
        UniversalTimerManager.last_elapsed = elapsed_sec

        # 根据 workflow_type 自动映射对应的单位名称
        unit_label = WORKFLOW_TYPE_TO_UNIT.get(workflow_type, "ITEMS")

        PromptServer.instance.send_sync(
            "universal_timer_update",
            {
                "node_id": unique_id,
                "current": UniversalTimerManager.completed_count,
                "total": total_count,
                "unit": unit_label,
                "elapsed_sec": elapsed_sec,
                "is_running": True,
                "is_final": False,
                "server_time": now,
            },
        )

        return ()
