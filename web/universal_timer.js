import { app } from "/scripts/app.js";
import { api } from "/scripts/api.js";
import { TimerEngine } from "./timer_engine.js";
import { ProgressEngine } from "./progress_engine.js";
import { renderTimerUI } from "./ui_renderer.js";

const timer = new TimerEngine();
const progress = new ProgressEngine();
let activeNodeId = null;
let isMacroRunning = false;
let lastCompletionTime = 0;
let queueEmptyTimeout = null;
let lastHeartbeatTime = Date.now();

const DEADLOCK_TIMEOUTS = {
    "Image": 10 * 60 * 1000,
    "Video": 120 * 60 * 1000,
    "Audio": 30 * 60 * 1000,
    "Prompt": 5 * 60 * 1000,
    "Training": 480 * 60 * 1000,
    "Custom": 60 * 60 * 1000,
};

function getDeadlockTimeout(node) {
    const wfType = node.properties?.workflowType || "Image";
    return DEADLOCK_TIMEOUTS[wfType] || DEADLOCK_TIMEOUTS["Custom"];
}

setInterval(() => {
    if (timer.isRunning && !timer.isPaused) {
        app.graph?.setDirtyCanvas(true, true);
    }

    if (isMacroRunning) {
        let timeoutMs = DEADLOCK_TIMEOUTS["Custom"];
        if (app.graph && app.graph._nodes) {
            const activeNode = app.graph._nodes.find(n => 
                n.comfyClass === "UniversalTimer" && String(n.id) === activeNodeId
            );
            if (activeNode) {
                timeoutMs = getDeadlockTimeout(activeNode);
            }
        }

        const silence = Date.now() - lastHeartbeatTime;
        if (silence > timeoutMs) {
            lastHeartbeatTime = Date.now(); // 重置，防止重复触发
            fetch("/prompt")
                .then(res => res.json())
                .then(data => {
                    if (data?.exec_info?.executing == null) {
                        isMacroRunning = false;
                        lastCompletionTime = Date.now();
                        timer.stop();
                        progress.status = "INTERRUPT";
                        fetch("/universal_timer/reset", { method: "POST" }).catch(() => {});
                        app.graph?.setDirtyCanvas(true, true);
                    }
                })
                .catch(() => {});
        }
    }
}, 100);

