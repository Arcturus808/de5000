# <img src="../img/de-5000-128.png" width="32" alt="DE-5000 icon"> DE-5000 LCR Meter Monitor — SvelteKit SPA

A **SvelteKit single-page application** for real-time monitoring of the DER EE DE-5000 LCR Meter via the Web Serial API.

[![codecov](https://codecov.io/gh/Arcturus808/de5000/graph/badge.svg?token=9KHDI77OOS)](https://codecov.io/gh/Arcturus808/de5000)
![License](https://img.shields.io/badge/license-MIT-green)
![SvelteKit](https://img.shields.io/badge/SvelteKit-v2-orange)
![Chrome](https://img.shields.io/badge/Chrome-89+-green)
![Edge](https://img.shields.io/badge/Edge-89+-blue)

## Features

- **Real-time measurement display** — primary and secondary values
- **Tabular measurement details** — measured values (main, secondary, model, frequency, tolerance) alongside calculated values (reactance, impedance, ESR, Q, D) derived from the measurement
- **Customizable typefaces** — choose display and readout fonts (Courier New, Poppins, Roboto, Open Sans, LED Segment) with live preview; all fonts bundled locally (offline)
- **Customizable colors** — curated palette dropdowns (Primary, Secondary, Neutral) with custom color naming and storage
- **Data logging** — record measurements with timestamps
- **Dual charts** — primary (green) and secondary (cyan) real-time canvas charts, each showing last 60 readings with inline stats
- **Alerts** — configurable high/low thresholds with Web Audio alarm and visual flash
- **Push notifications** — instant alerts to your phone via ntfy
- **Export** — download logged data as CSV (default), Excel (.xlsx), or JSON
- **Measurement modes** — Auto Range, LCR Auto, Delta, Calibration, Sorting, Parallel
- **Tooltips** — info icons with measurement parameter descriptions
- **Component architecture** — modular Svelte components with reactive stores

## Screenshot

![DE-5000 Svelte App](../img/svelte_app.png)

## Requirements

- **Chrome 89+** or **Edge 89+** (Web Serial API support required)
- DE-5000 LCR Meter connected via USB serial adapter

### IR to USB Adapter

Instead of purchasing the official DE-5000-USB interface module, you can build your own adapter with an IR phototransistor, pullup resistor, and CH340E USB-to-serial module. See the [Tauri app README](../de5000-tauri/README.md#ir-to-usb-adapter) for full DIY instructions with photos.

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
    │   ├── export.js                 — CSV/Excel/JSON export
    │   └── notify.js                 — ntfy push notification publishing (fetch-based)
    └── components/
        ├── Header.svelte             — Title + connection status + connect/disconnect button + settings
        ├── Controls.svelte           — (unused — actions moved to Header and Chart)
        ├── MeasurementCard.svelte    — Combined primary/secondary value display (stacked)
        ├── InfoPanel.svelte          — Frequency, status, tolerance, modes
        ├── MeasurementDetails.svelte — Tabular measured + calculated values
        ├── Chart.svelte              — Dual canvas charts + logging/export/clear + inline stats + alert checking
        ├── AlertModal.svelte         — Alert threshold configuration modal
        ├── Settings.svelte           — Typeface, color & ntfy notification customization modal
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

## Push Notifications (ntfy)

The web app can send push notifications to your phone when alerts trigger, using any [ntfy](https://ntfy.sh) server.

### Quick Start

1. Install the ntfy app on your phone ([Android](https://play.google.com/store/apps/details?id=io.heckel.ntfy) / [iOS](https://apps.apple.com/app/ntfy/id1625396347))
2. Open **Settings** → **Push Notifications** → click **ⓘ** for setup guidance
3. Use the default server `https://ntfy.sh` (no setup needed) or run your own [ntfy-rs](https://github.com/Arcturus808/ntfy-rs) server on your LAN
4. Set the topic name (both this app and your phone must use the same topic)
5. Enable push notifications and click **Send Test** to verify

### Self-Hosted Server

For LAN-only notifications (no third-party server), run [ntfy-rs](https://github.com/Arcturus808/ntfy-rs) on your PC:

```bash
ntfy-rs serve --listen-http :8090 --base-url http://YOUR_PC_IP:8090 --upstream-base-url https://ntfy.sh
```

Then set the Server URL in Settings to `http://YOUR_PC_IP:8090`.

> **Note:** iOS requires internet for push notifications (APNS relay through ntfy.sh). Android works on LAN only.

### Architecture

```
Browser → Alert triggers → fetch() POST → ntfy server → Phone
```

The web app publishes via standard HTTP — no embedded server or native backend required. This differs from the [Tauri desktop app](https://github.com/Arcturus808/de5000), which embeds ntfy-rs directly.

## Protocol

The DE-5000 uses the **Cyrustek ES51919** chipset. Each data packet is 17 bytes with a `0x00 0x0D` header and `0x0D 0x0A` footer. Values are formatted per DE-5000 Manual Section 3.2 (no scientific notation).

## Related Projects

- [de5000-tauri](https://github.com/Arcturus808/de5000) — Tauri desktop app (native serial via Rust backend, embedded ntfy-rs server)

## Credits

- Original serial protocol code by [4x1md](https://github.com/4x1md) (2017)
- DE-5000 LCR Meter by DER EE

## License

MIT
