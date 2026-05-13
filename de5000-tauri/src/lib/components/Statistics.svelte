<script>
	import { statistics, dataLog } from '$lib/stores/device.js';
</script>

<div class="log-stats">
	<div class="stat-box">
		<label>Samples Logged</label>
		<div class="value">{$dataLog.length}</div>
	</div>
	<div class="stat-box">
		<label>Min Value</label>
		<div class="value">{$statistics.min}</div>
	</div>
	<div class="stat-box">
		<label>Max Value</label>
		<div class="value">{$statistics.max}</div>
	</div>
	<div class="stat-box">
		<label>Average</label>
		<div class="value">{$statistics.avg}</div>
	</div>
	<div class="stat-box">
		<label>Std Dev</label>
		<div class="value">{$statistics.stdDev}</div>
	</div>
</div>

<style>
	.log-stats {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: 10px;
		margin-top: 8px;
	}

	.stat-box {
		background: var(--surface-muted);
		padding: 8px;
		border-radius: 5px;
		text-align: center;
	}

	label {
		color: var(--label-color);
		font-size: 0.8em;
		display: block;
		font-family: var(--readout-font);
	}

	.value {
		color: var(--readout-color);
		font-size: 1.2em;
		font-weight: bold;
		font-family: var(--readout-font);
	}
</style>
