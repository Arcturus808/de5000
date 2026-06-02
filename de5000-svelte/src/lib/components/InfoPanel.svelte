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
			<label>Tolerance<span class="info-icon">?<span class="tooltip">Applies to the sorting function of the meter</span></span></label>
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
		display: inline-flex;
		align-items: center;
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

	.info-icon {
		display: inline-block;
		width: 16px;
		height: 16px;
		background: var(--secondary-accent-muted);
		border: 1px solid var(--secondary-accent-border);
		border-radius: 50%;
		text-align: center;
		line-height: 16px;
		font-size: 11px;
		color: var(--secondary-accent-text);
		cursor: help;
		margin-left: 5px;
		position: relative;
	}

	.info-icon:hover {
		background: var(--secondary-accent-border);
	}

	.tooltip {
		visibility: hidden;
		position: absolute;
		bottom: 125%;
		left: 50%;
		transform: translateX(-50%);
		background: var(--popover-bg);
		color: var(--primary-accent);
		padding: 10px 15px;
		border-radius: 5px;
		border: 1px solid var(--primary-accent-panel);
		font-size: 12px;
		white-space: nowrap;
		z-index: 1000;
		box-shadow: var(--shadow);
	}

	.tooltip::after {
		content: '';
		position: absolute;
		top: 100%;
		left: 50%;
		transform: translateX(-50%);
		border: 5px solid transparent;
		border-top-color: var(--popover-bg);
	}

	.info-icon:hover .tooltip {
		visibility: visible;
	}

	@media (max-width: 768px) {
		.tooltip {
			white-space: normal;
			width: 200px;
			left: auto;
			right: 0;
			transform: none;
		}

		.tooltip::after {
			left: auto;
			right: 10px;
			transform: none;
		}
	}
</style>
