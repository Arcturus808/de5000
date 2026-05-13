# ⚡ DE-5000 LCR Meter Monitor — SvelteKit SPA

A **SvelteKit single-page application** for real-time monitoring of the DER EE DE-5000 LCR Meter via the Web Serial API. A modular, component-based rewrite of the [single-file HTML version](https://github.com/USERNAME/de5000-base).

![Chrome](https://img.shields.io/badge/Chrome-89+-green)
![Edge](https://img.shields.io/badge/Edge-89+-blue)
![SvelteKit](https://img.shields.io/badge/SvelteKit-v2-orange)
![License](https://img.shields.io/badge/license-MIT-green)

## Features

- **Real-time measurement display** — primary and secondary values
- **Customizable typefaces** — choose display and readout fonts (Courier New, Poppins, Roboto, Open Sans, LED Segment) with live preview; all fonts bundled locally (offline)
- **Customizable colors** — curated palette dropdowns (Primary, Secondary, Neutral) with custom color naming and storage
- **Data logging** — record measurements with timestamps
- **Dual charts** — primary (green) and secondary (cyan) real-time canvas charts, each showing last 60 readings with inline stats
- **Alerts** — configurable high/low thresholds with Web Audio alarm and visual flash
- **Push notifications** — instant alerts to your phone via ntfy (available in the [Tauri desktop app](https://github.com/USERNAME/de5000-tauri))
- **Export** — download logged data as CSV (default), Excel (.xlsx), or JSON
- **Measurement modes** — Auto Range, LCR Auto, Delta, Calibration, Sorting, Parallel
- **Tooltips** — info icons with measurement parameter descriptions
- **Component architecture** — modular Svelte components with reactive stores

## Screenshot

<!-- TODO: Add screenshot -->

## Requirements

- **Chrome 89+** or **Edge 89+** (Web Serial API support required)
- DE-5000 LCR Meter connected via USB serial adapter

### To Build
- [Node.js](https://nodejs.org/) (v18+)
- npm

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in Chrome or Edge, then:

1. Click **Connect**
2. Select the serial port in the browser picker
3. Measurements will appear in real-time

### Static Build

```bash
npm run build
```

Output is in `build/` — deploy to any static host or open `build/index.html` directly.

## Architecture

Built with **SvelteKit** using `@sveltejs/adapter-static` for SPA mode (SSR disabled, prerendered). Uses the Web Serial API for direct browser-to-device communication.

### Project Structure

```
src/
├── app.html                          — HTML shell
├── app.css                           — Global styles, @font-face (local fonts)
├── routes/
│   ├── +layout.svelte                — Root layout
│   ├── +layout.js                    — SPA config (ssr=false)
│   └── +page.svelte                  — Main application page
├── static/
│   └── fonts/                        — Bundled woff2 fonts (offline)
└── lib/
    ├── serial/
    │   ├── protocol.js               — ES51919 packet parser
    │   └── connection.js             — Web Serial API bridge
    ├── stores/
    │   ├── device.js                 — Svelte stores (state management)
    │   ├── settings.js               — Typeface, color, palette & custom color stores (localStorage)
    │   └── alerts.js                 — Alert thresholds, checking, and Web Audio alarm (localStorage)
    ├── utils/
    │   ├── format.js                 — Display value formatting
    │   └── export.js                 — CSV/Excel/JSON export
    └── components/
        ├── Header.svelte             — Title + connection status + connect/disconnect button + settings
        ├── Controls.svelte           — (unused — actions moved to Header and Chart)
        ├── MeasurementCard.svelte    — Combined primary/secondary value display (stacked)
        ├── InfoPanel.svelte          — Frequency, status, tolerance, modes
        ├── MeasurementDetails.svelte — Detailed readings with tooltips
        ├── Chart.svelte              — Dual canvas charts + logging/export/clear + inline stats + alert checking
        ├── AlertModal.svelte         — Alert threshold configuration modal
        ├── Settings.svelte           — Typeface & color customization modal
        ├── TypefaceDropdown.svelte   — Reusable dropdown with in-font preview
        ├── ColorDropdown.svelte     — Color palette dropdown with custom color support
        ├── Toast.svelte              — Error/success messages
        └── Footer.svelte             — Credits
```

### Key Technologies

| Layer | Technology |
|-------|-----------|
| Framework | SvelteKit v2 + Vite v6 |
| Serial | Web Serial API |
| State | Svelte writable/derived stores |
| Theming | CSS custom properties + localStorage persistence |
| Fonts | Bundled woff2 (local `/fonts/`): Roboto, Open Sans, Poppins, DSEG14 |
| Charting | Canvas API |
| Adapter | @sveltejs/adapter-static |

## Protocol

The DE-5000 uses the **Cyrustek ES51919** chipset. Each data packet is 17 bytes with a `0x00 0x0D` header and `0x0D 0x0A` footer. Values are formatted per DE-5000 Manual Section 3.2 (no scientific notation).

## Related Projects

- [de5000-base](https://github.com/USERNAME/de5000-base) — Original single-file HTML version
- [de5000-tauri](https://github.com/USERNAME/de5000-tauri) — Tauri desktop app (native serial via Rust backend)

## Credits

- Original serial protocol code by [4x1md](https://github.com/4x1md) (2017)
- DE-5000 LCR Meter by DER EE

## License

MIT
