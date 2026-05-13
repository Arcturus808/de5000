---
description: Set up the Tauri project from scratch on a new machine
---

# Tauri Project Setup

## Prerequisites

1. **Node.js** (v18+): https://nodejs.org
2. **Rust toolchain**: https://rustup.rs or `winget install Rustlang.Rustup`
3. **WebView2 Runtime** (pre-installed on Windows 10/11)

## Setup Steps

// turbo
1. Install npm dependencies:
```powershell
npm install
```
Run from: `d:\Coding Projects\DE5000\de5000-tauri`

2. Add Windows Defender exclusion for the Rust build directory (run as admin):
```powershell
Add-MpPreference -ExclusionPath "D:\Coding Projects\DE5000\de5000-tauri\src-tauri\target"
```

3. Configure rust-analyzer to use a separate target directory. Ensure this exists in `.vscode/settings.json` at the workspace root:
```json
{
  "rust-analyzer.cargo.targetDir": "target-ra"
}
```

// turbo
4. Verify Rust installation:
```powershell
rustc --version; cargo --version
```

5. Test compilation:
```powershell
cargo check
```
Run from: `d:\Coding Projects\DE5000\de5000-tauri\src-tauri`

6. Run the app in dev mode:
```powershell
npm run tauri dev
```
Run from: `d:\Coding Projects\DE5000\de5000-tauri`
