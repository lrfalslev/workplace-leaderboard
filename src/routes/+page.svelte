<script lang="ts">
    import { onMount } from 'svelte';
    import type { ApexOptions } from 'apexcharts';
    import { Chart } from '@flowbite-svelte-plugins/chart';
    import { Card } from 'flowbite-svelte';
	import { user } from '$lib/stores/user';
    import { UserRole } from '$lib/types';

    interface SummaryRow {
        teamMemberId: number;
        teamMemberName: string;
        totalFirstTimeApprovals: number;
        totalSubmissions: number;
    }
    
    let teamMemberName: string | null = null;
    let teamMemberAcceptanceRate: string | null = null;
    let summary: SummaryRow[] = [];
    let options: ApexOptions = {
        colors: ["#35bc00", "#BC00A3"],
        chart: {
            type: 'bar',
            width: '100%',
            height: '100%',
            toolbar: { show: false }
        },
        responsive: [{
            breakpoint: 480,
            options: {
                dataLabels: {
                    enabled: true
                }
            }
        }],
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

    function createTooltip(data: SummaryRow[], isAdmin: boolean): ApexOptions['tooltip'] {
        if (!isAdmin) {
            return {
                custom: ({ dataPointIndex, w }) => {
                    const row = data[dataPointIndex];
                    return `
                        <div class="p-2 text-sm bg-white dark:bg-gray-800 dark:text-white rounded shadow">
                            First Time Approvals: ${row.totalFirstTimeApprovals}<br/>
                        </div>
                    `;
                }
            };
        }
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
                        <strong>${row.teamMemberName} (${percentage}%)</strong><br/>
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

    function getUsersAcceptanceRate() {
        const teamMemberRow = summary.find(
            row => row.teamMemberId === $user?.teamMemberId
        );
        if (teamMemberRow) {
            const rate = teamMemberRow.totalSubmissions > 0
                ? (teamMemberRow.totalFirstTimeApprovals / teamMemberRow.totalSubmissions) * 100
                : 0;
            teamMemberAcceptanceRate = rate.toFixed(1);
            teamMemberName = teamMemberRow.teamMemberName;
        }
    }

    onMount(async () => {
        try {
            const response = await fetch('/api/topviews/summary');
            const json = await response.json();

            if (!response.ok || !Array.isArray(json)) 
                return;
                
            summary = json.sort((a, b) => a.teamMemberName.localeCompare(b.teamMemberName));
            options.xaxis!.categories = summary.map(row => row.teamMemberName);

            if ($user?.teamMemberId != null)
                getUsersAcceptanceRate();

            const isAdmin = $user?.role === UserRole.Admin;
            options.series = getSeries(isAdmin, summary);
            options.tooltip = createTooltip(summary, isAdmin);
        } catch (error) {
            console.error('Failed to fetch summary: ', error);
        }
    });
</script>

<Card class="p-2 m-2 md:m-12 lg:m-0 h-[80vh] md:h-[90vh] w-full md:max-w-screen-lg">
    <h2 class="text-xl font-semibold dark:text-white flex my-2 justify-center">
        First Topviews Accepted
    </h2>
    {#if teamMemberName != null && teamMemberAcceptanceRate != null}
        <p class="dark:text-white justify-center text-center text-xs md:text-base sm:flex sm:flex-row">
            <span class="block sm:inline">Nice work, {teamMemberName}!</span>
            <span class="block sm:inline ml-1">You're at a {teamMemberAcceptanceRate}% acceptance rate and climbing!</span>
        </p>
    {/if}
    {#if options.series?.length}
        <div class="h-full w-full">
            <Chart {options} />
        </div>
    {:else}
        <p class="pt-4 dark:text-gray-400 flex justify-center">Loading chart data…</p>
    {/if}
</Card>
