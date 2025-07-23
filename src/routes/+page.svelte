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
            height: 600 ,
            toolbar: { show: false }
        },
        plotOptions: {
            bar: {
                horizontal: true,
            }
        },
        dataLabels: { enabled: false },
        xaxis: {
            categories: [],
            labels: {
                style: {
                    cssClass: 'dark:fill-gray-400'
                }
            }
        },
        yaxis: {
            labels: {
                style: {
                    cssClass: 'dark:fill-gray-400'
                }
            }
        }
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

<Card class="p-2">
    <h2 class="text-xl font-semibold dark:text-white flex mt-2 justify-center">
        First Topviews Accepted
    </h2>

    {#if options.series?.length}
        <Chart {options} />
    {:else}
        <p class="text-gray-500 dark:text-gray-400">Loading chart data…</p>
    {/if}
</Card>
