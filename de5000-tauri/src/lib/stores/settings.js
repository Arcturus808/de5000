import { writable } from 'svelte/store';

const TYPEFACE_KEY = 'de5000-typeface';
const MAIN_VALUE_TYPEFACE_KEY = 'de5000-main-value-typeface';
const READOUT_COLOR_KEY = 'de5000-readout-color';
const LABEL_COLOR_KEY = 'de5000-label-color';
const APP_TITLE_COLOR_KEY = 'de5000-app-title-color';
const CARD_TITLE_COLOR_KEY = 'de5000-card-title-color';
const THEME_KEY = 'de5000-theme';

const DEFAULT_TYPEFACE = 'Roboto';
const DEFAULT_READOUT_COLOR = '#00ff00';
const DEFAULT_LABEL_COLOR = '#cccccc';
const DEFAULT_APP_TITLE_COLOR = '#ddaa00';
const DEFAULT_CARD_TITLE_COLOR = '#cccccc';
const DEFAULT_THEME = 'dark';

export const THEME_OPTIONS = [
	{ label: 'Dark', value: 'dark' },
	{ label: 'Light', value: 'light' },
	{ label: 'System', value: 'system' }
];

export const TYPEFACE_OPTIONS = [
	{ label: 'Courier New', value: "'Courier New', monospace" },
	{ label: 'Poppins', value: "'Poppins', sans-serif" },
	{ label: 'Roboto', value: "'Roboto', sans-serif" },
	{ label: 'Open Sans', value: "'Open Sans', sans-serif" },
	{ label: 'LED Segment', value: "'DSEG14-Classic-Italic', monospace" }
];

function createTypefaceStore(key, defaultVal) {
	const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
	const initial = stored ?? defaultVal;

	const { subscribe, set } = writable(initial);

	return {
		subscribe,
		set(value) {
			if (typeof localStorage !== 'undefined') {
				if (value === defaultVal) {
					localStorage.removeItem(key);
				} else {
					localStorage.setItem(key, value);
				}
			}
			set(value);
		}
	};
}

export const typeface = createTypefaceStore(TYPEFACE_KEY, DEFAULT_TYPEFACE);
export const mainValueTypeface = createTypefaceStore(MAIN_VALUE_TYPEFACE_KEY, DEFAULT_TYPEFACE);

function createColorStore(key, defaultColor) {
	const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
	const initial = stored ?? defaultColor;

	const { subscribe, set } = writable(initial);

	return {
		subscribe,
		set(value) {
			if (typeof localStorage !== 'undefined') {
				if (value === defaultColor) {
					localStorage.removeItem(key);
				} else {
					localStorage.setItem(key, value);
				}
			}
			set(value);
		}
	};
}

export const readoutColor = createColorStore(READOUT_COLOR_KEY, DEFAULT_READOUT_COLOR);
export const labelColor = createColorStore(LABEL_COLOR_KEY, DEFAULT_LABEL_COLOR);
export const appTitleColor = createColorStore(APP_TITLE_COLOR_KEY, DEFAULT_APP_TITLE_COLOR);
export const cardTitleColor = createColorStore(CARD_TITLE_COLOR_KEY, DEFAULT_CARD_TITLE_COLOR);

function createThemeStore() {
	const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(THEME_KEY) : null;
	const initial = THEME_OPTIONS.some((option) => option.value === stored) ? stored : DEFAULT_THEME;

	const { subscribe, set } = writable(initial);

	return {
		subscribe,
		set(value) {
			const next = THEME_OPTIONS.some((option) => option.value === value) ? value : DEFAULT_THEME;
			if (typeof localStorage !== 'undefined') {
				if (next === DEFAULT_THEME) {
					localStorage.removeItem(THEME_KEY);
				} else {
					localStorage.setItem(THEME_KEY, next);
				}
			}
			set(next);
		}
	};
}

export const theme = createThemeStore();

export function getTypefaceCSS(label) {
	const option = TYPEFACE_OPTIONS.find((o) => o.label === label);
	return option ? option.value : "'Courier New', monospace";
}

// ===== Color Palettes =====
export const COLOR_PALETTES = {
	Primary: [
		{ name: 'Green', hex: '#00ff00' },
		{ name: 'Cyan', hex: '#00ffff' },
		{ name: 'Blue', hex: '#4488ff' },
		{ name: 'Red', hex: '#ff4444' },
		{ name: 'Orange', hex: '#ff8800' },
		{ name: 'Yellow', hex: '#ffdd00' },
		{ name: 'Magenta', hex: '#ff44ff' },
		{ name: 'Lime', hex: '#88ff00' }
	],
	Secondary: [
		{ name: 'Teal', hex: '#00aa88' },
		{ name: 'Sky', hex: '#44aaff' },
		{ name: 'Indigo', hex: '#6644ff' },
		{ name: 'Rose', hex: '#ff4488' },
		{ name: 'Amber', hex: '#ffaa00' },
		{ name: 'Gold', hex: '#ddaa00' },
		{ name: 'Violet', hex: '#aa44ff' },
		{ name: 'Mint', hex: '#44ffaa' }
	],
	Neutral: [
		{ name: 'White', hex: '#ffffff' },
		{ name: 'Light Gray', hex: '#cccccc' },
		{ name: 'Gray', hex: '#888888' },
		{ name: 'Dim Gray', hex: '#666666' },
		{ name: 'Dark Gray', hex: '#444444' },
		{ name: 'Silver', hex: '#c0c0c0' }
	]
};

