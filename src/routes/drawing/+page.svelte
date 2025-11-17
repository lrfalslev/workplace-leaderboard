<script lang="ts">
    import { Button } from "flowbite-svelte";
    import { onMount } from "svelte";

    type MemberSummary = {
        teamMemberName: string;
        workTickets: number;
        bonusTickets: number;
        totalTickets: number;
    };
    
    let memberSummaries: MemberSummary[] = [];
    let showWork = false;
    let showBonus = false;
    let isLoading = true;

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
                        teamMemberName: row.teamMemberName,
                        workTickets: 0,
                        bonusTickets: row.bonusTickets,
                        totalTickets: row.bonusTickets
                    });
                    
                const memberSummary = summariesByMember.get(row.teamMemberId)!;
                memberSummary.workTickets += row.workTickets;
                memberSummary.totalTickets += row.workTickets;
            }

            memberSummaries = Array.from(summariesByMember.values()).sort((a, b) => {
                return a.teamMemberName.localeCompare(b.teamMemberName);
            });
            
            isLoading = false;
        } catch (error) {
            console.error("Failed to fetch summary: ", error);
        }
    }

    function printTickets(type: "work" | "bonus") {
      if (type === "work") {
        showWork = true;
      } else {
        showBonus = true;
      }
      
      setTimeout(() => {
        window.print();
        showWork = showBonus = false;
      }, 10);
    }
    
    $: workTickets = memberSummaries.flatMap(m =>
        Array.from({ length: m.workTickets }, () => m.teamMemberName)
    );
    $: bonusTickets = memberSummaries.flatMap(m =>
        Array.from({ length: m.bonusTickets }, () => m.teamMemberName)
    );

    onMount(async () => {
        await fetchMemberSummaries();
    });
</script>

{#if showWork}
  <div class="printable">
    {#each workTickets as name}
      <div class="ticket">{name}</div>
    {/each}
  </div>
{:else if showBonus}
  <div class="printable">
    {#each bonusTickets as name}
      <div class="ticket">{name}</div>
    {/each}
  </div>
{:else}
  <div class="p-4 bg-gray-800 rounded mb-6">
      {#if isLoading}
          <div class="text-center py-8 text-gray-500 dark:text-gray-400">
              Loading data...
          </div>
      {:else}
        <h2 class="text-lg font-bold mb-4 dark:text-gray-200 text-center">Ticket Summary</h2>
        <table>
          <thead>
              <tr>
                  <th>Team Member</th>
                  <th>Work Tickets</th>
                  <th>Bonus Tickets</th>
              </tr>
          </thead>
          <tbody>
              {#each memberSummaries as m}
                  <tr>
                      <td>{m.teamMemberName}</td>
                      <td>{m.workTickets}</td>
                      <td>{m.bonusTickets}</td>
                  </tr>
              {/each}
          </tbody>
          <tfoot class="h-8">
              <tr>
                  <td>Total</td>
                  <td>{memberSummaries.reduce((sum, m) => sum + m.workTickets, 0)}</td>
                  <td>{memberSummaries.reduce((sum, m) => sum + m.bonusTickets, 0)}</td>
              </tr>
          </tfoot>
        </table>
        <div class="justify-center flex gap-4 mt-4">
          <Button onclick={() => printTickets("work")}>
            Print Work Tickets
          </Button>
          <Button onclick={() => printTickets("bonus")}>
            Print Bonus Tickets
          </Button>
        </div>
      {/if}
  </div>
{/if}

<style>
  @page {
      margin: 0.25in;
  }
  
  td {
    padding-top: 0rem !important;
    padding-bottom: 0rem !important;
  }
  
  .ticket {
    border: 1px dashed #000;
    text-align: center;
    font-size: 2rem;
    line-height: 4rem;
    page-break-inside: avoid;
    padding: 0 .5rem;
  }

  @media print {
    :global(body) {
      visibility: hidden !important;
    }

    :global(.printable) {
      visibility: visible !important;
      display: grid;
      grid-template-columns: repeat(5, 1fr);
    }
  }
</style>