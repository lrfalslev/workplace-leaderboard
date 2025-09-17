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
            // custom: ({ dataPointIndex, w }) => {
            //     if (isAdmin)
            //         return getAdminTooltip(dataPointIndex);

            //     // return getTooltip(dataPointIndex);
            // }
        }
    };

    // function getTooltip(index: number) {
    //     const row = summary[index];
    //     const totalBonuses = row.qualifiedWorkLabel - row.totalWorkItemTickets;
    //     return `
    //         <div class="p-2 text-sm bg-white dark:bg-gray-700 dark:text-white rounded shadow">
    //             <div class="text-center font-bold">${row.teamMemberName}</div>
    //             <hr class="my-1 border-gray-300 dark:border-gray-600"/>
    //             <div class="flex justify-between">
    //                 <span>Work Tickets:</span>
    //                 <span class="ml-3 text-right font-mono">${row.totalWorkItemTickets ?? 0}</span>
    //             </div>
    //             <div class="flex justify-between">
    //                 <span>Bonuses:</span>
    //                 <span class="ml-3 text-right font-mono">${totalBonuses ?? 0}</span>
    //             </div>
    //             <div class="flex justify-between">
    //                 <strong>Total:</strong>
    //                 <strong class="ml-3 text-right font-mono">${row.totalTickets}</strong>
    //             </div>
    //         </div>
    //     `;
    // }

    // function getAdminTooltip(index: number) {
    //     const row = summary[index];
    //     const totalBonuses = row.totalTickets - row.totalWorkItemTickets;
    //     const percentage = row.totalWorkItems > 0
    //         ? ((row.totalWorkItemTickets / row.totalWorkItems) * 100).toFixed(1)
    //         : '0.0';
        
    //     const header = `
    //         <div class="p-2 text-sm bg-white dark:bg-gray-700 dark:text-white rounded shadow">
    //             <div class="text-center font-bold">${row.teamMemberName} (${percentage}%)</div>
    //     `;
        
    //     const footer = `
    //             <hr class="my-1 border-gray-300 dark:border-gray-600"/>
    //             <div class="flex justify-between">
    //                 <span>Work Tickets:</span>
    //                 <span class="ml-3 text-right font-mono">${row.totalWorkItemTickets ?? 0}</span>
    //             </div>
    //             <div class="flex justify-between">
    //                 <span>Bonus Tickets:</span>
    //                 <span class="ml-3 text-right font-mono">${totalBonuses ?? 0}</span>
    //             </div>
    //             <div class="flex justify-between">
    //                 <strong>Total:</strong>
    //                 <strong class="ml-3 text-right font-mono">${row.totalTickets}</strong>
    //             </div>
    //         </div>
    //     `;
        
    //     if (row.teamName === "Project Management")
    //         return header + `
    //             <hr class="my-1 border-gray-300 dark:border-gray-600"/>
    //             <div class="flex justify-between">
    //                 <span>First Time Approvals:</span>
    //                 <span class="ml-3 text-right font-mono">${row.totalWorkItemTickets ?? 0}</span>
    //             </div>
    //             <div class="flex justify-between">
    //                 <span>Topview Submissions:</span>
    //                 <span class="ml-3 text-right font-mono">${row.totalWorkItems ?? 0}</span>
    //             </div>
    //         ` + footer;

    //     return header + footer;
    // }

    // function getAdminTooltip(index: number) {
    //     // Get the member name from the x-axis category
    //     const memberName = options.xaxis!.categories[index];

    //     // All rows for this member (one per metric)
    //     const memberRows = summary.filter(r => r.teamMemberName === memberName);

    //     // Build metric lines: qualified + total for each metric
    //     const metricLines = memberRows.map(r => `
    //         <div class="flex justify-between">
    //             <span>${r.qualifiedWorkLabel}:</span>
    //             <span class="ml-3 text-right font-mono">
    //                 ${r.totalWorkItemTickets ?? 0} / ${r.totalWorkItems ?? 0}
    //             </span>
    //         </div>
    //     `).join('');

    //     // Totals
    //     const totalWorkTickets = memberRows.reduce((sum, r) => sum + (r.totalWorkItemTickets ?? 0), 0);
    //     const totalWorkItems = memberRows.reduce((sum, r) => sum + (r.totalWorkItems ?? 0), 0);
    //     const bonusTickets = memberRows[0]?.bonusTickets ?? 0;
    //     const totalTickets = totalWorkTickets + bonusTickets;

    //     return `
    //         <div class="p-2 text-sm bg-white dark:bg-gray-700 dark:text-white rounded shadow">
    //             <div class="text-center font-bold">${memberName}</div>
    //             <hr class="my-1 border-gray-300 dark:border-gray-600"/>
    //             ${metricLines}
    //             <hr class="my-1 border-gray-300 dark:border-gray-600"/>
    //             <div class="flex justify-between">
    //                 <span>Total Work Tickets:</span>
    //                 <span class="ml-3 text-right font-mono">${totalWorkTickets}</span>
    //             </div>
    //             <div class="flex justify-between">
    //                 <span>Total Bonus Tickets:</span>
    //                 <span class="ml-3 text-right font-mono">${bonusTickets}</span>
    //             </div>
    //             <div class="flex justify-between">
    //                 <strong>Total Tickets:</strong>
    //                 <strong class="ml-3 text-right font-mono">${totalTickets}</strong>
    //             </div>
    //         </div>
    //     `;
    // }

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
            const response = await fetch('/api/ticket-summary');
            const json: SummaryRow[] = await response.json();

            if (!response.ok || !Array.isArray(json)) 
                return;

            // Group rows by teamMemberId
            const grouped = new Map<number, SummaryRow[]>();
            for (const row of json) {
                if (!grouped.has(row.teamMemberId)) 
                    grouped.set(row.teamMemberId, []);
                grouped.get(row.teamMemberId)!.push(row);
            }

            // Sort members for consistent display
            const members = Array.from(grouped.values()).sort((a, b) => {
                const aRow = a[0], bRow = b[0];
                if (aRow.teamId !== bRow.teamId) 
                    return aRow.teamId - bRow.teamId;
                return aRow.teamMemberName.localeCompare(bRow.teamMemberName);
            });
            
            options.xaxis!.categories = members.map(rows => rows[0].teamMemberName);

            if (isAdmin) {
                const groupData = new Map<number, number[]>(); // non-legacy groups
                const groupNames = new Map<number, Set<string>>();
                const legacyData = Array(members.length).fill(0); // all legacy metrics combined

                const teamIds = Array.from(new Set(json.map(r => r.teamId)));

                teamIds.forEach(teamId => {
                    const teamMetrics = Array.from(
                        new Set(
                            json
                                .filter(r => r.teamId === teamId && !r.isLegacy)
                                .map(r => r.metricId)
                        )
                    ).sort((a, b) => a - b);

                    teamMetrics.forEach((metricId, idx) => {
                        if (!groupData.has(idx)) {
                            groupData.set(idx, Array(members.length).fill(0));
                            groupNames.set(idx, new Set());
                        }

                        const metricName = json.find(r => r.metricId === metricId)?.qualifiedWorkLabel;
                        if (metricName) groupNames.get(idx)!.add(metricName);

                        members.forEach((rows, memberIdx) => {
                            const m = rows.find(r => r.metricId === metricId);
                            if (m) groupData.get(idx)![memberIdx] += m.totalWorkItemTickets ?? 0;
                        });
                    });

                    // Add legacy metrics for this team to legacyData
                    const legacyMetrics = json.filter(r => r.teamId === teamId && r.isLegacy);
                    members.forEach((rows, memberIdx) => {
                        legacyMetrics.forEach(metric => {
                            const m = rows.find(r => r.metricId === metric.metricId);
                            if (m) legacyData[memberIdx] += m.totalWorkItemTickets ?? 0;
                        });
                    });
                });

                const greenShades = ['#2e7d32', '#81c784', '#43a047', '#66bb6a'];

                // Non-legacy grouped series
                options.series = Array.from(groupData.entries()).map(([groupIndex, data]) => ({
                    name: Array.from(groupNames.get(groupIndex)!).join(', '),
                    group: 'work',
                    data,
                    color: greenShades[groupIndex % greenShades.length]
                }));

                // Legacy group series — generic label
                options.series.push({
                    name: 'Work Tickets',
                    group: 'work',
                    data: legacyData,
                    color: '#F4FF6B' // pick a green shade for legacy
                });

                // Bonus tickets
                options.series.push({
                    name: 'Bonus Tickets',
                    group: 'work',
                    data: members.map(rows => rows[0].bonusTickets ?? 0),
                    color: '#007bff'
                });

                // Total work items (second bar)
                options.series.push({
                    name: 'Total Work Items',
                    group: 'total',
                    data: members.map(rows =>
                        rows.reduce((sum, r) => sum + (r.totalWorkItems ?? 0), 0)
                    ),
                    color: '#a40693'
                });
            } else {
                // Others: lump all qualified work into one "Work Tickets" series, plus bonus
                const workTickets = members.map(rows =>
                    rows.reduce((sum, r) => sum + (r.totalWorkItemTickets ?? 0), 0)
                );
                const bonusTickets = members.map(rows => rows[0].bonusTickets ?? 0);

                options.series = [
                    { name: 'Work Tickets', group: 'work', data: workTickets, color: '#31a608' },
                    { name: 'Bonus Tickets', group: 'work', data: bonusTickets, color: '#007bff' }
                ];
            }


            // Save summary for tooltips and acceptance rate
            summary = members.map(rows => ({
                ...rows[0],
                totalWorkItemTickets: rows.reduce((sum, r) => sum + (r.totalWorkItemTickets ?? 0), 0),
                totalWorkItems: rows.reduce((sum, r) => sum + (r.totalWorkItems ?? 0), 0),
                totalTickets: rows.reduce((sum, r) => sum + (r.totalWorkItemTickets ?? 0), 0) + (rows[0].bonusTickets ?? 0)
            }));

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
        <div class="text-center py-8 text-gray-500 dark:text-gray-400">
            Loading data...
        </div>
    {/if}
</Card>
