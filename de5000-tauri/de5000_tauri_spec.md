# DE-5000 LCR Meter Monitor — Tauri Desktop Application Specification

## 1. Project Overview

A cross-platform desktop application for real-time monitoring of the DER EE DE-5000 LCR Meter via USB serial connection. Built with Tauri v2 (Rust backend) and SvelteKit (frontend).

### 1.1 Key Difference from Web App

The original web application used the **Web Serial API** for browser-based serial communication. Since Tauri's WebView2 does not support Web Serial API, all serial communication is handled by a **Rust backend** using the `serialport` crate. The frontend communicates with the backend via Tauri's **IPC (invoke/listen)** mechanism.

## 2. Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Backend | Rust + Tauri v2 | Native serial I/O, window management |
| Frontend | SvelteKit + Vite | UI rendering, data display |
| Serial | `serialport` crate (v4) | Native serial port access |
| IPC | Tauri commands + events | Frontend ↔ Backend communication |
| Build | Cargo + npm | Dual build system |

### 2.1 Dependencies

**Rust (src-tauri/Cargo.toml):**
- `tauri` v2.11 — application framework (pinned to match NPM `@tauri-apps/api`)
- `serde` v1 (with derive) — serialization
- `serde_json` v1 — JSON handling
- `serialport` v4 — native serial port access

**Node (package.json):**
- `@tauri-apps/api` v2.11 — frontend IPC bridge (pinned to match Rust `tauri` crate)
- `@tauri-apps/plugin-dialog` v2 — native save/open dialog
- `@tauri-apps/plugin-fs` v2 — filesystem write access for export
- `exceljs` — Excel (.xlsx) generation with styled headers and auto-fit columns
- `@sveltejs/kit` v2 — frontend framework
- `@sveltejs/adapter-static` v3 — static site generation for Tauri
- `svelte` v5, `vite` v6 — build tooling

## 3. Architecture

```
┌─────────────────────────────────────────────┐
│                 Tauri Window                 │
│  ┌───────────────────────────────────────┐  │
│  │           SvelteKit Frontend          │  │
│  │                                       │  │
│  │  Stores ←── connection.js ←── IPC     │  │
│  │    ↓                          ↑       │  │
│  │  Components (UI)        invoke/listen │  │
│  └───────────────────┬───────────────────┘  │
│                      │ Tauri IPC             │
│  ┌───────────────────┴───────────────────┐  │
│  │            Rust Backend               │  │
│  │                                       │  │
│  │  serial.rs → serialport crate → USB   │  │
│  │  notify.rs → ntfy sidecar → LAN       │  │
│  │    ↓                                  │  │
│  │  Packet validation → emit events      │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

## 4. Rust Backend

### 4.1 Module Structure

```
src-tauri/src/
├── main.rs      — Entry point, launches Tauri app
├── lib.rs       — Plugin registration, state management
├── serial.rs    — Serial port commands and read loop
└── notify.rs    — ntfy sidecar management (start/stop/publish)
```

### 4.2 Tauri Commands (IPC)

| Command | Parameters | Returns | Description |
|---------|-----------|---------|-------------|
| `list_ports` | none | `Vec<PortInfo>` | Lists available serial ports with type info |
| `connect` | `port_name: String` | `Result<(), String>` | Opens serial port and starts read loop |
| `disconnect` | none | `Result<(), String>` | Stops the read loop |
| `ntfy_start` | `port: u16, topic: String` | `NtfyStatus` | Starts ntfy sidecar server |
| `ntfy_stop` | none | `NtfyStatus` | Stops ntfy sidecar server |
| `ntfy_status` | none | `NtfyStatus` | Returns running state, port, topic, subscribe URL |
| `ntfy_publish` | `title, message, priority` | `Result<(), String>` | Publishes push notification via local ntfy |

### 4.3 Tauri Events (Backend → Frontend)

| Event | Payload | Description |
|-------|---------|-------------|
| `serial-packet` | `Vec<u8>` (17 bytes) | Validated DE-5000 data packet |
| `serial-error` | `String` | Serial read error message |
| `serial-disconnected` | `()` | Backend disconnected (port closed or error) |

### 4.4 Serial Configuration

| Parameter | Value |
|-----------|-------|
| Baud Rate | 9600 |
| Data Bits | 8 |
| Parity | None |
| Stop Bits | 1 |
| DTR | true |
| RTS | false |
| Timeout | 1000ms |

### 4.5 Packet Protocol

- **Packet length**: 17 bytes
- **Header**: `[0x00, 0x0D]`
- **Footer**: `[0x0D, 0x0A]`
- The Rust backend validates header/footer and packet length before emitting to the frontend
- Packet parsing (byte-level protocol decode) is done in the frontend JavaScript (`protocol.js`)

### 4.6 State Management (Rust)

`SerialState` is managed via Tauri's state system:
- `reading: Arc<AtomicBool>` — controls the read loop lifecycle
- The read loop runs on a separate `std::thread` to avoid blocking

## 5. Frontend

### 5.1 File Structure

```
src/
├── app.html                          — HTML shell
├── app.css                           — Global styles, @font-face (local fonts)
├── static/
│   └── fonts/                        — Bundled woff2 fonts (offline, no CDN)
├── routes/
│   ├── +layout.svelte                — Root layout (imports CSS)
│   ├── +layout.js                    — SSR=false, prerender=true
│   └── +page.svelte                  — Main application page
└── lib/
    ├── serial/
    │   ├── protocol.js               — DE-5000 packet parser (ES51919)
    │   │   └── connection.js             — Tauri IPC bridge (invoke/listen, with dev-mode readiness handling + PC link watchdog)
       ├── stores/
    │   │   ├── device.js                 — Svelte stores for app state
    │   │   ├── settings.js               — Typeface, color, palette, ntfy config stores (localStorage)
