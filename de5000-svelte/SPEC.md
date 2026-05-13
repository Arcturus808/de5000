# DE-5000 LCR Meter Monitor — Specification

## Overview

A browser-based real-time monitor for the **Deree DE-5000 LCR meter**, built with **SvelteKit** and the **Web Serial API**. The app connects to the meter via USB-serial, parses its 17-byte binary protocol, and displays live measurements with customizable typefaces and colors.

**Browser support:** Chrome 89+, Edge 89+ (Web Serial API required).

---

## Architecture

```
src/
├── app.html              # HTML shell
├── app.css               # Global styles, CSS custom properties, @font-face (local fonts)
├── static/
│   └── fonts/             # Bundled woff2 font files (offline, no CDN)
├── lib/
│   ├── components/
│   │   ├── Header.svelte          # App title, connection status + connect/disconnect button, timestamp, settings trigger
│   │   ├── Controls.svelte        # (unused — connect/disconnect moved to Header; logging/export/clear moved to Chart)
│   │   ├── Toast.svelte           # Error/success notification banners
│   │   ├── MeasurementCard.svelte # Combined primary & secondary measurement readouts (stacked)
│   │   ├── InfoPanel.svelte       # Frequency, status, tolerance, active modes
│   │   ├── MeasurementDetails.svelte  # Detailed readings with tooltips
│   │   ├── Chart.svelte           # Dual canvas charts (primary + secondary, 60 points each) + logging/export/clear + inline stats + alert checking
│   │   ├── AlertModal.svelte      # Alert threshold configuration modal (high/low per measurement)
│   │   ├── Settings.svelte        # Modal with typeface & color customization
│   │   ├── TypefaceDropdown.svelte # Reusable dropdown with in-font preview
│   │   ├── ColorDropdown.svelte   # Color palette dropdown with custom color support
│   │   └── Footer.svelte          # Browser requirement & attribution
│   ├── serial/
│   │   ├── connection.js  # Web Serial API connect/disconnect/read loop
│   │   └── protocol.js    # Packet parsing, constants, normalization
│   ├── stores/
│   │   ├── device.js      # Device state, measurement data, logging, statistics
│   │   ├── settings.js    # Typeface, color, palette & custom color stores with localStorage persistence
│   │   └── alerts.js     # Alert thresholds, checking, and Web Audio alarm with localStorage persistence
│   └── utils/
│       ├── format.js      # Value formatting per DE-5000 manual §3.2
│       └── export.js      # CSV/Excel/JSON data export
└── routes/
    └── +page.svelte       # Main page layout
```

---

## Serial Protocol

### Connection

- **Baud rate:** 9600, 8N1
- **Flow control:** DTR=true, RTS=false
- **API:** Web Serial (`navigator.serial.requestPort()`)

### Packet Format

17 bytes per measurement:

| Offset | Length | Content |
|--------|--------|---------|
| 0x00–0x01 | 2 | Header: `0x00 0x0D` |
| 0x02 | 1 | Flags byte (parallel, auto-range, LCR auto, sorting, calibration, delta, ref) |
| 0x03 | 1 | Frequency index (bits 5–7) |
| 0x04 | 1 | Tolerance index |
| 0x05 | 1 | Main quantity index |
| 0x06–0x07 | 2 | Main value (big-endian uint16) |
| 0x08 | 1 | Main multiplier (bits 0–2) + units index (bits 3–7) |
| 0x09 | 1 | Main status index (bits 0–3) |
| 0x0A | 1 | Secondary quantity index |
| 0x0B–0x0C | 2 | Secondary value (big-endian uint16, signed for %/deg) |
| 0x0D | 1 | Secondary multiplier (bits 0–2) + units index (bits 3–7) |
| 0x0E | 1 | Secondary status index (bits 0–2) |
| 0x0F–0x10 | 2 | Footer: `0x0D 0x0A` |

### Lookup Tables

- **Frequencies:** 100 Hz, 120 Hz, 1 KHz, 10 KHz, 100 KHz, DC
- **Tolerances:** ±0.25%, ±0.5%, ±1%, ±2%, ±5%, ±10%, ±20%, -20+80%
- **Main quantities (series):** Ls, Cs, Rs, DCR
- **Main quantities (parallel):** Lp, Cp, Rp, DCR
- **Secondary quantities:** D, Q, ESR, Θ (Theta), Rp
- **Units:** Ohm, kOhm, MOhm, uH, mH, H, kH, pF, nF, uF, mF, %, deg
- **Status values:** normal, blank, ----, OL, PASS, FAIL, OPEn, Srt

