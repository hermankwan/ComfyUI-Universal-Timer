# ComfyUI Universal Timer
**Version: v0.1.0**

A professional, mechanical-style monitoring and execution timer node for ComfyUI with dynamic unit mapping, real-time status reporting, and robust error-state handling.

---

## 🌟 Features

* **Mechanical-Style UI**: Industrial-inspired ALL CAPS status and unit labels (e.g., `[ READY ]`, `[ RUNNING ]`, `[ ERROR ]`), offering a sleek and geek-friendly aesthetic.
* **Dynamic Unit Mapping**: Automatically adapts and switches measurement units based on your workflow task type:
  * `Image` -> `IMAGES`
  * `Video` -> `FRAMES`
  * `Audio` -> `CLIPS`
  * `Prompt` -> `STEPS`
  * `Training` -> `EPOCHS`
  * `Custom` -> `ITEMS`
* **Smart Workflow Guidance**: Reordered frontend parameters to prioritize `workflow_type` for an intuitive setup experience.
* **State Persistence**: Node properties automatically save selected configurations, ensuring settings persist across workflow reloads.
* **Robust Error Handling**: Built-in exception monitoring. When interruptions or underlying errors occur, the panel automatically switches to a red `[ ERROR ]` state for reliable debugging and tracking.

---

## 📦 Installation

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

## 🎮 Usage

1. **Add the Node**: Right-click in your ComfyUI workspace, navigate to `utils`, or search for **Universal Timer**.
2. **Configure Workflow Type**: Select your task type from the dropdown menu (e.g., *Image*, *Video*, *Audio*). The frontend unit label will dynamically update to match (e.g., `IMAGES`, `FRAMES`, `CLIPS`).
3. **Connect & Monitor**: Insert it into your execution pipeline to track processing duration, item counts, and real-time execution states.

---

## 📌 Release Notes

### v0.1.0 (Initial Release)
* **Core Functionality**: 
  * Implemented backend (`universal_timer.py`) and frontend (`universal_timer.js`) core logic.
  * Released dynamic mapping supporting Images, Frames, Clips, Steps, Epochs, and Custom items.
* **UI & Experience**: 
  * Standardized industrial ALL CAPS status indicators.
  * Optimized parameter ordering to prioritize `workflow_type`.
* **Stability**: 
  * Added robust `execution_error` state handling and state persistence.

---

## 📜 License

This project is licensed under the [MIT License](LICENSE).