│   │   └── alerts.js                 — Alert thresholds, checking, and Web Audio alarm (localStorage)
    ├── utils/
│   ├── format.js                 — Display value formatting
│   ├── export.js                 — CSV/Excel/JSON export via native save dialog
│   └── notify.js                 — ntfy sidecar management (Tauri invoke wrappers)
    └── components/
        ├── Header.svelte             — Title + inline port selector/connect + PC Link indicator
        ├── MeasurementCard.svelte    — Combined primary/secondary value display (stacked, no flash animation)
        ├── InfoPanel.svelte          — Frequency, status, tolerance, modes
        ├── MeasurementDetails.svelte — Detailed readings with tooltips
        ├── Chart.svelte              — Dual canvas charts (primary + secondary, 60 points each) + logging/export/clear + inline stats + alert checking
        ├── AlertModal.svelte        — Alert threshold configuration modal (high/low per measurement)
        ├── Toast.svelte              — Error/success messages
        ├── Settings.svelte           — Typeface & color customization modal
        ├── TypefaceDropdown.svelte   — Reusable dropdown with in-font preview
        ├── ColorDropdown.svelte     — Color palette dropdown with custom color support
        └── Footer.svelte             — Credits
```

### 5.2 Connection Flow (Tauri vs Web Serial)

**Web App (original):**
```
User clicks Connect → navigator.serial.requestPort() → browser picker → port.open() → reader.read() loop
```

**Tauri App (this project):**
```
User selects port from dropdown → invoke('connect', { portName }) → Rust opens port → Rust read loop → emit('serial-packet') → listen() in JS
```

### 5.2.1 IPC Bridge Readiness

During development (`tauri dev`), the Svelte frontend may load before the Tauri IPC bridge is fully initialized. The `connection.js` module handles this by:

1. **Detecting Tauri context** — `isTauri()` checks for `window.__TAURI_INTERNALS__` or `window.__TAURI__`. If neither exists (e.g., running in a regular browser), IPC calls return `null` silently.
2. **Polling for `invoke`** — `tauriInvoke()` polls `window.__TAURI_INTERNALS__.invoke` every 100ms for up to 10 seconds, waiting for the bridge to become ready before making calls.
3. **Direct global resolution** — Avoids the `@tauri-apps/api/core` wrapper import, which itself reads `__TAURI_INTERNALS__` internally and crashes if the bridge isn't ready. Instead, `getInvoke()` resolves the `invoke` function directly from the window globals.

This ensures the Tauri desktop app works reliably during hot-reload development, while the browser preview at `localhost:5173` degrades gracefully without errors.

### 5.3 Svelte Stores

| Store | Type | Description |
|-------|------|-------------|
| `connected` | `writable(bool)` | Connection status |
| `logging` | `writable(bool)` | Whether data logging is active |
| `lastMeasurement` | `writable(object)` | Most recent parsed measurement |
| `timestamp` | `writable(string)` | Last update time |
| `dataLog` | `writable(array)` | All logged measurements |
| `chartData` | `writable(object)` | Last 60 primary data points for charting |
| `secChartData` | `writable(object)` | Last 60 secondary data points for charting |
| `availablePorts` | `writable(array)` | Serial ports from `list_ports` |
| `selectedPort` | `writable(string)` | Currently selected port name |
| `errorMessage` | `writable(string)` | Active error message |
| `successMessage` | `writable(string)` | Temporary success message |
| `statistics` | `derived` | Min/max/avg/stddev from chartData |
| `secStatistics` | `derived` | Min/max/avg/stddev from secChartData |
| `activeModes` | `derived` | Active measurement modes |
| `alerts` | `writable(object)` | Alert thresholds (primaryHigh/Low, secondaryHigh/Low) with localStorage |
| `ntfyEnabled` | `writable(bool)` | Push notifications on/off (localStorage) |
| `ntfyPort` | `writable(number)` | ntfy server port, default 8090 (localStorage) |
| `ntfyTopic` | `writable(string)` | ntfy topic name, default `de5000-alerts` (localStorage) |
| `ntfyOncePerCrossing` | `writable(bool)` | Notify once per threshold crossing, default true (localStorage) |

### 5.4 Controls Component (Port Selection)

Unlike the web app (which uses the browser's serial port picker), the Tauri app provides:
- A `<select>` dropdown populated by `list_ports` command
- A refresh button (↻) to re-scan ports
- Port entries display name and type (e.g., `COM3 — USB (FTDI)`)

## 6. Data Protocol (Cyrustek ES51919)

Identical to the web app. See `protocol.js` for full implementation.

### 6.1 Packet Structure (17 bytes)

| Offset | Content |
|--------|---------|
| 0x00–0x01 | Header (0x00, 0x0D) |
| 0x02 | Flags (parallel, auto_range, lcr_auto, sorting, cal, delta, ref) |
| 0x03 | Frequency (bits 7–5) |
| 0x04 | Tolerance |
| 0x05 | Measurement quantity |
| 0x06–0x07 | Main value (16-bit) |
| 0x08 | Main units (bits 7–3) + decimal (bits 2–0) |
| 0x09 | Main status |
| 0x0A | Secondary quantity |
| 0x0B–0x0C | Secondary value (16-bit) |
| 0x0D | Secondary units (bits 7–3) + decimal (bits 2–0) |
| 0x0E | Secondary status |
| 0x0F–0x10 | Footer (0x0D, 0x0A) |

### 6.2 Display Formatting

Per DE-5000 Manual Section 3.2 — no scientific notation, uses unit prefixes. See `format.js`.

## 7. Build & Distribution

### 7.1 Development

```bash
npm run tauri dev
```
- Starts Vite dev server on `http://localhost:5173`
- Compiles and runs Rust backend
- Hot-reload for frontend changes

