<script>
	import { onDestroy } from 'svelte';
	import { connected, lastMeasurement } from '$lib/stores/device.js';
	import { disconnectDevice } from '$lib/serial/connection.js';
	import { formatDisplayValue } from '$lib/utils/format.js';
	import Header from '$lib/components/Header.svelte';
	import Toast from '$lib/components/Toast.svelte';
	import MeasurementCard from '$lib/components/MeasurementCard.svelte';
	import InfoPanel from '$lib/components/InfoPanel.svelte';
	import MeasurementDetails from '$lib/components/MeasurementDetails.svelte';
	import Chart from '$lib/components/Chart.svelte';
	import Footer from '$lib/components/Footer.svelte';

	onDestroy(() => {
		if ($connected) disconnectDevice();
	});

	// Derive display values from measurement
	$: mainQuantity =
		$lastMeasurement?.main_status === 'normal'
			? $lastMeasurement?.main_quantity || '--'
			: '';
	$: mainValue =
		$lastMeasurement?.main_status === 'normal'
			? formatDisplayValue($lastMeasurement?.main_val, $lastMeasurement?.main_units)
			: $lastMeasurement?.main_status || '--';
	$: mainUnits =
		$lastMeasurement?.main_status === 'normal'
			? $lastMeasurement?.main_units || '--'
			: '';

	$: secQuantity =
		$lastMeasurement?.sec_status === 'normal'
			? $lastMeasurement?.sec_quantity || '--'
			: '';
	$: secValue =
		$lastMeasurement?.sec_status === 'normal'
			? formatDisplayValue($lastMeasurement?.sec_val, $lastMeasurement?.sec_units)
			: $lastMeasurement?.sec_status || '--';
	$: secUnits =
		$lastMeasurement?.sec_status === 'normal'
			? $lastMeasurement?.sec_units || '--'
			: '';
</script>

<div class="container">
	<Header />
	<Toast />

	{#if $connected || $lastMeasurement}
		<div class="top-grid">
			<MeasurementCard
				mainQuantity={mainQuantity}
				mainValue={mainValue}
				mainUnits={mainUnits}
				secQuantity={secQuantity}
				secValue={secValue}
				secUnits={secUnits}
			/>
			<InfoPanel />
			<MeasurementDetails />
		</div>
		<Chart />
	{/if}

	<Footer />
</div>

<style>
	.top-grid {
		display: grid;
		grid-template-columns: 1fr 1fr 1fr;
		gap: 12px;
		margin-bottom: 12px;
	}

	@media (max-width: 768px) {
		.top-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