const CUSTOM_COLORS_KEY = 'de5000-custom-colors';

function createCustomColorsStore() {
	const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(CUSTOM_COLORS_KEY) : null;
	const initial = stored ? JSON.parse(stored) : [];

	const { subscribe, set } = writable(initial);

	return {
		subscribe,
		set(value) {
			if (typeof localStorage !== 'undefined') {
				localStorage.setItem(CUSTOM_COLORS_KEY, JSON.stringify(value));
			}
			set(value);
		},
		add(name, hex) {
			const list = JSON.parse(JSON.stringify(
				typeof localStorage !== 'undefined' ? JSON.parse(localStorage.getItem(CUSTOM_COLORS_KEY) || '[]') : []
			));
			list.push({ name, hex });
			if (typeof localStorage !== 'undefined') {
				localStorage.setItem(CUSTOM_COLORS_KEY, JSON.stringify(list));
			}
			set(list);
		},
		remove(hex) {
			const list = JSON.parse(JSON.stringify(
				typeof localStorage !== 'undefined' ? JSON.parse(localStorage.getItem(CUSTOM_COLORS_KEY) || '[]') : []
			)).filter(c => c.hex !== hex);
			if (typeof localStorage !== 'undefined') {
				localStorage.setItem(CUSTOM_COLORS_KEY, JSON.stringify(list));
			}
			set(list);
		}
	};
}

export const customColors = createCustomColorsStore();

// ===== ntfy Push Notifications =====
const NTFY_ENABLED_KEY = 'de5000-ntfy-enabled';
const NTFY_PORT_KEY = 'de5000-ntfy-port';
const NTFY_TOPIC_KEY = 'de5000-ntfy-topic';
const NTFY_ONCE_KEY = 'de5000-ntfy-once-per-crossing';

const DEFAULT_NTFY_ENABLED = false;
const DEFAULT_NTFY_PORT = 8090;
const DEFAULT_NTFY_TOPIC = 'de5000-alerts';
const DEFAULT_NTFY_ONCE = true;

function createNtfyEnabledStore() {
	const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(NTFY_ENABLED_KEY) : null;
	const initial = stored === 'true';

	const { subscribe, set } = writable(initial);

	return {
		subscribe,
		set(value) {
			if (typeof localStorage !== 'undefined') {
				if (value === DEFAULT_NTFY_ENABLED) {
					localStorage.removeItem(NTFY_ENABLED_KEY);
				} else {
					localStorage.setItem(NTFY_ENABLED_KEY, String(value));
				}
			}
			set(value);
		}
	};
}

function createNtfyPortStore() {
	const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(NTFY_PORT_KEY) : null;
	const initial = stored ? parseInt(stored, 10) || DEFAULT_NTFY_PORT : DEFAULT_NTFY_PORT;

	const { subscribe, set } = writable(initial);

	return {
		subscribe,
		set(value) {
			const num = parseInt(value, 10) || DEFAULT_NTFY_PORT;
			if (typeof localStorage !== 'undefined') {
				if (num === DEFAULT_NTFY_PORT) {
					localStorage.removeItem(NTFY_PORT_KEY);
				} else {
					localStorage.setItem(NTFY_PORT_KEY, String(num));
				}
			}
			set(num);
		}
	};
}

function createNtfyTopicStore() {
	const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(NTFY_TOPIC_KEY) : null;
	const initial = stored || DEFAULT_NTFY_TOPIC;

	const { subscribe, set } = writable(initial);

	return {
		subscribe,
		set(value) {
			if (typeof localStorage !== 'undefined') {
				if (value === DEFAULT_NTFY_TOPIC) {
					localStorage.removeItem(NTFY_TOPIC_KEY);
				} else {
					localStorage.setItem(NTFY_TOPIC_KEY, value);
				}
			}
			set(value);
		}
	};
}

export const ntfyEnabled = createNtfyEnabledStore();
export const ntfyPort = createNtfyPortStore();
export const ntfyTopic = createNtfyTopicStore();
export const ntfyOncePerCrossing = createNtfyOnceStore();

function createNtfyOnceStore() {
	const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(NTFY_ONCE_KEY) : null;
	const initial = stored === null ? DEFAULT_NTFY_ONCE : stored === 'true';

	const { subscribe, set } = writable(initial);

	return {
		subscribe,
		set(value) {
			if (typeof localStorage !== 'undefined') {
				if (value === DEFAULT_NTFY_ONCE) {
					localStorage.removeItem(NTFY_ONCE_KEY);
				} else {
					localStorage.setItem(NTFY_ONCE_KEY, String(value));
				}
			}
			set(value);
		}
	};
}
