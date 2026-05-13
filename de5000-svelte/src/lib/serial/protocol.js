// ===== Protocol Constants =====
export const BAUD_RATE = 9600;
export const PACKET_LENGTH = 17;
export const HEADER = [0x00, 0x0d];
export const FOOTER = [0x0d, 0x0a];

export const FREQ = ['100 Hz', '120 Hz', '1 KHz', '10 KHz', '100 KHz', 'DC'];

export const TOLERANCE = [
	null, null, null,
	'±0.25%', '±0.5%', '±1%', '±2%', '±5%',
	'±10%', '±20%', '-20+80%'
];

export const MEAS_QUANTITY_SER = [null, 'Ls', 'Cs', 'Rs', 'DCR'];
export const MEAS_QUANTITY_PAR = [null, 'Lp', 'Cp', 'Rp', 'DCR'];

export const MAIN_UNITS = [
	'', 'Ohm', 'kOhm', 'MOhm', null,
	'uH', 'mH', 'H', 'kH',
	'pF', 'nF', 'uF', 'mF',
	'%', 'deg',
	null, null, null, null, null, null
];

export const STATUS = [
	'normal', 'blank', '----', 'OL',
	null, null, null,
	'PASS', 'FAIL', 'OPEn', 'Srt'
];

export const SEC_QUANTITY = [null, 'D', 'Q', 'ESR', 'θ'];
export const RP = 'RP';

export const NORMALIZE_RULES = {
	'': [1, ''],
	'Ohm': [1, 'Ohm'],
	'kOhm': [1e3, 'Ohm'],
	'MOhm': [1e6, 'Ohm'],
	'uH': [1e-6, 'H'],
	'mH': [1e-3, 'H'],
	'H': [1, 'H'],
	'kH': [1e3, 'H'],
	'pF': [1e-12, 'F'],
	'nF': [1e-9, 'F'],
	'uF': [1e-6, 'F'],
	'mF': [1e-3, 'F'],
	'%': [1, '%'],
	'deg': [1, 'deg']
};

/**
 * Find the header bytes in a buffer
 * @param {number[]} buffer
 * @returns {number} index of header or -1
 */
export function findHeader(buffer) {
	for (let i = 0; i < buffer.length - 1; i++) {
		if (buffer[i] === HEADER[0] && buffer[i + 1] === HEADER[1]) {
			return i;
		}
	}
	return -1;
}

/**
 * Validate a 17-byte packet
 * @param {number[]} data
 * @returns {boolean}
 */
export function validatePacket(data) {
	if (data.length !== PACKET_LENGTH) return false;
	if (data[0] !== HEADER[0] || data[1] !== HEADER[1]) return false;
	if (data[15] !== FOOTER[0] || data[16] !== FOOTER[1]) return false;
	return true;
}

/**
 * Normalize a value to base units
 * @param {number} val
 * @param {string} units
 * @returns {[number, string]}
 */
export function normalizeValue(val, units) {
	if (!units || !NORMALIZE_RULES[units]) {
		return [val, units];
	}
	const rule = NORMALIZE_RULES[units];
	return [val * rule[0], rule[1]];
}

/**
 * Parse a 17-byte DE-5000 data packet
 * @param {number[]} data
 * @returns {object} measurement object
 */
export function parsePacket(data) {
	const measurement = {
		main_quantity: null,
		main_val: null,
		main_units: null,
		main_status: null,
		main_norm_val: null,
		main_norm_units: null,
		sec_quantity: null,
		sec_val: null,
		sec_units: null,
		sec_status: null,
		sec_norm_val: null,
		sec_norm_units: null,
		freq: null,
		tolerance: null,
		parallel: false,
		auto_range: false,
		lcr_auto: false,
		delta_mode: false,
		ref_shown: false,
		cal_mode: false,
		sorting_mode: false
	};

	const flags = data[0x02];
	measurement.parallel = !!(flags & 0b10000000);
	measurement.auto_range = !!(flags & 0b01000000);
	measurement.lcr_auto = !!(flags & 0b00100000);
	measurement.sorting_mode = !!(flags & 0b00010000);
	measurement.cal_mode = !!(flags & 0b00001000);
	measurement.delta_mode = !!(flags & 0b00000100);
	measurement.ref_shown = !!(flags & 0b00000010);

	let val = (data[0x03] & 0b11100000) >> 5;
	measurement.freq = FREQ[val];

	measurement.tolerance = TOLERANCE[data[0x04]];

	val = data[0x09] & 0b00001111;
	measurement.main_status = STATUS[val];

	val = data[0x05];
	measurement.main_quantity = measurement.parallel
		? MEAS_QUANTITY_PAR[val]
		: MEAS_QUANTITY_SER[val];

	val = data[0x06] * 0x100 + data[0x07];
	let mul = data[0x08] & 0b00000111;
	val = val * Math.pow(10, -mul);
	measurement.main_val = val;

	val = (data[0x08] & 0b11111000) >> 3;
	measurement.main_units = MAIN_UNITS[val];

	const mainNorm = normalizeValue(measurement.main_val, measurement.main_units);
	measurement.main_norm_val = mainNorm[0];
	measurement.main_norm_units = mainNorm[1];

	val = data[0x0e] & 0b00000111;
	measurement.sec_status = STATUS[val];

	val = data[0x0a];
	if (measurement.parallel && val === 0x03) {
		measurement.sec_quantity = RP;
	} else {
		measurement.sec_quantity = SEC_QUANTITY[val];
	}

	val = (data[0x0d] & 0b11111000) >> 3;
	measurement.sec_units = MAIN_UNITS[val];

	val = data[0x0b] * 0x100 + data[0x0c];
	if ((measurement.sec_units === '%' || measurement.sec_units === 'deg') && (val & 0x1000)) {
		val = val - 0x10000;
	}
	mul = data[0x0d] & 0b00000111;
	val = val * Math.pow(10, -mul);
	measurement.sec_val = val;

	const secNorm = normalizeValue(measurement.sec_val, measurement.sec_units);
	measurement.sec_norm_val = secNorm[0];
	measurement.sec_norm_units = secNorm[1];

	return measurement;
}
