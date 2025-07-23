<script lang="ts">
    import { onMount } from 'svelte';
    import type { ApexOptions } from 'apexcharts';
    import { Chart } from '@flowbite-svelte-plugins/chart';
    import { Card } from 'flowbite-svelte';

    let options: ApexOptions = {
        chart: {
            type: 'bar',
            width: '100%',
            height: undefined,
            toolbar: { show: false }
        },
        plotOptions: {
            bar: {
                horizontal: true,
            }
        },
        dataLabels: { enabled: false },
        xaxis: {
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

    interface SummaryRow {
        coordinator: string;
        totalFirstTimeApprovals: number;
    }

    let summary: SummaryRow[] = [];

    onMount(async () => {
        const isMobile = window.innerWidth < 640;
        options.dataLabels!.enabled = isMobile;
        try {
            const response = await fetch('/api/topviews/summary');
            const json = await response.json();

            if (response.ok && Array.isArray(json)) {
                summary = json.sort((a, b) => b.totalFirstTimeApprovals - a.totalFirstTimeApprovals);

                options.xaxis!.categories = summary.map(row => row.coordinator);
                options.series = [
                    {
                        name: 'Approvals',
                        data: summary.map(row => row.totalFirstTimeApprovals)
                    },
                ];
            }
        } catch (error) {
            console.error('Failed to fetch summary:', error);
        }
    });
</script>

<Card class="p-2 md:pr-8 m-8 w-full md:max-w-screen-lg">
    <h2 class="text-xl font-semibold dark:text-white flex mt-4 justify-center">
        First Topviews Accepted
    </h2>
    {#if options.series?.length}
        <Chart {options} />
    {:else}
        <p class="pt-4 dark:text-gray-400 flex justify-center">Loading chart data…</p>
    {/if}
</Card>