> **Note:** The Vite dev server also runs at `http://localhost:5173` in a regular browser, but the Tauri IPC bridge (`window.__TAURI_INTERNALS__`) is only available inside the Tauri WebView. The frontend code detects this and silently skips IPC calls when not in a Tauri context. This means the browser preview will show an empty port list but no errors.

### 7.2 Production Build

```bash
npm run tauri build --no-bundle    # Portable .exe only
npm run tauri build                # Full bundle (MSI + NSIS installer)
```

Output: `src-tauri/target/release/de5000-tauri.exe` (~18 MB)

### 7.3 Prerequisites

- **Runtime**: Windows 10/11 with WebView2 (pre-installed)
- **Build**: Rust toolchain (rustup), Node.js, npm

### 7.4 Windows Defender Note

Add a Defender exclusion for the build target directory to prevent file-locking during compilation:
```powershell
Add-MpPreference -ExclusionPath "path\to\src-tauri\target"
```

## 8. Capabilities & Security

Defined in `src-tauri/capabilities/default.json`:
- `core:default` — standard Tauri permissions
- `dialog:default`, `dialog:allow-save` — native save dialog for export
- `fs:default`, `fs:allow-write-file` — write exported files to user-chosen path

No inbound network access required for core functionality. The ntfy sidecar listens on a configurable port (default 8090) for LAN push notifications and makes outbound requests to `ntfy.sh` for iOS APNS relay. All fonts are bundled locally.

