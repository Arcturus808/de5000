import { describe, it, expect } from 'vitest';

describe('Settings stores (Svelte)', () => {

	describe('getTypefaceCSS', () => {
		it('returns CSS value for known typeface label', async () => {
			const { getTypefaceCSS } = await import('$lib/stores/settings.js');
			expect(getTypefaceCSS('Roboto')).toBe("'Roboto', sans-serif");
			expect(getTypefaceCSS('Courier New')).toBe("'Courier New', monospace");
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
			expect(localStorage.setItem).toHaveBeenCalledWith('de5000-typeface', 'Poppins');
		});
	});

	describe('Color store', () => {
		it('initializes with default readout color', async () => {
			const { readoutColor } = await import('$lib/stores/settings.js');
			let value;
			readoutColor.subscribe(v => { value = v; })();
			expect(value).toBe('#00ff00');
		});
	});

	describe('Theme store', () => {
		it('initializes with dark theme by default', async () => {
			const { theme } = await import('$lib/stores/settings.js');
			let value;
			theme.subscribe(v => { value = v; })();
			expect(value).toBe('dark');
		});

		it('falls back to dark for invalid theme values', async () => {
			const { theme } = await import('$lib/stores/settings.js');
			theme.set('invalid');
			let value;
			theme.subscribe(v => { value = v; })();
			expect(value).toBe('dark');
		});
	});

	describe('Ntfy server URL store', () => {
		it('initializes with default ntfy.sh URL', async () => {
			const { ntfyServerUrl } = await import('$lib/stores/settings.js');
			let value;
			ntfyServerUrl.subscribe(v => { value = v; })();
			expect(value).toBe('https://ntfy.sh');
		});

		it('persists non-default server URL', async () => {
			const { ntfyServerUrl } = await import('$lib/stores/settings.js');
			ntfyServerUrl.set('http://192.168.0.82:2586');
			expect(localStorage.setItem).toHaveBeenCalledWith('de5000-ntfy-server-url', 'http://192.168.0.82:2586');
		});

		it('removes localStorage key when set back to default', async () => {
			const { ntfyServerUrl } = await import('$lib/stores/settings.js');
			ntfyServerUrl.set('http://custom:8090');
			ntfyServerUrl.set('https://ntfy.sh');
			expect(localStorage.removeItem).toHaveBeenCalledWith('de5000-ntfy-server-url');
		});
	});

	describe('Ntfy topic store', () => {
		it('initializes with default topic', async () => {
			const { ntfyTopic } = await import('$lib/stores/settings.js');
			let value;
			ntfyTopic.subscribe(v => { value = v; })();
			expect(value).toBe('de5000-alerts');
		});
	});

	describe('Ntfy enabled store', () => {
		it('initializes as disabled', async () => {
			const { ntfyEnabled } = await import('$lib/stores/settings.js');
			let value;
			ntfyEnabled.subscribe(v => { value = v; })();
			expect(value).toBe(false);
		});
	});

	describe('Custom colors store', () => {
		it('initializes as empty array', async () => {
			const { customColors } = await import('$lib/stores/settings.js');
			let value;
			customColors.subscribe(v => { value = v; })();
			expect(value).toEqual([]);
		});

		it('adds and removes custom colors', async () => {
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
