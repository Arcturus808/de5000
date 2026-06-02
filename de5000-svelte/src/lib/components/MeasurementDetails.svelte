<script>
	import { lastMeasurement } from '$lib/stores/device.js';
	import { formatDisplayValue } from '$lib/utils/format.js';

	function formatUnits(units) {
		return units ? units.replace(/Ohm/g, 'Ω') : '';
	}

	$: m = $lastMeasurement;

	$: mainDetail =
		m?.main_status === 'normal'
			? `${formatDisplayValue(m.main_val, m.main_units)} ${formatUnits(m.main_units)}`
			: '----';

	$: secDetail =
		m?.sec_status === 'normal'
			? `${formatDisplayValue(m.sec_val, m.sec_units)} ${formatUnits(m.sec_units)}`
			: '----';

	// Parse frequency in Hz for calculations
	$: freqHz = (() => {
		if (!m?.freq) return null;
		const s = m.freq.replace(/\s/g, '');
		if (s === 'DC') return 0;
		const match = s.match(/^([\d.]+)(Hz|kHz|KHz|MHz)$/i);
		if (!match) return null;
		const val = parseFloat(match[1]);
		const unit = match[2].toLowerCase();
		if (unit === 'khz') return val * 1000;
		if (unit === 'mhz') return val * 1e6;
		return val;
	})();

	// Normalized main value in base units
	$: mainNorm = m?.main_status === 'normal' && m?.main_norm_val != null ? m.main_norm_val : null;
	$: mainNormUnits = m?.main_norm_units || '';

	// Calculated values
	$: reactance = (() => {
		if (freqHz == null || freqHz === 0 || mainNorm == null) return null;
		const q = mainNormUnits;
		if (q === 'H') return 2 * Math.PI * freqHz * mainNorm;
		if (q === 'F') return 1 / (2 * Math.PI * freqHz * mainNorm);
		return null;
	})();

	$: impedance = (() => {
		if (reactance == null) return null;
		if (m?.sec_quantity === 'D' && m?.sec_status === 'normal' && m?.sec_val != null) {
			const R = reactance * m.sec_val;
			return Math.sqrt(R * R + reactance * reactance);
		}
		if (m?.sec_quantity === 'Q' && m?.sec_status === 'normal' && m?.sec_val != null) {
			const R = reactance / m.sec_val;
			return Math.sqrt(R * R + reactance * reactance);
		}
		return Math.abs(reactance);
	})();

	$: esr = (() => {
		if (m?.sec_quantity === 'ESR' && m?.sec_status === 'normal') return m.sec_norm_val;
		if (reactance != null && m?.sec_quantity === 'D' && m?.sec_status === 'normal' && m?.sec_val != null) return reactance * m.sec_val;
		if (reactance != null && m?.sec_quantity === 'Q' && m?.sec_status === 'normal' && m?.sec_val != null && m.sec_val !== 0) return reactance / m.sec_val;
		return null;
	})();

	$: qualityFactor = (() => {
		if (m?.sec_quantity === 'Q' && m?.sec_status === 'normal') return m.sec_val;
		if (m?.sec_quantity === 'D' && m?.sec_status === 'normal' && m.sec_val !== 0) return 1 / m.sec_val;
		return null;
	})();

	$: dissipationFactor = (() => {
		if (m?.sec_quantity === 'D' && m?.sec_status === 'normal') return m.sec_val;
		if (m?.sec_quantity === 'Q' && m?.sec_status === 'normal' && m.sec_val !== 0) return 1 / m.sec_val;
		return null;
	})();

	function formatCalculated(val, baseUnit) {
		if (val == null || isNaN(val)) return '--';
		const abs = Math.abs(val);
		const u = baseUnit.replace('Ohm', 'Ω');
		if (abs >= 1e6) return `${(val / 1e6).toFixed(3)} M${u}`;
		if (abs >= 1e3) return `${(val / 1e3).toFixed(3)} k${u}`;
		if (abs >= 1) return `${val.toFixed(3)} ${u}`;
		if (abs >= 1e-3) return `${(val * 1e3).toFixed(3)} m${u}`;
		if (abs >= 1e-6) return `${(val * 1e6).toFixed(3)} µ${u}`;
		return `${val.toExponential(3)} ${u}`;
	}

	function formatDimensionless(val) {
		if (val == null || isNaN(val)) return '--';
		const abs = Math.abs(val);
		if (abs >= 100) return val.toFixed(1);
		if (abs >= 10) return val.toFixed(2);
		if (abs >= 1) return val.toFixed(3);
		return val.toFixed(4);
	}

	$: hasCalculated = reactance != null || impedance != null || esr != null || qualityFactor != null || dissipationFactor != null;
	$: model = m?.parallel ? 'Parallel' : 'Series';
