/**
 * ComfyUI-Universal-Timer
 * A universal execution timer for ComfyUI workflows that provides real-time duration tracking with dynamic unit mapping for any generation pipeline.
 * 
 * @version 0.2.3
 * @copyright Copyright (c) 2026 Herman Kwan
 * @license MIT
 */

export class ProgressEngine {
    constructor() {
        this.current = 0;
        this.total = 0;
        this.status = "READY"; 
        this.isCompleted = false;
        this.unitLabel = "IMAGES";
    }

    start(total = 1, unit = "IMAGES") {
        this.current = 1;
        this.total = total > 0 ? total : 1;
        this.unitLabel = unit;
        this.status = "RUNNING";
        this.isCompleted = false;
    }

    update(data) {
        if (this.status !== "RUNNING") return;
        if (data.current != null) this.current = data.current;
        if (data.total != null) this.total = data.total;
        if (data.unit) this.unitLabel = data.unit;
        if (this.current > this.total) this.current = this.total;
    }

    markCompleted() {
        if (this.status === "RUNNING" && this.current >= this.total) {
            this.isCompleted = true;
        }
    }

    resetAll() {
        this.current = 0;
        this.total = 0;
        this.status = "READY";
        this.isCompleted = false;
    }

    getDisplayText() {
        if (this.status === "READY") return "READY";
        if (this.current > 0) return `${this.current} / ${this.total}`;
        return this.status;
    }
}