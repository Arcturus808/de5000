import ExcelJS from 'exceljs';

const COLUMNS = [
	{ header: 'Timestamp', key: 'timestamp' },
	{ header: 'Primary Quantity', key: 'main_quantity' },
	{ header: 'Primary Value', key: 'main_value' },
	{ header: 'Primary Units', key: 'main_units' },
	{ header: 'Secondary Quantity', key: 'sec_quantity' },
	{ header: 'Secondary Value', key: 'sec_value' },
	{ header: 'Secondary Units', key: 'sec_units' },
	{ header: 'Frequency', key: 'frequency' },
	{ header: 'Tolerance', key: 'tolerance' },
	{ header: 'Parallel', key: 'parallel' },
	{ header: 'Auto Range', key: 'auto_range' },
	{ header: 'LCR Auto', key: 'lcr_auto' },
	{ header: 'Delta Mode', key: 'delta_mode' }
];

/**
 * Generate CSV content from data log
 * @param {object[]} dataLog
 * @returns {string}
 */
function generateCSV(dataLog) {
	let csv = COLUMNS.map((c) => c.header).join(',') + '\n';

	dataLog.forEach((entry) => {
		csv += `${entry.timestamp || ''},`;
		csv += `${entry.main_quantity || ''},${entry.main_value || ''},${entry.main_units || ''},`;
		csv += `${entry.sec_quantity || ''},${entry.sec_value || ''},${entry.sec_units || ''},`;
		csv += `${entry.frequency || ''},${entry.tolerance || ''},`;
		csv += `${entry.parallel},${entry.auto_range},${entry.lcr_auto},${entry.delta_mode}\n`;
	});

	return csv;
}

/**
 * Generate JSON content from data log
 * @param {object[]} dataLog
 * @returns {string}
 */
function generateJSON(dataLog) {
	return JSON.stringify(dataLog, null, 2);
}

/**
 * Generate Excel (.xlsx) buffer from data log
 * @param {object[]} dataLog
 * @returns {Promise<Buffer>}
 */
async function generateExcel(dataLog) {
	const workbook = new ExcelJS.Workbook();
	const sheet = workbook.addWorksheet('DE-5000 Log');

	sheet.columns = COLUMNS;
	sheet.addRows(dataLog);

	// Style header row
	const headerRow = sheet.getRow(1);
	headerRow.fill = {
		type: 'pattern',
		pattern: 'solid',
		fgColor: { argb: 'FF00AA00' }
	};
	headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
	headerRow.alignment = { horizontal: 'center' };

	// Auto-fit column widths
	sheet.columns.forEach((col) => {
		let maxLen = col.header.length;
		dataLog.forEach((row) => {
			const val = String(row[col.key] || '');
			if (val.length > maxLen) maxLen = val.length;
		});
		col.width = maxLen + 2;
	});

	return await workbook.xlsx.writeBuffer();
}

/**
 * Download a file by creating a temporary anchor element.
 * @param {string|ArrayBuffer} content
 * @param {string} filename
 * @param {string} mimeType
 */
function downloadFile(content, filename, mimeType) {
	const blob = new Blob([content], { type: mimeType });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}

const FORMAT_CONFIG = {
	csv: { ext: 'csv', mime: 'text/csv' },
	json: { ext: 'json', mime: 'application/json' },
	xlsx: { ext: 'xlsx', mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
};

/**
 * Export data log as browser download.
 * @param {object[]} dataLog
 * @param {'csv'|'json'|'xlsx'} format - Export format (default: 'csv')
 * @returns {Promise<boolean>} true if exported
 */
export async function exportData(dataLog, format = 'csv') {
	if (dataLog.length === 0) return false;

	const cfg = FORMAT_CONFIG[format];
	const defaultName = `de5000-log.${cfg.ext}`;

	if (format === 'xlsx') {
		const buffer = await generateExcel(dataLog);
		downloadFile(buffer, defaultName, cfg.mime);
		return true;
	}

	const content = format === 'csv' ? generateCSV(dataLog) : generateJSON(dataLog);
	downloadFile(content, defaultName, cfg.mime);
	return true;
}
