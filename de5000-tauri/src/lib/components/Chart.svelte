<script>
	import { onDestroy, onMount } from 'svelte';
	import { chartData, secChartData, connected, logging, dataLog, statistics, secStatistics, lastMeasurement, showError, showSuccess, clearLogData } from '$lib/stores/device.js';
	import { formatDisplayValue } from '$lib/utils/format.js';
	import { exportData } from '$lib/utils/export.js';
	import { alerts, checkAlerts, playAlertSound } from '$lib/stores/alerts.js';
	import { ntfyEnabled, ntfyOncePerCrossing } from '$lib/stores/settings.js';
	import { publishNotification, isNtfyRunning } from '$lib/utils/notify.js';
	import AlertModal from './AlertModal.svelte';

	let primaryCanvas;
	let primaryCtx;
	let secondaryCanvas;
	let secondaryCtx;

	let showSecondary = localStorage.getItem('de5000-show-secondary') === 'true';

	function toggleSecondary() {
		showSecondary = !showSecondary;
		localStorage.setItem('de5000-show-secondary', showSecondary.toString());
	}

	onMount(() => {
		primaryCtx = primaryCanvas.getContext('2d');
		drawChart(primaryCtx, primaryCanvas, $chartData, getThemeColor('--primary-accent'));
		window.addEventListener('de5000-theme-change', redrawCharts);
	});

	onDestroy(() => {
		window.removeEventListener('de5000-theme-change', redrawCharts);
	});

	$: if (primaryCtx) drawChart(primaryCtx, primaryCanvas, $chartData, getThemeColor('--primary-accent'));

	$: if (showSecondary && secondaryCanvas) {
		if (!secondaryCtx || !secondaryCanvas.isConnected) {
			secondaryCtx = secondaryCanvas.getContext('2d');
		}
		drawChart(secondaryCtx, secondaryCanvas, $secChartData, getThemeColor('--secondary-accent'));
	} else {
		secondaryCtx = null;
	}

	// Alert checking
	let alertActive = false;
	let alertFlash = false;
	let notifiedAlerts = new Set();

	function formatAlertName(name) {
		return name.replace(/([A-Z])/g, ' $1').trim().replace(/High$/, '≥').replace(/Low$/, '≤');
	}

	$: {
		if ($lastMeasurement && $connected) {
			const mainVal = $lastMeasurement.main_status === 'normal' ? $lastMeasurement.main_val : null;
			const secVal = $lastMeasurement.sec_status === 'normal' ? $lastMeasurement.sec_val : null;
			const triggered = checkAlerts($alerts, mainVal, secVal);
			if (triggered.length > 0) {
				alertActive = true;
				alertFlash = true;
				playAlertSound();
				if ($ntfyEnabled && isNtfyRunning()) {
					const toNotify = $ntfyOncePerCrossing
						? triggered.filter(t => !notifiedAlerts.has(t.name))
						: triggered;
					if (toNotify.length > 0) {
						const details = toNotify.map(t => `${formatAlertName(t.name)} ${t.value} (threshold ${t.threshold})`).join(', ');
						publishNotification('DE-5000 Alert', details, 'high');
						toNotify.forEach(t => notifiedAlerts.add(t.name));
					}
				}
				setTimeout(() => (alertFlash = false), 500);
			} else {
				alertActive = false;
				alertFlash = false;
				notifiedAlerts.clear();
			}
		} else {
			alertActive = false;
			alertFlash = false;
		}
	}

	function handleLog() {
		if ($logging) {
			logging.set(false);
		} else {
			logging.set(true);
		}
	}

	let exportFormat = 'csv';

	async function handleExport() {
		try {
			const exported = await exportData($dataLog, exportFormat);
			if (exported) {
				showSuccess(`${exportFormat.toUpperCase()} file saved`);
			} else {
				showError('No data to export');
			}
		} catch (error) {
			showError(`Export failed: ${error}`);
		}
	}

	let clearMessage = false;

	function handleClear() {
		if (confirm('Are you sure you want to clear all logged data?')) {
			clearLogData();
			clearMessage = true;
			setTimeout(() => (clearMessage = false), 2000);
		}
	}

	function drawChart(ctx, canvas, data, lineColor) {
		if (!canvas || !ctx) return;

		const width = (canvas.width = canvas.offsetWidth);
		const height = (canvas.height = canvas.offsetHeight);

		ctx.clearRect(0, 0, width, height);

		const values = data.values.filter((v) => v !== null && !isNaN(v));

		if (values.length < 2) {
			ctx.fillStyle = getThemeColor('--chart-axis');
			ctx.font = '14px Courier New';
			ctx.textAlign = 'center';
			ctx.fillText('No data to display', width / 2, height / 2);
			return;
		}

		const minVal = Math.min(...values);
		const maxVal = Math.max(...values);
		const range = maxVal - minVal || 1;

		const paddingX = 60;
		const paddingY = 20;
		const graphWidth = width - paddingX * 2;
		const graphHeight = height - paddingY * 2;

		const units = data.units || '';

		// Draw grid
		ctx.strokeStyle = getThemeColor('--chart-grid');
		ctx.lineWidth = 1;
		for (let i = 0; i <= 5; i++) {
			const y = paddingY + (graphHeight / 5) * i;
			ctx.beginPath();
			ctx.moveTo(paddingX, y);
			ctx.lineTo(width - paddingX, y);
			ctx.stroke();
		}

		// Draw y-axis labels
		ctx.fillStyle = getThemeColor('--chart-axis');
		ctx.font = '14px Courier New';
		ctx.textAlign = 'right';

		for (let i = 0; i <= 5; i++) {
			const y = paddingY + (graphHeight / 5) * i;
			const val = maxVal - (range / 5) * i;
			ctx.fillText(formatDisplayValue(val, units), paddingX - 5, y + 4);
		}

		// Draw line
		ctx.strokeStyle = lineColor;
		ctx.lineWidth = 2;
		ctx.beginPath();

		data.values.forEach((val, i) => {
			if (val === null || isNaN(val)) return;

			const x = paddingX + (graphWidth / (data.values.length - 1)) * i;
			const y = paddingY + graphHeight - ((val - minVal) / range) * graphHeight;

			if (i === 0) {
				ctx.moveTo(x, y);
			} else {
				ctx.lineTo(x, y);
			}
		});

		ctx.stroke();

		// Draw points
		ctx.fillStyle = lineColor;
		data.values.forEach((val, i) => {
			if (val === null || isNaN(val)) return;

			const x = paddingX + (graphWidth / (data.values.length - 1)) * i;
			const y = paddingY + graphHeight - ((val - minVal) / range) * graphHeight;

			ctx.beginPath();
			ctx.arc(x, y, 3, 0, Math.PI * 2);
			ctx.fill();
		});
	}

	function getThemeColor(variableName) {
		if (typeof document === 'undefined') return '';
		return getComputedStyle(document.body).getPropertyValue(variableName).trim();
	}

	function redrawCharts() {
		if (primaryCtx) drawChart(primaryCtx, primaryCanvas, $chartData, getThemeColor('--primary-accent'));
		if (secondaryCtx) drawChart(secondaryCtx, secondaryCanvas, $secChartData, getThemeColor('--secondary-accent'));
	}
