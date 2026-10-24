from aiohttp import web
from server import PromptServer

WORKFLOW_TYPE_TO_UNIT = {
    "Image": "IMAGES",
    "Video": "FRAMES",
    "Audio": "CLIPS",
    "Prompt": "STEPS",
    "Training": "EPOCHS",
    "Custom": "ITEMS",
}


class TimerState:
    def __init__(self):
        self.completed_count = 0
        self.total_count = 1
        self.is_active = False


STATE = TimerState()


@PromptServer.instance.routes.post("/universal_timer/reset")
async def reset_timer(request):
    STATE.completed_count = 0
    STATE.is_active = False
    return web.json_response({"status": "ok"})


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
    FUNCTION = "process"
    CATEGORY = "utils/timer"
    OUTPUT_NODE = True

    @classmethod
    def IS_CHANGED(cls, **kwargs):
        return float("nan")

    def process(self, total_count, workflow_type="Image", unique_id=None):
        # Auto-reset if new batch starts
        if (
            not STATE.is_active
            or STATE.completed_count >= STATE.total_count
            or STATE.total_count != total_count
        ):
            STATE.is_active = True
            STATE.completed_count = 0
            STATE.total_count = total_count

        STATE.completed_count += 1
        unit_label = WORKFLOW_TYPE_TO_UNIT.get(workflow_type, "ITEMS")

        PromptServer.instance.send_sync(
            "universal_timer_update",
            {
                "current": STATE.completed_count,
                "total": STATE.total_count,
                "unit": unit_label,
                "node_id": unique_id,
            },
        )
        return ()