</script>

<div class="measurement-details">
	<h3>Measurement Details</h3>
	<div class="tables-row">
		<table class="detail-table">
			<tbody>
				<tr>
					<td class="label">Main</td>
					<td class="value">{mainDetail}</td>
				</tr>
				<tr>
					<td class="label">Secondary</td>
					<td class="value">{secDetail}</td>
				</tr>
				<tr>
					<td class="label">Model</td>
					<td class="value">{m ? model : '--'}</td>
				</tr>
				<tr>
					<td class="label">Frequency</td>
					<td class="value">{m?.freq || '--'}</td>
				</tr>
				<tr>
					<td class="label">Tolerance</td>
					<td class="value">{m?.tolerance || 'N/A'}</td>
				</tr>
			</tbody>
		</table>
		{#if hasCalculated}
			<table class="detail-table calculated">
				<tbody>
					{#if reactance != null}
						<tr>
							<td class="label">Reactance (X)</td>
							<td class="value">{formatCalculated(reactance, 'Ohm')}</td>
						</tr>
					{/if}
					{#if impedance != null}
						<tr>
							<td class="label">Impedance (|Z|)</td>
							<td class="value">{formatCalculated(impedance, 'Ohm')}</td>
						</tr>
					{/if}
					{#if esr != null}
						<tr>
							<td class="label">ESR</td>
							<td class="value">{formatCalculated(esr, 'Ohm')}</td>
						</tr>
					{/if}
					{#if qualityFactor != null}
						<tr>
							<td class="label">Quality (Q)</td>
							<td class="value">{formatDimensionless(qualityFactor)}</td>
						</tr>
					{/if}
					{#if dissipationFactor != null && m?.sec_quantity !== 'D'}
						<tr>
							<td class="label">Dissipation (D)</td>
							<td class="value">{formatDimensionless(dissipationFactor)}</td>
						</tr>
					{/if}
				</tbody>
			</table>
		{/if}
	</div>
</div>

<style>
	.measurement-details {
		background: var(--secondary-accent-soft);
		border: 1px solid var(--secondary-accent-muted);
		border-radius: 10px;
		padding: 12px 15px;
	}

	h3 {
		color: var(--card-title-color);
		font-size: 1em;
		margin-bottom: 8px;
		font-family: var(--readout-font);
	}

	.tables-row {
		display: flex;
		gap: 12px;
	}

	.detail-table {
		flex: 1;
		border-collapse: collapse;
		min-width: 0;
	}

	.detail-table td {
		padding: 3px 8px;
		vertical-align: middle;
		border-bottom: 1px solid var(--secondary-accent-muted);
	}

	.detail-table tr:last-child td {
		border-bottom: none;
	}

	.detail-table .label {
		color: var(--label-color);
		font-size: 0.8em;
		font-family: var(--readout-font);
		white-space: nowrap;
		width: 1%;
		white-space: nowrap;
	}

	.detail-table .value {
		color: var(--readout-color);
		font-size: 0.9em;
		font-family: var(--readout-font);
		text-align: right;
		white-space: nowrap;
	}

	.detail-table.calculated {
		border-left: 1px solid var(--secondary-accent-muted);
	}

	.detail-table.calculated .label {
		color: var(--secondary-accent);
	}

	.detail-table.calculated .value {
		color: var(--secondary-accent);
	}

	@media (max-width: 768px) {
		.tables-row {
			flex-direction: column;
			gap: 8px;
		}

		.detail-table.calculated {
			border-left: none;
			border-top: 1px solid var(--secondary-accent-muted);
		}
	}
</style>
