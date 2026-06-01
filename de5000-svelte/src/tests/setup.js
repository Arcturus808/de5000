import { vi, afterEach } from 'vitest';

// Mock localStorage for jsdom
const store = {};
globalThis.localStorage = {
	getItem: vi.fn((key) => store[key] ?? null),
	setItem: vi.fn((key, value) => { store[key] = String(value); }),
	removeItem: vi.fn((key) => { delete store[key]; }),
	clear: vi.fn(() => { Object.keys(store).forEach(k => delete store[k]); }),
	get length() { return Object.keys(store).length; },
	key: vi.fn((i) => Object.keys(store)[i] ?? null)
};

afterEach(() => {
	Object.keys(store).forEach(k => delete store[k]);
	vi.clearAllMocks();
});
