<script lang="ts">
  import { onMount } from 'svelte';
  import { startRun, listRunFiles, uploadRunWorkspace } from '../lib/api/agent';
  import type { FileEntry } from '../lib/types';
  import { ApiError } from '../lib/http';

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

  function goUp(): void {
    const parts = currentPath.split('/').filter(Boolean);
    parts.pop();
    void loadFiles(parts.join('/'), true);
  }

  function handleFileSelect(e: Event): void {
    selectedFile = (e.target as HTMLInputElement).files?.[0] ?? null;
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
    try {
      await uploadRunWorkspace(runId, selectedFile);
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

<header class="detail-header">
  <div>
    <h1>Run: {runName}</h1>
    {#if runStatus}<p class="status-badge">Status: {runStatus}</p>{/if}
  </div>
  <div class="actions">
    <button class="start-btn" on:click={handleStart} disabled={starting}>
      {starting ? 'Starting…' : '▶ Start Run'}
    </button>
  </div>
</header>

{#if startError}<p class="error">{startError}</p>{/if}

<section class="upload-section">
  <h2>Upload Workspace</h2>
  <p class="hint">Upload a .zip to set up this run's files — it starts automatically once the upload finishes.</p>
  <div class="upload-row">
    <input type="file" accept=".zip" on:change={handleFileSelect} disabled={uploading} />
    <button on:click={handleUpload} disabled={!selectedFile || uploading}>
      {uploading ? 'Uploading…' : 'Upload & Start'}
    </button>
  </div>
  {#if uploadError}<p class="error">{uploadError}</p>{/if}
</section>

<section class="files-section">
  <h2>Workspace Files {currentPath ? `— /${currentPath}` : ''}</h2>
  {#if currentPath}<button class="up-btn" on:click={goUp}>↖ Back (Up)</button>{/if}
  {#if filesError}<p class="error">{filesError}</p>{/if}

  {#if loadingFiles && entries.length === 0}
    <p>Loading files…</p>
  {:else if entries.length === 0}
    <p class="empty-state">No files found.</p>
  {:else}
    <ul class="file-list">
      {#each entries as entry (entry.name)}
        <li>
          {#if entry.is_folder}
            <button class="link-btn" on:click={() => openFolder(entry.name)}>📁 {entry.name}</button>
          {:else}
            <span class="file-icon">📄</span> {entry.name}
            <span class="size">{#if entry.size}({entry.size} bytes){/if}</span>
          {/if}
        </li>
      {/each}
    </ul>
    {#if nextCursor}
      <button on:click={() => loadFiles(currentPath, false)} disabled={loadingFiles}>Load more</button>
    {/if}
  {/if}
</section>

<style>
  .detail-header {
    display: flex; justify-content: space-between; align-items: flex-start;
    margin-bottom: 2rem; border-bottom: 1px solid #eee; padding-bottom: 1.5rem;
  }
  .detail-header h1 { margin: 0 0 0.5rem 0; }
  .upload-section, .files-section { margin-top: 1.5rem; }
  .error { color: #b00020; }
  .hint { color: #666; font-size: 0.9em; margin: 0 0 0.75rem; }

  .status-badge { display: inline-block; margin: 0; padding: 0.25rem 0.75rem; background: #e3f2fd; color: #1565c0; border-radius: 4px; font-weight: 500; font-size: 0.9rem;}

  .start-btn { font-size: 1.05rem; padding: 0.6rem 1.2rem; background-color: #2e7d32; color: white; border: none; border-radius: 4px; cursor: pointer; transition: background-color 0.2s;}
  .start-btn:hover { background-color: #1b5e20; }
  .start-btn:disabled { background-color: #a5d6a7; cursor: not-allowed; }

  .upload-row { display: flex; gap: 0.75rem; align-items: center; }

  .file-list { list-style: none; padding: 0; margin: 1rem 0; border: 1px solid #e0e0e0; border-radius: 6px; }
  .file-list li { padding: 0.75rem 1rem; border-bottom: 1px solid #e0e0e0; display: flex; align-items: center; gap: 0.5rem; }
  .file-list li:last-child { border-bottom: none; }

  .link-btn { background: none; border: none; padding: 0; color: #1565c0; font: inherit; cursor: pointer; text-align: left; font-weight: 500; }
  .link-btn:hover { text-decoration: underline; }
  .up-btn { margin-bottom: 1rem; padding: 0.4rem 0.8rem; background: #f5f5f5; border: 1px solid #ccc; border-radius: 4px; cursor: pointer;}

  .file-icon { color: #757575; }
  .size { color: #999; font-size: 0.85em; margin-left: auto; }
  .empty-state { color: #666; font-style: italic; background: #f9f9f9; padding: 2rem; border-radius: 6px; text-align: center; }
</style>