<script lang="ts">
    import { onMount } from 'svelte';
    import type { ApexOptions } from 'apexcharts';
    import { Chart } from '@flowbite-svelte-plugins/chart';
    import { Card } from 'flowbite-svelte';

    interface SummaryRow {
        coordinator: string;
        totalFirstTimeApprovals: number;
    }

    let summary: SummaryRow[] = [];

    let options: ApexOptions = {
        chart: {
            type: 'bar',
            height: 400,
            toolbar: { show: false }
        },
        plotOptions: {
            bar: {
                horizontal: true,
                borderRadius: 6,
                dataLabels: { position: 'top' }
            }
        },
        dataLabels: { enabled: false },
        legend: { show: false },
        xaxis: {
            categories: [],
            labels: {
                style: {
                    fontFamily: 'Inter, sans-serif',
                    cssClass: 'text-xs font-normal fill-gray-500 dark:fill-gray-400'
                }
            }
        },
        yaxis: {
            labels: {
                style: {
                    fontFamily: 'Inter, sans-serif',
                    cssClass: 'text-xs font-normal fill-gray-500 dark:fill-gray-400'
                }
            }
        },
        grid: {
            strokeDashArray: 4,
            padding: { top: -20, right: 2, left: 2 }
        },
        series: []
    };

    onMount(async () => {
        try {
            const response = await fetch('/api/topviews/summary');
            const data = await response.json();

            if (response.ok && Array.isArray(data)) {
                summary = data.sort((a, b) => b.totalFirstTimeApprovals - a.totalFirstTimeApprovals);

                options.xaxis!.categories = summary.map(row => row.coordinator);
                options.series = [
                    {
                        name: 'Approvals',
                        data: summary.map(row => row.totalFirstTimeApprovals)
                    }
                ];
            }
        } catch (error) {
            console.error('Failed to fetch summary:', error);
        }
    });
</script>

<Card class="m-4 md:m-6">
    <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex justify-center">
        First Topviews Accepted
    </h2>

    {#if options.series?.length}
        <Chart {options} />
    {:else}
        <p class="text-gray-500 dark:text-gray-400">Loading chart data…</p>
    {/if}
</Card>
