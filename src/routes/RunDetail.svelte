<script lang="ts">
  import { onMount } from 'svelte';
  import { uploadRunWorkspace, startRun, listRunFiles } from '../lib/api/agent';
  import type { FileEntry } from '../lib/types';
  import { ApiError } from '../lib/http';

  export let runId: string;

  let currentPath = '';
  let entries: FileEntry[] = [];
  let nextCursor: string | undefined;
  let loadingFiles = false;
  let filesError: string | null = null;

  let selectedFile: File | null = null;
  let uploading = false;
  let uploadError: string | null = null;
  let uploadedBytes: number | null = null;

  let starting = false;
  let startError: string | null = null;
  let runStatus: string | null = null;

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

  async function handleUpload(): Promise<void> {
    if (!selectedFile) return;
    uploading = true;
    uploadError = null;
    try {
      const res = await uploadRunWorkspace(runId, selectedFile);
      uploadedBytes = res.uploaded_bytes;
      await loadFiles('', true);
    } catch (err) {
      uploadError = err instanceof ApiError ? err.message : 'Upload failed.';
    } finally {
      uploading = false;
    }
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

  onMount(() => loadFiles('', true));
</script>

<h1>Run: {runId}</h1>

<section>
  <h2>Upload workspace (.zip)</h2>
  <input type="file" accept=".zip" on:change={handleFileSelect} />
  <button on:click={handleUpload} disabled={!selectedFile || uploading}>
    {uploading ? 'Uploading…' : 'Upload'}
  </button>
  {#if uploadError}<p class="error">{uploadError}</p>{/if}
  {#if uploadedBytes !== null}<p>Uploaded {uploadedBytes} bytes.</p>{/if}
</section>

<section>
  <h2>Start run</h2>
  <button on:click={handleStart} disabled={starting}>{starting ? 'Starting…' : 'Start'}</button>
  {#if startError}<p class="error">{startError}</p>{/if}
  {#if runStatus}<p>Status: {runStatus}</p>{/if}
</section>

<section>
  <h2>Files {currentPath ? `— /${currentPath}` : ''}</h2>
  {#if currentPath}<button on:click={goUp}>.. (up)</button>{/if}
  {#if filesError}<p class="error">{filesError}</p>{/if}
  {#if loadingFiles && entries.length === 0}
    <p>Loading…</p>
  {:else if entries.length === 0}
    <p>No files.</p>
  {:else}
    <ul>
      {#each entries as entry (entry.name)}
        <li>
          {#if entry.is_folder}
            <button on:click={() => openFolder(entry.name)}>📁 {entry.name}</button>
          {:else}
            📄 {entry.name} {#if entry.size}({entry.size} bytes){/if}
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
  section { margin-bottom: 1.5rem; }
  .error { color: #b00020; }
  ul { list-style: none; padding: 0; }
</style>