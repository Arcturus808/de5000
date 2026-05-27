<script>
	import { onDestroy, onMount } from 'svelte';
	import { typeface, mainValueTypeface, readoutColor, labelColor, appTitleColor, cardTitleColor, theme, THEME_OPTIONS, getTypefaceCSS, ntfyEnabled, ntfyServerUrl, ntfyTopic, ntfyOncePerCrossing } from '$lib/stores/settings.js';
	import TypefaceDropdown from './TypefaceDropdown.svelte';
	import ColorDropdown from './ColorDropdown.svelte';
	import { testNtfyConnection, getSubscribeUrl } from '$lib/utils/notify.js';

	let open = false;
	let displayFontOpen = false;
	let mainValueFontOpen = false;
	let readoutColorOpen = false;
	let labelColorOpen = false;
	let appTitleColorOpen = false;
	let cardTitleColorOpen = false;
	let systemThemeQuery;
	let ntfyError = '';
	let ntfyTestResult = '';
	let ntfyInfoOpen = false;
	let ntfyServerHistory = [];
	let ntfyTopicHistory = [];

	const SERVER_HISTORY_KEY = 'de5000-ntfy-server-history';
	const TOPIC_HISTORY_KEY = 'de5000-ntfy-topic-history';

	function loadNtfyHistory() {
		try {
			const servers = JSON.parse(localStorage.getItem(SERVER_HISTORY_KEY) || '[]');
			ntfyServerHistory = [...new Set(servers)];
		} catch { ntfyServerHistory = []; }
		try {
			const topics = JSON.parse(localStorage.getItem(TOPIC_HISTORY_KEY) || '[]');
			ntfyTopicHistory = [...new Set(topics)];
		} catch { ntfyTopicHistory = []; }
	}

	function saveServerToHistory(url) {
		if (!url) return;
		const updated = [url, ...ntfyServerHistory.filter(s => s !== url)].slice(0, 10);
		ntfyServerHistory = updated;
		localStorage.setItem(SERVER_HISTORY_KEY, JSON.stringify(updated));
	}

	function saveTopicToHistory(topic) {
		if (!topic) return;
		const updated = [topic, ...ntfyTopicHistory.filter(t => t !== topic)].slice(0, 10);
		ntfyTopicHistory = updated;
		localStorage.setItem(TOPIC_HISTORY_KEY, JSON.stringify(updated));
	}

	function toggle() {
		open = !open;
		if (!open && $ntfyEnabled) {
			ntfyError = '';
		}
	}

	async function handleTestNotification() {
		ntfyTestResult = '';
		ntfyError = '';
		try {
			await testNtfyConnection($ntfyServerUrl, $ntfyTopic);
			ntfyTestResult = '✓ Sent';
		} catch (e) {
			ntfyTestResult = `✗ ${e.message || e}`;
		}
		setTimeout(() => (ntfyTestResult = ''), 5000);
	}

	$: subscribeUrl = getSubscribeUrl($ntfyServerUrl, $ntfyTopic);

	function handleDisplayFontOpen() {
		closeOtherDropdowns('displayFont');
		displayFontOpen = true;
	}

	function handleDisplayFontClose() {
		displayFontOpen = false;
	}

	function handleMainValueFontOpen() {
		closeOtherDropdowns('mainValueFont');
		mainValueFontOpen = true;
	}

	function handleMainValueFontClose() {
		mainValueFontOpen = false;
	}

	function handleClose() {
		displayFontOpen = false;
		mainValueFontOpen = false;
		readoutColorOpen = false;
		labelColorOpen = false;
		appTitleColorOpen = false;
		cardTitleColorOpen = false;
		open = false;
	}

	function closeOtherDropdowns(except) {
		if (except !== 'displayFont') displayFontOpen = false;
		if (except !== 'mainValueFont') mainValueFontOpen = false;
		if (except !== 'readoutColor') readoutColorOpen = false;
		if (except !== 'labelColor') labelColorOpen = false;
		if (except !== 'appTitleColor') appTitleColorOpen = false;
		if (except !== 'cardTitleColor') cardTitleColorOpen = false;
	}

	function closeAllDropdowns() {
		displayFontOpen = false;
		mainValueFontOpen = false;
		readoutColorOpen = false;
		labelColorOpen = false;
		appTitleColorOpen = false;
		cardTitleColorOpen = false;
	}

	$: readoutFont = getTypefaceCSS($typeface);
	$: mainValueFont = getTypefaceCSS($mainValueTypeface);

	$: applySettings(readoutFont, mainValueFont, $readoutColor, $labelColor, $appTitleColor, $cardTitleColor);
	$: applyTheme($theme);

	onMount(() => {
		systemThemeQuery = window.matchMedia('(prefers-color-scheme: light)');
		systemThemeQuery.addEventListener('change', handleSystemThemeChange);
		applyTheme($theme);
		loadNtfyHistory();
		saveServerToHistory($ntfyServerUrl);
		saveTopicToHistory($ntfyTopic);
	});

	onDestroy(() => {
		systemThemeQuery?.removeEventListener('change', handleSystemThemeChange);
	});

	function handleSystemThemeChange() {
		applyTheme($theme);
	}

	function applyTheme(selectedTheme) {
		if (typeof document === 'undefined') return;
		const resolvedTheme =
			selectedTheme === 'system' && typeof window !== 'undefined'
				? window.matchMedia('(prefers-color-scheme: light)').matches
					? 'light'
					: 'dark'
				: selectedTheme;
		document.body.dataset.theme = resolvedTheme;
		document.body.dataset.themePreference = selectedTheme;
		applySettings(readoutFont, mainValueFont, $readoutColor, $labelColor, $appTitleColor, $cardTitleColor);
		window.dispatchEvent(new CustomEvent('de5000-theme-change'));
	}

	function applySettings(readout, mainValue, rColor, lColor, aColor, cColor) {
		if (typeof document !== 'undefined') {
			const lightTheme = document.body.dataset.theme === 'light';
			document.body.style.setProperty('--readout-font', readout);
			document.body.style.setProperty('--main-value-font', mainValue);
			document.body.style.setProperty('--readout-color', lightTheme && rColor === '#00ff00' ? '#00b81f' : rColor);
			document.body.style.setProperty('--label-color', lightTheme && lColor === '#cccccc' ? '#45515b' : lColor);
			document.body.style.setProperty('--app-title-color', lightTheme && aColor === '#ddaa00' ? '#b58900' : aColor);
			document.body.style.setProperty('--card-title-color', lightTheme && cColor === '#cccccc' ? '#1f2a32' : cColor);
		}
	}
