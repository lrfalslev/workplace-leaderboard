<script lang="ts">
    import { onMount } from "svelte";
    import type { ApexOptions } from "apexcharts";
    import { Chart } from "@flowbite-svelte-plugins/chart";
    import { Card } from "flowbite-svelte";
    import { user } from "$lib/stores/user";
    import { UserRole } from "$lib/types";

    type SummaryRow = {
        teamMemberId: number;
        teamMemberName: string;
        teamId: number;
        teamName: string;
        metricId: number;
        isLegacy: boolean;
        qualifiedWorkLabel: string;
        totalWorkLabel: string | null;
        workTickets: number;
        workItems: number;
        bonusTickets: number;
    };

    type MemberSummary = {
        teamMemberId: number;
        teamMemberName: string;
        teamId: number;
        teamName: string;
        metrics: Record<number, MetricSummary>;
        workItems: number;
        workTickets: number;
        bonusTickets: number;
        totalTickets: number;
    };
    
    type MetricSummary = {
        isLegacy: boolean;
        qualifiedWorkLabel: string;
        totalWorkLabel: string | null;
        workTickets: number;
        workItems: number;
    };

    const metricTicketColors = ["#35BC00", "#A7FFF6", "#2C6E49"];
    const legacyTicketColor = "#F3B61F";
    const bonusTicketColor = "#007bff";
    const workItemColor = "#BBADFF";

    let memberSummaries: MemberSummary[] = [];

    const isAdmin = $user?.role === UserRole.ADMIN;
    let teamMemberName: string | null = null;
    let teamMemberAcceptanceRate: string | null = null;

    const options: ApexOptions = {
        chart: {
            type: "bar",
            width: "100%",
            height: "100%",
            stacked: true,
            toolbar: { show: false },
            foreColor: "#ffffff",
        },
        responsive: [
            {
                breakpoint: 480,
                options: {
                    dataLabels: {
                        enabled: true,
                    },
                },
            },
        ],
        legend: {
            onItemHover: {
                highlightDataSeries: false,
            },
        },
        plotOptions: {
            bar: {
                horizontal: true,
            },
        },
        dataLabels: {
            enabled: false,
        },
        xaxis: {
            categories: [],
            labels: {
                formatter: (val) =>
                    Number.isInteger(val) ? val.toString() : "",
            },
        },
        states: {
            hover: {
                filter: {
                    type: 'none'
                }
            },
            active: {
                filter: {
                    type: 'none'
                }
            }
        },
        tooltip: {
            shared: true,
            intersect: false,
            followCursor: true,
            custom: ({ dataPointIndex, w }) => {
                if (isAdmin) return getAdminTooltip(dataPointIndex);

                return getTooltip(dataPointIndex);
            },
        },
    };

    function getTooltip(index: number) {
        const memberSummary = memberSummaries[index];
        return `
            <div class="p-2 text-sm bg-white dark:bg-gray-700 dark:text-white rounded shadow">
                <div class="text-center font-bold">${memberSummary.teamMemberName}</div>
                <hr class="my-1 border-gray-300 dark:border-gray-600"/>
                <div class="flex justify-between">
                    <span>Work Tickets:</span>
                    <span class="ml-3 text-right font-mono">${memberSummary.workTickets ?? 0}</span>
                </div>
                <div class="flex justify-between">
                    <span>Bonuses:</span>
                    <span class="ml-3 text-right font-mono">${memberSummary.bonusTickets ?? 0}</span>
                </div>
                <div class="flex justify-between">
                    <strong>Total:</strong>
                    <strong class="ml-3 text-right font-mono">${memberSummary.totalTickets}</strong>
                </div>
            </div>
        `;
    }

    function getAdminTooltip(index: number) {
        const memberSummary = memberSummaries[index];
        
        let header: string;
        if (memberSummary.workItems > 0) {
            const percentage = ((memberSummary.workTickets / memberSummary.workItems) * 100).toFixed(1);
            header = `
                <div class="p-2 text-sm bg-white dark:bg-gray-700 dark:text-white rounded shadow">
                    <div class="text-center font-bold">${memberSummary.teamMemberName} (${percentage}%)</div>
                    <hr class="my-1 border-gray-300 dark:border-gray-600"/>
            `;
        } else {
            header = `
                <div class="p-2 text-sm bg-white dark:bg-gray-700 dark:text-white rounded shadow">
                    <div class="text-center font-bold">${memberSummary.teamMemberName}</div>
                    <hr class="my-1 border-gray-300 dark:border-gray-600"/>
            `;
        }

        const footer = `
                <hr class="my-1 border-gray-300 dark:border-gray-600"/>
                <div class="flex justify-between">
                    <span>Work Tickets:</span>
                    <span class="ml-3 text-right font-mono">${memberSummary.workTickets ?? 0}</span>
                </div>
                <div class="flex justify-between">
                    <span>Bonus Tickets:</span>
                    <span class="ml-3 text-right font-mono">${memberSummary.bonusTickets ?? 0}</span>
                </div>
                <div class="flex justify-between">
                    <strong>Total:</strong>
                    <strong class="ml-3 text-right font-mono">${memberSummary.totalTickets}</strong>
                </div>
            </div>
        `;

        const metricRows = Object.values(memberSummary.metrics)
            .sort((a, b) => Number(a.isLegacy) - Number(b.isLegacy))
            .map(metric => {
                let html = `
                    <div class="flex justify-between">
                        <span>${metric.qualifiedWorkLabel}:</span>
                        <span class="ml-3 text-right font-mono">${metric.workTickets ?? 0}</span>
                    </div>
                `;

                if (metric.totalWorkLabel) {
                    html += `
                        <div class="flex justify-between">
                            <span>${metric.totalWorkLabel}:</span>
                            <span class="ml-3 text-right font-mono">${metric.workItems ?? 0}</span>
                        </div>
                    `;
                }

                return html;
            })
            .join("")

        return (
            header + metricRows + footer
        );
    }

    async function fetchMemberSummaries() {
        try {
            const response = await fetch("/api/ticket-summary");
            const json: SummaryRow[] = await response.json();

            if (!response.ok || !Array.isArray(json)) 
                return;

            const summariesByMember = new Map<number, MemberSummary>();
            for (const row of json) {
                if (!summariesByMember.has(row.teamMemberId))
                    summariesByMember.set(row.teamMemberId, {
                        teamMemberId: row.teamMemberId,
                        teamMemberName: row.teamMemberName,
                        teamId: row.teamId,
                        teamName: row.teamName,
                        metrics: {},
                        workItems: 0,
                        workTickets: 0,
                        bonusTickets: row.bonusTickets,
                        totalTickets: row.bonusTickets
                    });
                    
                const memberSummary = summariesByMember.get(row.teamMemberId)!;
                memberSummary.metrics[row.metricId] = {
                    isLegacy: row.isLegacy,
                    qualifiedWorkLabel: row.qualifiedWorkLabel,
                    totalWorkLabel: row.totalWorkLabel,
                    workTickets: row.workTickets,
                    workItems: row.workItems
                };

                memberSummary.workItems += row.workItems;
                memberSummary.workTickets += row.workTickets;
                memberSummary.totalTickets += row.workTickets;
            }

            memberSummaries = Array.from(summariesByMember.values()).sort((a, b) => {
                if (a.teamId !== b.teamId) 
                    return a.teamId - b.teamId;
                return a.teamMemberName.localeCompare(b.teamMemberName);
            });
        } catch (error) {
            console.error("Failed to fetch summary: ", error);
        }
    }

    function setAdminChartData() {
        const memberNames: string[] = [];
        const metricGroupNames = new Map<number, Set<string>>();
        const metricGroups = new Map<number, number[]>();
        const legacyTicketsData: number[] = Array(memberSummaries.length).fill(0);
        const bonusTicketsData: number[] = [];
        const workItemsData: number[] = [];
        
        memberSummaries.forEach(({ teamMemberName, bonusTickets, workItems, metrics }, memberId) => {            
            memberNames.push(teamMemberName);
            bonusTicketsData.push(bonusTickets);
            workItemsData.push(workItems);

            const nonLegacyMetrics: MetricSummary[] = [];
            for (const metric of Object.values(metrics)) {
                if (metric.isLegacy) {
                    legacyTicketsData[memberId] += metric.workTickets;
                } else {
                    nonLegacyMetrics.push(metric);
                }
            }

            nonLegacyMetrics.sort((a, b) => a.qualifiedWorkLabel.localeCompare(b.qualifiedWorkLabel));

            nonLegacyMetrics.forEach((metric, idx) => {
                if (!metricGroups.has(idx)) {
                    metricGroups.set(idx, Array(memberSummaries.length).fill(0));
                    metricGroupNames.set(idx, new Set());
                }
                metricGroupNames.get(idx)!.add(metric.qualifiedWorkLabel);
                metricGroups.get(idx)![memberId] += metric.workTickets;
            });
        });

        const metricTicketSeries = Array.from(metricGroups, ([idx, data]) => ({
            name: Array.from(metricGroupNames.get(idx)!).join(", "),
            group: "tickets",
            data,
            color: metricTicketColors[idx % metricTicketColors.length]
        }));
        
        options.xaxis!.categories = memberNames;
        options.series = [
            ...metricTicketSeries,
            { name: "Work Tickets", group: "tickets", data: legacyTicketsData, color: legacyTicketColor },
            { name: "Bonus Tickets", group: "tickets", data: bonusTicketsData, color: bonusTicketColor },
            { name: "Total Work Items", group: "work items", data: workItemsData, color: workItemColor }
        ];
    }

    function setUserChartData() {
        const memberNames: string[] = [];
        const workTicketsData: number[] = [];
        const bonusTicketsData: number[] = [];

        for (const { teamMemberName, workTickets, bonusTickets } of memberSummaries) {
            memberNames.push(teamMemberName);
            workTicketsData.push(workTickets);
            bonusTicketsData.push(bonusTickets);
        }

        options.xaxis!.categories = memberNames;
        options.series = [
            { name: "Work Tickets", group: "tickets", data: workTicketsData, color: metricTicketColors[0] },
            { name: "Bonus Tickets", group: "tickets", data: bonusTicketsData, color: bonusTicketColor }
        ];
    }

    function getUsersAcceptanceRate() {
        const memberSummary = memberSummaries.find(
            summary => summary.teamMemberId === $user?.teamMemberId,
        );

        if (!memberSummary?.workItems) 
            return;

        teamMemberName = memberSummary.teamMemberName;
        teamMemberAcceptanceRate = ((memberSummary.workTickets / memberSummary.workItems) * 100).toFixed();
    }

    onMount(async () => {
        await fetchMemberSummaries();
        if ($user?.role === UserRole.ADMIN) {
            setAdminChartData();
        } else {
            setUserChartData();
        }
        if ($user?.teamMemberId != null)
            getUsersAcceptanceRate();
    });
</script>

<Card
    class="p-2 m-2 md:m-12 lg:m-0 h-[80vh] md:h-[90vh] w-full md:max-w-screen-lg"
>
    <h2 class="text-xl font-semibold dark:text-white flex my-2 justify-center">
        Great Western Leaderboard
    </h2>
    {#if teamMemberName != null && teamMemberAcceptanceRate != null}
        <p
            class="dark:text-white justify-center text-center text-xs md:text-base sm:flex sm:flex-row"
        >
            <span class="block sm:inline">Nice work, {teamMemberName}!</span>
            <span class="block sm:inline ml-1"
                >You're at a {teamMemberAcceptanceRate}% acceptance rate and
                climbing!</span
            >
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
