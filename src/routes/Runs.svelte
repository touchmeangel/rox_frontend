<script lang="ts">
  import { onMount } from 'svelte';
  import { listRuns, createRun, deleteRun, uploadRunWorkspace, startRun } from '../lib/api/agent';
  import type { RunSummary } from '../lib/types';
  import { ApiError } from '../lib/http';
  import { navigate } from '../lib/router';

  let runs: RunSummary[] = [];
  let nextCursor: string | undefined;
  let loading = false;
  let loadError: string | null = null;
  let listActionError: string | null = null;

  let showCreateModal = false;
  let newRunName = '';
  let selectedFile: File | null = null;
  let creating = false;
  let modalError: string | null = null;

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

  function handleFileSelect(e: Event): void {
    selectedFile = (e.target as HTMLInputElement).files?.[0] ?? null;
  }

  function goToRun(id: string, name: string): void {
    sessionStorage.setItem(`run_name_${id}`, name);
    navigate(`/runs/${id}`);
  }

  function resetModal(): void {
    showCreateModal = false;
    newRunName = '';
    selectedFile = null;
  }

  async function handleCreate(): Promise<void> {
    const name = newRunName.trim();
    if (!name) return;

    creating = true;
    modalError = null;
    let runId: string | null = null;

    try {
      const created = await createRun(name);
      runId = created.run_id;

      if (selectedFile) {
        await uploadRunWorkspace(runId, selectedFile);
        await startRun(runId);
      }

      resetModal();
      goToRun(runId, name);
    } catch (err) {
      if (runId) {
        // Run exists (and possibly has files) even though a later step
        // failed — don't delete it. Send the user to its own page, where
        // upload/start can be retried, instead of losing that state.
        resetModal();
        goToRun(runId, name);
      } else {
        modalError = err instanceof ApiError ? err.message : 'Failed to create run.';
      }
    } finally {
      creating = false;
    }
  }

  async function handleDelete(runId: string): Promise<void> {
    if (!confirm('Delete this run? This cannot be undone.')) return;
    listActionError = null;
    try {
      await deleteRun(runId);
      runs = runs.filter((r) => r.id !== runId);
    } catch (err) {
      listActionError = err instanceof ApiError ? err.message : 'Failed to delete run.';
    }
  }

  onMount(() => load(true));
</script>

<div class="header-actions">
  <h1>Runs</h1>
  <button on:click={() => showCreateModal = true}>+ Create New Run</button>
</div>

{#if listActionError}<p class="error">{listActionError}</p>{/if}

{#if showCreateModal}
  <div class="modal-overlay">
    <div class="modal">
      <h2>Create Run</h2>
      <form on:submit|preventDefault={handleCreate}>
        <div class="form-group">
          <label for="runName">Run Name</label>
          <input id="runName" placeholder="My new run" bind:value={newRunName} required />
        </div>
        <div class="form-group">
          <label for="workspaceFile">Workspace (.zip) — optional</label>
          <input id="workspaceFile" type="file" accept=".zip" on:change={handleFileSelect} />
          <p class="hint">You can also upload and start this run later from its page.</p>
        </div>

        {#if modalError}<p class="error">{modalError}</p>{/if}

        <div class="modal-actions">
          <button type="button" class="cancel-btn" on:click={resetModal} disabled={creating}>Cancel</button>
          <button type="submit" disabled={creating || !newRunName.trim()}>
            {creating ? 'Saving…' : selectedFile ? 'Create, Upload & Start' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

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
            <a href={`/runs/${run.id}`} on:click|preventDefault={() => goToRun(run.id, run.name)}>
              {run.name}
            </a>
          </td>
          <td>{run.status}</td>
          <td>{new Date(run.created_at).toLocaleString()}</td>
          <td><button class="delete-btn" on:click={() => handleDelete(run.id)}>Delete</button></td>
        </tr>
      {/each}
    </tbody>
  </table>
  {#if nextCursor}
    <button on:click={() => load(false)} disabled={loading}>{loading ? 'Loading…' : 'Load more'}</button>
  {/if}
{/if}

<style>
  .header-actions { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; padding: 0.6rem 0.4rem; border-bottom: 1px solid #ddd; }

  .error { color: #b00020; margin: 0.5rem 0; }
  .hint { color: #666; font-size: 0.85em; margin: 0.25rem 0 0; }
  .delete-btn { color: #b00020; background: none; border: 1px solid #b00020; padding: 0.25rem 0.5rem; cursor: pointer; border-radius: 4px; }
  .delete-btn:hover { background: #ffebee; }

  .modal-overlay {
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex; align-items: center; justify-content: center;
    z-index: 1000;
  }
  .modal {
    background: white; padding: 2rem; border-radius: 8px;
    width: 100%; max-width: 420px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  }
  .modal h2 { margin-top: 0; margin-bottom: 1.5rem; }
  .form-group { margin-bottom: 1rem; display: flex; flex-direction: column; gap: 0.5rem; }
  .form-group label { font-weight: bold; font-size: 0.9rem; }
  .form-group input[type="text"] { padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px; }
  .modal-actions { margin-top: 2rem; display: flex; justify-content: flex-end; gap: 0.75rem; }
  .cancel-btn { background: #f5f5f5; color: #333; border: 1px solid #ccc; }
  .cancel-btn:hover { background: #e0e0e0; }
</style>