<script>
	import { createEventDispatcher } from 'svelte';
	import { COLOR_PALETTES, customColors } from '$lib/stores/settings.js';

	export let store;
	export let isOpen = false;

	const dispatch = createEventDispatcher();

	let triggerEl;
	let dropdownEl;
	let customNameInput = '';
	let customHexInput = '#00ff00';
	let showAddForm = false;
	let menuStyle = '';
	let openAbove = false;

	$: selectedHex = $store;
	$: selectedName = (() => {
		for (const colors of Object.values(COLOR_PALETTES)) {
			const found = colors.find(c => c.hex === selectedHex);
			if (found) return found.name;
		}
		const custom = $customColors.find(c => c.hex === selectedHex);
		return custom ? custom.name : '';
	})();

	function positionDropdown() {
		if (!triggerEl) return;
		const rect = triggerEl.getBoundingClientRect();
		const spaceBelow = window.innerHeight - rect.bottom;
		const spaceAbove = rect.top;
		const estimatedHeight = 340;

		if (spaceBelow < estimatedHeight && spaceAbove > spaceBelow) {
			openAbove = true;
			menuStyle = `position:fixed;bottom:${window.innerHeight - rect.top}px;left:${rect.left}px;width:${rect.width}px;`;
		} else {
			openAbove = false;
			menuStyle = `position:fixed;top:${rect.bottom}px;left:${rect.left}px;width:${rect.width}px;`;
		}
	}

	function toggle() {
		if (isOpen) {
			isOpen = false;
			dispatch('close');
		} else {
			isOpen = true;
			showAddForm = false;
			positionDropdown();
			dispatch('open');
		}
	}

	function select(hex) {
		store.set(hex);
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
			if (showAddForm) {
				showAddForm = false;
			} else {
				closeAndRefocus();
			}
		}
	}

	function handleFocusout(e) {
		setTimeout(() => {
			const el = e.currentTarget;
			if (el && !el.contains(document.activeElement)) {
				isOpen = false;
				showAddForm = false;
				dispatch('close');
			}
		}, 0);
	}

	function handleBackdropClick() {
		isOpen = false;
		showAddForm = false;
		triggerEl?.focus();
		dispatch('close');
	}

	function handleCustomColorChange(e) {
		customHexInput = e.target.value;
	}

	function addCustomColor() {
		const name = customNameInput.trim() || customHexInput;
		customColors.add(name, customHexInput);
		customNameInput = '';
		showAddForm = false;
	}

	function removeCustomColor(hex) {
		customColors.remove(hex);
	}

	function openAddForm() {
		showAddForm = true;
		customHexInput = $store;
		customNameInput = '';
	}
</script>

