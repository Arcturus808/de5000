<script>
	import { typeface, mainValueTypeface, readoutColor, labelColor, appTitleColor, cardTitleColor, theme, THEME_OPTIONS, getTypefaceCSS, ntfyEnabled, ntfyPort, ntfyTopic, ntfyOncePerCrossing } from '$lib/stores/settings.js';
	import { onDestroy, onMount } from 'svelte';
	import TypefaceDropdown from './TypefaceDropdown.svelte';
	import ColorDropdown from './ColorDropdown.svelte';
	import { startNtfy, stopNtfy, getNtfyStatus, getSubscribeUrl, isNtfyRunning, publishNotification } from '$lib/utils/notify.js';

	let open = false;
	let displayFontOpen = false;
	let mainValueFontOpen = false;
	let readoutColorOpen = false;
	let labelColorOpen = false;
	let appTitleColorOpen = false;
	let cardTitleColorOpen = false;
	let ntfyStatus = { running: false, port: 8090, topic: 'de5000-alerts', subscribe_url: '' };
	let ntfyError = '';
	let ntfyTestResult = '';

	function toggle() {
		open = !open;
		if (open) {
			syncNtfyState();
		} else {
			handleNtfyConfigChange();
		}
	}

	async function syncNtfyState() {
		try {
			ntfyStatus = await getNtfyStatus();
			ntfyEnabled.set(ntfyStatus.running);
		} catch (e) {
			ntfyEnabled.set(false);
		}
	}

	async function handleNtfyConfigChange() {
		if (ntfyStatus.running) {
			try { ntfyStatus = await startNtfy($ntfyPort, $ntfyTopic); } catch (e) {}
		}
	}

	async function handleTestNotification() {
		ntfyTestResult = '';
		try {
			await publishNotification('DE-5000 Test', 'Push notifications are working!', 'default');
			ntfyTestResult = '✓ Sent';
		} catch (e) {
			ntfyTestResult = `✗ ${e}`;
		}
		setTimeout(() => (ntfyTestResult = ''), 5000);
	}

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

	$: applySettings(readoutFont, mainValueFont, $readoutColor, $labelColor, $appTitleColor, $cardTitleColor, $theme);

	let systemDark = typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)') : null;

	onMount(async () => {
		applyTheme($theme);
		if (systemDark) {
			systemDark.addEventListener('change', handleSystemThemeChange);
		}
		try {
			ntfyStatus = await getNtfyStatus();
		} catch {}
	});

	onDestroy(() => {
		if (systemDark) {
			systemDark.removeEventListener('change', handleSystemThemeChange);
		}
	});

	function handleSystemThemeChange(e) {
		if ($theme === 'system') {
			applyTheme('system');
		}
	}

	function applyTheme(value) {
		const isDark = value === 'dark' || (value === 'system' && systemDark?.matches !== false);
		document.body.setAttribute('data-theme', isDark ? 'dark' : 'light');
		window.dispatchEvent(new CustomEvent('de5000-theme-change'));
	}

	$: if ($theme) applyTheme($theme);

	function applySettings(readout, mainValue, rColor, lColor, aColor, cColor, currentTheme) {
		if (typeof document !== 'undefined') {
			const lightTheme = currentTheme === 'light' || (currentTheme === 'system' && systemDark?.matches === false);
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
		<div class="modal" on:click|stopPropagation={closeAllDropdowns}>
			<div class="modal-header">
				<h2>Settings</h2>
				<button class="close-btn" on:click={handleClose}>✕</button>
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

			<div class="setting-group">
				<label class="setting-label">Theme</label>
				<p class="setting-desc">Dark, light, or follow system preference</p>
				<div class="theme-toggle">
					{#each THEME_OPTIONS as option}
						<button
							class="theme-btn"
							class:active={$theme === option.value}
							on:click={() => theme.set(option.value)}
						>
							{option.label}
						</button>
					{/each}
				</div>
			</div>

			<div class="setting-group">
				<label class="setting-label">Push Notifications</label>
				<p class="setting-desc">Send alerts to your phone via ntfy</p>
				<div class="ntfy-controls">
					<label class="ntfy-toggle">
						<input type="checkbox" checked={$ntfyEnabled}
							on:change={async () => {
							const newVal = !$ntfyEnabled;
							ntfyEnabled.set(newVal);
							ntfyError = '';
							if (newVal) {
								try {
									ntfyStatus = await startNtfy($ntfyPort, $ntfyTopic);
								} catch (e) {
									ntfyError = String(e);
									ntfyEnabled.set(false);
								}
							} else {
								try {
									ntfyStatus = await stopNtfy();
								} catch (e) {
									ntfyError = String(e);
								}
							}
						}} />
						<span class="toggle-slider"></span>
					</label>
					<span class="ntfy-status" class:running={ntfyStatus.running}>
						{ntfyStatus.running ? 'Server running' : 'Server off'}
					</span>
				</div>
				{#if ntfyError}
					<p class="ntfy-error">{ntfyError}</p>
				{/if}
				{#if ntfyStatus.running && ntfyStatus.subscribe_url}
					<div class="ntfy-subscribe-info">
						<label class="setting-label">Subscribe URL</label>
						<div class="subscribe-url-row">
							<code class="subscribe-url">{ntfyStatus.subscribe_url}</code>
							<button class="copy-btn" on:click={() => navigator.clipboard.writeText(ntfyStatus.subscribe_url)} title="Copy URL">📋</button>
						</div>
						<p class="setting-desc">Open the ntfy app on your phone and subscribe to this URL</p>
					</div>
				{/if}
				{#if $ntfyEnabled}
					<div class="ntfy-config-row">
						<div class="ntfy-field">
							<label class="setting-label">Port</label>
							<input type="number" class="ntfy-input" bind:value={$ntfyPort} min="1024" max="65535"
								on:change={handleNtfyConfigChange} />
						</div>
						<div class="ntfy-field">
							<label class="setting-label">Topic</label>
							<input type="text" class="ntfy-input" bind:value={$ntfyTopic}
								on:change={handleNtfyConfigChange} />
						</div>
					</div>
					<div class="ntfy-once-row">
						<label class="ntfy-toggle ntfy-once-toggle">
							<input type="checkbox" checked={$ntfyOncePerCrossing}
								on:change={() => ntfyOncePerCrossing.set(!$ntfyOncePerCrossing)} />
							<span class="toggle-slider"></span>
						</label>
						<span class="ntfy-once-label">Notify once per threshold crossing</span>
					</div>
					<div class="ntfy-test-row">
						<button class="ntfy-test-btn" on:click={handleTestNotification} disabled={!ntfyStatus.running}>
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
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: var(--modal-overlay);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 9999;
	}

	.modal {
		background: var(--modal-bg);
		border: 1px solid var(--primary-accent-panel);
		border-radius: 12px;
		padding: 25px;
		min-width: 420px;
		max-width: 90vw;
		max-height: 85vh;
		overflow-y: auto;
		box-shadow: var(--shadow);
		font-family: 'Open Sans', sans-serif;
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
		display: flex;
		gap: 8px;
	}

	.theme-btn {
		flex: 1;
		padding: 8px 12px;
		border: 1px solid var(--border);
		border-radius: 6px;
		background: var(--surface-muted);
		color: var(--muted-text);
		font-size: 0.85em;
		cursor: pointer;
		transition: all 0.2s ease;
		font-family: 'Open Sans', sans-serif;
	}

	.theme-btn:hover {
		border-color: var(--primary-accent-panel);
	}

	.theme-btn.active {
		background: var(--primary-accent-muted);
		border-color: var(--primary-accent-border);
		color: var(--primary-accent);
		font-weight: bold;
	}

	@media (max-width: 768px) {
		.modal {
			min-width: auto;
			margin: 20px;
		}
	}

	.ntfy-controls {
		display: flex;
		align-items: center;
		gap: 12px;
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

	.ntfy-status {
		font-size: 0.85em;
		color: var(--muted-text);
	}

	.ntfy-status.running {
		color: var(--primary-accent);
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

	.ntfy-test-btn:hover:not(:disabled) {
		background: var(--primary-accent-border);
	}

	.ntfy-test-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.ntfy-test-result {
		font-size: 0.85em;
		font-family: var(--readout-font);
	}
</style>
