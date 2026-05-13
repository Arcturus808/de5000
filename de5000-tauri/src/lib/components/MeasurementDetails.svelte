<script>
	import { lastMeasurement } from '$lib/stores/device.js';
	import { formatDisplayValue } from '$lib/utils/format.js';

	function formatUnits(units) {
		return units.replace(/Ohm/g, 'Ω');
	}

	$: mainDetail =
		$lastMeasurement?.main_status === 'normal'
			? `${formatDisplayValue($lastMeasurement.main_val, $lastMeasurement.main_units)} ${formatUnits($lastMeasurement.main_units)}`
			: '----';

	$: secDetail =
		$lastMeasurement?.sec_status === 'normal'
			? `${formatDisplayValue($lastMeasurement.sec_val, $lastMeasurement.sec_units)} ${formatUnits($lastMeasurement.sec_units)}`
			: '----';
</script>

<div class="normalized-values">
	<h3>
		Measurement Details
		<span class="info-icon">
			?
			<span class="tooltip">Additional measurement information and quality parameters</span>
		</span>
	</h3>
	<div class="details-grid">
		<div class="info-item">
			<label>
				Main Reading
				<span class="info-icon">
					?
					<span class="tooltip">Primary measurement value with appropriate units</span>
				</span>
			</label>
			<div class="value">{mainDetail}</div>
		</div>
		<div class="info-item">
			<label>
				Secondary Reading
				<span class="info-icon">
					?
					<span class="tooltip"
						>Quality parameter: D (dissipation), Q (quality), ESR, Θ (phase), or Rp</span
					>
				</span>
			</label>
			<div class="value">{secDetail}</div>
		</div>
	</div>
</div>

<style>
	.normalized-values {
		background: var(--secondary-accent-soft);
		border: 1px solid var(--secondary-accent-muted);
		border-radius: 10px;
		padding: 15px;
	}

	h3 {
		color: var(--card-title-color);
		font-size: 1em;
		margin-bottom: 10px;
		font-family: var(--readout-font);
	}

	.details-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 15px;
		margin-top: 10px;
	}

	.info-item {
		padding: 10px;
		background: var(--surface-muted);
		border-radius: 5px;
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