<div class="color-dropdown" class:open={isOpen} on:keydown={handleKeydown} on:focusout={handleFocusout}>
	<button
		bind:this={triggerEl}
		class="dropdown-trigger"
		on:click={toggle}
	>
		<span class="color-swatch" style="background: {selectedHex}"></span>
		{#if selectedName}
			<span class="color-name">{selectedName}</span>
		{/if}
		<span class="color-hex">{selectedHex}</span>
		<span class="dropdown-arrow">▾</span>
	</button>
	{#if isOpen}
		<div class="dropdown-backdrop" on:click|stopPropagation={handleBackdropClick}></div>
		<div class="dropdown-menu" class:above={openAbove} bind:this={dropdownEl} style={menuStyle}>
			{#each Object.entries(COLOR_PALETTES) as [group, colors]}
				<div class="palette-group">
					{#if group === 'Custom'}
						<div class="palette-label">{group}</div>
					{/if}
					<div class="palette-swatches">
						{#each colors as color}
							<button
								class="swatch-btn"
								class:selected={selectedHex === color.hex}
								title="{color.name} ({color.hex})"
								on:click={() => select(color.hex)}
							>
								<span class="swatch" style="background: {color.hex}"></span>
								<span class="swatch-name">{color.name}</span>
							</button>
						{/each}
					</div>
				</div>
			{/each}

			{#if $customColors.length > 0}
				<div class="palette-group">
					<div class="palette-label">Custom</div>
					<div class="palette-swatches">
						{#each $customColors as color}
							<button
								class="swatch-btn"
								class:selected={selectedHex === color.hex}
								title="{color.name} ({color.hex})"
								on:click={() => select(color.hex)}
							>
								<span class="swatch" style="background: {color.hex}"></span>
								<span class="swatch-name">{color.name}</span>
								<span class="swatch-remove" on:click|stopPropagation={() => removeCustomColor(color.hex)}>✕</span>
							</button>
						{/each}
					</div>
				</div>
			{/if}

			{#if showAddForm}
				<div class="add-form">
					<div class="add-form-row">
						<input type="color" bind:value={customHexInput} class="add-color-input" on:change={handleCustomColorChange} />
						<input type="text" bind:value={customNameInput} placeholder="Color name" class="add-name-input" />
					</div>
					<div class="add-form-actions">
						<button class="add-save-btn" on:click={addCustomColor} disabled={!customNameInput.trim()}>Save</button>
						<button class="add-cancel-btn" on:click={() => (showAddForm = false)}>Cancel</button>
					</div>
				</div>
			{:else}
				<button class="add-custom-btn" on:click={openAddForm}>+ Add Custom Color</button>
			{/if}
		</div>
	{/if}
</div>

<style>
	.color-dropdown {
		position: relative;
	}

	.dropdown-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		z-index: 5;
	}

	.dropdown-trigger {
		display: flex;
		align-items: center;
		gap: 10px;
		width: 100%;
		padding: 10px 14px;
		background: var(--surface-muted);
		border: 1px solid var(--border);
		border-radius: 8px;
		color: var(--app-text);
		cursor: pointer;
		transition: all 0.2s ease;
		font-size: 1em;
		font-family: 'Courier New', monospace;
	}

	.dropdown-trigger:hover {
		border-color: var(--primary-accent-panel);
		background: var(--primary-accent-soft);
	}

	.color-dropdown.open .dropdown-trigger {
		border-color: var(--primary-accent-border);
		border-radius: 8px 8px 0 0;
		background: var(--primary-accent-muted);
	}

	.color-swatch {
		width: 22px;
		height: 22px;
		border-radius: 4px;
		border: 1px solid var(--swatch-border);
		flex-shrink: 0;
	}

	.color-name {
		flex: 1;
		text-align: left;
		font-family: 'Open Sans', sans-serif;
		font-size: 0.9em;
	}

	.color-hex {
		text-align: right;
		font-size: 0.8em;
		opacity: 0.6;
	}

	.dropdown-arrow {
		color: var(--muted-text);
		flex-shrink: 0;
	}

	.dropdown-menu {
		background: var(--option-bg);
		border: 1px solid var(--primary-accent-border);
		border-radius: 0 0 8px 8px;
		z-index: 10000;
		overflow: hidden;
		padding: 8px 0;
		max-height: 80vh;
		overflow-y: auto;
	}

	.dropdown-menu.above {
		border-radius: 8px 8px 0 0;
		border-top: 1px solid var(--primary-accent-border);
		border-bottom: none;
	}

	.palette-group {
		padding: 6px 10px;
	}

	.palette-group + .palette-group {
		border-top: 1px solid var(--border);
	}

	.palette-label {
		color: var(--muted-text);
		font-size: 0.75em;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		margin-bottom: 6px;
	}

	.palette-swatches {
		display: flex;
		flex-wrap: wrap;
		gap: 4px;
	}

	.swatch-btn {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 4px 8px;
		background: var(--surface-muted);
		border: 1px solid var(--border);
		border-radius: 5px;
		cursor: pointer;
		transition: all 0.15s ease;
		color: var(--app-text);
		font-size: 0.8em;
		position: relative;
	}

	.swatch-btn:hover {
		background: var(--primary-accent-soft);
		border-color: var(--primary-accent-panel);
	}

	.swatch-btn.selected {
		background: var(--primary-accent-muted);
		border-color: var(--primary-accent-border);
		color: var(--primary-accent);
	}

	.swatch {
		width: 16px;
		height: 16px;
		border-radius: 3px;
		border: 1px solid var(--swatch-border);
		flex-shrink: 0;
	}

	.swatch-name {
		white-space: nowrap;
	}

	.swatch-remove {
		color: var(--subtle-text);
		font-size: 0.85em;
		margin-left: 2px;
	}

	.swatch-remove:hover {
		color: var(--danger-accent);
	}

	.add-custom-btn {
		display: block;
		width: calc(100% - 20px);
		margin: 8px 10px;
		padding: 8px;
		background: var(--secondary-accent-soft);
		border: 1px dashed var(--secondary-accent-border);
		border-radius: 5px;
		color: var(--secondary-accent-text);
		cursor: pointer;
		font-size: 0.85em;
		transition: all 0.15s ease;
	}

	.add-custom-btn:hover {
		background: var(--secondary-accent-muted);
		border-color: var(--secondary-accent-border);
	}

	.add-form {
		padding: 10px;
		border-top: 1px solid var(--border);
	}

	.add-form-row {
		display: flex;
		gap: 8px;
		align-items: center;
		margin-bottom: 8px;
	}

	.add-color-input {
		width: 36px;
		height: 30px;
		border: 1px solid var(--swatch-border);
		border-radius: 4px;
		background: none;
		cursor: pointer;
		padding: 2px;
		flex-shrink: 0;
	}

	.add-name-input {
		flex: 1;
		padding: 6px 10px;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 4px;
		color: var(--app-text);
		font-size: 0.85em;
		font-family: 'Open Sans', sans-serif;
	}

	.add-name-input::placeholder {
		color: var(--subtle-text);
	}

	.add-form-actions {
		display: flex;
		gap: 8px;
	}

	.add-save-btn,
	.add-cancel-btn {
		padding: 5px 14px;
		border-radius: 4px;
		font-size: 0.8em;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.add-save-btn {
		background: var(--primary-accent-muted);
		border: 1px solid var(--primary-accent-border);
		color: var(--primary-accent);
	}

	.add-save-btn:hover:not(:disabled) {
		background: var(--primary-accent-panel);
	}

	.add-save-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.add-cancel-btn {
		background: var(--surface-muted);
		border: 1px solid var(--border);
		color: var(--muted-text);
	}

	.add-cancel-btn:hover {
		background: var(--surface-strong);
		color: var(--app-text);
	}
</style>
