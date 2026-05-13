<script>
	import { alerts, hasAnyAlertEnabled } from '$lib/stores/alerts.js';
	import { chartData, secChartData } from '$lib/stores/device.js';

	export let showSecondary = false;

	let open = false;

	function toggle() {
		open = !open;
	}

	function handleClose() {
		open = false;
	}

	$: primaryUnits = $chartData.units || '';
	$: secondaryUnits = $secChartData.units || '';
	$: anyEnabled = hasAnyAlertEnabled($alerts);
</script>

<button class="alert-btn" class:has-alerts={anyEnabled} on:click={toggle} title="Set Alerts">
	🔔
</button>

{#if open}
	<div class="overlay" on:click={handleClose}>
		<div class="modal" on:click|stopPropagation>
			<div class="modal-header">
				<h2>🔔 Set Alerts</h2>
				<button class="close-btn" on:click={handleClose}>✕</button>
			</div>

			<div class="alert-section">
				<h3 class="section-title primary-title">Primary Measurement</h3>
				{#if primaryUnits}
					<span class="units-hint">Units: {primaryUnits}</span>
				{/if}

				<div class="alert-row">
					<label class="alert-toggle">
						<input type="checkbox" checked={$alerts.primaryHigh.enabled}
							on:change={() => alerts.updateField('primaryHigh', { enabled: !$alerts.primaryHigh.enabled })} />
						<span class="toggle-slider"></span>
					</label>
					<div class="alert-input-group">
						<label class="alert-label">High threshold</label>
						<input type="number" class="alert-input" placeholder="Max value"
							value={$alerts.primaryHigh.value}
							on:input={(e) => alerts.updateField('primaryHigh', { value: e.target.value })} />
					</div>
				</div>

				<div class="alert-row">
					<label class="alert-toggle">
						<input type="checkbox" checked={$alerts.primaryLow.enabled}
							on:change={() => alerts.updateField('primaryLow', { enabled: !$alerts.primaryLow.enabled })} />
						<span class="toggle-slider"></span>
					</label>
					<div class="alert-input-group">
						<label class="alert-label">Low threshold</label>
						<input type="number" class="alert-input" placeholder="Min value"
							value={$alerts.primaryLow.value}
							on:input={(e) => alerts.updateField('primaryLow', { value: e.target.value })} />
					</div>
				</div>
			</div>

			{#if showSecondary}
				<div class="alert-section">
					<h3 class="section-title secondary-title">Secondary Measurement</h3>
					{#if secondaryUnits}
						<span class="units-hint">Units: {secondaryUnits}</span>
					{/if}

					<div class="alert-row">
						<label class="alert-toggle">
							<input type="checkbox" checked={$alerts.secondaryHigh.enabled}
								on:change={() => alerts.updateField('secondaryHigh', { enabled: !$alerts.secondaryHigh.enabled })} />
							<span class="toggle-slider"></span>
						</label>
						<div class="alert-input-group">
							<label class="alert-label">High threshold</label>
							<input type="number" class="alert-input" placeholder="Max value"
								value={$alerts.secondaryHigh.value}
								on:input={(e) => alerts.updateField('secondaryHigh', { value: e.target.value })} />
						</div>
					</div>

					<div class="alert-row">
						<label class="alert-toggle">
							<input type="checkbox" checked={$alerts.secondaryLow.enabled}
								on:change={() => alerts.updateField('secondaryLow', { enabled: !$alerts.secondaryLow.enabled })} />
							<span class="toggle-slider"></span>
						</label>
						<div class="alert-input-group">
							<label class="alert-label">Low threshold</label>
							<input type="number" class="alert-input" placeholder="Min value"
								value={$alerts.secondaryLow.value}
								on:input={(e) => alerts.updateField('secondaryLow', { value: e.target.value })} />
						</div>
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.alert-btn {
		background: none;
		border: 1px solid var(--border-strong);
		color: var(--muted-text);
		cursor: pointer;
		padding: 4px 8px;
		border-radius: 5px;
		font-size: 1em;
		transition: all 0.3s ease;
	}

	.alert-btn:hover {
		color: var(--warning-accent);
		border-color: var(--warning-accent-border);
		background: var(--warning-accent-soft);
	}

	.alert-btn.has-alerts {
		color: var(--warning-accent);
		border-color: var(--warning-accent-border);
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
		border: 1px solid var(--warning-accent-border);
		border-radius: 12px;
		padding: 25px;
		min-width: 380px;
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
	}

	.modal-header h2 {
		color: var(--warning-accent);
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

	.alert-section {
		margin-bottom: 20px;
	}

	.alert-section:last-child {
		margin-bottom: 0;
	}

	.section-title {
		font-size: 0.95em;
		margin: 0 0 4px 0;
	}

	.primary-title {
		color: var(--primary-accent);
	}

	.secondary-title {
		color: var(--secondary-accent);
	}

	.units-hint {
		color: var(--muted-text);
		font-size: 0.75em;
		display: block;
		margin-bottom: 10px;
	}

	.alert-row {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-bottom: 10px;
	}

	.alert-toggle {
		position: relative;
		display: inline-block;
		width: 40px;
		height: 22px;
		flex-shrink: 0;
		cursor: pointer;
	}

	.alert-toggle input {
		opacity: 0;
		width: 0;
		height: 0;
	}

	.toggle-slider {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: var(--switch-bg);
		border-radius: 22px;
		transition: background 0.3s;
	}

	.toggle-slider::before {
		content: '';
		position: absolute;
		width: 16px;
		height: 16px;
		left: 3px;
		bottom: 3px;
		background: var(--switch-thumb);
		border-radius: 50%;
		transition: transform 0.3s;
	}

	.alert-toggle input:checked + .toggle-slider {
		background: var(--warning-accent);
	}

	.alert-toggle input:checked + .toggle-slider::before {
		transform: translateX(18px);
	}

	.alert-input-group {
		flex: 1;
	}

	.alert-label {
		color: var(--muted-text);
		font-size: 0.8em;
		display: block;
		margin-bottom: 3px;
	}

	.alert-input {
		width: 100%;
		padding: 8px 10px;
		background: var(--surface-muted);
		border: 1px solid var(--border);
		border-radius: 6px;
		color: var(--app-text);
		font-size: 0.9em;
		font-family: 'Roboto', sans-serif;
		transition: border-color 0.2s;
	}

	.alert-input:focus {
		outline: none;
		border-color: var(--warning-accent-border);
	}

	.alert-input::placeholder {
		color: var(--input-placeholder);
	}

	@media (max-width: 768px) {
		.modal {
			min-width: auto;
			margin: 20px;
		}
	}
</style>