## 9. UI Design

Identical to the web app:
- Dark theme with green (#00ff00) accent
- Monospace font (Courier New) for readouts; Roboto for buttons and dropdowns
- No flash animation on value changes (code retained for future use)
- Combined MeasurementCard with primary & secondary stacked vertically; quantity stacked above units
- 3-column top grid: MeasurementCard | InfoPanel | MeasurementDetails
- Dual canvas charts: primary (green #00ff00) and secondary (cyan #00ccff), each 150px, last 60 readings
- Secondary chart toggle ("Show/Hide Secondary") persisted in localStorage
- Inline stats (Min, Max, Avg, σ) below each chart canvas
- Inline status indicators: pulsing orange "● Data Logging Active" and green "✓ Data Log Cleared" (2s timeout)
- Alert system: configurable high/low thresholds per measurement, Web Audio double-beep alarm, red border flash, pulsing ⚠ ALERT badge
- Push notifications: ntfy sidecar server with once-per-crossing option, includes measured value and threshold in notification body
- PC Link indicator with watchdog timeout (800ms) — shows ON/OFF status and tooltip for troubleshooting
- Inline port selector, refresh, and connect/disconnect in header status bar (colored dot + controls)
- Window: 1200×900, centered, min 800×700, resizable
- Responsive layout (desktop-optimized)

### 9.1 Alert Modal

Opened via 🔔 button in the primary chart header row. Overlay + centered modal (min-width 380px).

**Primary Measurement** section (always shown):
- High threshold: toggle + number input
- Low threshold: toggle + number input
- Units hint from current measurement

**Secondary Measurement** section (shown only when secondary chart visible):
- High threshold: toggle + number input
- Low threshold: toggle + number input
- Units hint from current measurement

**Alert behavior:**
- Web Audio API double-beep (880Hz sine, 0.3 gain) with 3-second cooldown
- Red border flash on primary chart container (500ms)
- Pulsing red "⚠ ALERT" badge next to chart title while condition persists
- Auto-clears when measurement returns within thresholds
- Alert thresholds and enabled state persisted in localStorage (`de5000-alerts`)

### 9.2 Settings Modal

Typeface, color, and push notification customization via dropdowns and toggles:

**Push Notifications** (ntfy):
- Enable/disable toggle — starts/stops ntfy sidecar server
- Subscribe URL display (auto-detected LAN IP)
- Port and topic configuration
- Once-per-crossing toggle (default on) — only notify once per threshold crossing
- Test notification button — sends a test message to verify the full pipeline (server → LAN → phone)
- Error display for troubleshooting

**Typeface & Color Dropdowns:**

**Typeface Dropdowns** (2):
- Display Typeface (default: Roboto) — labels, titles, UI text, units
- Main Value Typeface (default: Roboto) — measurement readout values

**Color Dropdowns** (4) with curated palettes and custom color support:

| Setting | Default |
|---------|---------|
| Readout Color | `#00ff00` (Green) |
| Label Color | `#cccccc` (Light Gray) |
| App Title Color | `#ddaa00` (Gold) |
| Card Title Color | `#ffffff` (White) |

**Curated Palettes:**
- Primary (8): Green, Cyan, Blue, Red, Orange, Yellow, Magenta, Lime
- Secondary (8): Teal, Sky, Indigo, Rose, Amber, Gold, Violet, Mint
- Neutral (6): White, Light Gray, Gray, Dim Gray, Dark Gray, Silver

**Custom Colors:** Named custom colors persisted in localStorage, with add/remove UI.

**Dropdown UX:** Fixed positioning escapes modal clipping, auto-flips upward near viewport bottom, trigger border-radius adapts to match adjacent menu corners (rounded bottom when menu opens above, rounded top when below), mutual exclusion (opening one closes others), clicking anywhere on the modal (header, separator, labels) closes open dropdowns, clicking another dropdown while one is open closes the first and opens the second in a single click, Escape key closes.

## 10. Future Enhancements

- Auto-detect DE-5000 port on connect
- Multiple device support
- Data persistence (SQLite via Tauri plugin)
- System tray integration
- Auto-update (Tauri updater plugin)

## 11. Push Notifications (ntfy)

The app embeds an ntfy-rs server as a background thread (single binary, no external process), enabling instant push notifications to phones when alerts trigger.

### 11.1 How It Works

```
DE-5000 App → Alert triggers → ntfy_publish() → embedded ntfy-rs server → LAN → Phone
```

For iOS, the ntfy server relays poll requests through `ntfy.sh` → APNS for instant delivery despite iOS background restrictions. **An internet connection is required on both the PC and the iPhone** — without internet, iOS notifications will not be delivered (Android works on LAN only). This is unavoidable due to how Apple's push notification system works: iOS apps cannot receive LAN-only push notifications. Only a lightweight poll request is relayed through `ntfy.sh`; no notification content (title, message, priority) is sent to the external server.

### 11.2 ntfy-rs Server Configuration

The server is configured programmatically via `ntfy_rs::Config`:

- `listen_http` — HTTP listen address (e.g. `:2586`)
- `base_url` — Required for iOS; tells the server its own address
- `upstream_base_url` — Relays iOS poll requests through ntfy.sh → APNS

The standalone `ntfy-rs` CLI binary uses the same flags: `ntfy-rs serve --listen-http :<port> --base-url http://<local-ip>:<port> --upstream-base-url https://ntfy.sh`

### 11.3 Notification Format

Notifications include the alert name, measured value, and threshold:

> **DE-5000 Alert** — Primary ≥ 1.023 (threshold 1.0)

### 11.4 Windows Firewall

On first launch, Windows Defender Firewall will prompt. Check **Private networks**, uncheck **Public networks**, click **Allow**.

If the prompt was missed, run in elevated PowerShell:
```powershell
Set-NetConnectionProfile -Name "<NetworkName>" -NetworkCategory Private
Get-NetFirewallRule | Where-Object { $_.DisplayName -like "*ntfy*" -or $_.DisplayName -like "*DE-5000*" } | Remove-NetFirewallRule
New-NetFirewallRule -DisplayName "DE-5000 ntfy Server" -Direction Inbound -Protocol TCP -LocalPort 8090,2586 -Action Allow -Profile Private
```

If the port is changed in Settings, the firewall rule must be updated to include the new port.
