<script lang="ts">
    import { onMount } from 'svelte';
    import type { ApexOptions } from 'apexcharts';
    import { Chart } from '@flowbite-svelte-plugins/chart';
    import { Card } from 'flowbite-svelte';
	import { user } from '$lib/stores/user';
    import { UserRole } from '$lib/types';

    interface SummaryRow {
        coordinator: string;
        totalFirstTimeApprovals: number;
        totalSubmissions: number;
    }
    
    let summary: SummaryRow[] = [];
    let options: ApexOptions = {
        colors: ['#10B981', '#3B82F6'],
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
        dataLabels: { 
            enabled: false,
        },
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

    function createAdminTooltip(data: SummaryRow[]): ApexOptions['tooltip'] {
        return {
            shared: true,
            intersect: false,
            custom: ({ dataPointIndex, w }) => {
                const row = data[dataPointIndex];
                const percentage = row.totalSubmissions > 0
                    ? ((row.totalFirstTimeApprovals / row.totalSubmissions) * 100).toFixed(1)
                    : '0.0';

                return `
                    <div class="p-2 text-sm bg-white dark:bg-gray-800 dark:text-white rounded shadow">
                        <strong>${row.coordinator} (${percentage}%)</strong><br/>
                        First Time Approvals: ${row.totalFirstTimeApprovals}<br/>
                        Total Submissions: ${row.totalSubmissions}
                    </div>
                `;
            }
        };
    }

    function getSeries(isAdmin: boolean, data: SummaryRow[]) {
        const base = [
            {
                name: 'First Time Approvals',
                data: data.map(row => row.totalFirstTimeApprovals)
            }
        ];
        if (isAdmin) {
            base.push({
                name: 'Total Submissions',
                data: data.map(row => row.totalSubmissions)
            });
        }
        return base;
    }

    onMount(async () => {
        const isMobile = window.innerWidth < 640;
        options.dataLabels!.enabled = isMobile;

        try {
            const response = await fetch('/api/topviews/summary');
            const json = await response.json();

            if (!response.ok || !Array.isArray(json)) 
                return;
                
            summary = json.sort((a, b) => b.totalFirstTimeApprovals - a.totalFirstTimeApprovals);
            options.xaxis!.categories = summary.map(row => row.coordinator);

            const isAdmin = $user?.role === UserRole.Admin;
            options.series = getSeries(isAdmin, summary);
            if (isAdmin) {
                options.tooltip = createAdminTooltip(summary);
            }
        } catch (error) {
            console.error('Failed to fetch summary:', error);
        }
    });
</script>

<Card class="p-2 md:pr-8 m-12 lg:m-0 w-full md:max-w-screen-lg">
    <h2 class="text-xl font-semibold dark:text-white flex mt-4 justify-center">
        First Topviews Accepted
    </h2>
    {#if options.series?.length}
        <Chart {options} />
    {:else}
        <p class="pt-4 dark:text-gray-400 flex justify-center">Loading chart data…</p>
    {/if}
</Card>
