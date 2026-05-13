import { BAUD_RATE, PACKET_LENGTH, findHeader, validatePacket, parsePacket } from './protocol.js';
import {
	connected,
	lastMeasurement,
	timestamp,
	logging,
	logMeasurement,
	showError,
	hideError,
	showSuccess
} from '$lib/stores/device.js';
import { get } from 'svelte/store';

let port = null;
let reader = null;
let reading = false;

/**
 * Check if Web Serial API is supported
 * @returns {boolean}
 */
export function isSerialSupported() {
	return 'serial' in navigator;
}

/**
 * Connect to the DE-5000 via Web Serial API
 */
export async function connectToDevice() {
	try {
		port = await navigator.serial.requestPort();

		await port.open({
			baudRate: BAUD_RATE,
			dataBits: 8,
			parity: 'none',
			stopBits: 1
		});

		await port.setSignals({
			dataTerminalReady: true,
			requestToSend: false
		});

		connected.set(true);
		hideError();
		startReading();
	} catch (error) {
		console.error('Connection error:', error);
		showError(`Connection failed: ${error.message}`);
	}
}

/**
 * Disconnect from the DE-5000
 */
export async function disconnectDevice() {
	reading = false;

	if (get(logging)) {
		logging.set(false);
		showSuccess('Data logging stopped');
	}

	if (reader) {
		try {
			await reader.cancel();
		} catch (e) {
			console.error('Error canceling reader:', e);
		}
		reader = null;
	}

	if (port) {
		try {
			await port.close();
		} catch (e) {
			console.error('Error closing port:', e);
		}
		port = null;
	}

	connected.set(false);
	lastMeasurement.set(null);
	timestamp.set('--');
}

/**
 * Start the continuous reading loop
 */
async function startReading() {
	if (!port) return;

	reading = true;
	reader = port.readable.getReader();

	const buffer = [];

	try {
		while (reading) {
			const { value, done } = await reader.read();
			if (done) break;

			buffer.push(...value);

			while (buffer.length >= PACKET_LENGTH) {
				const headerIndex = findHeader(buffer);

				if (headerIndex === -1) {
					buffer.shift();
					continue;
				}

				if (buffer.length >= headerIndex + PACKET_LENGTH) {
					const packet = buffer.slice(headerIndex, headerIndex + PACKET_LENGTH);

					if (validatePacket(packet)) {
						const measurement = parsePacket(packet);
						lastMeasurement.set(measurement);
						timestamp.set(new Date().toLocaleString());

						if (get(logging)) {
							logMeasurement(measurement);
						}
					}

					buffer.splice(0, headerIndex + PACKET_LENGTH);
				} else {
					break;
				}
			}
		}
	} catch (error) {
		console.error('Read error:', error);
		showError(`Read error: ${error.message}`);
		await disconnectDevice();
	} finally {
		if (reader) {
			reader.releaseLock();
		}
	}
}
