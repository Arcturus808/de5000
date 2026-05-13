---
description: Build a production release of the Tauri desktop app (portable .exe or installer)
---

# Build Tauri Production Release

1. Stop any running dev server or Tauri process:
```powershell
Get-Process -Name "de5000*" -ErrorAction SilentlyContinue | Stop-Process -Force
```

2. For a **portable .exe only** (no installer):
```powershell
npx tauri build --no-bundle
```
Run from: `d:\Coding Projects\DE5000\de5000-tauri`

Output: `src-tauri\target\release\de5000-tauri.exe` (~8 MB)

3. For a **full bundle** (MSI installer + NSIS):
```powershell
npx tauri build
```
Run from: `d:\Coding Projects\DE5000\de5000-tauri`

Output: `src-tauri\target\release\bundle\`

### Troubleshooting

- **File-locking errors during build**: rust-analyzer or Windows Defender may lock `.o` files. Fix:
  - Kill rust-analyzer: `Get-Process -Name "rust-analyzer*" -ErrorAction SilentlyContinue | Stop-Process -Force`
  - Use single-threaded build: append `-- -- -j 1` to the build command
  - Add Defender exclusion (run as admin): `Add-MpPreference -ExclusionPath "D:\Coding Projects\DE5000\de5000-tauri\src-tauri\target"`
