import { writable } from 'svelte/store';

const ALERTS_KEY = 'de5000-alerts';

const DEFAULT_ALERTS = {
	primaryHigh: { enabled: false, value: '' },
	primaryLow: { enabled: false, value: '' },
	secondaryHigh: { enabled: false, value: '' },
	secondaryLow: { enabled: false, value: '' }
};

function isDefaultAlerts(value) {
	return JSON.stringify(value) === JSON.stringify(DEFAULT_ALERTS);
}

function loadAlerts() {
	if (typeof localStorage === 'undefined') return DEFAULT_ALERTS;
	const stored = localStorage.getItem(ALERTS_KEY);
	if (!stored) return DEFAULT_ALERTS;
	try {
		const parsed = JSON.parse(stored);
		return { ...DEFAULT_ALERTS, ...parsed };
	} catch {
		return DEFAULT_ALERTS;
	}
}

function persistAlerts(value) {
	if (typeof localStorage === 'undefined') return;
	if (isDefaultAlerts(value)) {
		localStorage.removeItem(ALERTS_KEY);
	} else {
		localStorage.setItem(ALERTS_KEY, JSON.stringify(value));
	}
}

function createAlertsStore() {
	const { subscribe, set } = writable(loadAlerts());

	return {
		subscribe,
		set(value) {
			persistAlerts(value);
			set(value);
		},
		updateField(field, data) {
			let current;
			subscribe((v) => (current = v))();
			const updated = {
				...current,
				[field]: { ...current[field], ...data }
			};
			persistAlerts(updated);
			set(updated);
		}
	};
}

export const alerts = createAlertsStore();

export function checkAlerts(alertConfig, mainVal, secVal) {
	const triggered = [];

	if (alertConfig.primaryHigh.enabled && alertConfig.primaryHigh.value !== '') {
		const threshold = parseFloat(alertConfig.primaryHigh.value);
		if (!isNaN(threshold) && mainVal !== null && mainVal > threshold) {
			triggered.push({ name: 'primaryHigh', threshold, value: mainVal });
		}
	}

	if (alertConfig.primaryLow.enabled && alertConfig.primaryLow.value !== '') {
		const threshold = parseFloat(alertConfig.primaryLow.value);
		if (!isNaN(threshold) && mainVal !== null && mainVal < threshold) {
			triggered.push({ name: 'primaryLow', threshold, value: mainVal });
		}
	}

	if (alertConfig.secondaryHigh.enabled && alertConfig.secondaryHigh.value !== '') {
		const threshold = parseFloat(alertConfig.secondaryHigh.value);
		if (!isNaN(threshold) && secVal !== null && secVal > threshold) {
			triggered.push({ name: 'secondaryHigh', threshold, value: secVal });
		}
	}

	if (alertConfig.secondaryLow.enabled && alertConfig.secondaryLow.value !== '') {
		const threshold = parseFloat(alertConfig.secondaryLow.value);
		if (!isNaN(threshold) && secVal !== null && secVal < threshold) {
			triggered.push({ name: 'secondaryLow', threshold, value: secVal });
		}
	}

	return triggered;
}

let audioCtx = null;
let lastAlertTime = 0;
const ALERT_COOLDOWN_MS = 3000;

export function playAlertSound() {
	const now = Date.now();
	if (now - lastAlertTime < ALERT_COOLDOWN_MS) return;
	lastAlertTime = now;

	try {
		if (!audioCtx) {
			audioCtx = new (window.AudioContext || window.webkitAudioContext)();
		}

		// Double beep pattern
		for (let i = 0; i < 2; i++) {
			const osc = audioCtx.createOscillator();
			const gain = audioCtx.createGain();
			osc.connect(gain);
			gain.connect(audioCtx.destination);

			osc.type = 'sine';
			osc.frequency.value = 880;

			const startTime = audioCtx.currentTime + i * 0.2;
			gain.gain.setValueAtTime(0.3, startTime);
			gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);

			osc.start(startTime);
			osc.stop(startTime + 0.15);
		}
	} catch (e) {
		// Web Audio not available
	}
}

export function hasAnyAlertEnabled(alertConfig) {
	return (
		alertConfig.primaryHigh.enabled ||
		alertConfig.primaryLow.enabled ||
		alertConfig.secondaryHigh.enabled ||
		alertConfig.secondaryLow.enabled
	);
}
