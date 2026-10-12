import { app } from "/scripts/app.js";
import { api } from "/scripts/api.js";

window.__UNIVERSAL_TIMER__ = window.__UNIVERSAL_TIMER__ || {
    isRunning: false,
    isLocked: false,
    baseElapsedMs: 0,
    syncClientTime: 0,
    completedCount: 0,
    totalCount: 0,
    workflowType: "Image",
    unitLabel: "IMAGES",
    intervalId: null,
    progressText: "READY",
    activeColor: "#FFFFFF",
    isTerminated: false,
    isPaused: false
};

const timerState = window.__UNIVERSAL_TIMER__;

const TYPE_TO_UNIT_MAP = {
    "Image": "IMAGES",
    "Video": "FRAMES",
    "Audio": "CLIPS",
    "Prompt": "STEPS",
    "Training": "EPOCHS",
    "Custom": "ITEMS"
};

const COLOR_PALETTE = [
    "#FFFFFF", // 经典白
    "#00BFFF", // 科技蓝
    "#00FF88", // 荧光绿
    "#FFCC00", // 暖黄
    "#FF007F"  // 霓虹粉
];

const INACTIVE_COLOR_MAP = {
    "#FFFFFF": "#2A2A2A",
    "#00BFFF": "#002B36",
    "#00FF88": "#003311",
    "#FFCC00": "#332600",
    "#FF007F": "#33001A"
};

function startClientTicker() {
    if (!timerState.intervalId) {
        timerState.intervalId = setInterval(() => {
            if (timerState.isRunning && !timerState.isPaused) {
                app.graph?.setDirtyCanvas(true, true);
            }
        }, 100);
    }
}

function stopClientTicker() {
    if (timerState.isRunning) {
        if (!timerState.isLocked && timerState.syncClientTime > 0 && !timerState.isPaused) {
            timerState.baseElapsedMs += (performance.now() - timerState.syncClientTime);
        }
        timerState.syncClientTime = 0;
        timerState.isRunning = false;
    }
    if (timerState.intervalId) {
        clearInterval(timerState.intervalId);
        timerState.intervalId = null;
    }
    app.graph?.setDirtyCanvas(true, true);
}

function formatTime(msTotal) {
    const totalSec = Math.floor(Math.max(0, msTotal) / 1000);
    const p = (n) => String(n).padStart(2, "0");

    const h = p(Math.floor(totalSec / 3600));
    const m = p(Math.floor((totalSec % 3600) / 60));
    const s = p(totalSec % 60);

    return `${h}:${m}:${s}`;
}

const SEGMENT_MAP = {
    '0': [1, 1, 1, 1, 1, 1, 0],
    '1': [0, 1, 1, 0, 0, 0, 0],
    '2': [1, 1, 0, 1, 1, 0, 1],
    '3': [1, 1, 1, 1, 0, 0, 1],
    '4': [0, 1, 1, 0, 0, 1, 1],
    '5': [1, 0, 1, 1, 0, 1, 1],
    '6': [1, 0, 1, 1, 1, 1, 1],
    '7': [1, 1, 1, 0, 0, 0, 0],
    '8': [1, 1, 1, 1, 1, 1, 1],
    '9': [1, 1, 1, 1, 0, 1, 1]
};

function draw7SegmentDigit(ctx, x, y, width, height, digitChar, activeColor, inactiveColor) {
    const segments = SEGMENT_MAP[digitChar] || [0, 0, 0, 0, 0, 0, 0];
    const t = Math.max(2, width * 0.14);
    const gap = width * 0.08;

    const hW = width;
    const hH = height / 2;

    const segs = [
        () => ctx.fillRect(x + t + gap, y, hW - 2 * t - 2 * gap, t),
        () => ctx.fillRect(x + hW - t, y + t + gap, t, hH - t - 2 * gap),
        () => ctx.fillRect(x + hW - t, y + hH + gap, t, hH - t - 2 * gap),
        () => ctx.fillRect(x + t + gap, y + height - t, hW - 2 * t - 2 * gap, t),
        () => ctx.fillRect(x, y + hH + gap, t, hH - t - 2 * gap),
        () => ctx.fillRect(x, y + t + gap, t, hH - t - 2 * gap),
        () => ctx.fillRect(x + t + gap, y + hH - t / 2, hW - 2 * t - 2 * gap, t)
    ];

    for (let i = 0; i < 7; i++) {
        ctx.fillStyle = segments[i] ? activeColor : inactiveColor;
        segs[i]();
    }
}

