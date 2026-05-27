<script>
	import { createEventDispatcher, tick } from 'svelte';
	import { TYPEFACE_OPTIONS } from '$lib/stores/settings.js';

	export let store;
	export let isOpen = false;

	const dispatch = createEventDispatcher();

	let triggerEl;
	let menuEl;
	let menuStyle = '';

	$: selectedOption = TYPEFACE_OPTIONS.find((o) => o.label === $store) || TYPEFACE_OPTIONS[0];

	async function toggle() {
		if (isOpen) {
			isOpen = false;
			dispatch('close');
		} else {
			isOpen = true;
			dispatch('open');
			await tick();
			requestAnimationFrame(positionMenu);
		}
	}

	function positionMenu() {
		if (triggerEl && menuEl) {
			const rect = triggerEl.getBoundingClientRect();
			menuStyle = `position:fixed;top:${rect.bottom}px;left:${rect.left}px;width:${rect.width}px;`;
		}
	}

	function select(option) {
		store.set(option.label);
		isOpen = false;
		triggerEl?.focus();
		dispatch('close');
	}

	function closeAndRefocus() {
		if (!isOpen) return;
		isOpen = false;
		triggerEl?.focus();
		dispatch('close');
	}

	function handleKeydown(e) {
		if (e.key === 'Escape') {
			e.preventDefault();
			e.stopPropagation();
			closeAndRefocus();
		}
	}

	function handleFocusout(e) {
		setTimeout(() => {
			const dropdownEl = e.currentTarget;
			if (dropdownEl && !dropdownEl.contains(document.activeElement)) {
				isOpen = false;
				dispatch('close');
			}
		}, 0);
	}

	function handleBackdropClick() {
		isOpen = false;
		triggerEl?.focus();
		dispatch('close');
	}

	function handleWindowClick(e) {
		if (!isOpen) return;
		const el = document.querySelector('.dropdown.open');
		if (el && !el.contains(e.target)) {
			isOpen = false;
			triggerEl?.focus();
			dispatch('close');
		}
	}

	$: if (isOpen) {
		window.addEventListener('click', handleWindowClick, true);
	} else {
		window.removeEventListener('click', handleWindowClick, true);
	}
</script>

<div class="dropdown" class:open={isOpen} on:keydown={handleKeydown} on:focusout={handleFocusout}>
	<button
		bind:this={triggerEl}
		class="dropdown-trigger"
		style="font-family: {selectedOption.value}"
		on:click={toggle}
	>
		<span class="typeface-name">{selectedOption.label}</span>
		<span class="typeface-preview">0123.456</span>
		<span class="dropdown-arrow">▾</span>
	</button>
	{#if isOpen}
		<div class="dropdown-menu" bind:this={menuEl} style={menuStyle}>
			{#each TYPEFACE_OPTIONS as option}
				<button
					class="dropdown-item"
					class:selected={$store === option.label}
					style="font-family: {option.value}"
					on:click={() => select(option)}
				>
					<span class="typeface-name">{option.label}</span>
					<span class="typeface-preview">0123.456</span>
				</button>
			{/each}
		</div>
	{/if}
</div>

<style>
	.dropdown {
		position: relative;
	}

	.dropdown-trigger {
		display: flex;
		justify-content: space-between;
		align-items: center;
		width: 100%;
		padding: 10px 14px;
		background: var(--surface-muted);
		border: 1px solid var(--border);
		border-radius: 8px;
		color: var(--app-text);
		cursor: pointer;
		transition: all 0.2s ease;
		font-size: 1em;
	}

	.dropdown-trigger:hover {
		border-color: var(--primary-accent-panel);
		background: var(--primary-accent-soft);
	}

	.dropdown.open .dropdown-trigger {
		border-color: var(--primary-accent-border);
		border-radius: 8px 8px 0 0;
		background: var(--primary-accent-muted);
	}

	.dropdown-arrow {
		color: var(--muted-text);
		margin-left: 8px;
		flex-shrink: 0;
	}

	.dropdown-menu {
		background: var(--option-bg);
		border: 1px solid var(--primary-accent-border);
		border-radius: 0 0 8px 8px;
		z-index: 10000;
		overflow: hidden;
	}

	.dropdown-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		width: 100%;
		padding: 10px 14px;
		background: var(--surface-muted);
		border: none;
		border-bottom: 1px solid var(--border);
		color: var(--app-text);
		cursor: pointer;
		transition: all 0.15s ease;
		font-size: 1em;
	}

	.dropdown-item:last-child {
		border-bottom: none;
	}

	.dropdown-item:hover {
		background: var(--primary-accent-soft);
	}

	.dropdown-item.selected {
		background: var(--primary-accent-muted);
		color: var(--primary-accent);
	}

	.typeface-name {
		font-weight: bold;
	}

	.typeface-preview {
		color: var(--secondary-accent-text);
		font-size: 1.1em;
		letter-spacing: 1px;
	}
</style>
