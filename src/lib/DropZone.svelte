<script lang="ts">
  import { formatBytes } from './ui';

  export let file: File | null = null;
  export let disabled = false;
  export let progress: number | null = null;

  let over = false;
  let rejected = false;
  let input: HTMLInputElement;

  $: if (!file && input) input.value = '';

  function take(f: File | null | undefined): void {
    if (!f) return;
    rejected = !f.name.toLowerCase().endsWith('.zip');
    if (!rejected) file = f;
  }

  function onDrop(e: DragEvent): void {
    over = false;
    if (!disabled) take(e.dataTransfer?.files?.[0]);
  }

  function open(): void {
    if (!disabled) input.click();
  }
</script>

<div
  class="drop"
  class:over
  class:has={file !== null}
  class:disabled
  role="button"
  tabindex={disabled ? -1 : 0}
  on:click={open}
  on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), open())}
  on:dragover|preventDefault={() => !disabled && (over = true)}
  on:dragleave={() => (over = false)}
  on:drop|preventDefault={onDrop}
>
  <input bind:this={input} type="file" accept=".zip" hidden on:click|stopPropagation on:change={(e) => take(e.currentTarget.files?.[0])} />
  <div class="inner">
    {#if file}
      <span class="name">{file.name}</span>
      <span class="meta">{formatBytes(file.size)}{disabled ? ', uploading' : ', click to replace'}</span>
    {:else}
      <span class="name">Drop a .zip here</span>
      <span class="meta" class:bad={rejected}>{rejected ? 'Only .zip files are supported' : 'or click to browse'}</span>
    {/if}
  </div>
  {#if progress !== null}<i class="fill" style="width: {Math.round(progress * 100)}%"></i>{/if}
</div>

<style>
  .drop {
    position: relative; overflow: hidden; text-align: center; cursor: pointer;
    padding: 2.25rem 1rem; border-radius: 16px;
    border: 1px dashed var(--line-2); background: var(--surface);
    transition: border-color 0.2s, background 0.2s, transform 0.2s;
  }
  .drop:hover { border-color: rgba(255, 255, 255, 0.35); }
  .drop.over { border-color: #fff; background: rgba(255, 255, 255, 0.07); transform: scale(1.01); }
  .drop.has { border-style: solid; }
  .drop.disabled { cursor: default; opacity: 0.75; }
  .inner { display: flex; flex-direction: column; gap: 0.25rem; pointer-events: none; }
  .name { font-weight: 500; overflow-wrap: anywhere; }
  .meta { color: var(--fg-1); font-size: 0.85rem; }
  .meta.bad { color: var(--bad); }
  .fill { position: absolute; left: 0; bottom: 0; height: 2px; background: #fff; transition: width 0.15s; }
</style>