function drawColon(ctx, x, y, width, height, color) {
    const dotSize = Math.max(3, width * 0.35);
    const centerX = x + width / 2 - dotSize / 2;
    ctx.fillStyle = color;
    ctx.fillRect(centerX, y + height * 0.3 - dotSize / 2, dotSize, dotSize);
    ctx.fillRect(centerX, y + height * 0.7 - dotSize / 2, dotSize, dotSize);
}

function patchUniversalTimerNodeUI(node) {
    if (!node || node.comfyClass !== "UniversalTimer" || node._universalTimerPatched) return;

    node._universalTimerPatched = true;
    node.size = [290, 175];
    node.colorSwatches = [];
    node.lastMousePos = [0, 0];
    
    node._swatchHovered = false;
    node._digitHovered = false;
    node._counterHovered = false;
    node._digitArea = null;
    node._counterArea = null;

    node.properties = node.properties || {};
    if (!node.properties.activeColor) {
        node.properties.activeColor = "#FFFFFF";
    }
    timerState.activeColor = node.properties.activeColor;

    // 关联 workflow_type 小部件并实现工作流持久化存储
    const typeWidget = node.widgets?.find(w => w.name === "workflow_type");
    if (typeWidget) {
        if (node.properties.workflowType) {
            typeWidget.value = node.properties.workflowType;
        } else {
            node.properties.workflowType = typeWidget.value || "Image";
        }
        
        const origCallback = typeWidget.callback;
        typeWidget.callback = function (v) {
            node.properties.workflowType = v;
            timerState.workflowType = v;
            timerState.unitLabel = TYPE_TO_UNIT_MAP[v] || "ITEMS";
            app.graph?.setDirtyCanvas(true, true);
            if (origCallback) return origCallback.apply(this, arguments);
        };
    }
    timerState.workflowType = node.properties.workflowType || typeWidget?.value || "Image";
    timerState.unitLabel = TYPE_TO_UNIT_MAP[timerState.workflowType] || "IMAGES";

    node.onMouseDown = function (e, pos) {
        if (this.colorSwatches && this.colorSwatches.length > 0) {
            for (const swatch of this.colorSwatches) {
                if (
                    pos[0] >= swatch.x &&
                    pos[0] <= swatch.x + swatch.w &&
                    pos[1] >= swatch.y &&
                    pos[1] <= swatch.y + swatch.h
                ) {
                    timerState.activeColor = swatch.color;
                    this.properties.activeColor = swatch.color; 
                    app.graph?.setDirtyCanvas(true, true);
                    return true;
                }
            }
        }

        if (this._counterArea &&
            pos[0] >= this._counterArea.x &&
            pos[0] <= this._counterArea.x + this._counterArea.w &&
            pos[1] >= this._counterArea.y &&
            pos[1] <= this._counterArea.y + this._counterArea.h
        ) {
            if (timerState.isRunning && !timerState.isTerminated) {
                if (!timerState.isPaused) {
                    if (!timerState.isLocked && timerState.syncClientTime > 0) {
                        timerState.baseElapsedMs += (performance.now() - timerState.syncClientTime);
                    }
                    timerState.syncClientTime = 0;
                    timerState.isPaused = true;
                } else {
                    timerState.syncClientTime = performance.now();
                    timerState.isPaused = false;
                }
                app.graph?.setDirtyCanvas(true, true);
                return true;
            }
        }

        if (this._digitArea &&
            pos[0] >= this._digitArea.x &&
            pos[0] <= this._digitArea.x + this._digitArea.w &&
            pos[1] >= this._digitArea.y &&
            pos[1] <= this._digitArea.y + this._digitArea.h
        ) {
            fetch("/universal_timer/reset", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ force: false })
            }).catch(err => console.error("Universal Timer reset fetch failed", err));

            timerState.baseElapsedMs = 0;
            timerState.syncClientTime = performance.now();
            timerState.isLocked = false;
            timerState.isPaused = false;
            if (!timerState.isRunning) {
                timerState.isTerminated = false;
                timerState.completedCount = 0;
                timerState.totalCount = 0;
                timerState.progressText = "READY";
            }
            app.graph?.setDirtyCanvas(true, true);
            return true;
        }
    };

    node.onMouseMove = function (e, pos) {
        this.lastMousePos = pos;
        app.graph?.setDirtyCanvas(true, false);
    };

    node.onMouseLeave = function (e) {
        const canvasEl = app.canvas?.canvas;
        if (canvasEl) {
            if (this._swatchHovered || this._digitHovered || this._counterHovered) {
                canvasEl.style.cursor = app.canvas?.default_connection_cursor || "crosshair";
                this._swatchHovered = false;
                this._digitHovered = false;
                this._counterHovered = false;
            }
        }
    };

    node.onDrawBackground = function (ctx) {
        const nodeW = this.size[0];
        const nodeH = this.size[1];

        let headerOffset = 30;
        if (this.widgets && this.widgets.length > 0) {
            let maxY = 0;
            for (const w of this.widgets) {
                if (w.last_y !== undefined) {
                    const h = w.computeSize ? w.computeSize()[1] : 20;
                    const bottom = w.last_y + h;
                    if (bottom > maxY) maxY = bottom;
                }
            }
            headerOffset = maxY > 0 ? maxY + 15 : 65;
        }

        const margin = 10;
        const topOffset = headerOffset;
        const rectW = nodeW - margin * 2;
        const rectH = Math.max(80, nodeH - topOffset - margin);

        ctx.save();

        ctx.fillStyle = "#000000";
        ctx.fillRect(margin, topOffset, rectW, rectH);
        ctx.strokeStyle = "#222222";
        ctx.lineWidth = 1;
        ctx.strokeRect(margin, topOffset, rectW, rectH);

        const scaleW = rectW / 240;
        const scaleH = rectH / 90;
        const scale = Math.max(0.5, Math.min(scaleW, scaleH));

        const centerY = topOffset + rectH * 0.42;

        let currentElapsed = timerState.baseElapsedMs;
        if (timerState.isRunning && !timerState.isLocked && !timerState.isPaused && timerState.syncClientTime > 0) {
            currentElapsed += (performance.now() - timerState.syncClientTime);
        }

        const timeStr = formatTime(currentElapsed);

        const digitWidth = 14 * scale;
        const digitHeight = 26 * scale;
        const digitGap = 5 * scale;
        const colonWidth = 8 * scale;

        const totalDisplayWidth = (6 * digitWidth) + (4 * digitGap) + (2 * colonWidth) + (2 * digitGap);
        let startX = (nodeW - totalDisplayWidth) / 2;
        const digitStartY = centerY - (digitHeight / 2);

        this._digitArea = {
            x: startX - 4,
            y: digitStartY - 4,
            w: totalDisplayWidth + 8,
            h: digitHeight + 8
        };

        const titleFontSize = Math.max(9, Math.round(10 * scale));
        ctx.fillStyle = "#666666";
        ctx.font = `bold ${titleFontSize}px monospace`;
        ctx.textAlign = "center";
        ctx.fillText("TOTAL ELAPSED", nodeW / 2, digitStartY - 8 * scale);

        if (this.properties && this.properties.activeColor) {
            timerState.activeColor = this.properties.activeColor;
        }
        const activeColor = timerState.activeColor || "#FFFFFF";
        const inactiveColor = INACTIVE_COLOR_MAP[activeColor] || "#2A2A2A";

        for (let i = 0; i < timeStr.length; i++) {
            const char = timeStr[i];
            if (char === ':') {
                drawColon(ctx, startX, digitStartY, colonWidth, digitHeight, activeColor);
                startX += colonWidth + digitGap;
            } else {
                draw7SegmentDigit(ctx, startX, digitStartY, digitWidth, digitHeight, char, activeColor, inactiveColor);
                startX += digitWidth + digitGap;
            }
        }

        const swatchSize = Math.max(5, Math.round(6 * scale));
        const swatchGap = 6 * scale;
        const totalSwatchesW = COLOR_PALETTE.length * swatchSize + (COLOR_PALETTE.length - 1) * swatchGap;
        let swatchStartX = (nodeW - totalSwatchesW) / 2;
        const swatchY = digitStartY + digitHeight + 6 * scale;

        this.colorSwatches = [];

        COLOR_PALETTE.forEach((color) => {
            ctx.fillStyle = color;
            ctx.fillRect(swatchStartX, swatchY, swatchSize, swatchSize);

            if (color === activeColor) {
                ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
                ctx.lineWidth = 1;
                ctx.strokeRect(swatchStartX - 1.5, swatchY - 1.5, swatchSize + 3, swatchSize + 3);
            }

            this.colorSwatches.push({
                x: swatchStartX - 3,
                y: swatchY - 3,
                w: swatchSize + 6,
                h: swatchSize + 6,
                color: color
            });

            swatchStartX += swatchSize + swatchGap;
        });

        // ==========================================
        // UI 精修: 根据动态类型映射并渲染 [ 状态 ] UNIT
        // ==========================================
        const statusFontSize = Math.max(10, Math.round(11 * scale));
        const statusY = swatchY + swatchSize + 14 * scale;

        const isHovering = timerState.isRunning && this._counterHovered && !timerState.isTerminated;
        
        // 实时同步当前选中的 workflowType 映射出的全大写单位
        const currentType = node.properties.workflowType || timerState.workflowType || "Images";
        const activeUnit = TYPE_TO_UNIT_MAP[currentType] || timerState.unitLabel || "IMAGES";

        let innerContent = "READY";
        if (isHovering) {
            innerContent = timerState.isPaused ? "RESUME" : "PAUSE";
        } else if (timerState.isTerminated) {
            innerContent = timerState.progressText;
        } else {
            innerContent = timerState.totalCount > 0 ? `${timerState.completedCount} / ${timerState.totalCount}` : "READY";
        }

        const bracketColor = "#666666";
        ctx.font = `bold ${statusFontSize}px monospace`;

        const bracketWidth = ctx.measureText("[").width;
        const innerWidth = ctx.measureText(` ${innerContent} `).width;
        const unitText = ` ${activeUnit}`;
        const unitWidth = ctx.measureText(unitText).width;

        const totalGroupWidth = bracketWidth + innerWidth + bracketWidth + unitWidth;
        let currentX = (nodeW - totalGroupWidth) / 2;

        // 1. 左方括号 "["
        ctx.fillStyle = bracketColor;
        ctx.textAlign = "left";
        ctx.fillText("[", currentX, statusY);
        currentX += bracketWidth;

        // 2. 中间的内容颜色配置
        if (isHovering) {
            ctx.fillStyle = timerState.isPaused ? "#00FF88" : "#FFB300";
        } else if (innerContent === "ERROR" || innerContent === "CANCEL") {
            ctx.fillStyle = "#FF3333";
        } else if (innerContent === "READY") {
            ctx.fillStyle = timerState.isRunning ? "#00BFFF" : "#5A8B9B";
        } else {
            ctx.fillStyle = timerState.isRunning ? "#00BFFF" : "#5A8B9B";
        }
        
        ctx.fillText(` ${innerContent} `, currentX, statusY);
        currentX += innerWidth;

        // 3. 右方括号 "]"
        ctx.fillStyle = bracketColor;
        ctx.fillText("]", currentX, statusY);
        currentX += bracketWidth;

        // 4. 右侧对应映射的动态单位名称
        ctx.fillStyle = "#888888";
        ctx.fillText(unitText, currentX, statusY);

        this._counterArea = {
            x: (nodeW / 2) - (totalGroupWidth / 2) - 4,
            y: statusY - statusFontSize,
            w: totalGroupWidth + 8,
            h: statusFontSize + 6
        };

        ctx.restore();

        const canvasEl = app.canvas?.canvas;
        if (canvasEl && this.lastMousePos && this.colorSwatches.length > 0) {
            const [mx, my] = this.lastMousePos;
            let isHoveringSwatch = false;
            let isHoveringDigit = false;
            let isHoveringCounter = false;

            for (const swatch of this.colorSwatches) {
                if (mx >= swatch.x && mx <= swatch.x + swatch.w && my >= swatch.y && my <= swatch.y + swatch.h) {
                    isHoveringSwatch = true;
                    break;
                }
            }

            if (this._digitArea && mx >= this._digitArea.x && mx <= this._digitArea.x + this._digitArea.w && my >= this._digitArea.y && my <= this._digitArea.y + this._digitArea.h) {
                isHoveringDigit = true;
            }

            if (this._counterArea && mx >= this._counterArea.x && mx <= this._counterArea.x + this._counterArea.w && my >= this._counterArea.y && my <= this._counterArea.y + this._counterArea.h) {
                isHoveringCounter = true;
            }

            const currentCursor = canvasEl.style.cursor;
            if (!currentCursor.includes("resize")) {
                if (isHoveringSwatch) {
                    canvasEl.style.cursor = "default"; 
                    this._swatchHovered = true;
                    this._digitHovered = false;
                    this._counterHovered = false;
                } else if (isHoveringDigit) {
                    canvasEl.style.cursor = "pointer"; 
                    this._swatchHovered = false;
                    this._digitHovered = true;
                    this._counterHovered = false;
                } else if (timerState.isRunning && isHoveringCounter && !timerState.isTerminated) {
                    canvasEl.style.cursor = "pointer"; 
                    this._swatchHovered = false;
                    this._digitHovered = false;
                    this._counterHovered = true;
                } else if (this._swatchHovered || this._digitHovered || this._counterHovered) {
                    canvasEl.style.cursor = app.canvas?.default_connection_cursor || "crosshair"; 
                    this._swatchHovered = false;
                    this._digitHovered = false;
                    this._counterHovered = false;
                }
            }
        }
    };

    app.graph?.setDirtyCanvas(true, true);
}

