# 🎛️ ComfyUI Universal Timer

![Version](https://img.shields.io/badge/version-0.2.3-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![ComfyUI](https://img.shields.io/badge/ComfyUI-custom%20node-orange)
![Platform](https://img.shields.io/badge/platform-web%20%2F%20canvas-lightgrey)

<p align="center">
  <img src="assets/uni_timer.gif" alt="Universal Timer Interaction Demo"><br>
  <sub>*Switch modes to view COMPUTE, TOTAL, or ETA. Click to Pause/Resume, double-click to reset, and click swatches to change colors.*</sub>
</p>

A universal execution timer for ComfyUI workflows that provides real-time duration tracking with dynamic unit mapping for any generation pipeline.

> 💡 **Specifically generating batches of images?** For a more tailored experience with image batch loaders, check out [ComfyUI Batch Image Timer](https://github.com/hermankwan/ComfyUI-Batch-Image-Timer).

---

## 📌 Where to Find It in ComfyUI
After installation, you can find this node by right-clicking on the canvas, navigating to **utils/timer** (or using the search bar and typing **`Universal Timer`**).

---

## ✨ Features

* 🏭 **Mechanical-Style Industrial UI**: Sleek, retro-digital 7-segment LED appearance featuring clean, intuitive status indicators for a geek-friendly aesthetic.
* 🕒 **Triple Timing Modes**:
  * **COMPUTE** — Pure execution time (excludes queue wait). Supports Pause/Resume.
  * **TOTAL** — Wall-clock time from start to finish, including all waits.
  * **ETA** — Forecast of remaining batch time based on completed iterations.
* 🔄 **Dynamic Unit Mapping**: Automatically adapts measurement units and counter labels based on your selected workflow type:
  * `Image` ➔ `IMAGES`
  * `Video` ➔ `FRAMES`
  * `Audio` ➔ `CLIPS`
  * `Prompt` ➔ `STEPS`
  * `Training` ➔ `EPOCHS`
  * `Custom` ➔ `ITEMS`
* 🎨 **Interactive Palette & Persistence**: Click a swatch to change color; the choice is saved in the **Workflow JSON** (per-workflow persistence).
* 📊 **Macro-Level Accurate Timing**: Unlike native node timers, this timer measures the **entire duration** of a workflow—from the first task starting to the very last task completing—without resetting between iterations.
* 🚦 **Color-Coded Status Counter `[ X / Y ]`**:
  * ⚪ **Gray** `[ READY ]` — Idle, waiting for execution.
  * 🔵 **Blue** `[ X / Y ]` — Workflow running.
  * 🟢 **Green** `[ Y / Y ]` — Workflow completed successfully.
  * 🟡 **Yellow** `[ X / Y ]` — Interrupted (retains exact count).
  * 🔴 **Red** `[ X / Y ]` — Error (retains exact count).
* ⏸️ **Absolute Timer Independence**: Pausing or resetting the timer never affects the backend workflow or the progress counter, and vice versa. It is designed to let you exclude personal away-time from the final stats.
* 🛡️ **Multi-Workflow Isolation**: Open multiple workflows in the same browser session. The timer states are perfectly isolated per workflow to prevent visual cross-contamination.
* ⏳ **Dynamic Safety Deadlock Fallback**: A smart, type-aware safety net that prevents the timer from running indefinitely if a third-party node enters a deadlock. The timeout threshold automatically adjusts based on your selected `workflow_type`.
* ✨ **Polished Industrial Aesthetics**: Equipped with a neon glow effect for all LED digits, plus support for multiple synchronized timers to benchmark complex, multi-modal pipelines.

---

## 📦 Installation

> **Note:** This node relies strictly on native web standard components and ComfyUI API events. No external Python dependencies or `requirements.txt` are required.

### Method 1: Via ComfyUI-Manager *(Recommended)*
1. Open ComfyUI and click on **Manager** in the menu.
2. Select **Custom Nodes Manager**.
3. Search for `ComfyUI-Universal-Timer`.
4. Click **Install** and restart your ComfyUI.

### Method 2: Manual Installation (Git Clone)
1. Navigate to your ComfyUI `custom_nodes` directory:
   ```bash
   cd ComfyUI/custom_nodes
   ```
2. Clone this repository:
   ```bash
   git clone https://github.com/hermankwan/ComfyUI-Universal-Timer
   ```
3. Restart your ComfyUI instance.

---

## 🚀 How to Use & Interactive Controls

1. Add **Universal Timer** to your ComfyUI workspace graph.
2. Select your pipeline category under **`workflow_type`** (the node instantly maps the corresponding unit label).
3. Set the total count in **`total_count`** (manually or via widget connection) for sequential loops, then click **Queue Prompt**.

The node UI has **four interaction zones** — each responds only within its own area:

| Zone | Interaction |
|---|---|
| **1. Mode tabs** (`ETA`&nbsp;/&nbsp;`COMPUTE`&nbsp;/&nbsp;`TOTAL`) | Click to switch mode. Active tab is highlighted blue. |
| **2. LED timer digits** | **COMPUTE**: single-click = Pause/Resume, double-click = reset (continues if running, stays at `00:00:00` if idle).<br>**TOTAL**: single-click = brief flash (only while running); double-click = reset.<br>**ETA**: single/double-click = brief flash (only while running, no pause/reset). |
| **3. Color swatches** (5 blocks) | Click to change LED color. Saved with the workflow. |
| **4. Progress counter** `[ X / Y ]` | Display only — no interaction. |

> 💡 **Pro Tip (Multi-Node Sync)**: You can add multiple Timer nodes to the same canvas. When the workflow runs, all timers will start and stop synchronously, displaying the exact same unified macro-time. This is perfect for benchmarking different stages of your multi-modal pipeline!

---

## 💡 How It Works

### Timing Modes
* **COMPUTE** — Pure execution time, from the first task start to the last task end. Pausable to exclude away-time.
* **TOTAL** — Absolute wall-clock time. Keeps ticking even if COMPUTE is paused.
* **ETA** — Estimated remaining time using a smoothed blend of the **global average cost per item** and the **latest iteration cost** (30% / 70% weighting). It adapts quickly to speed changes while staying stable.
  > Shows `99:99:99` until the first item completes (`current` reaches 2), then counts down. Zeroes out when the workflow finishes.
  > **⚠️ ETA is for sequential loops (`total_count > 1`).** For single-item workflows (`total_count = 1`), ETA remains at `99:99:99` during the run — use COMPUTE or TOTAL instead.

---

## 🛡️ Dynamic Safety Deadlock Fallback

ComfyUI's custom node ecosystem sometimes experiences unexpected deadlocks. For example, third-party batch loaders may occasionally stop sending new prompts due to internal state bugs, even though they visually appear to still be running. In such rare cases, the backend stops processing, but the frontend timer might continue ticking indefinitely because it receives no "finish" signal.

To guarantee that the timer will **never run forever**, we've implemented a **Dynamic Deadlock Fallback** that adapts to your selected `workflow_type`:

| Workflow Type | Deadlock Timeout | Rationale |
| :--- | :--- | :--- |
| **`Prompt`** | 5 minutes | Text generation is usually very fast. |
| **`Image`** | 10 minutes | Covers most upscaling and img2img tasks. |
| **`Audio`** | 30 minutes | Audio synthesis may take longer. |
| **`Custom`** | 60 minutes | A safe conservative default. |
| **`Video`** | 120 minutes | Video generation requires significant time. |
| **`Training`** | 480 minutes | Model training can run for hours. |

**How it works:**
- If the timer is running and **no progress heartbeat** has been received for the specified timeout, the node will query ComfyUI's backend (`/prompt` API) to check if any node is truly executing (`exec_info.executing`).
- If the backend confirms it is completely idle (`executing == null`), the timer will automatically stop and display a yellow counter (retaining the exact progress).
- If a genuine long task is still running, the backend will report `executing != null`, and the timer will **not** be falsely stopped.

> **⏩ Don't want to wait?**  
> If you notice the workflow has clearly stopped but the timer is still counting, simply **double-click the LED digits**. This instantly resets the timer manually and clears the ghost state.

---

## ⚠️ FAQ & Known Limitations

**Q: I added multiple Timer nodes to one workflow, but the progress counter is jumping or resetting. Why?**
> **A:** The Timer engine is designed to track the **entire macro-duration** of a workflow using a global single-state per session. All Timer nodes in the same canvas are synchronized and share the same macro-progress.
> 
> If you place multiple Timer nodes but set different `total_count` values, the backend will detect a "changed total" on every cycle, resetting its counter and causing chaotic jumping. 
> 
> 👉 **Best Practice**: If you need to benchmark different stages (e.g., Loader vs. Upscaler), **ensure all connected Timer nodes share the exact same `total_count` value**. For normal usage, we recommend adding only **one** Timer node per workflow.

* **Interrupt/error before first task completes**: Counter shows `[ 0 / Y ]` since no progress has been made yet.
* **Rapid consecutive Queue clicks**: The previous run may not have fully reset; ETA may briefly show stale values until `current` reaches 1 again (force-restarts clocks when `current === 1`).
* **ETA in single-item workflows**: Stays at `99:99:99` during execution (no history). Use COMPUTE or TOTAL.

---

## 📋 Changelog

### v0.2.3
* **Triple Timing Modes**: Added `ETA` and `TOTAL` alongside `COMPUTE` to match the Batch Image Timer architecture.
* **Smart ETA**: 30/70 blend of global average and latest iteration cost; excludes initial model-load overhead.
* **Color-Coded Counter**: Removed text-based `[ INTERRUPT ]` / `[ ERROR ]` in favor of the unified colored `[ X / Y ]` format.
* **UI & Interaction Polish**: Panel-only cursor logic for smooth node drag/resize; enhanced LED glow. Replaced old hover-to-pause with intuitive click interactions.
* **Refined Display Isolation**: Each workflow canvas strictly isolates its own live timer display.
* **Force-restart on `current === 1`**: Handles rapid Queue clicks more gracefully.

### v0.2.2
* **Added Multi-Timer Sync**: You can now drop multiple timers across a complex multi-modal workflow (e.g., Video + Audio) to benchmark different stages. All timers will show the exact same macro-time.
* **Added Neon Glow Effect**: Enhanced the industrial UI by adding a dynamic, theme-matched neon glow to the 7-segment digits and status texts.
* **Fixed Node Resizing Conflict**: Resolved the cursor conflict at the node corners, making manual resizing smooth and reliable.

### v0.2.1
* **Added Dynamic Safety Deadlock Fallback**: Introduced a smart timeout mechanism that adapts to the selected `workflow_type` (e.g., 10 mins for Image, 120 mins for Video). Prevents infinite timers caused by third-party node deadlocks while protecting long-running tasks from being falsely terminated.
* **Improved Status Handling**: `[ INTERRUPT ]` now properly covers both user-initiated interruptions and fallback-triggered stops.

### v0.2.0 (Major Architecture Refactor)
* **Complete Codebase Rewrite**: Refactored into a modular ES Modules architecture (`timer_engine.js`, `progress_engine.js`, `ui_renderer.js`).
* **Batch Tracking Logic**: Rewrote the lifecycle monitoring logic to accurately track sequential loops and native batches without premature resetting.
* **Bulletproof Termination**: Added a robust "queue empty" fallback debounce, eliminating the issue where the timer would run indefinitely if a workflow was interrupted mid-batch.
* **State Isolation**: Timer interactions (Pause/Reset) are now fully decoupled from the progress counter. Added multi-workflow isolation.
* **UI/UX Overhaul**: 
  * Redesigned node layout and fixed window resizing conflicts.
  * Introduced dynamic color feedback for statuses (Ready/Running/Complete/Error/Interrupt).
  * Replaced the old hover-to-pause interaction with intuitive single-click/double-click controls.

### v0.1.0
* Initial release of **Universal Timer**.
* Introduced dynamic unit mapping across 6 core output categories.
* Added industrial ALL-CAPS status state machines.

---

## 📜 License

This project is licensed under the [MIT License](LICENSE).