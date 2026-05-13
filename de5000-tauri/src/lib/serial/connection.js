import { listen } from '@tauri-apps/api/event';
import { parsePacket } from './protocol.js';
import {
	connected,
	lastMeasurement,
	timestamp,
	logging,
	logMeasurement,
	showError,
	hideError,
	showSuccess,
	availablePorts
} from '$lib/stores/device.js';
import { get } from 'svelte/store';

let unlistenPacket = null;
let unlistenError = null;
let unlistenDisconnected = null;
let pcLinkTimeout = null;
const PC_LINK_TIMEOUT_MS = 800;

/**
 * Get the invoke function from Tauri's window globals.
 * Avoids the @tauri-apps/api/core wrapper which crashes if the bridge
 * isn't ready yet, since the wrapper itself reads __TAURI_INTERNALS__.
 * @returns {Function|null}
 */
function getInvoke() {
	return window.__TAURI_INTERNALS__?.invoke
		|| window.__TAURI__?.core?.invoke
		|| null;
}

/**
 * Invoke a Tauri command, waiting for the IPC bridge if necessary.
 * @param {string} cmd - Tauri command name
 * @param {object} [args] - Command arguments
 * @returns {Promise<any>}
 */
export function isTauri() {
	return !!window.__TAURI_INTERNALS__ || !!window.__TAURI__;
}

async function tauriInvoke(cmd, args) {
	if (!isTauri()) return null;
	let invoke = getInvoke();
	if (!invoke) {
		// Bridge not ready yet — wait and retry
		for (let i = 0; i < 100; i++) {
			await new Promise(resolve => setTimeout(resolve, 100));
			invoke = getInvoke();
			if (invoke) break;
		}
	}
	if (!invoke) throw new Error('Tauri IPC bridge not available');
	return invoke(cmd, args);
}

/**
 * Fetch available serial ports from the Rust backend
 * @param {boolean} [silent=false] - If true, suppress error display (for initial load)
 * @returns {Promise<object[]>}
 */
export async function listPorts(silent = false) {
	try {
		const ports = await tauriInvoke('list_ports');
		if (!ports) return []; // Not in Tauri context (regular browser)
		availablePorts.set(ports);
		return ports;
	} catch (error) {
		if (!silent) {
			showError(`Failed to list ports: ${error}`);
		}
		return [];
	}
}

/**
 * Connect to the DE-5000 via a named serial port (Tauri backend)
 * @param {string} portName
 */
export async function connectToDevice(portName) {
	try {
		// Set up event listeners before connecting
		unlistenPacket = await listen('serial-packet', (event) => {
			const packet = event.payload;
			const measurement = parsePacket(packet);
			lastMeasurement.set(measurement);
			timestamp.set(new Date().toLocaleString());

			// Reset PC link watchdog
			if (pcLinkTimeout) clearTimeout(pcLinkTimeout);
			pcLinkTimeout = setTimeout(() => {
				timestamp.set('--');
			}, PC_LINK_TIMEOUT_MS);

			if (get(logging)) {
				logMeasurement(measurement);
			}
		});

		unlistenError = await listen('serial-error', (event) => {
			showError(event.payload);
			disconnectDevice();
		});

		unlistenDisconnected = await listen('serial-disconnected', () => {
			connected.set(false);
			lastMeasurement.set(null);
			timestamp.set('--');
			cleanupListeners();
		});

		await tauriInvoke('connect', { portName });
		connected.set(true);
		hideError();
	} catch (error) {
		showError(`Connection failed: ${error}`);
		cleanupListeners();
	}
}

/**
 * Disconnect from the DE-5000
 */
export async function disconnectDevice() {
	try {
		await tauriInvoke('disconnect');
	} catch (error) {
		console.error('Disconnect error:', error);
	}

	if (get(logging)) {
		logging.set(false);
		showSuccess('Data logging stopped');
	}

	cleanupListeners();
	connected.set(false);
	lastMeasurement.set(null);
	timestamp.set('--');
}

function cleanupListeners() {
	if (pcLinkTimeout) {
		clearTimeout(pcLinkTimeout);
		pcLinkTimeout = null;
	}
	if (unlistenPacket) {
		unlistenPacket();
		unlistenPacket = null;
	}
	if (unlistenError) {
		unlistenError();
		unlistenError = null;
	}
	if (unlistenDisconnected) {
		unlistenDisconnected();
		unlistenDisconnected = null;
	}
}
