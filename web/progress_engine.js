export class ProgressEngine {
    constructor() {
        this.current = 0;
        this.total = 0;
        this.status = "READY"; // READY | RUNNING | INTERRUPT | ERROR
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
        
        if (this.current > this.total) {
            this.current = this.total;
        }
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

    // 返回两部分数据，方便 UI 分别渲染
    getDisplayData() {
        if (this.status === "READY") return { inner: "READY", unit: "" };
        if (this.status === "ERROR") return { inner: "ERROR", unit: "" };
        if (this.status === "INTERRUPT") return { inner: "INTERRUPT", unit: "" };
        return { inner: `${this.current} / ${this.total}`, unit: this.unitLabel };
    }
}