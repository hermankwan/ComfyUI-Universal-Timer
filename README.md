# 🎛️ ComfyUI Universal Timer
**Version: v0.1.0**

A professional, industrial-grade monitoring and execution timer node for ComfyUI. Designed with dynamic unit mapping, real-time status reporting, and robust workflow categorization, **Universal Timer** provides a unified time-tracking and performance analysis framework for any type of ComfyUI generation pipeline.

---

## 📌 Where to Find It in ComfyUI
After installation, you can find this node by right-clicking on the canvas, navigating to **utils** (or using the search bar and typing **`Universal Timer`**).

---

## ✨ Features

* 🏭 **Mechanical-Style Industrial UI**: Sleek, retro-digital LED appearance featuring all-caps status indicators (`[ READY ]`, `[ PAUSE ]`, `[ ERROR ]`) for a geek-friendly, clean aesthetic.
* 🔄 **Dynamic Unit Mapping**: Automatically adapts measurement units and counter labels based on your selected workflow type:
  * `Image` ➔ `IMAGES`
  * `Video` ➔ `FRAMES`
  * `Audio` ➔ `CLIPS`
  * `Prompt` ➔ `STEPS`
  * `Training` ➔ `EPOCHS`
  * `Custom` ➔ `ITEMS`
* 🎨 **Theme Persistence**: Click-to-change color palette (White, Blue, Green, Yellow, Pink). Your visual preferences automatically persist inside the **Workflow JSON**.
* 📊 **Live Progress & State Tracking**: Monitors real-time progress (`[ Current / Total ]`) alongside precise lifecycle management.
* ⏸️ **Interactive Pause & Resume**: Hover over the lower counter region to toggle `[ PAUSE ]` / `[ RESUME ]` to exclude away-time from performance metrics.
* 🛡️ **Robust Error Handling**: Automatically switches to an alert-red `[ ERROR ]` state when upstream execution failures or workflow exceptions occur.

---

<p align="center">
  <img src="assets/uni_timer.gif" alt="Universal Timer Interaction Demo"><br>
  <sub>*Industrial aesthetic with dynamic unit mapping, live status monitoring, and interactive controls.*</sub>
</p>

---

## 📦 Installation

> **Note:** This node relies strictly on native web standard components and ComfyUI API events. No external Python dependencies or `requirements.txt` are required.

### Method 1: Via ComfyUI-Manager *(Recommended)*
1. Open ComfyUI and click on **Manager** in the menu.
2. Select **Custom Nodes Manager**.
3. Search for `ComfyUI Universal Timer`.
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

## 🎯 Conceptual Framework & Design Principles

To maintain absolute clarity and maintainability across complex pipelines, **Universal Timer** enforces strict architectural boundaries regarding workflow typing and batch execution.

### 1. The `workflow_type` Definition Rule (Output Asset Type Principle)
The classification of a workflow is governed strictly by its **Final Output Asset Type**, regardless of the intermediate processing steps, auxiliary models, control networks, or prompt enhancements involved:
* **`Image`**: Any pipeline whose terminal output is an image format (covers standard Text-to-Image, Image-to-Image, Upscaling pipelines, etc.).
* **`Video`**: Pipelines whose terminal delivery consists of video sequences or animation files.
* **`Audio`**: Pipelines terminating in sound or music synthesis.
* **`Prompt`**: Workflows dedicated to LLM-driven text prompt engineering, optimization, or structured generation.
* **`Training`**: Workflows focused on model fine-tuning, embedding, or LoRA generation (`EPOCHS`).
* **`Custom`**: Any alternative or experimental output type falling outside the standard categories (`ITEMS`).

### 2. Total Count Principles: Tensor Batching vs. Sequential Loops
Universal Timer distinguishes between ComfyUI’s native tensor processing and iterative loop execution:
* **Native Tensor Batching (`batch_size = N` in KSampler / Latent)**:
  * **Behavior**: Processed in parallel during a *single* prompt execution cycle.
  * **Setting Rule**: Keep `total = 1`. The timer records the monolithic execution duration of the tensor bundle as 1 unit.
* **Sequential / Iterative Batching (e.g., Loop nodes, Batch Loaders)**:
  * **Behavior**: Processed iteratively across multiple execution rounds.
  * **Setting Rule**: Set `total = N` to track accurate real-time loop progress (`[ Current / Total ]`).

---

## 🚀 How to Use & Interactive Controls

1. Add **Universal Timer** to your ComfyUI workspace graph.
2. Select your pipeline category under **`workflow_type`** (the node instantly maps the corresponding unit label).
3. Connect your item count to **`total`** if running sequential loops, then click **Queue Prompt**.

### 🖱️ Canvas Interactions
* **Pause / Resume**: Hover over the bottom counter area while running. Click `[ PAUSE ]` to freeze the elapsed timer, and `[ RESUME ]` to resume.
* **Manual Reset**: Click directly on the 7-segment LED time display digits at any time to reset the clock to `00:00:00`.
* **Theme Swatches**: Click any color indicator swatch to change the LED glow color instantly.

---

## 📋 Changelog

### v0.1.0
* Initial release of **Universal Timer**.
* Introduced dynamic unit mapping across 6 core output categories (`Image`, `Video`, `Audio`, `Prompt`, `Training`, `Custom`).
* Added industrial ALL-CAPS status state machines (`[ READY ]`, `[ RUNNING ]`, `[ PAUSE ]`, `[ ERROR ]`).
* Implemented workflow-scoped theme color persistence and hover-to-pause controls.

---

## 📜 License

This project is licensed under the [MIT License](LICENSE).