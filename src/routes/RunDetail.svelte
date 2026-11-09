<script lang="ts">
  import { onMount } from 'svelte';
  import { startRun, listRunFiles, uploadRunWorkspaceChunked } from '../lib/api/agent';
  import type { FileEntry } from '../lib/types';
  import { ApiError } from '../lib/http';
  import { navigate } from '../lib/router';
  import DropZone from '../lib/DropZone.svelte';
  import { statusTone, formatBytes } from '../lib/ui';

  export let runId: string;
  let runName = '';

  let currentPath = '';
  let entries: FileEntry[] = [];
  let nextCursor: string | undefined;
  let loadingFiles = false;
  let filesError: string | null = null;

  let starting = false;
  let startError: string | null = null;
  let runStatus: string | null = null;

  let selectedFile: File | null = null;
  let uploading = false;
  let uploadError: string | null = null;
  let uploadProgress = 0;

  $: crumbs = currentPath.split('/').filter(Boolean);

  async function loadFiles(path: string, reset = true): Promise<void> {
    loadingFiles = true;
    filesError = null;
    try {
      const res = await listRunFiles(runId, path, 50, reset ? undefined : nextCursor);
      entries = reset ? res.entries : [...entries, ...res.entries];
      nextCursor = res.next_cursor;
      currentPath = res.path;
    } catch (err) {
      filesError = err instanceof ApiError ? err.message : 'Failed to load files.';
    } finally {
      loadingFiles = false;
    }
  }

  function openFolder(name: string): void {
    void loadFiles(currentPath ? `${currentPath}/${name}` : name, true);
  }

  function openCrumb(i: number): void {
    void loadFiles(crumbs.slice(0, i + 1).join('/'), true);
  }

  async function handleStart(): Promise<void> {
    starting = true;
    startError = null;
    try {
      const res = await startRun(runId);
      runStatus = res.status;
    } catch (err) {
      startError = err instanceof ApiError ? err.message : 'Failed to start run.';
    } finally {
      starting = false;
    }
  }

  async function handleUpload(): Promise<void> {
    if (!selectedFile) return;
    uploading = true;
    uploadError = null;
    uploadProgress = 0;
    try {
      await uploadRunWorkspaceChunked(runId, selectedFile, (fraction) => {
        uploadProgress = fraction;
      });
      selectedFile = null;
      await loadFiles('', true);
      await handleStart();
    } catch (err) {
      uploadError = err instanceof ApiError ? err.message : 'Upload failed.';
    } finally {
      uploading = false;
    }
  }

  onMount(() => {
    runName = sessionStorage.getItem(`run_name_${runId}`) || runId;
    loadFiles('', true);
  });
</script>

<section class="wrap page">
  <a class="back muted" href="/runs" on:click|preventDefault={() => navigate('/runs')}>← Runs</a>

  <header class="head">
    <div class="stack" style="gap: 0.75rem">
      <h1 class="title">{runName}</h1>
      {#if runStatus}<span class="pill"><i class="dot {statusTone(runStatus)}"></i>{runStatus}</span>{/if}
    </div>
    <button class="primary" on:click={handleStart} disabled={starting}>{starting ? 'Starting…' : 'Start run'}</button>
  </header>

  {#if startError}<p class="err">{startError}</p>{/if}

  <div class="block stack">
    <h2>Workspace</h2>
    <p class="muted">Upload a .zip to set up this run's files. The run starts automatically once the upload finishes.</p>
    <DropZone bind:file={selectedFile} disabled={uploading} progress={uploading ? uploadProgress : null} />
    <div>
      <button class="primary" on:click={handleUpload} disabled={!selectedFile || uploading}>
        {uploading ? `Uploading… ${Math.round(uploadProgress * 100)}%` : 'Upload & start'}
      </button>
    </div>
    {#if uploadError}<p class="err">{uploadError}</p>{/if}
  </div>

  <div class="block stack">
    <h2>Files</h2>
    <div class="crumbs">
      <button class="ghost" on:click={() => loadFiles('', true)}>root</button>
      {#each crumbs as c, i}
        <span class="sep">/</span>
        <button class="ghost" on:click={() => openCrumb(i)}>{c}</button>
      {/each}
    </div>

    {#if filesError}<p class="err">{filesError}</p>{/if}

    {#if loadingFiles && entries.length === 0}
      <p class="muted">Loading files…</p>
    {:else if entries.length === 0}
      <div class="card empty muted">No files yet. Upload a workspace above.</div>
    {:else}
      <ul class="card files">
        {#each entries as entry (entry.name)}
          <li>
            {#if entry.is_folder}
              <button class="folder" on:click={() => openFolder(entry.name)}><span class="ico">▸</span>{entry.name}</button>
            {:else}
              <span class="file"><span class="ico"></span>{entry.name}</span>
              {#if entry.size}<span class="size">{formatBytes(entry.size)}</span>{/if}
            {/if}
          </li>
        {/each}
      </ul>
      {#if nextCursor}
        <div><button on:click={() => loadFiles(currentPath, false)} disabled={loadingFiles}>Load more</button></div>
      {/if}
    {/if}
  </div>
</section>

<style>
  .back { display: inline-block; margin-bottom: 1.5rem; font-size: 0.9rem; text-decoration: none; }
  .back:hover { color: #fff; }
  .head { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; margin-bottom: 1.5rem; }
  .block { margin-top: 3rem; }
  .crumbs { display: flex; flex-wrap: wrap; align-items: center; gap: 0.1rem; margin-left: -0.6rem; }
  .crumbs button { padding: 0.25rem 0.6rem; }
  .sep { color: var(--fg-2); }
  .files { list-style: none; margin: 0; padding: 0; overflow: hidden; }
  .files li { display: flex; align-items: center; border-bottom: 1px solid var(--line); }
  .files li:last-child { border-bottom: 0; }
  .folder, .file { flex: 1; display: flex; align-items: center; gap: 0.7rem; padding: 0.75rem 1.25rem; text-align: left; overflow-wrap: anywhere; }
  .folder { border: 0; border-radius: 0; font-weight: 500; justify-content: flex-start; }
  .folder:hover:not(:disabled) { background: rgba(255, 255, 255, 0.05); }
  .ico { width: 0.8rem; color: var(--fg-2); }
  .size { padding-right: 1.25rem; color: var(--fg-2); font-size: 0.85rem; white-space: nowrap; }
  .empty { padding: 2.5rem 1rem; text-align: center; }
</style>