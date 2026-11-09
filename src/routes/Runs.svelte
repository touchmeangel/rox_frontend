<script lang="ts">
  import { onMount } from 'svelte';
  import { listRuns, createRun, deleteRun, startRun, uploadRunWorkspaceChunked } from '../lib/api/agent';
  import type { RunSummary } from '../lib/types';
  import { ApiError } from '../lib/http';
  import { navigate } from '../lib/router';
  import DropZone from '../lib/DropZone.svelte';
  import { spotlight, autofocus, statusTone } from '../lib/ui';

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
  let uploadProgress = 0;

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

  function goToRun(id: string, name: string): void {
    sessionStorage.setItem(`run_name_${id}`, name);
    navigate(`/runs/${id}`);
  }

  function resetModal(): void {
    showCreateModal = false;
    newRunName = '';
    selectedFile = null;
    uploadProgress = 0;
    modalError = null;
  }

  async function handleCreate(): Promise<void> {
    const name = newRunName.trim();
    if (!name) return;

    creating = true;
    modalError = null;
    uploadProgress = 0;
    let runId: string | null = null;

    try {
      const created = await createRun(name);
      runId = created.run_id;

      if (selectedFile) {
        await uploadRunWorkspaceChunked(runId, selectedFile, (fraction) => {
          uploadProgress = fraction;
        });
        await startRun(runId);
      }

      resetModal();
      goToRun(runId, name);
    } catch (err) {
      if (runId) {
        resetModal();
        goToRun(runId, name);
      } else {
        modalError = err instanceof ApiError ? err.message : 'Failed to create run.';
      }
    } finally {
      creating = false;
    }
  }

  let confirmingId: string | null = null;
  let deletingId: string | null = null;

  async function handleDelete(runId: string): Promise<void> {
    deletingId = runId;
    listActionError = null;
    try {
      await deleteRun(runId);
      runs = runs.filter((r) => r.id !== runId);
    } catch (err) {
      listActionError = err instanceof ApiError ? err.message : 'Failed to delete run.';
    } finally {
      deletingId = null;
      confirmingId = null;
    }
  }

  function onKey(e: KeyboardEvent): void {
    if (e.key === 'Escape' && confirmingId && !deletingId) {
      confirmingId = null;
      return;
    }
    if (e.key === 'Escape' && showCreateModal && !creating) {
      resetModal();
      return;
    }
    if (e.key === 'n' && !showCreateModal && !e.metaKey && !e.ctrlKey && !e.altKey) {
      if ((e.target as HTMLElement | null)?.closest?.('input,textarea,select')) return;
      e.preventDefault();
      showCreateModal = true;
    }
  }

  onMount(() => load(true));
</script>

<svelte:window on:keydown={onKey} />