</script>

<div class="chart-container" class:alert-flash={alertFlash}>
	<div class="chart-header-row">
		<h3>📈 Primary Chart {#if alertActive}<span class="alert-badge">⚠ ALERT</span>{/if}</h3>
		<div class="header-right">
			<span class="sample-count">Samples: {$dataLog.length}</span>
			<AlertModal bind:showSecondary />
			<button class="secondary toggle-btn" on:click={toggleSecondary}>
				{showSecondary ? 'Hide Secondary' : 'Show Secondary'}
			</button>
		</div>
	</div>
	{#if $connected}
		<div class="chart-controls">
			{#if clearMessage}
				<div class="clear-status">✓ Data Log Cleared</div>
			{/if}
			{#if $logging}
				<div class="logging-status">● Data Logging Active</div>
			{/if}
			<div class="chart-actions">
				<button class:warning={$logging} class:secondary={!$logging} on:click={handleLog}>
					{$logging ? 'Stop Logging' : 'Start Logging'}
				</button>
				<div class="export-group">
					<button class="secondary" on:click={handleExport}>Export Data</button>
					<select bind:value={exportFormat} class="export-format">
						<option value="csv">CSV</option>
						<option value="xlsx">Excel</option>
						<option value="json">JSON</option>
					</select>
				</div>
				<button class="warning" on:click={handleClear}>Clear Log</button>
			</div>
		</div>
	{/if}
	<canvas bind:this={primaryCanvas} class="chart-canvas"></canvas>
	<div class="chart-stats">
		<div class="stat-item"><span class="stat-label">Min</span> <span class="stat-value primary-stat">{$statistics.min}</span></div>
		<div class="stat-item"><span class="stat-label">Max</span> <span class="stat-value primary-stat">{$statistics.max}</span></div>
		<div class="stat-item"><span class="stat-label">Avg</span> <span class="stat-value primary-stat">{$statistics.avg}</span></div>
		<div class="stat-item"><span class="stat-label">σ</span> <span class="stat-value primary-stat">{$statistics.stdDev}</span></div>
	</div>
</div>

{#if showSecondary}
	<div class="chart-container secondary">
		<div class="chart-header-row">
			<h3>📈 Secondary Chart</h3>
		</div>
		<canvas bind:this={secondaryCanvas} class="chart-canvas"></canvas>
		<div class="chart-stats">
			<div class="stat-item"><span class="stat-label">Min</span> <span class="stat-value secondary-stat">{$secStatistics.min}</span></div>
			<div class="stat-item"><span class="stat-label">Max</span> <span class="stat-value secondary-stat">{$secStatistics.max}</span></div>
			<div class="stat-item"><span class="stat-label">Avg</span> <span class="stat-value secondary-stat">{$secStatistics.avg}</span></div>
			<div class="stat-item"><span class="stat-label">σ</span> <span class="stat-value secondary-stat">{$secStatistics.stdDev}</span></div>
		</div>
	</div>
{/if}

<style>
	.chart-container {
		background: var(--surface);
		border: 1px solid var(--primary-accent-panel);
		border-radius: 10px;
		padding: 12px;
		margin-top: 12px;
		transition: border-color 0.3s ease;
	}

	.chart-container.alert-flash {
		border-color: var(--danger-accent);
	}

	.chart-container.secondary {
		border-color: var(--secondary-accent-border);
		margin-top: 8px;
	}

	.chart-header-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.header-right {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.sample-count {
		color: var(--label-color);
		font-size: 0.85em;
		font-family: 'Roboto', sans-serif;
	}

	.toggle-btn {
		background: linear-gradient(135deg, var(--button-primary-start) 0%, var(--button-primary-end) 100%) !important;
		color: var(--button-text-on-color) !important;
		border: none;
		padding: 4px 12px;
		font-size: 0.8em;
		font-weight: bold;
		border-radius: 5px;
		cursor: pointer;
		font-family: 'Roboto', sans-serif;
		transition: all 0.3s ease;
		box-shadow: var(--button-shadow);
	}

	.toggle-btn:hover {
		transform: translateY(-1px);
		box-shadow: var(--button-shadow-hover-primary);
	}

	.chart-controls {
		display: flex;
		align-items: center;
		gap: 10px;
		flex-wrap: wrap;
		margin-top: 6px;
		margin-bottom: 4px;
	}

	.logging-status {
		color: var(--warning-accent);
		font-size: 0.85em;
		font-weight: bold;
		font-family: 'Roboto', sans-serif;
		animation: pulse 1.5s ease-in-out infinite;
	}

	.clear-status {
		color: var(--primary-accent);
		font-size: 0.85em;
		font-weight: bold;
		font-family: 'Roboto', sans-serif;
	}

	@keyframes pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.5; }
	}

	h3 {
		color: var(--card-title-color);
		font-family: var(--readout-font);
		margin: 0;
	}

	.chart-actions {
		display: flex;
		gap: 8px;
		align-items: center;
		flex-wrap: wrap;
	}

	.chart-actions button {
		background: linear-gradient(135deg, var(--button-primary-start) 0%, var(--button-primary-end) 100%);
		color: var(--button-text-on-color);
		border: none;
		padding: 6px 14px;
		font-size: 0.85em;
		font-weight: bold;
		border-radius: 5px;
		cursor: pointer;
		font-family: 'Roboto', sans-serif;
		transition: all 0.3s ease;
		box-shadow: var(--button-shadow);
	}

	.chart-actions button:hover {
		transform: translateY(-1px);
		box-shadow: var(--button-shadow-hover-primary);
	}

	.chart-actions button:active {
		transform: translateY(0);
	}

	.chart-actions button.warning {
		background: linear-gradient(135deg, var(--button-warning-start) 0%, var(--button-warning-end) 100%);
	}

	.export-group {
		display: flex;
		gap: 0;
	}

	.export-group button {
		border-radius: 5px 0 0 5px;
	}

	.export-format {
		background: var(--button-primary-start);
		color: var(--button-text-on-color);
		border: none;
		border-radius: 0 5px 5px 0;
		padding: 6px 8px;
		font-size: 0.85em;
		font-weight: bold;
		font-family: 'Roboto', sans-serif;
		cursor: pointer;
		border-left: 1px solid var(--border-strong);
	}

	.chart-canvas {
		width: 100%;
		height: 150px;
		background: var(--chart-bg);
		border-radius: 5px;
	}

	.chart-stats {
		display: flex;
		gap: 16px;
		margin-top: 6px;
		padding: 4px 8px;
	}

	.stat-item {
		display: flex;
		align-items: baseline;
		gap: 4px;
	}

	.stat-label {
		color: var(--label-color);
		font-size: 0.75em;
		font-family: var(--readout-font);
	}

	.stat-value {
		font-size: 0.85em;
		font-family: var(--readout-font);
		font-weight: bold;
	}

	.primary-stat {
		color: var(--primary-accent);
	}

	.secondary-stat {
		color: var(--secondary-accent);
	}

	.alert-badge {
		color: var(--danger-accent);
		font-size: 0.7em;
		background: var(--danger-accent-soft);
		padding: 2px 8px;
		border-radius: 4px;
		border: 1px solid var(--danger-accent-border);
		animation: alert-pulse 1s ease-in-out infinite;
		margin-left: 8px;
	}

	@keyframes alert-pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.5; }
	}
</style>
