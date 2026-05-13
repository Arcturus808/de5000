<script>
	import { onDestroy, onMount } from 'svelte';
	import { typeface, mainValueTypeface, readoutColor, labelColor, appTitleColor, cardTitleColor, theme, THEME_OPTIONS, getTypefaceCSS } from '$lib/stores/settings.js';
	import TypefaceDropdown from './TypefaceDropdown.svelte';
	import ColorDropdown from './ColorDropdown.svelte';

	let open = false;
	let displayFontOpen = false;
	let mainValueFontOpen = false;
	let readoutColorOpen = false;
	let labelColorOpen = false;
	let appTitleColorOpen = false;
	let cardTitleColorOpen = false;
	let systemThemeQuery;

	function toggle() {
		open = !open;
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

	$: applySettings(readoutFont, mainValueFont, $readoutColor, $labelColor, $appTitleColor, $cardTitleColor);
	$: applyTheme($theme);

	onMount(() => {
		systemThemeQuery = window.matchMedia('(prefers-color-scheme: light)');
		systemThemeQuery.addEventListener('change', handleSystemThemeChange);
		applyTheme($theme);
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
		<div class="modal" on:click|stopPropagation={closeAllDropdowns}>
			<div class="modal-header">
				<h2>Settings</h2>
				<button class="close-btn" on:click={handleClose}>✕</button>
			</div>

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


	@media (max-width: 768px) {
		.modal {
			min-width: auto;
			margin: 20px;
		}
	}
</style>