app.registerExtension({
    name: "UniversalTimer.Final",

    async setup() {
        api.addEventListener("universal_timer_update", (event) => {
            const d = event.detail || {};
            if (d.node_id) activeNodeId = String(d.node_id);

            lastHeartbeatTime = Date.now();

            if (queueEmptyTimeout) {
                clearTimeout(queueEmptyTimeout);
                queueEmptyTimeout = null;
            }

            const now = Date.now();
            if (!isMacroRunning && (now - lastCompletionTime < 200)) {
                return; 
            }

            if (!isMacroRunning) {
                isMacroRunning = true;
                timer.start();
                progress.start(d.total || 1, d.unit || "IMAGES");
            }
            
            progress.update(d);
            app.graph?.setDirtyCanvas(true, true);
        });

        api.addEventListener("execution_success", () => {
            if (isMacroRunning && progress.current >= progress.total) {
                isMacroRunning = false;
                lastCompletionTime = Date.now();
                timer.stop();
                progress.markCompleted();
                app.graph?.setDirtyCanvas(true, true);
            }
        });

        api.addEventListener("status", (event) => {
            const queueRemaining = event.detail?.status?.exec_info?.queue_remaining;
            
            if (queueRemaining === 0 && isMacroRunning) {
                if (queueEmptyTimeout) clearTimeout(queueEmptyTimeout);
                queueEmptyTimeout = setTimeout(() => {
                    fetch("/prompt")
                        .then(res => res.json())
                        .then(data => {
                            const isExecuting = data?.exec_info?.executing != null;
                            if (isExecuting) return;
                            
                            if (isMacroRunning) {
                                isMacroRunning = false;
                                lastCompletionTime = Date.now();
                                timer.stop();
                                if (progress.current < progress.total) {
                                    progress.status = "INTERRUPT";
                                } else {
                                    progress.markCompleted();
                                }
                                fetch("/universal_timer/reset", { method: "POST" }).catch(() => {});
                                app.graph?.setDirtyCanvas(true, true);
                            }
                        })
                        .catch(() => {
                            if (isMacroRunning) {
                                isMacroRunning = false;
                                lastCompletionTime = Date.now();
                                timer.stop();
                                progress.status = "INTERRUPT";
                                fetch("/universal_timer/reset", { method: "POST" }).catch(() => {});
                                app.graph?.setDirtyCanvas(true, true);
                            }
                        })
                        .finally(() => {
                            queueEmptyTimeout = null;
                        });
                }, 1500);
            }
        });

        api.addEventListener("execution_error", () => {
            if (isMacroRunning) {
                setTimeout(() => {
                    if (isMacroRunning) {
                        isMacroRunning = false;
                        progress.status = "ERROR";
                        timer.stop();
                        fetch("/universal_timer/reset", { method: "POST" }).catch(() => {});
                        app.graph?.setDirtyCanvas(true, true);
                    }
                }, 500);
            }
        });

        api.addEventListener("execution_interrupted", () => {
            if (isMacroRunning) {
                setTimeout(() => {
                    if (isMacroRunning) {
                        isMacroRunning = false;
                        progress.status = "INTERRUPT";
                        timer.stop();
                        fetch("/universal_timer/reset", { method: "POST" }).catch(() => {});
                        app.graph?.setDirtyCanvas(true, true);
                    }
                }, 500);
            }
        });
    },

    async nodeCreated(node) {
        if (node.comfyClass !== "UniversalTimer") return;

        node.properties = node.properties || {};
        node.properties.activeColor = node.properties.activeColor || "#FFFFFF";
        node._lastDigitClick = 0;

        const typeWidget = node.widgets?.find(w => w.name === "workflow_type");
        if (typeWidget) {
            const origCallback = typeWidget.callback;
            typeWidget.callback = function (v) {
                node.properties.workflowType = v;
                app.graph?.setDirtyCanvas(true, true);
                if (origCallback) return origCallback.apply(this, arguments);
            };
        }

        if (!node._hasInitialSized) {
            node._hasInitialSized = true;
            requestAnimationFrame(() => {
                if (!node.widgets || node.widgets.length === 0) return;
                
                const lastWidget = node.widgets[node.widgets.length - 1];
                const widgetBottom = (lastWidget.last_y !== undefined) ? lastWidget.last_y + (lastWidget.computeSize ? lastWidget.computeSize()[1] : 24) : 80;
                const minHeight = widgetBottom + 15 + 115; 
                
                if (!node.size || node.size[1] < minHeight) {
                    node.size = [Math.max(node.size ? node.size[0] : 290, 290), minHeight];
                    app.graph?.setDirtyCanvas(true, true);
                }
            });
        }

        node.onDrawBackground = function (ctx) {
            const isThisNodeActive = (activeNodeId === String(this.id));
            
            let timerMs = timer.getElapsedMs();
            let displayData = progress.getDisplayData();
            let isCompleted = progress.isCompleted;

            if (!isThisNodeActive) {
                if (!timer.isRunning && progress.isCompleted) {
                    if (activeNodeId !== String(this.id)) {
                        timerMs = 0;
                        displayData = { inner: "READY", unit: "" };
                        isCompleted = false;
                    }
                } else {
                    timerMs = 0;
                    displayData = { inner: "READY", unit: "" };
                    isCompleted = false;
                }
            }

            const activeColor = this.properties.activeColor;
            renderTimerUI(ctx, this, timerMs, displayData, activeColor, isCompleted);
        };

        node.onMouseDown = function (e, pos) {
            const isThisNodeActive = (activeNodeId === String(this.id)) || !timer.isRunning;

            if (this._hitSwatches) {
                for (const s of this._hitSwatches) {
                    if (pos[0] >= s.x && pos[0] <= s.x + s.w && pos[1] >= s.y && pos[1] <= s.y + s.h) {
                        this.properties.activeColor = s.color;
                        app.graph.setDirtyCanvas(true, true);
                        return true;
                    }
                }
            }

            if (!isThisNodeActive) return false;

            const d = this._hitDigit;
            if (d && pos[0] >= d.x && pos[0] <= d.x + d.w && pos[1] >= d.y && pos[1] <= d.y + d.h) {
                const now = Date.now();
                if (now - this._lastDigitClick < 300) {
                    this._lastDigitClick = 0;
                    const keepRunning = timer.isRunning;
                    timer.reset(keepRunning);
                    if (!keepRunning) {
                        progress.resetAll();
                        activeNodeId = null;
                    }
                } else {
                    this._lastDigitClick = now;
                    if (timer.isRunning) {
                        timer.isPaused ? timer.resume() : timer.pause();
                    }
                }
                app.graph.setDirtyCanvas(true, true);
                return true;
            }
        };

        node.onMouseMove = function (e, pos) {
            const canvasEl = app.canvas?.canvas;
            if (!canvasEl) return;
            
            const currentCursor = canvasEl.style.cursor || "";
            if (currentCursor.includes("resize")) return;

            let cursor = "crosshair";
            if (this._hitSwatches?.some(s => pos[0] >= s.x && pos[0] <= s.x + s.w && pos[1] >= s.y && pos[1] <= s.y + s.h)) {
                cursor = "default";
            } else if (this._hitDigit && pos[0] >= this._hitDigit.x && pos[0] <= this._hitDigit.x + this._hitDigit.w && pos[1] >= this._hitDigit.y && pos[1] <= this._hitDigit.y + this._hitDigit.h) {
                cursor = "pointer";
            }
            
            if (canvasEl.style.cursor !== cursor) {
                canvasEl.style.cursor = cursor;
            }
        };

        node.onMouseLeave = function () {
            const canvasEl = app.canvas?.canvas;
            if (canvasEl) canvasEl.style.cursor = "crosshair";
        };
    },

    async loadedGraphNode(node) {
        this.nodeCreated(node);
    }
});