/**
 * Format a display value according to DE-5000 Manual Section 3.2 specs.
 * NO scientific notation - uses unit prefixes to keep values readable.
 *
 * @param {number} val
 * @param {string} units
 * @returns {string}
 */
export function formatDisplayValue(val, units) {
	if (val === null || val === undefined || isNaN(val)) return '--';

	const absVal = Math.abs(val);

	// Percentage and phase angle
	if (units === '%' || units === 'deg') {
		if (absVal >= 10) return val.toFixed(1);
		if (absVal >= 1) return val.toFixed(2);
		return val.toFixed(3);
	}

	// Dimensionless (D, Q, ESR ratios)
	if (units === '' || !units) {
		if (absVal >= 100) return val.toFixed(1);
		if (absVal >= 10) return val.toFixed(2);
		if (absVal >= 1) return val.toFixed(3);
		return val.toFixed(4);
	}

	// Resistance
	if (units === 'Ohm') {
		if (absVal >= 100) return val.toFixed(2);
		if (absVal >= 10) return val.toFixed(3);
		return val.toFixed(3);
	}
	if (units === 'kOhm') {
		if (absVal >= 100) return val.toFixed(2);
		if (absVal >= 10) return val.toFixed(3);
		if (absVal >= 1) return val.toFixed(4);
		return val.toFixed(4);
	}
	if (units === 'MOhm') {
		if (absVal >= 100) return val.toFixed(1);
		if (absVal >= 10) return val.toFixed(3);
		if (absVal >= 1) return val.toFixed(4);
		return val.toFixed(4);
	}

	// Capacitance
	if (units === 'pF') {
		if (absVal >= 1000) return val.toFixed(1);
		if (absVal >= 100) return val.toFixed(2);
		return val.toFixed(2);
	}
	if (units === 'nF') {
		if (absVal >= 1000) return val.toFixed(1);
		if (absVal >= 100) return val.toFixed(2);
		if (absVal >= 10) return val.toFixed(3);
		return val.toFixed(3);
	}
	if (units === 'uF') {
		if (absVal >= 1000) return val.toFixed(1);
		if (absVal >= 100) return val.toFixed(2);
		if (absVal >= 10) return val.toFixed(3);
		return val.toFixed(3);
	}
	if (units === 'mF') {
		return val.toFixed(2);
	}

	// Inductance
	if (units === 'uH') {
		if (absVal >= 1000) return val.toFixed(1);
		if (absVal >= 100) return val.toFixed(2);
		if (absVal >= 10) return val.toFixed(3);
		return val.toFixed(3);
	}
	if (units === 'mH') {
		if (absVal >= 1000) return val.toFixed(1);
		if (absVal >= 100) return val.toFixed(2);
		if (absVal >= 10) return val.toFixed(3);
		return val.toFixed(3);
	}
	if (units === 'H') {
		if (absVal >= 100) return val.toFixed(1);
		if (absVal >= 10) return val.toFixed(3);
		return val.toFixed(3);
	}
	if (units === 'kH') {
		return val.toFixed(3);
	}

	// Default fallback
	return val.toFixed(4);
}