### Value Decoding

Main/secondary values are decoded as: `raw_uint16 × 10^(-multiplier)`

For % and deg units, if bit 12 of the raw secondary value is set, the value is treated as signed (two's complement).

### Normalization

Values are normalized to base SI units (Ohm → Ohm, kOhm → 1000 Ohm, uF → 1e-6 F, etc.) for statistical calculations.

---

## Data Flow

```
DE-5000 ──USB──> Web Serial API
                    │
                    ▼
              connection.js (read loop)
                    │
                    ▼
              protocol.js (parsePacket)
                    │
                    ▼
              device.js stores
              ├── lastMeasurement ──> MeasurementCard, InfoPanel, MeasurementDetails, Chart (alert checking)
              ├── chartData ────────> Chart (primary canvas, last 60 points)
              ├── secChartData ─────> Chart (secondary canvas, last 60 points)
              ├── statistics ───────> Chart (inline: min/max/avg/stddev)
              ├── secStatistics ────> Chart (inline: min/max/avg/stddev)
              ├── dataLog ──────────> Chart (export CSV/Excel/JSON)
              ├── connected ────────> Header, Chart
              ├── alerts ───────────> AlertModal, Chart (alert checking + sound)
              └── activeModes ──────> InfoPanel (derived from lastMeasurement)
```

---

## UI Layout

### Header
- App title (⚡ DE-5000 LCR Meter Monitor) — styled with `--app-title-color` and `--readout-font`
- Connection status indicator (● Connected / ● Disconnected)
- **Connect** / **Disconnect** button (inline with status indicator, Roboto font)
- Timestamp of last reading
- Settings gear icon (opens modal)

### Top Grid (3-column)
1. **MeasurementCard** — combined primary & secondary measurements stacked vertically; quantity stacked above units next to value; no flash animation
2. **InfoPanel** — frequency/status/tolerance row above active modes badges
3. **MeasurementDetails** — detailed readings with info tooltips (blue-bordered card)

### Chart Card
- **Primary chart**: canvas-based line chart (green #00ff00) of last 60 primary values with grid and y-axis labels, 150px height
- **Secondary chart**: canvas-based line chart (cyan #00ccff) of last 60 secondary values, 150px height, toggled via "Show/Hide Secondary" button
- **Inline stats** below each canvas: Min, Max, Avg, σ (color-coded to match chart)
- **Alert system**: 🔔 button opens AlertModal; configurable high/low thresholds per measurement; Web Audio double-beep alarm (880Hz, 3s cooldown); red border flash; pulsing ⚠ ALERT badge
- **Inline status indicators** — pulsing orange "● Data Logging Active" and green "✓ Data Log Cleared" (2s timeout) between title and action buttons
- **Action buttons** (Roboto font, visible when connected):
  - **Start Logging** / **Stop Logging** toggle
  - **Export Data** button + format dropdown (CSV / Excel / JSON)
  - **Clear Log** button with confirmation

### Footer
- Browser requirement notice
- Attribution

---

## Settings Modal

Opened via gear icon in the header. Overlay + centered modal (min-width 420px).

Modal body text uses **Open Sans** (overrides the Courier New body default). The color hex display (`.color-hex`) retains `'Courier New', monospace`.

### Typeface Settings

Two independent typeface selectors using `TypefaceDropdown` component:

| Setting | Description | CSS Variable | Applies To |
|---------|-------------|--------------|------------|
| Display Typeface | Labels, titles, other UI text | `--readout-font` | Labels, card titles, info values, chart title, statistics |
| Main Value Typeface | Primary & secondary readouts | `--main-value-font` | Large measurement values |

**Available typefaces:**
- Courier New (monospace, default)
- Poppins (sans-serif, bundled)
- Roboto (sans-serif, bundled)
- Open Sans (sans-serif, bundled)
- LED Segment (DSEG14-Classic-Italic, bundled — mimics 14-segment LED display)

**Dropdown UX:**
- Trigger shows current selection rendered in its font (name + specimen "0123.456")
- Clicking trigger opens dropdown; opening one closes the other
- Clicking outside (via transparent backdrop) closes dropdown and absorbs the click
- Escape key closes dropdown and returns focus to trigger
- Tabbing away closes dropdown
- Selecting an option applies it and closes dropdown
- Close button (✕) closes any open dropdown and the modal in one click

### Color Settings

Four color selectors using `ColorDropdown` component with curated palettes and custom color support:

| Setting | Description | CSS Variable | Default |
|---------|-------------|--------------|---------|
| Readout Color | Measurement values, titles, highlights | `--readout-color` | `#00ff00` (Green) |
| Label Color | Labels, units, secondary text | `--label-color` | `#cccccc` (Light Gray) |
| App Title Color | Main header title | `--app-title-color` | `#ddaa00` (Gold) |
| Card Title Color | Section and card headings | `--card-title-color` | `#ffffff` (White) |

**Curated Palettes:**
- **Primary** (8 colors): Green, Cyan, Blue, Red, Orange, Yellow, Magenta, Lime
- **Secondary** (8 colors): Teal, Sky, Indigo, Rose, Amber, Gold, Violet, Mint
- **Neutral** (6 colors): White, Light Gray, Gray, Dim Gray, Dark Gray, Silver

Palette groups are separated by dividers; group labels are hidden except for "Custom".

**Custom Colors:**
- Users can add named custom colors via an inline form with a native color picker and name input
- Custom colors are persisted in localStorage and appear in a "Custom" group with a remove button (✕)

**Dropdown UX:**
- Trigger shows color swatch, color name (if matched), and hex value
- Dropdown uses `position: fixed` to escape modal clipping
- Auto-flips upward when near the bottom of the viewport
- `max-height: 80vh` with scroll for long palettes
- Opening one dropdown closes all others
- Escape key and outside click close the dropdown
- Clicking another dropdown while one is open closes the first and opens the second in a single click

---

## Persistence

All settings persist in `localStorage`:

| Key | Default |
|-----|---------|
| `de5000-typeface` | `Roboto` |
| `de5000-main-value-typeface` | `Roboto` |
| `de5000-readout-color` | `#00ff00` (Green) |
| `de5000-label-color` | `#cccccc` (Light Gray) |
| `de5000-app-title-color` | `#ddaa00` (Gold) |
| `de5000-card-title-color` | `#ffffff` (White) |
| `de5000-custom-colors` | `[]` |
| `de5000-show-secondary` | `false` |
| `de5000-alerts` | `{ primaryHigh: {enabled: false, value: ''}, primaryLow: {enabled: false, value: ''}, secondaryHigh: {enabled: false, value: ''}, secondaryLow: {enabled: false, value: ''} }` |

---

## Value Formatting

Per DE-5000 manual §3.2 — no scientific notation, uses unit prefixes:

| Unit | Range | Decimal Places |
|------|-------|----------------|
| %, deg | ≥10 → 1dp, ≥1 → 2dp, <1 → 3dp | |
| (dimensionless) | ≥100 → 1dp, ≥10 → 2dp, ≥1 → 3dp, <1 → 4dp | |
| Ohm | ≥100 → 2dp, ≥10 → 3dp, <10 → 3dp | |
| kOhm | ≥100 → 2dp, ≥10 → 3dp, <10 → 4dp | |
| MOhm | ≥100 → 1dp, ≥10 → 3dp, <10 → 4dp | |
| pF | ≥1000 → 1dp, ≥100 → 2dp, <100 → 2dp | |
| nF | ≥1000 → 1dp, ≥100 → 2dp, ≥10 → 3dp, <10 → 3dp | |
| uF | ≥1000 → 1dp, ≥100 → 2dp, ≥10 → 3dp, <10 → 3dp | |
| mF | always 2dp | |
| uH | ≥1000 → 1dp, ≥100 → 2dp, ≥10 → 3dp, <10 → 3dp | |
| mH | ≥1000 → 1dp, ≥100 → 2dp, ≥10 → 3dp, <10 → 3dp | |
| H | ≥100 → 1dp, ≥10 → 3dp, <10 → 3dp | |
| kH | always 3dp | |

---

## Data Export

### CSV Format
Columns: Timestamp, Primary Quantity, Primary Value, Primary Units, Secondary Quantity, Secondary Value, Secondary Units, Frequency, Tolerance, Parallel, Auto Range, LCR Auto, Delta Mode

### JSON Format
Array of log entry objects with the same fields as CSV columns.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | SvelteKit 2.x with Svelte 5 |
| Build | Vite 6.x |
| Adapter | `@sveltejs/adapter-static` |
| Serial | Web Serial API (native browser) |
| Fonts | Bundled woff2 (local `/fonts/`): Roboto, Open Sans, Poppins, DSEG14 |
| Rendering | Canvas 2D (chart), CSS custom properties (theming) |
| Persistence | localStorage |

---

## Responsive Design

- **Desktop (>768px):** 3-column top grid (MeasurementCard | InfoPanel | MeasurementDetails), chart with inline actions
- **Mobile (≤768px):** Single-column layout, smaller readout font, adjusted tooltip positioning
