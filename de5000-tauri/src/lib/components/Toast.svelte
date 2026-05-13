<script>
	import { errorMessage, successMessage, hideError } from '$lib/stores/device.js';
</script>

{#if $errorMessage}
	<div class="error-message">
		{$errorMessage}
		<button class="dismiss" on:click={hideError}>✕</button>
	</div>
{/if}

{#if $successMessage}
	<div class="success-message">
		{$successMessage}
	</div>
{/if}

<style>
	.error-message {
		background: var(--danger-accent-soft);
		border: 1px solid var(--danger-accent-border);
		color: var(--danger-accent);
		padding: 15px;
		border-radius: 5px;
		margin: 20px 0;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.success-message {
		background: var(--primary-accent-soft);
		border: 1px solid var(--primary-accent-border);
		color: var(--primary-accent);
		padding: 15px;
		border-radius: 5px;
		margin: 20px 0;
		animation: fadeOut 3s forwards;
	}

	.dismiss {
		background: none;
		border: none;
		color: var(--danger-accent);
		cursor: pointer;
		font-size: 1.2em;
		padding: 0 5px;
		font-family: 'Courier New', monospace;
	}

	.dismiss:hover {
		color: var(--danger-accent);
	}

	@keyframes fadeOut {
		0%,
		80% {
			opacity: 1;
		}
		100% {
			opacity: 0;
		}
	}
</style>
