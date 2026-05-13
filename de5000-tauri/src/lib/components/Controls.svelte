<script>
	import { onMount } from 'svelte';
	import {
		connected,
		availablePorts,
		selectedPort,
		showError
	} from '$lib/stores/device.js';
	import { listPorts, connectToDevice, disconnectDevice } from '$lib/serial/connection.js';

	onMount(() => {
		// Initial silent attempt — bridge may not be ready yet during dev
		listPorts(true).then(ports => {
			// If silent attempt failed (empty result), retry with error display after delay
			if (!ports || ports.length === 0) {
				setTimeout(() => listPorts(false), 1000);
			}
		});
	});

	async function refreshPorts() {
		await listPorts();
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

<div class="controls">
	<div class="port-selector">
		<select bind:value={$selectedPort} disabled={$connected}>
			<option value="">-- Select Port --</option>
			{#each $availablePorts as port}
				<option value={port.name}>{port.name} — {port.port_type}</option>
			{/each}
		</select>
		<button class="secondary refresh-btn" on:click={refreshPorts} disabled={$connected} title="Refresh ports">
			↻
		</button>
		<button
			class:disconnect={$connected}
			on:click={handleConnect}
		>
			{$connected ? 'Disconnect' : 'Connect'}
		</button>
	</div>
</div>

<style>
	.controls {
		display: flex;
		flex-direction: column;
		gap: 15px;
		margin: 20px 0;
	}

	.port-selector {
		display: flex;
		gap: 10px;
		justify-content: center;
		align-items: center;
	}

	select {
		background: var(--control-bg);
		color: var(--primary-accent);
		border: 1px solid var(--primary-accent-panel);
		padding: 10px 15px;
		font-size: 1em;
		font-family: 'Courier New', monospace;
		border-radius: 5px;
		min-width: 300px;
		cursor: pointer;
	}

	select:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	select option {
		background: var(--option-bg);
		color: var(--app-text);
	}

	.refresh-btn {
		padding: 10px 15px !important;
		font-size: 1.2em !important;
		min-width: auto;
	}

	button {
		background: linear-gradient(135deg, var(--button-success-start) 0%, var(--button-success-end) 100%);
		color: var(--button-text-on-success);
		border: none;
		padding: 12px 30px;
		font-size: 1em;
		font-weight: bold;
		border-radius: 5px;
		cursor: pointer;
		font-family: 'Courier New', monospace;
		transition: all 0.3s ease;
		box-shadow: var(--button-shadow);
	}

	button:hover {
		transform: translateY(-2px);
		box-shadow: var(--button-shadow-hover-success);
	}

	button:active {
		transform: translateY(0);
	}

	button.disconnect {
		background: linear-gradient(135deg, var(--button-danger-start) 0%, var(--button-danger-end) 100%);
		color: var(--button-text-on-color);
		padding: 12px 18px;
	}

	button.secondary {
		background: linear-gradient(135deg, var(--button-primary-start) 0%, var(--button-primary-end) 100%);
		color: var(--button-text-on-color);
	}

	button.warning {
		background: linear-gradient(135deg, var(--button-warning-start) 0%, var(--button-warning-end) 100%);
		color: var(--button-text-on-color);
	}

	button:disabled {
		background: var(--button-disabled);
		cursor: not-allowed;
		opacity: 0.5;
	}

	@media (max-width: 768px) {
		.port-selector {
			flex-direction: column;
		}

		select {
			min-width: auto;
			width: 100%;
		}

		button {
			width: 100%;
		}
	}
</style>
