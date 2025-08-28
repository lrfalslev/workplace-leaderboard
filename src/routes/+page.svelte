<script lang="ts">
    import { onMount } from 'svelte';
    import type { ApexOptions } from 'apexcharts';
    import { Chart } from '@flowbite-svelte-plugins/chart';
    import { Card } from 'flowbite-svelte';
    import { user } from '$lib/stores/user';
    import { UserRole, type SummaryRow } from '$lib/types';
    
    const isAdmin = $user?.role === UserRole.ADMIN;

    let summary: SummaryRow[] = [];
    let teamMemberName: string | null = null;
    let teamMemberAcceptanceRate: string | null = null;
    
    const options: ApexOptions = {
        chart: { 
            type: 'bar', 
            width: '100%',
            height: '100%',
            stacked: true, 
            toolbar: { show: false },
            foreColor: '#ffffff'
        },
        colors: ['#31a608', '#007bff', '#a40693'],
        responsive: [{
            breakpoint: 480,
            options: {
                dataLabels: {
                    enabled: true
                }
            }
        }],
        legend: {
            onItemHover: {
            highlightDataSeries: false
            }
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
            categories: [],
            labels: {
                formatter: val => Number.isInteger(val) ? val.toString() : ''
            }
        },
        tooltip: {
            shared: true,
            intersect: false,
            followCursor: true,
            custom: ({ dataPointIndex, w }) => {
                const row = summary[dataPointIndex];
                const totalBonuses = row.totalTickets - row.totalWorkItemTickets;
                
                if (!isAdmin) {
                        return `
                            <div class="p-2 text-sm bg-white dark:bg-gray-800 dark:text-white rounded shadow">
                                <strong>${row.teamMemberName}</strong>
                                <hr class="my-1 border-gray-300 dark:border-gray-600"/>
                                <div class="flex justify-between">
                                    <span>Work Tickets:</span>
                                    <span class="ml-3 text-right font-mono">${row.totalWorkItemTickets ?? 0}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span>Bonuses:</span>
                                    <span class="ml-3 text-right font-mono">${totalBonuses ?? 0}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span>Total Tickets:</span>
                                    <span class="ml-3 text-right font-mono">${row.totalTickets}</span>
                                </div>
                            </div>
                        `;
                    }

                const percentage = row.totalWorkItems > 0
                    ? ((row.totalWorkItemTickets / row.totalWorkItems) * 100).toFixed(1)
                    : '0.0';

                return `
                    <div class="p-2 text-sm bg-white dark:bg-gray-800 dark:text-white rounded shadow">
                        <strong>${row.teamMemberName} (${percentage}%)</strong>
                        <hr class="my-1 border-gray-300 dark:border-gray-600"/>
                        <div class="flex justify-between">
                            <span>First Time Approvals:</span>
                            <span class="ml-3 text-right font-mono">${row.totalWorkItemTickets ?? 0}</span>
                        </div>
                        <div class="flex justify-between">
                            <span>Topview Submissions:</span>
                            <span class="ml-3 text-right font-mono">${row.totalWorkItems ?? 0}</span>
                        </div>
                        <hr class="my-1 border-gray-300 dark:border-gray-600"/>
                        <div class="flex justify-between">
                            <span>Work Tickets:</span>
                            <span class="ml-3 text-right font-mono">${row.totalWorkItemTickets ?? 0}</span>
                        </div>
                        <div class="flex justify-between">
                            <span>Bonus Tickets:</span>
                            <span class="ml-3 text-right font-mono">${totalBonuses ?? 0}</span>
                        </div>
                        <div class="flex justify-between">
                            <span>Total Tickets:</span>
                            <span class="ml-3 text-right font-mono">${row.totalTickets ?? 0}</span>
                        </div>
                    </div>
                `;
            }
        }
    };

    function getUsersAcceptanceRate() {
        const teamMemberRow = summary.find(
            row => row.teamMemberId === $user?.teamMemberId
        );

        if (
            teamMemberRow && 
            teamMemberRow.totalWorkItems != null &&
            teamMemberRow.totalWorkItems > 0
        ) {
            const rate = (teamMemberRow.totalWorkItemTickets / teamMemberRow.totalWorkItems) * 100;
            teamMemberAcceptanceRate = rate.toFixed(1);
            teamMemberName = teamMemberRow.teamMemberName;
        }
    }

    onMount(async () => {
        try {
            const response = await fetch('/api/tickets/summary');
            const json: SummaryRow[] = await response.json();

            if (!response.ok || !Array.isArray(json)) 
                return;
                
            summary = json.sort((a, b) => {
                if (a.teamId !== b.teamId) {
                return a.teamId - b.teamId;
                }
                return a.teamMemberName.localeCompare(b.teamMemberName);
            });
            
            options.xaxis!.categories = summary.map(row => row.teamMemberName);

            const workItemTickets = summary.map(m => m.totalWorkItemTickets || 0);
            const bonusTickets = summary.map(m => (m.totalTickets || 0) - (m.totalWorkItemTickets || 0));
            
            options.series = [
                { name: 'Work Tickets', group: 'tickets', data: workItemTickets },
                { name: 'Bonus Tickets', group: 'tickets', data: bonusTickets }
            ];

            if (isAdmin) {
                const totalWorkItems = summary.map(m => m.totalWorkItems || 0);
                options.series.push({ name: 'Total Work Items', group: 'submissions', data: totalWorkItems });
            }

            if ($user?.teamMemberId != null)
                getUsersAcceptanceRate();
        } catch (error) {
            console.error('Failed to fetch summary: ', error);
        }
    });
</script>

<Card class="p-2 m-2 md:m-12 lg:m-0 h-[80vh] md:h-[90vh] w-full md:max-w-screen-lg">
    <h2 class="text-xl font-semibold dark:text-white flex my-2 justify-center">
        Great Western Leaderboard
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
