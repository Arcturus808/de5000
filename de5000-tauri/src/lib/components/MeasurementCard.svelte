<script>
	export let mainQuantity = '--';
	export let mainValue = '--';
	export let mainUnits = '--';
	export let secQuantity = '--';
	export let secValue = '--';
	export let secUnits = '--';

	function formatUnits(units) {
		return units.replace(/Ohm/g, 'Ω').replace(/u/g, 'μ');
	}
</script>

<div class="measurement-card">
	<div class="measurement-section">
		<h2>Primary</h2>
		<div class="measurement-readout">
			<span class="measurement-value">{mainValue}</span>
			<div class="measurement-units-group">
				<span class="measurement-label">{mainQuantity}</span>
				<span class="measurement-units">{formatUnits(mainUnits)}</span>
			</div>
		</div>
	</div>
	<div class="measurement-divider"></div>
	<div class="measurement-section">
		<h2>Secondary</h2>
		<div class="measurement-readout">
			<span class="measurement-value">{secValue}</span>
			<div class="measurement-units-group">
				<span class="measurement-label">{secQuantity}</span>
				<span class="measurement-units">{formatUnits(secUnits)}</span>
			</div>
		</div>
	</div>
</div>

<style>
	.measurement-card {
		background: var(--surface);
		border: 1px solid var(--primary-accent-panel);
		border-radius: 10px;
		padding: 10px;
		transition: all 0.3s ease;
	}

	.measurement-section {
		padding: 1px 0;
	}

	.measurement-divider {
		height: 1px;
		background: var(--primary-accent-panel);
		margin: 10px 0;
	}

	h2 {
		color: var(--card-title-color);
		font-size: 1em;
		margin-bottom: 10px;
		font-family: var(--readout-font);
	}

	.measurement-readout {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 10px;
		min-height: 1.2em;
	}

	.measurement-value {
		font-size: 2.5em;
		color: var(--readout-color);
		text-shadow: var(--readout-glow);
		transition: all 0.3s ease;
		font-family: var(--main-value-font);
		white-space: nowrap;
	}

	.measurement-value.changed {
		animation: flash 0.5s ease;
	}

	.measurement-units-group {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 2px;
	}

	.measurement-label {
		color: var(--label-color);
		font-size: 0.9em;
		font-family: var(--readout-font);
		white-space: nowrap;
	}

	.measurement-units {
		color: var(--label-color);
		font-size: 1.2em;
		font-family: var(--readout-font);
		white-space: nowrap;
	}

	@keyframes flash {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}

	@media (max-width: 768px) {
		.measurement-value {
			font-size: 2em;
		}
	}
</style>
