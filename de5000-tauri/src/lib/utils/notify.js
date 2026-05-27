let ntfyRunning = false;
let subscribeUrl = '';

/**
 * Start the ntfy server
 * @param {number} port
 * @param {string} topic
 */
export async function startNtfy(port, topic) {
	if (typeof window === 'undefined' || !window.__TAURI__) return;

	const { invoke } = await import('@tauri-apps/api/core');

	try {
		const status = await invoke('ntfy_start', {
			port: parseInt(port, 10) || 8090,
			topic: topic
		});
		ntfyRunning = status.running;
		subscribeUrl = status.subscribe_url;
		return status;
	} catch (e) {
		console.error('Failed to start ntfy:', e);
		ntfyRunning = false;
		throw e;
	}
}

/**
 * Stop the ntfy server
 */
export async function stopNtfy() {
	if (typeof window === 'undefined' || !window.__TAURI__) return;

	const { invoke } = await import('@tauri-apps/api/core');

	try {
		const status = await invoke('ntfy_stop');
		ntfyRunning = status.running;
		subscribeUrl = '';
		return status;
	} catch (e) {
		console.error('Failed to stop ntfy:', e);
		throw e;
	}
}

/**
 * Get current ntfy server status
 */
export async function getNtfyStatus() {
	if (typeof window === 'undefined' || !window.__TAURI__) {
		return { running: false, port: 8090, topic: 'de5000-alerts', subscribe_url: '' };
	}

	const { invoke } = await import('@tauri-apps/api/core');

	try {
		const status = await invoke('ntfy_status');
		ntfyRunning = status.running;
		subscribeUrl = status.subscribe_url;
		return status;
	} catch (e) {
		console.error('Failed to get ntfy status:', e);
		return { running: false, port: 8090, topic: 'de5000-alerts', subscribe_url: '' };
	}
}

/**
 * Publish a push notification via ntfy
 * @param {string} title - Notification title
 * @param {string} message - Notification body
 * @param {string} [priority='default'] - Priority: min, low, default, high, urgent
 */
export async function publishNotification(title, message, priority = 'high') {
	if (!ntfyRunning) throw new Error('ntfy server is not running');

	const { invoke } = await import('@tauri-apps/api/core');

	try {
		await invoke('ntfy_publish', { title, message, priority });
	} catch (e) {
		console.error('Failed to publish notification:', e);
		throw e;
	}
}

/**
 * Get the subscribe URL for phone setup
 */
export function getSubscribeUrl() {
	return subscribeUrl;
}

/**
 * Check if ntfy is currently running
 */
export function isNtfyRunning() {
	return ntfyRunning;
}
