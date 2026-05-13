<script>
	import { onMount } from 'svelte';
	import { connected, selectedPort, availablePorts, timestamp, showError } from '$lib/stores/device.js';
	import { listPorts, connectToDevice, disconnectDevice } from '$lib/serial/connection.js';
	import { theme } from '$lib/stores/settings.js';
	import Settings from '$lib/components/Settings.svelte';

	onMount(() => {
		// Initial silent attempt — bridge may not be ready yet during dev
		listPorts(true).then(ports => {
			if (!ports || ports.length === 0) {
				setTimeout(() => listPorts(false), 1000);
			}
		});
	});

	async function refreshPorts() {
		await listPorts();
	}

	function cycleTheme() {
		const next = $theme === 'dark' ? 'light' : $theme === 'light' ? 'system' : 'dark';
		theme.set(next);
	}

	function handleConnect() {
		if ($connected) {
			disconnectDevice();
		} else {
			if (!$selectedPort) {
				showError('Please select a serial port first');
				return;
			}
			connectToDevice($selectedPort);
		}
	}
</script>

<header>
	<h1><img src="/de5000-icon-32.png" alt="DE-5000" class="title-icon" /> DE-5000 LCR Meter Monitor</h1>
	<div class="status-bar">
		<div class="status-left">
			<span class="status-dot" class:status-connected={$connected} class:status-disconnected={!$connected}>●
				<span class="status-dot-tooltip">{$connected ? 'COM Port Connected' : 'COM Port Disconnected'}</span>
			</span>
			<select bind:value={$selectedPort} disabled={$connected}>
				<option value="">-- Select Port --</option>
				{#each $availablePorts as port}
					<option value={port.name}>{port.name} — {port.port_type}</option>
				{/each}
			</select>
			<button class="secondary refresh-btn" on:click={refreshPorts} disabled={$connected} title="Refresh ports">
				↻
			</button>
			<button class:disconnect={$connected} on:click={handleConnect}>
				{$connected ? 'Disconnect' : 'Connect'}
			</button>
		</div>
		<div class="status-bar-right">
			<div class="pc-link" class:pc-link-on={$timestamp !== '--'} class:pc-link-off={$timestamp === '--'}>
				{$timestamp === '--' ? 'PC Link OFF' : 'PC Link ON'}
				{#if $timestamp === '--'}
					<span class="pc-link-tooltip">No signal detected from LCR Meter. Press &quot;PC&quot; button on the meter and check optical link.</span>
				{/if}
			</div>
			<div class="timestamp">{$timestamp}</div>
			<button class="theme-toggle-btn" on:click={cycleTheme} title="Toggle theme">
				{#if $theme === 'dark'}🌙{:else if $theme === 'light'}☀️{:else}💻{/if}
			</button>
			<Settings />
		</div>
	</div>
</header>

<style>
	header {
		text-align: center;
		margin-bottom: 5px;
		padding: 12px;
		background: var(--surface-muted);
		border-radius: 10px;
		border: 1px solid var(--border);
	}

	h1 {
		color: var(--app-title-color);
		font-size: 2em;
		margin-bottom: 5px;
		text-shadow: var(--title-glow);
		font-family: var(--readout-font);
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
	}

	.title-icon {
		width: 32px;
		height: 32px;
		vertical-align: middle;
	}

	.status-bar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: 8px;
		padding: 8px;
		background: var(--surface-strong);
		border-radius: 5px;
	}

	.status-left {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.status-dot {
		font-size: 1.1em;
		font-weight: bold;
		position: relative;
		cursor: help;
	}

	.status-dot-tooltip {
		display: none;
		position: absolute;
		bottom: 130%;
		left: 0;
		background: var(--popover-bg);
		color: var(--app-text);
		border: 1px solid var(--border-strong);
		border-radius: 5px;
		padding: 8px 10px;
		font-size: 0.85em;
		font-weight: normal;
		font-family: 'Roboto', sans-serif;
		line-height: 1.4;
		white-space: nowrap;
		pointer-events: none;
		z-index: 100;
	}

	.status-dot-tooltip::after {
		content: '';
		position: absolute;
		top: 100%;
		left: 10px;
		border-width: 6px;
		border-style: solid;
		border-color: var(--border-strong) transparent transparent transparent;
	}

	.status-dot:hover .status-dot-tooltip {
		display: block;
	}

	.status-connected {
		color: var(--readout-color);
		text-shadow: var(--status-glow);
	}

	.status-disconnected {
		color: var(--danger-accent);
	}

	.status-left select {
		background: var(--control-bg);
		color: var(--app-text);
		border: 1px solid var(--border-strong);
		padding: 5px 10px;
		font-size: 0.85em;
		font-family: 'Courier New', monospace;
		border-radius: 5px;
		cursor: pointer;
		transition: color 0.3s ease, border-color 0.3s ease;
	}

	.status-left select:disabled {
		color: var(--primary-accent);
		border-color: var(--primary-accent-panel);
		opacity: 0.5;
		cursor: not-allowed;
	}

	.status-left select option {
		background: var(--option-bg);
		color: var(--app-text);
	}

	.status-left button {
		border: none;
		padding: 5px 12px;
		font-size: 0.85em;
		font-weight: bold;
		border-radius: 5px;
		cursor: pointer;
		font-family: 'Roboto', sans-serif;
		transition: all 0.3s ease;
		box-shadow: var(--button-shadow);
		background: linear-gradient(135deg, var(--button-success-start) 0%, var(--button-success-end) 100%);
		color: var(--button-text-on-success);
	}

	.status-left button:hover {
		transform: translateY(-1px);
		box-shadow: var(--button-shadow-hover-success);
	}

	.status-left button:active {
		transform: translateY(0);
	}

	.status-left button.secondary {
		background: linear-gradient(135deg, var(--button-primary-start) 0%, var(--button-primary-end) 100%);
		color: var(--button-text-on-color);
	}

	.status-left button.disconnect {
		background: linear-gradient(135deg, var(--button-danger-start) 0%, var(--button-danger-end) 100%);
		color: var(--button-text-on-color);
	}

	.status-left button:disabled {
		background: var(--button-disabled);
		cursor: not-allowed;
		opacity: 0.5;
	}

	.refresh-btn {
		padding: 5px 10px !important;
		font-size: 1em !important;
		min-width: auto;
	}

	.status-bar-right {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.timestamp {
		color: var(--label-color);
		font-size: 0.9em;
	}

	.pc-link {
		font-size: 0.85em;
		font-weight: bold;
		font-family: 'Courier New', monospace;
	}

	.pc-link-on {
		color: var(--readout-color);
		text-shadow: var(--status-glow);
	}

	.pc-link-off {
		color: var(--danger-accent);
		position: relative;
		cursor: help;
	}

	.pc-link-tooltip {
		display: none;
		position: absolute;
		bottom: 130%;
		right: 0;
		background: var(--popover-bg);
		color: var(--app-text);
		border: 1px solid var(--danger-accent-border);
		border-radius: 5px;
		padding: 8px 10px;
		font-size: 0.85em;
		font-weight: normal;
		font-family: 'Roboto', sans-serif;
		line-height: 1.4;
		white-space: normal;
		width: 240px;
		text-align: left;
		pointer-events: none;
		z-index: 100;
	}

	.pc-link-tooltip::after {
		content: '';
		position: absolute;
		top: 100%;
		right: 16px;
		border-width: 6px;
		border-style: solid;
		border-color: var(--danger-accent-border) transparent transparent transparent;
	}

	.pc-link-off:hover .pc-link-tooltip {
		display: block;
	}

	.theme-toggle-btn {
		background: none;
		border: 1px solid var(--border-strong);
		color: var(--muted-text);
		cursor: pointer;
		padding: 4px 8px;
		border-radius: 5px;
		font-size: 1em;
		transition: all 0.3s ease;
	}

	.theme-toggle-btn:hover {
		color: var(--warning-accent);
		border-color: var(--warning-accent-border);
		background: var(--warning-accent-soft);
	}
</style>
