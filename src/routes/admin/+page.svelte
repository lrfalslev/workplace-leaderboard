<script lang="ts">
    import { onMount } from "svelte";

    type Coordinator = {
        id: number;
        name: string;
    }

    interface TopviewRow {
        date: string;
        coordinator: string;
        numerator: number;
        denominator: number;
    }

    type ViewRow = {
        date: string;
        [name: string]: string;
    };

    let coordinators: Coordinator[] = [];
    let name = '';
    let rows: TopviewRow[] = [];
    let table: ViewRow[] = [];
    let coordinatorNames: string[] = [];

    async function fetchTopviews() {
        try {
            const response = await fetch('/api/topviews');
            const data = (await response.json() as { results: TopviewRow[] });

            if (response.ok && Array.isArray(data.results)) {
                rows = data.results;

                coordinatorNames = [...new Set(rows.map(r => r.coordinator))];

                const groupedByDate = new Map<string, ViewRow>();

                for (const row of rows) {
                    if (!groupedByDate.has(row.date)) {
                        groupedByDate.set(row.date, { date: row.date });
                    }
                    const record = groupedByDate.get(row.date)!;
                    record[row.coordinator] = `${row.numerator}/${row.denominator}`;
                }

                table = Array.from(groupedByDate.values());
            } else {
                console.error('Unexpected response format:', data);
            }
        } catch (err) {
            console.error('Failed to fetch topviews:', err);
        }
    }

    async function fetchCoordinators() {
        try {
            const response = await fetch('/api/project-coordinators');
            const data = await response.json();

            if (response.ok && Array.isArray(data)) {
                coordinators = data;
            } else {
                console.error('Unexpected response format:', data);
            }
        } catch (err) {
            console.error('Failed to fetch topviews:', err);
        }
    }

    async function addCoordinator() {
        const trimmed = name.trim();
        if (!trimmed) return;

        try {
            const response = await fetch('/api/project-coordinators', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name: trimmed })
            });

            if (!response.ok) alert('Failed to add coordinator');

            name = '';
            await fetchCoordinators();
        } catch (err) {
            console.error('Error adding coordinator:', err);
            alert('❌ Could not add coordinator. Please try again.');
        }
    }

    async function deleteCoordinator(id: number) {
        try {
            const response = await fetch(`/api/project-coordinators?id=${id}`, {
            method: 'DELETE'
            });

            if (response.ok) {
                console.log(`Deleted coordinator with id ${id}`);
                coordinators = coordinators.filter(c => c.id !== id);
            } else {
                console.error('Failed to delete coordinator');
            }
        } catch (err) {
            console.error('Error deleting coordinator:', err);
        }
    }

    onMount(() => {
        fetchCoordinators();
        fetchTopviews();
    });
</script>

<div>
    {#each coordinators as coordinator}
      <div style="display: flex; align-items: center; gap: 0.5rem;">
        <span>{coordinator.name}</span>
        <button
          on:click={() => deleteCoordinator(coordinator.id)}
          style="background-color: red; color: white; border: none; padding: 0.25rem 0.5rem; border-radius: 4px; cursor: pointer;"
        >
          Delete
        </button>
      </div>
    {/each}

    <div style="margin-bottom: 1rem;">
        <input
            bind:value={name}
            placeholder="Enter coordinator name"
            style="padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px;"
        />
        <button
            on:click={() => addCoordinator()}
            style="margin-left: 0.5rem; background-color: #0d6efd; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px;"
        >
            Add
        </button>
    </div>
</div>

<table>
  <thead>
    <tr>
      <th>Date</th>
      {#each coordinatorNames as name}
        <th>{name}</th>
      {/each}
    </tr>
  </thead>
  <tbody>
    {#each table as row}
      <tr>
        <td>{row.date}</td>
        {#each coordinatorNames as name}
          <td>{row[name] || "-"}</td>
        {/each}
      </tr>
    {/each}
  </tbody>
</table>