app.registerExtension({
    name: "UniversalTimer.UI",
    async setup() {
        const origQueuePrompt = app.queuePrompt?.bind(app);
        if (origQueuePrompt) {
            app.queuePrompt = async function (...args) {
                try {
                    const isAlreadyRunning = timerState.isRunning;
                    await fetch("/universal_timer/reset", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ force: !isAlreadyRunning })
                    });

                    if (!isAlreadyRunning) {
                        timerState.isRunning = true;
                        timerState.isLocked = false;
                        timerState.isTerminated = false; 
                        timerState.isPaused = false; 
                        timerState.baseElapsedMs = 0;
                        timerState.completedCount = 0;
                        timerState.syncClientTime = performance.now();
                        timerState.progressText = "READY";
                    }
                    startClientTicker();
                } catch (e) {
                    console.error("Universal Timer reset fetch failed", e);
                }
                return origQueuePrompt(...args);
            };
        }

        api.addEventListener("universal_timer_update", (event) => {
            if (timerState.isTerminated) return;

            const { current, total, unit } = event.detail || {};

            timerState.completedCount = current;
            timerState.totalCount = total;
            if (unit) timerState.unitLabel = unit;
            timerState.progressText = `${current} / ${total}`;

            if (!timerState.isPaused) {
                timerState.isRunning = true;
                timerState.isLocked = false;
                startClientTicker();
            }

            app.graph?.setDirtyCanvas(true, true);
        });

        api.addEventListener("executing", (event) => {
            const node = event.detail;
            if (!node && !timerState.isTerminated) {
                if (timerState.completedCount >= timerState.totalCount && timerState.totalCount > 0) {
                    stopClientTicker();
                }
            }
        });

        api.addEventListener("status", (event) => {
            const queueRemaining = event.detail?.status?.exec_info?.queue_remaining;
            if (queueRemaining === 0 && timerState.completedCount >= timerState.totalCount && timerState.totalCount > 0 && !timerState.isTerminated) {
                stopClientTicker();
            }
        });

        api.addEventListener("execution_error", () => {
            timerState.isLocked = false;
            stopClientTicker();
            timerState.progressText = "ERROR";
            timerState.isTerminated = true; 
            app.graph?.setDirtyCanvas(true, true);
        });

        api.addEventListener("execution_interrupted", () => {
            timerState.isLocked = false;
            stopClientTicker();
            timerState.progressText = "CANCEL";
            timerState.isTerminated = true; 
            app.graph?.setDirtyCanvas(true, true);
        });
    },

    async nodeCreated(node) {
        patchUniversalTimerNodeUI(node);
    },

    async loadedGraphNode(node) {
        patchUniversalTimerNodeUI(node);
    },

    async afterConfigureGraph() {
        if (app.graph && app.graph._nodes) {
            for (const node of app.graph._nodes) {
                if (node.comfyClass === "UniversalTimer") {
                    patchUniversalTimerNodeUI(node);
                }
            }
        }
    }
});