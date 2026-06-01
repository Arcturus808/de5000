import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		include: ['src/**/*.test.js'],
		environment: 'jsdom',
		setupFiles: ['src/tests/setup.js']
	},
	clearScreen: false,
	server: {
		strictPort: true
	}
});
