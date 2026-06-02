<script>
	import { lastMeasurement, activeModes } from '$lib/stores/device.js';
</script>

<div class="info-panel">
	<div class="info-row">
		<div class="info-item">
			<label>Frequency</label>
			<div class="value">{$lastMeasurement?.freq || '--'}</div>
		</div>
		<div class="info-item">
			<label>Status</label>
			<div class="value">{$lastMeasurement?.main_status || '--'}</div>
		</div>
		<div class="info-item">
			<label>Tolerance</label>
			<div class="value">{$lastMeasurement?.tolerance || 'N/A'}</div>
		</div>
	</div>
	<div class="info-item modes-item">
		<label>Active Modes</label>
		<div class="mode-text">
			{$activeModes.length > 0 ? $activeModes.join(', ') : 'None'}
		</div>
	</div>
</div>

<style>
	.info-panel {
		background: var(--surface);
		border: 1px solid var(--primary-accent-panel);
		border-radius: 10px;
		padding: 20px;
		display: flex;
		flex-direction: column;
		gap: 15px;
	}

	.info-row {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 15px;
	}

	.info-item {
		padding: 10px;
		background: var(--surface-muted);
		border-radius: 5px;
	}

	.modes-item {
		background: var(--surface-muted);
		border-radius: 5px;
		padding: 10px;
	}

	label {
		color: var(--label-color);
		font-size: 0.9em;
		display: block;
		margin-bottom: 5px;
		font-family: var(--readout-font);
	}

	.value {
		color: var(--readout-color);
		font-size: 1.1em;
		font-family: var(--readout-font);
	}

	.mode-text {
		color: var(--readout-color);
		font-size: 1.1em;
		font-family: var(--readout-font);
		margin-top: 5px;
	}
</style>
