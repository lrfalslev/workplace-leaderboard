<script lang="ts">
    import { onMount } from "svelte";

    type Coordinator = {
        id: number;
        name: string;
    }

    interface RawTopviewRow {
        date: string;
        coordinator: string;
        firstTimeApprovals: number;
        totalSubmissions: number;
    }

    type EditableRow = {
        date: string;
        data: {
            [coordinatorId: number]: {
                firstTimeApprovals: number;
                totalSubmissions: number;
            };
        };
    };

    let coordinators: Coordinator[] = [];
    let name = '';
    let editableTable: EditableRow[] = [];

    async function fetchCoordinators() {
        try {
            const response = await fetch('/api/project-coordinators');
            const data = await response.json();

            if (response.ok && Array.isArray(data)) {
                coordinators = data;
            } else {
                console.error('Unexpected response format.', data);
            }
        } catch (err) {
            console.error('Failed to fetch project coordinators.', err);
        }
    }

    async function fetchTopviews() {
        try {
            const response = await fetch('/api/topviews');
            const json = await response.json();

            if (response.ok && Array.isArray(json)) {
                const raw = json as RawTopviewRow[];
                const grouped = new Map<string, EditableRow>();

                for (const row of raw) {
                    const coordinator = coordinators.find(c => c.name === row.coordinator);
                    if (!coordinator) continue;

                    if (!grouped.has(row.date)) {
                        grouped.set(row.date, {
                            date: row.date,
                            data: {}
                        });
                    }

                    grouped.get(row.date)!.data[coordinator.id] = {
                        firstTimeApprovals: row.firstTimeApprovals,
                        totalSubmissions: row.totalSubmissions
                    };
                }

                editableTable = Array.from(grouped.values()).sort(
                    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
                );
            } else {
                console.error('Unexpected topviews format.', json);
            }
        } catch (err) {
            console.error('Failed to fetch topviews.', err);
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

            if (!response.ok) {
                alert('Failed to add coordinator');
                return;
            }

            name = '';
            await fetchCoordinators();
            await fetchTopviews();
        } catch (err) {
            console.error('Error adding project coordinator.', err);
            alert('❌ Could not add project coordinator. Please try again.');
        }
    }

    async function deleteCoordinator(id: number) {
        try {
            const response = await fetch(`/api/project-coordinators?id=${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                coordinators = coordinators.filter(c => c.id !== id);
                await fetchTopviews();
            } else {
                console.error('Failed to delete coordinator');
            }
        } catch (err) {
            console.error('Error deleting coordinator:', err);
            alert('❌ Could not delete coordinator. Please try again.');
        }
    }

    function addEmptyRow() {
        const today = new Date().toISOString().split('T')[0];
        const blankRow: EditableRow = { date: today,
            data: {}
        };

        for (const c of coordinators) {
            blankRow.data[c.id] = {
                firstTimeApprovals: 0,
                totalSubmissions: 0
            };
        }

        editableTable = [blankRow, ...editableTable];
    }
    
    function formatCell(rowIdx: number, coordId: number): string {
        const entry = editableTable[rowIdx].data[coordId];
        return entry ? `${entry.firstTimeApprovals}/${entry.totalSubmissions}` : '';
    }

    function updateValue(rowIdx: number, coordId: number, input: string) {
        const [first, total] = input.split('/').map(n => parseInt(n) || 0);
        editableTable[rowIdx].data[coordId] = {
            firstTimeApprovals: first,
            totalSubmissions: total
        };
    }

    async function submitRow(row: EditableRow) {
        const payload = [];

        for (const c of coordinators) {
            const entry = row.data[c.id];
            if (!entry) continue;

            payload.push({
                projectCoordinatorId: c.id,
                date: row.date,
                firstTimeApprovals: entry.firstTimeApprovals,
                totalSubmissions: entry.totalSubmissions
            });
        }

        try {
            const res = await fetch('/api/topviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                alert('✅ Row saved!');
                await fetchTopviews();
            } else {
                alert('❌ Save failed');
            }
        } catch (err) {
            console.error('Submission error:', err);
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

<button on:click={addEmptyRow} style="margin-bottom: 1rem;">
    Add Row for Today
</button>

<table>
    <thead>
        <tr>
            <th>Date</th>
            {#each coordinators as coordinator}
                <th>{coordinator.name}</th>
            {/each}
            <th>Action</th>
        </tr>
    </thead>
    <tbody>
        {#each editableTable as row, i}
            <tr>
                <td>
                    <input
                        type="date"
                        bind:value={editableTable[i].date}
                        style="width: 140px;"
                    />
                </td>

                {#each coordinators as coordinator}
                    <td>
                        <input
                            value={formatCell(i, coordinator.id)}
                            on:input={(e) => updateValue(i, coordinator.id, (e.target as HTMLInputElement).value)}
                            style="width: 100px;"
                        />
                    </td>
                {/each}

                <td>
                    <button
                        on:click={() => submitRow(editableTable[i])}
                        style="background-color: #198754; color: white; border: none; padding: 0.4rem 0.6rem; border-radius: 4px; cursor: pointer;"
                    >
                        Save
                    </button>
                </td>
            </tr>
        {/each}
    </tbody>
</table>
