/**
 * ntfy push notification utilities for the Svelte web app.
 * Publishes notifications via HTTP POST to any ntfy server URL.
 */

let ntfyRunning = false;

/**
 * Publish a push notification via ntfy
 * @param {string} title - Notification title
 * @param {string} message - Notification body
 * @param {string} [priority='default'] - Priority: min, low, default, high, urgent
 */
export async function publishNotification(title, message, priority = 'high') {
	const { ntfyServerUrl, ntfyTopic } = await import('$lib/stores/settings.js');

	let serverUrl, topic;
	ntfyServerUrl.subscribe(v => serverUrl = v)();
	ntfyTopic.subscribe(v => topic = v)();

	if (!serverUrl || !topic) throw new Error('ntfy server URL and topic are required');

	const url = `${serverUrl.replace(/\/+$/, '')}/${topic}`;

	const response = await fetch(url, {
		method: 'POST',
		headers: {
			'Title': title,
			'Priority': priority
		},
		body: message
	});

	if (!response.ok) {
		throw new Error(`ntfy returned ${response.status}: ${response.statusText}`);
	}

	ntfyRunning = true;
	return true;
}

/**
 * Test the ntfy connection by publishing a test notification
 * @param {string} serverUrl
 * @param {string} topic
 */
export async function testNtfyConnection(serverUrl, topic) {
	if (!serverUrl || !topic) throw new Error('Server URL and topic are required');

	const url = `${serverUrl.replace(/\/+$/, '')}/${topic}`;

	const response = await fetch(url, {
		method: 'POST',
		headers: {
			'Title': 'DE-5000 Test',
			'Priority': 'default'
		},
		body: 'Push notifications are working!'
	});

	if (!response.ok) {
		throw new Error(`ntfy returned ${response.status}: ${response.statusText}`);
	}

	ntfyRunning = true;
	return true;
}

/**
 * Get the subscribe URL for phone setup
 * @param {string} serverUrl
 * @param {string} topic
 */
export function getSubscribeUrl(serverUrl, topic) {
	if (!serverUrl || !topic) return '';
	return `${serverUrl.replace(/\/+$/, '')}/${topic}`;
}

/**
 * Check if ntfy is currently available (at least one publish succeeded)
 */
export function isNtfyRunning() {
	return ntfyRunning;
}
