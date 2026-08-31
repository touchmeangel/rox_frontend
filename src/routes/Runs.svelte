<script lang="ts">
  import { onMount } from 'svelte';
  import { listRuns, createRun, deleteRun } from '../lib/api/agent';
  import type { RunSummary } from '../lib/types';
  import { ApiError } from '../lib/http';
  import { navigate } from '../lib/router';

  let runs: RunSummary[] = [];
  let nextCursor: string | undefined;
  let loading = false;
  let loadError: string | null = null;

  let newRunName = '';
  let creating = false;
  let actionError: string | null = null;

  async function load(reset = true): Promise<void> {
    loading = true;
    loadError = null;
    try {
      const res = await listRuns(20, reset ? undefined : nextCursor);
      runs = reset ? res.runs : [...runs, ...res.runs];
      nextCursor = res.next_cursor;
    } catch (err) {
      loadError = err instanceof ApiError ? err.message : 'Failed to load runs.';
    } finally {
      loading = false;
    }
  }

  async function handleCreate(): Promise<void> {
    if (!newRunName.trim()) return;
    creating = true;
    actionError = null;
    try {
      await createRun(newRunName.trim());
      newRunName = '';
      await load(true);
    } catch (err) {
      actionError = err instanceof ApiError ? err.message : 'Failed to create run.';
    } finally {
      creating = false;
    }
  }

  async function handleDelete(runId: string): Promise<void> {
    if (!confirm('Delete this run? This cannot be undone.')) return;
    actionError = null;
    try {
      await deleteRun(runId);
      runs = runs.filter((r) => r.id !== runId);
    } catch (err) {
      actionError = err instanceof ApiError ? err.message : 'Failed to delete run.';
    }
  }

  onMount(() => load(true));
</script>

<h1>Runs</h1>

<form on:submit|preventDefault={handleCreate}>
  <input placeholder="New run name" bind:value={newRunName} required />
  <button type="submit" disabled={creating}>{creating ? 'Creating…' : 'Create run'}</button>
</form>

{#if actionError}<p class="error">{actionError}</p>{/if}

{#if loading && runs.length === 0}
  <p>Loading…</p>
{:else if loadError}
  <p class="error">{loadError}</p>
{:else if runs.length === 0}
  <p>No runs yet.</p>
{:else}
  <table>
    <thead>
      <tr><th>Name</th><th>Status</th><th>Created</th><th></th></tr>
    </thead>
    <tbody>
      {#each runs as run (run.id)}
        <tr>
          <td>
            <a href={`/runs/${run.id}`} on:click|preventDefault={() => navigate(`/runs/${run.id}`)}>
              {run.workspace_folder || run.id}
            </a>
          </td>
          <td>{run.status}</td>
          <td>{new Date(run.created_at).toLocaleString()}</td>
          <td><button on:click={() => handleDelete(run.id)}>Delete</button></td>
        </tr>
      {/each}
    </tbody>
  </table>
  {#if nextCursor}
    <button on:click={() => load(false)} disabled={loading}>{loading ? 'Loading…' : 'Load more'}</button>
  {/if}
{/if}

<style>
  form { display: flex; gap: 0.5rem; margin-bottom: 1rem; }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; padding: 0.4rem; border-bottom: 1px solid #ddd; }
  .error { color: #b00020; }
</style>