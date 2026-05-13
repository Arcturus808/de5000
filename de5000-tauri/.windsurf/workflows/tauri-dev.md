---
description: Start the Tauri desktop app in development mode with hot-reload
---

# Start Tauri Dev Mode

1. Make sure no existing dev server or Tauri process is running:
```powershell
Get-Process -Name "de5000*" -ErrorAction SilentlyContinue | Stop-Process -Force
```

// turbo
2. Start the Tauri dev environment (Vite + Rust backend):
```powershell
npm run tauri dev
```
Run from: `d:\Coding Projects\DE5000\de5000-tauri`

This will:
- Start the Vite dev server on http://localhost:5173
- Compile the Rust backend (if needed)
- Open the Tauri desktop window
- Enable hot-reload for frontend changes

3. To stop, close the Tauri window or press Ctrl+C in the terminal.
