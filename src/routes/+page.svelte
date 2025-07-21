<script lang="ts">
    import { onMount } from 'svelte';

    interface SummaryRow {
        coordinator: string;
        totalNumerator: number;
        totalDenominator: number;
    }

    let summary: SummaryRow[] = [];

    onMount(async () => {
        try {
            const response = await fetch('/api/topviews/summary');
            const data = await response.json();

            if (response.ok && Array.isArray(data)) {
                summary = data.sort(
                    (a, b) => b.totalNumerator - a.totalNumerator
                );
            } else {
                console.error('Unexpected summary format:', data);
            }
        } catch (err) {
            console.error('Failed to fetch summary:', err);
        }
    });
</script>

<style>
    .bar-container {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        width: 100%;
        max-width: 500px;
    }

    .bar-row {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    .bar-label {
        width: 150px;
        font-weight: bold;
    }

    .bar-fill {
        height: 24px;
        background-color: #0d6efd;
        border-radius: 4px;
    }
</style>

<h2>📊 Coordinator Contributions</h2>
<div class="bar-container">
    {#each summary as row}
        <div class="bar-row">
            <span class="bar-label">{row.coordinator}</span>
            <div
                class="bar-fill"
                style="width: {row.totalNumerator * 20}px"
                title="{row.totalNumerator} accepted"
            ></div>
            <span>{row.totalNumerator}</span>
        </div>
    {/each}
</div>
