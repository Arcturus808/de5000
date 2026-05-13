<script>
	import { connected } from '$lib/stores/device.js';
	import { connectToDevice, disconnectDevice, isSerialSupported } from '$lib/serial/connection.js';

	const serialSupported = isSerialSupported();

	function handleConnect() {
		if ($connected) {
			disconnectDevice();
		} else {
			connectToDevice();
		}
	}
</script>

<div class="controls">
	<button
		class:disconnect={$connected}
		on:click={handleConnect}
		disabled={!serialSupported}
	>
		{$connected ? 'Disconnect' : 'Connect'}
	</button>
</div>

<style>
	.controls {
		display: flex;
		justify-content: center;
		gap: 15px;
		margin: 20px 0;
		flex-wrap: wrap;
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
		font-family: 'Roboto', sans-serif;
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
	}

	button:disabled {
		background: var(--button-disabled);
		cursor: not-allowed;
		opacity: 0.5;
	}

	@media (max-width: 768px) {
		.controls {
			flex-direction: column;
		}

		button {
			width: 100%;
		}
	}
</style>