<section class="wrap page">
  <div class="head">
    <div class="stack" style="gap: 0.5rem">
      <h1>Runs</h1>
      {#if runs.length > 0}<p class="muted">{runs.length}{nextCursor ? '+' : ''} {runs.length === 1 ? 'run' : 'runs'}</p>{/if}
    </div>
    <button class="primary" on:click={() => (showCreateModal = true)}>New run <kbd>N</kbd></button>
  </div>

  {#if listActionError}<p class="err">{listActionError}</p>{/if}

  {#if loading && runs.length === 0}
    <p class="muted">Loading…</p>
  {:else if loadError}
    <p class="err">{loadError}</p>
  {:else if runs.length === 0}
    <div class="card spot empty" use:spotlight>
      <p class="muted">No runs yet. Create one and drop in a workspace to get started.</p>
      <button class="primary" on:click={() => (showCreateModal = true)}>Create your first run</button>
    </div>
  {:else}
    <ul class="card rows">
      {#each runs as run (run.id)}
        <li class="row spot" class:confirming={confirmingId === run.id} use:spotlight>
          <i class="dot {statusTone(run.status)}" title={run.status}></i>
          <a class="name" href={`/runs/${run.id}`} on:click|preventDefault={() => goToRun(run.id, run.name)}>{run.name}</a>
          <span class="meta">{run.status}</span>
          <time class="meta">{new Date(run.created_at).toLocaleString()}</time>
          {#if confirmingId === run.id}
            <span class="confirm">
              <span class="q">Delete this run? This can't be undone.</span>
              <button class="ghost" use:autofocus on:click={() => (confirmingId = null)} disabled={deletingId === run.id}>Cancel</button>
              <button class="danger-fill" on:click={() => handleDelete(run.id)} disabled={deletingId === run.id}>
                {deletingId === run.id ? 'Deleting…' : 'Delete'}
              </button>
            </span>
          {:else}
            <button class="ghost danger" on:click={() => (confirmingId = run.id)}>Delete</button>
          {/if}
        </li>
      {/each}
    </ul>
    {#if nextCursor}
      <button class="more" on:click={() => load(false)} disabled={loading}>{loading ? 'Loading…' : 'Load more'}</button>
    {/if}
  {/if}
</section>

{#if showCreateModal}
  <div class="overlay" role="presentation" on:click|self={() => !creating && resetModal()}>
    <div class="modal card" role="dialog" aria-modal="true" aria-label="Create run">
      <h2>New run</h2>
      <form class="stack" style="gap: 1.1rem" on:submit|preventDefault={handleCreate}>
        <label>Run name<input id="runName" type="text" use:autofocus placeholder="My new run" bind:value={newRunName} required disabled={creating} /></label>
        <div class="stack" style="gap: 0.5rem">
          <span class="lbl">Workspace (.zip), optional</span>
          <DropZone bind:file={selectedFile} disabled={creating} progress={creating && selectedFile ? uploadProgress : null} />
          <p class="hint">You can also upload and start this run later from its page.</p>
        </div>
        {#if modalError}<p class="err">{modalError}</p>{/if}
        <div class="actions">
          <button type="button" class="ghost" on:click={resetModal} disabled={creating}>Cancel</button>
          <button type="submit" class="primary" disabled={creating || !newRunName.trim()}>
            {creating ? (selectedFile ? `Uploading… ${Math.round(uploadProgress * 100)}%` : 'Saving…') : selectedFile ? 'Create, upload & start' : 'Create run'}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<style>
  .head { display: flex; justify-content: space-between; align-items: flex-end; gap: 1rem; margin-bottom: 2.5rem; }
  .rows { list-style: none; margin: 0; padding: 0; overflow: hidden; }
  .row {
    display: grid; grid-template-columns: auto 1fr auto auto auto; align-items: center; gap: 1rem;
    padding: 1rem 1.25rem; border-bottom: 1px solid var(--line); transition: background 0.15s;
  }
  .row:last-child { border-bottom: 0; }
  .row:hover { background: rgba(255, 255, 255, 0.03); }
  .name { font-size: 1.05rem; font-weight: 500; text-decoration: none; }
  .name::after { content: ''; position: absolute; inset: 0; }
  .meta { color: var(--fg-2); font-size: 0.85rem; }
  .row button { position: relative; z-index: 1; }
  .row.confirming { background: rgba(248, 113, 113, 0.07); box-shadow: inset 2px 0 0 var(--bad); }
  .row.confirming .meta { display: none; }
  .row.confirming .name::after { display: none; }
  .confirm { grid-column: 3 / -1; justify-self: end; display: flex; align-items: center; gap: 0.5rem; animation: rise 0.2s ease both; }
  .q { color: var(--fg-1); font-size: 0.9rem; margin-right: 0.5rem; }
  .danger-fill { background: var(--bad); border-color: var(--bad); color: #000; }
  .danger-fill:hover:not(:disabled) { background: #fca5a5; border-color: #fca5a5; }
  .empty { display: flex; flex-direction: column; align-items: center; gap: 1.25rem; padding: 4rem 1rem; text-align: center; }
  .more { margin-top: 1.5rem; }

  .overlay { position: fixed; inset: 0; z-index: 50; display: flex; align-items: center; justify-content: center; padding: 1rem; background: rgba(0, 0, 0, 0.7); backdrop-filter: blur(6px); }
  .modal { width: 100%; max-width: 440px; padding: 1.75rem; background: #0a0a0a; display: flex; flex-direction: column; gap: 1.25rem; animation: rise 0.25s ease both; }
  .lbl { font-size: 0.85rem; color: var(--fg-1); }
  .hint { color: var(--fg-2); font-size: 0.8rem; }
  .actions { display: flex; justify-content: flex-end; gap: 0.5rem; }

  @media (max-width: 640px) {
    .row { grid-template-columns: auto 1fr auto; }
    .row .meta { display: none; }
    .q { display: none; }
  }
</style>