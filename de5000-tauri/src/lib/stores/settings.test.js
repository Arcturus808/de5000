import { describe, it, expect } from 'vitest';

describe('Settings stores (Tauri)', () => {

	describe('getTypefaceCSS', () => {
		it('returns CSS value for known typeface label', async () => {
			const { getTypefaceCSS } = await import('$lib/stores/settings.js');
			expect(getTypefaceCSS('Roboto')).toBe("'Roboto', sans-serif");
			expect(getTypefaceCSS('Courier New')).toBe("'Courier New', monospace");
			expect(getTypefaceCSS('LED Segment')).toBe("'DSEG14-Classic-Italic', monospace");
		});

		it('returns fallback for unknown label', async () => {
			const { getTypefaceCSS } = await import('$lib/stores/settings.js');
			expect(getTypefaceCSS('NonExistent')).toBe("'Courier New', monospace");
		});
	});

	describe('Typeface store', () => {
		it('initializes with default value when localStorage is empty', async () => {
			const { typeface } = await import('$lib/stores/settings.js');
			let value;
			typeface.subscribe(v => { value = v; })();
			expect(value).toBe('Roboto');
		});

		it('sets a non-default value and persists to localStorage', async () => {
			const { typeface } = await import('$lib/stores/settings.js');
			typeface.set('Poppins');
			let value;
			typeface.subscribe(v => { value = v; })();
			expect(value).toBe('Poppins');
		});

		it('removes localStorage key when set back to default', async () => {
			const { typeface } = await import('$lib/stores/settings.js');
			typeface.set('Poppins');
			typeface.set('Roboto');
			// When value equals default, removeItem is called
			expect(localStorage.removeItem).toHaveBeenCalledWith('de5000-typeface');
		});
	});

	describe('Color store', () => {
		it('initializes with default readout color', async () => {
			const { readoutColor } = await import('$lib/stores/settings.js');
			let value;
			readoutColor.subscribe(v => { value = v; })();
			expect(value).toBe('#00ff00');
		});

		it('persists non-default color to localStorage', async () => {
			const { readoutColor } = await import('$lib/stores/settings.js');
			readoutColor.set('#ff4444');
			expect(localStorage.setItem).toHaveBeenCalledWith('de5000-readout-color', '#ff4444');
		});
	});

	describe('Theme store', () => {
		it('initializes with dark theme by default', async () => {
			const { theme } = await import('$lib/stores/settings.js');
			let value;
			theme.subscribe(v => { value = v; })();
			expect(value).toBe('dark');
		});

		it('accepts valid theme values', async () => {
			const { theme } = await import('$lib/stores/settings.js');
			theme.set('light');
			let value;
			theme.subscribe(v => { value = v; })();
			expect(value).toBe('light');
		});

		it('falls back to dark for invalid theme values', async () => {
			const { theme } = await import('$lib/stores/settings.js');
			theme.set('invalid-theme');
			let value;
			theme.subscribe(v => { value = v; })();
			expect(value).toBe('dark');
		});
	});

	describe('Ntfy port store', () => {
		it('initializes with default port 8090', async () => {
			const { ntfyPort } = await import('$lib/stores/settings.js');
			let value;
			ntfyPort.subscribe(v => { value = v; })();
			expect(value).toBe(8090);
		});

		it('coerces string input to integer', async () => {
			const { ntfyPort } = await import('$lib/stores/settings.js');
			ntfyPort.set('2586');
			let value;
			ntfyPort.subscribe(v => { value = v; })();
			expect(value).toBe(2586);
		});

		it('falls back to default for invalid input', async () => {
			const { ntfyPort } = await import('$lib/stores/settings.js');
			ntfyPort.set('abc');
			let value;
			ntfyPort.subscribe(v => { value = v; })();
			expect(value).toBe(8090);
		});
	});

	describe('Ntfy topic store', () => {
		it('initializes with default topic', async () => {
			const { ntfyTopic } = await import('$lib/stores/settings.js');
			let value;
			ntfyTopic.subscribe(v => { value = v; })();
			expect(value).toBe('de5000-alerts');
		});

		it('persists non-default topic', async () => {
			const { ntfyTopic } = await import('$lib/stores/settings.js');
			ntfyTopic.set('custom-topic');
			expect(localStorage.setItem).toHaveBeenCalledWith('de5000-ntfy-topic', 'custom-topic');
		});
	});

	describe('Ntfy enabled store', () => {
		it('initializes as disabled', async () => {
			const { ntfyEnabled } = await import('$lib/stores/settings.js');
			let value;
			ntfyEnabled.subscribe(v => { value = v; })();
			expect(value).toBe(false);
		});

		it('persists enabled state', async () => {
			const { ntfyEnabled } = await import('$lib/stores/settings.js');
			ntfyEnabled.set(true);
			expect(localStorage.setItem).toHaveBeenCalledWith('de5000-ntfy-enabled', 'true');
		});
	});

	describe('Ntfy once-per-crossing store', () => {
		it('initializes as true by default', async () => {
			const { ntfyOncePerCrossing } = await import('$lib/stores/settings.js');
			let value;
			ntfyOncePerCrossing.subscribe(v => { value = v; })();
			expect(value).toBe(true);
		});
	});

	describe('Custom colors store', () => {
		it('initializes as empty array', async () => {
			const { customColors } = await import('$lib/stores/settings.js');
			let value;
			customColors.subscribe(v => { value = v; })();
			expect(value).toEqual([]);
		});

		it('adds a custom color', async () => {
			const { customColors } = await import('$lib/stores/settings.js');
			customColors.add('My Color', '#aabbcc');
			let value;
			customColors.subscribe(v => { value = v; })();
			expect(value).toContainEqual({ name: 'My Color', hex: '#aabbcc' });
		});

		it('removes a custom color by hex', async () => {
			const { customColors } = await import('$lib/stores/settings.js');
			customColors.add('Color1', '#111111');
			customColors.add('Color2', '#222222');
			customColors.remove('#111111');
			let value;
			customColors.subscribe(v => { value = v; })();
			expect(value).toEqual([{ name: 'Color2', hex: '#222222' }]);
		});
	});
});
