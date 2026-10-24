# 🎛️ ComfyUI Universal Timer
**Version: v0.2.1**

<p align="center">
  <img src="assets/uni_timer.gif" alt="Universal Timer Interaction Demo"><br>
  <sub>*Click LED digits to Pause/Resume, double-click to reset, and click swatches to change colors.*</sub>
</p>

A universal execution timer for ComfyUI workflows that provides real-time duration tracking with dynamic unit mapping for any generation pipeline.

---

## 📌 Where to Find It in ComfyUI
After installation, you can find this node by right-clicking on the canvas, navigating to **utils/timer** (or using the search bar and typing **`Universal Timer`**).

---

## ✨ Features

* 🏭 **Mechanical-Style Industrial UI**: Sleek, retro-digital LED appearance featuring clean, intuitive status indicators for a geek-friendly aesthetic.
* 🔄 **Dynamic Unit Mapping**: Automatically adapts measurement units and counter labels based on your selected workflow type:
  * `Image` ➔ `IMAGES`
  * `Video` ➔ `FRAMES`
  * `Audio` ➔ `CLIPS`
  * `Prompt` ➔ `STEPS`
  * `Training` ➔ `EPOCHS`
  * `Custom` ➔ `ITEMS`
* 🎨 **Theme Persistence**: Click-to-change color palette (White, Blue, Green, Yellow, Pink). Your visual preferences automatically persist inside the **Workflow JSON** (per-workflow persistence).
* 📊 **Macro-Level Accurate Timing**: Unlike native node timers, this timer measures the **entire duration** of a workflow—from the first task starting to the very last task completing—without resetting between iterations.
* 🟢 **Dynamic Visual Status Feedback**: The progress counter `[ X / Y ] UNIT` (e.g., `[ 1 / 10 ] IMAGES`) changes color based on the workflow state:
  * ⚪ **Cool Gray (`[ READY ]`)**: Idle, waiting for execution.
  * 🔵 **Blue**: Workflow running.
  * 🟢 **Green (`[ Y / Y ]`)**: Workflow completed successfully.
  * 🟡 **Yellow (`[ INTERRUPT ]`)**: Workflow interrupted by the user or stopped by the safety fallback.
  * 🔴 **Pink (`[ ERROR ]`)**: Workflow encountered an error and stopped.
* ⏸️ **Absolute Timer Independence**: Click the LED digits to pause/resume, or double-click to reset.
  > **⚠️ Semantic Note on Interaction:** Pausing **only freezes the UI time ticking**. It does *not* pause the backend workflow, nor does it stop the progress counter from updating. It is designed to let you exclude personal away-time from the final stats.
* 🛡️ **Multi-Workflow Isolation**: Open multiple workflows in the same browser session. The timer states are perfectly isolated per workflow to prevent cross-contamination.
* ⏳ **Dynamic Safety Deadlock Fallback**: A smart, type-aware safety net that prevents the timer from running indefinitely if a third-party node enters a deadlock. The timeout threshold automatically adjusts based on your selected `workflow_type`. See details below.

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

### 🖱️ Canvas Interactions
* **Single Click (Pause/Resume)**: Click anywhere on the 7-segment LED time digits to freeze or continue the timer. (The cursor will change to a pointer).
* **Double Click (Reset)**: Double-click the LED digits to reset the clock back to `00:00:00`. 
  * If the workflow is currently running, the timer will restart from zero immediately.
  * If the workflow is idle, the clock will remain at `00:00:00`.
* **Theme Swatches**: Click any of the 5 color blocks below the digits to change the LED glow color instantly.

---

## 🛡️ Dynamic Safety Deadlock Fallback

ComfyUI's custom node ecosystem sometimes experiences unexpected deadlocks. For example, third-party batch loaders (like *Sequential Image Loader*) may occasionally stop sending new prompts due to internal state bugs, even though they visually appear to still be running. In such rare cases, the backend stops processing, but the frontend timer might continue ticking indefinitely because it receives no "finish" signal.

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
- If the backend confirms it is completely idle (`executing == null`), the timer will automatically stop and display `[ INTERRUPT ]` in yellow.
- If a genuine long task is still running, the backend will report `executing != null`, and the timer will **not** be falsely stopped.

> **⏩ Don't want to wait?**  
> If you notice the workflow has clearly stopped but the timer is still counting, simply **double-click the LED digits**. This instantly resets the timer manually and clears the ghost state.

---

## 📋 Changelog

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