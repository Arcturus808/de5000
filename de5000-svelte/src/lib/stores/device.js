import { writable, derived } from 'svelte/store';
import { formatDisplayValue } from '$lib/utils/format.js';

// ===== Core state stores =====
export const connected = writable(false);
export const logging = writable(false);
export const lastMeasurement = writable(null);
export const timestamp = writable('--');
export const dataLog = writable([]);
export const chartData = writable({
	timestamps: [],
	values: [],
	units: null
});

export const secChartData = writable({
	timestamps: [],
	values: [],
	units: null
});

// ===== Toast / feedback messages =====
export const errorMessage = writable('');
export const successMessage = writable('');

let successTimeout = null;

export function showError(msg) {
	errorMessage.set(msg);
}

export function hideError() {
	errorMessage.set('');
}

export function showSuccess(msg) {
	successMessage.set(msg);
	if (successTimeout) clearTimeout(successTimeout);
	successTimeout = setTimeout(() => successMessage.set(''), 3000);
}

function computeStats(chartDataObj) {
	const values = chartDataObj.values.filter((v) => v !== null && !isNaN(v));

	if (values.length === 0) {
		return { count: 0, min: '--', max: '--', avg: '--', stdDev: '--' };
	}

	const min = Math.min(...values);
	const max = Math.max(...values);
	const avg = values.reduce((a, b) => a + b, 0) / values.length;
	const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
	const stdDev = Math.sqrt(variance);

	const units = chartDataObj.units || '';

	return {
		count: values.length,
		min: formatDisplayValue(min, units),
		max: formatDisplayValue(max, units),
		avg: formatDisplayValue(avg, units),
		stdDev: formatDisplayValue(stdDev, units)
	};
}

// ===== Statistics (derived) =====
export const statistics = derived(chartData, computeStats);
export const secStatistics = derived(secChartData, computeStats);

// ===== Active modes (derived) =====
export const activeModes = derived(lastMeasurement, ($m) => {
	if (!$m) return [];
	const modes = [];
	if ($m.auto_range) modes.push('AUTO RNG');
	if ($m.lcr_auto) modes.push('LCR AUTO');
	if ($m.delta_mode) modes.push($m.ref_shown ? 'DELTA Ref' : 'DELTA');
	if ($m.cal_mode) modes.push('CALIBRATION');
	if ($m.sorting_mode) modes.push('SORTING');
	if ($m.parallel) modes.push('PARALLEL');
	return modes;
});

// ===== Log data action =====
export function logMeasurement(measurement) {
	const logEntry = {
		timestamp: new Date().toISOString(),
		main_quantity: measurement.main_quantity,
		main_value:
			measurement.main_status === 'normal'
				? formatDisplayValue(measurement.main_val, measurement.main_units)
				: measurement.main_status,
		main_units: measurement.main_units,
		sec_quantity: measurement.sec_quantity,
		sec_value:
			measurement.sec_status === 'normal'
				? formatDisplayValue(measurement.sec_val, measurement.sec_units)
				: measurement.sec_status,
		sec_units: measurement.sec_units,
		frequency: measurement.freq,
		tolerance: measurement.tolerance,
		parallel: measurement.parallel,
		auto_range: measurement.auto_range,
		lcr_auto: measurement.lcr_auto,
		delta_mode: measurement.delta_mode
	};

	dataLog.update((log) => [...log, logEntry]);

	// Update primary chart data (keep last 60 points)
	if (measurement.main_status === 'normal' && measurement.main_val !== null) {
		chartData.update((cd) => {
			const newTimestamps = [...cd.timestamps, new Date()];
			const newValues = [...cd.values, measurement.main_val];

			if (newValues.length > 60) {
				newTimestamps.shift();
				newValues.shift();
			}

			return {
				timestamps: newTimestamps,
				values: newValues,
				units: measurement.main_units
			};
		});
	}

	// Update secondary chart data (keep last 60 points)
	if (measurement.sec_status === 'normal' && measurement.sec_val !== null) {
		secChartData.update((cd) => {
			const newTimestamps = [...cd.timestamps, new Date()];
			const newValues = [...cd.values, measurement.sec_val];

			if (newValues.length > 60) {
				newTimestamps.shift();
				newValues.shift();
			}

			return {
				timestamps: newTimestamps,
				values: newValues,
				units: measurement.sec_units
			};
		});
	}
}

// ===== Clear log =====
export function clearLogData() {
	dataLog.set([]);
	chartData.set({ timestamps: [], values: [], units: null });
	secChartData.set({ timestamps: [], values: [], units: null });
}