</script>

<button class="settings-btn" on:click={toggle} title="Settings">
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="22"
		height="22"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
	>
		<circle cx="12" cy="12" r="3" />
		<path
			d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
		/>
	</svg>
</button>

{#if open}
	<div class="overlay" on:click={handleClose}>
		<div class="modal" on:click|stopPropagation>
			<div class="modal-header">
				<h2>Settings</h2>
				<button class="close-btn" on:click={handleClose}>✕</button>
			</div>

			<div class="settings-columns">
				<div class="settings-column">
					<div class="setting-group">
						<label class="setting-label">Appearance</label>
						<p class="setting-desc">Application color theme</p>
						<div class="theme-toggle" role="group" aria-label="Application theme">
							{#each THEME_OPTIONS as option}
								<button
									type="button"
								class:selected={$theme === option.value}
								on:click={() => theme.set(option.value)}
							>
									{option.label}
								</button>
							{/each}
						</div>
					</div>

					<div class="setting-group">
						<label class="setting-label">Display Typeface</label>
						<p class="setting-desc">Labels, titles, and other UI text</p>
						<TypefaceDropdown
							store={typeface}
							bind:isOpen={displayFontOpen}
							on:open={handleDisplayFontOpen}
							on:close={handleDisplayFontClose}
						/>
					</div>

					<div class="setting-group">
						<label class="setting-label">Main Value Typeface</label>
						<p class="setting-desc">Primary &amp; secondary measurement readouts</p>
						<TypefaceDropdown
							store={mainValueTypeface}
							bind:isOpen={mainValueFontOpen}
							on:open={handleMainValueFontOpen}
							on:close={handleMainValueFontClose}
						/>
					</div>
				</div>

				<div class="settings-column">
					<div class="setting-group">
						<label class="setting-label">Readout Color</label>
						<p class="setting-desc">Measurement values, titles, and highlights</p>
						<ColorDropdown
							store={readoutColor}
							bind:isOpen={readoutColorOpen}
							on:open={() => closeOtherDropdowns('readoutColor')}
							on:close={() => (readoutColorOpen = false)}
						/>
					</div>

					<div class="setting-group">
						<label class="setting-label">Label Color</label>
						<p class="setting-desc">Labels, units, and secondary text</p>
						<ColorDropdown
							store={labelColor}
							bind:isOpen={labelColorOpen}
							on:open={() => closeOtherDropdowns('labelColor')}
							on:close={() => (labelColorOpen = false)}
						/>
					</div>
					<div class="setting-group">
						<label class="setting-label">App Title Color</label>
						<p class="setting-desc">Main header title</p>
						<ColorDropdown
							store={appTitleColor}
							bind:isOpen={appTitleColorOpen}
							on:open={() => closeOtherDropdowns('appTitleColor')}
							on:close={() => (appTitleColorOpen = false)}
						/>
					</div>

					<div class="setting-group">
						<label class="setting-label">Card Title Color</label>
						<p class="setting-desc">Section and card headings</p>
						<ColorDropdown
							store={cardTitleColor}
							bind:isOpen={cardTitleColorOpen}
							on:open={() => closeOtherDropdowns('cardTitleColor')}
							on:close={() => (cardTitleColorOpen = false)}
						/>
					</div>
				</div>
			</div>

			<div class="setting-group">
				{#if ntfyInfoOpen}
					<div class="ntfy-info-popover">
						<p><strong>How it works:</strong> The app sends notifications to an ntfy server. You subscribe to a topic on your phone using the <a href="https://ntfy.sh" target="_blank" rel="noopener">ntfy app</a>.</p>
						<p><strong>Quick start:</strong></p>
						<ol>
							<li>Install the ntfy app on your phone (<a href="https://play.google.com/store/apps/details?id=io.heckel.ntfy" target="_blank" rel="noopener">Android</a> / <a href="https://apps.apple.com/app/ntfy/id1625396347" target="_blank" rel="noopener">iOS</a>)</li>
							<li>Use the default server <code>https://ntfy.sh</code> (no setup needed) or run your own <a href="https://github.com/Arcturus808/ntfy-rs" target="_blank" rel="noopener">ntfy-rs</a> server on your LAN</li>
							<li>Set the topic name below (both this app and your phone must use the same topic)</li>
							<li>Enable push notifications and click <strong>Send Test</strong> to verify</li>
						</ol>
						<p><strong>Note:</strong> Using <code>https://ntfy.sh</code> means messages pass through a third-party server. For LAN-only notifications, run ntfy-rs locally and set the server URL to your PC's LAN address (e.g. <code>http://192.168.0.82:8090</code>).</p>
					</div>
				{/if}
				<div class="setting-label-row">
					<label class="ntfy-toggle">
						<input type="checkbox" checked={$ntfyEnabled}
							on:change={() => ntfyEnabled.set(!$ntfyEnabled)} />
						<span class="toggle-slider"></span>
					</label>
					<label class="setting-label" title="Send alerts to your phone via ntfy">Push Notifications</label>
					<button type="button" class="info-btn" on:click={() => ntfyInfoOpen = !ntfyInfoOpen} title="How to set up push notifications">ⓘ</button>
				</div>
				{#if ntfyError}
					<p class="ntfy-error">{ntfyError}</p>
				{/if}
				{#if $ntfyEnabled}
					<div class="ntfy-config-row">
						<div class="ntfy-field">
							<label class="setting-label">Server URL</label>
							<input type="text" class="ntfy-input" bind:value={$ntfyServerUrl}
								list="ntfy-server-list"
								placeholder="https://ntfy.sh"
								on:change={() => saveServerToHistory($ntfyServerUrl)} />
							<datalist id="ntfy-server-list">
								{#each ntfyServerHistory as server}
									<option value={server} />
								{/each}
							</datalist>
						</div>
						<div class="ntfy-field">
							<label class="setting-label">Topic</label>
							<input type="text" class="ntfy-input" bind:value={$ntfyTopic}
								list="ntfy-topic-list"
								placeholder="de5000-alerts"
								on:change={() => saveTopicToHistory($ntfyTopic)} />
							<datalist id="ntfy-topic-list">
								{#each ntfyTopicHistory as topic}
									<option value={topic} />
								{/each}
							</datalist>
						</div>
					</div>
					{#if subscribeUrl}
						<div class="ntfy-subscribe-info">
							<label class="setting-label">Subscribe URL</label>
							<div class="subscribe-url-row">
								<code class="subscribe-url">{subscribeUrl}</code>
								<button type="button" class="copy-btn" on:click={() => navigator.clipboard.writeText(subscribeUrl)} title="Copy URL">📋</button>
							</div>
							<p class="setting-desc">Open the ntfy app on your phone and subscribe to this URL</p>
						</div>
					{/if}
					<div class="ntfy-once-row">
						<label class="ntfy-toggle ntfy-once-toggle">
							<input type="checkbox" checked={$ntfyOncePerCrossing}
								on:change={() => ntfyOncePerCrossing.set(!$ntfyOncePerCrossing)} />
							<span class="toggle-slider"></span>
						</label>
						<span class="ntfy-once-label">Notify once per threshold crossing</span>
					</div>
					<div class="ntfy-test-row">
						<button type="button" class="ntfy-test-btn" on:click={handleTestNotification}>
							Send Test Notification
						</button>
						{#if ntfyTestResult}
							<span class="ntfy-test-result">{ntfyTestResult}</span>
						{/if}
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	.settings-btn {
		background: none;
		border: 1px solid var(--border-strong);
		color: var(--muted-text);
		cursor: pointer;
		padding: 6px;
		border-radius: 5px;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.3s ease;
	}

	.settings-btn:hover {
		color: var(--primary-accent);
		border-color: var(--primary-accent-border);
		background: var(--primary-accent-soft);
	}

	.overlay {
		position: fixed;
		inset: 0;
		background: var(--modal-overlay);
		z-index: 9999;
		display: flex;
		align-items: flex-start;
		justify-content: center;
		padding: 40px 0;
		overflow-y: auto;
	}

	.modal {
		background: var(--modal-bg);
		border: 1px solid var(--primary-accent-panel);
		border-radius: 12px;
		padding: 25px;
		width: min(720px, 90vw);
		margin: 0 auto;
		max-height: 95vh;
		overflow-y: auto;
		scrollbar-gutter: stable;
		box-shadow: var(--shadow);
		font-family: 'Open Sans', sans-serif;
	}

	.settings-columns {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 20px;
	}

	.settings-column {
		display: flex;
		flex-direction: column;
		gap: 0;
		overflow: visible;
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20px;
		padding-bottom: 12px;
		border-bottom: 1px solid var(--border);
		position: relative;
		z-index: 6;
	}

	.modal-header h2 {
		color: var(--primary-accent);
		font-size: 1.2em;
		margin: 0;
	}

	.close-btn {
		background: none;
		border: none;
		color: var(--muted-text);
		font-size: 1.3em;
		cursor: pointer;
		padding: 0 4px;
		transition: color 0.2s;
	}

	.close-btn:hover {
		color: var(--danger-accent);
	}

	.setting-group {
		margin-bottom: 20px;
		position: relative;
	}

	.setting-label {
		color: var(--muted-text);
		font-size: 0.9em;
		display: block;
		margin-bottom: 4px;
	}

	.setting-desc {
		color: var(--subtle-text);
		font-size: 0.75em;
		margin: 0 0 8px 0;
	}

	.theme-toggle {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 4px;
		padding: 4px;
		background: var(--surface-muted);
		border: 1px solid var(--border);
		border-radius: 8px;
	}

	.theme-toggle button {
		padding: 8px 10px;
		border: 1px solid transparent;
		border-radius: 6px;
		background: transparent;
		color: var(--muted-text);
		cursor: pointer;
		font-family: 'Open Sans', sans-serif;
		font-weight: 700;
		transition: all 0.2s ease;
	}

	.theme-toggle button:hover {
		background: var(--primary-accent-soft);
		color: var(--primary-accent);
	}

	.theme-toggle button.selected {
		background: var(--primary-accent-muted);
		border-color: var(--primary-accent-border);
		color: var(--primary-accent);
	}


	.setting-label-row {
		display: flex;
		align-items: center;
		gap: 6px;
		margin-bottom: 4px;
	}

	.info-btn {
		background: none;
		border: 1px solid var(--border);
		color: var(--muted-text);
		font-size: 0.85em;
		cursor: pointer;
		width: 22px;
		height: 22px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s;
		padding: 0;
		line-height: 1;
	}

	.info-btn:hover {
		border-color: var(--primary-accent-border);
		color: var(--primary-accent);
		background: var(--primary-accent-soft);
	}

	.ntfy-info-popover {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 100%;
		background: var(--modal-bg);
		border: 1px solid var(--primary-accent-border);
		border-radius: 8px;
		padding: 12px 14px;
		margin-bottom: 6px;
		font-size: 0.8em;
		color: var(--muted-text);
		line-height: 1.5;
		text-align: left;
		word-break: break-word;
		overflow-wrap: break-word;
		z-index: 10000;
		box-shadow: 0 4px 16px rgba(0,0,0,0.3);
	}

	.ntfy-info-popover p {
		margin: 0 0 6px 0;
	}

	.ntfy-info-popover ol {
		margin: 4px 0 6px 18px;
		padding: 0;
	}

	.ntfy-info-popover li {
		margin-bottom: 3px;
	}

	.ntfy-info-popover a {
		color: var(--primary-accent);
		word-break: break-all;
	}

	.ntfy-info-popover code {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 3px;
		padding: 1px 4px;
		font-size: 0.9em;
		word-break: break-all;
	}

	.ntfy-toggle {
		position: relative;
		display: inline-block;
		width: 40px;
		height: 22px;
		cursor: pointer;
	}

	.ntfy-toggle input {
		opacity: 0;
		width: 0;
		height: 0;
	}

	.ntfy-toggle .toggle-slider {
		position: absolute;
		inset: 0;
		background: var(--surface-muted);
		border: 1px solid var(--border);
		border-radius: 22px;
		transition: all 0.3s;
	}

	.ntfy-toggle .toggle-slider::before {
		content: '';
		position: absolute;
		width: 16px;
		height: 16px;
		left: 2px;
		bottom: 2px;
		background: var(--muted-text);
		border-radius: 50%;
		transition: transform 0.3s;
	}

	.ntfy-toggle input:checked + .toggle-slider {
		background: var(--primary-accent-muted);
		border-color: var(--primary-accent-border);
	}

	.ntfy-toggle input:checked + .toggle-slider::before {
		transform: translateX(18px);
		background: var(--primary-accent);
	}

	.ntfy-config-row {
		display: flex;
		gap: 12px;
		margin-top: 12px;
	}

	.ntfy-field {
		flex: 1;
	}

	.ntfy-input {
		width: 100%;
		padding: 6px 10px;
		background: var(--surface-muted);
		border: 1px solid var(--border);
		border-radius: 4px;
		color: var(--app-text);
		font-size: 0.85em;
		font-family: 'Courier New', monospace;
	}

	.ntfy-input:focus {
		outline: none;
		border-color: var(--primary-accent-border);
	}

	.ntfy-error {
		color: var(--danger-accent);
		font-size: 0.8em;
		margin: 8px 0 0 0;
		word-break: break-word;
	}

	.ntfy-subscribe-info {
		margin-top: 12px;
	}

	.subscribe-url-row {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.subscribe-url {
		flex: 1;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 4px;
		padding: 6px 10px;
		font-size: 0.85em;
		color: var(--primary-accent);
		font-family: 'Courier New', monospace;
		word-break: break-all;
	}

	.copy-btn {
		background: var(--surface-muted);
		border: 1px solid var(--border);
		border-radius: 4px;
		cursor: pointer;
		font-size: 1em;
		padding: 4px 8px;
		transition: all 0.2s;
	}

	.copy-btn:hover {
		border-color: var(--primary-accent-border);
		background: var(--primary-accent-soft);
	}

	.ntfy-once-row {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-top: 10px;
	}

	.ntfy-once-toggle {
		transform: scale(0.8);
		transform-origin: left center;
	}

	.ntfy-once-label {
		color: var(--muted-text);
		font-size: 0.85em;
	}

	.ntfy-test-row {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-top: 10px;
	}

	.ntfy-test-btn {
		background: var(--primary-accent-muted);
		border: 1px solid var(--primary-accent-border);
		color: var(--primary-accent);
		padding: 5px 12px;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.85em;
		font-family: var(--readout-font);
	}

	.ntfy-test-btn:hover {
		background: var(--primary-accent-border);
	}

	.ntfy-test-result {
		font-size: 0.85em;
		font-family: var(--readout-font);
	}

	@media (max-width: 768px) {
		.modal {
			width: 90vw;
			margin: 20px;
		}

		.settings-columns {
			grid-template-columns: 1fr;
		}

		.ntfy-config-row {
			flex-direction: column;
			gap: 8px;
		}
	}
</style>
