<script lang="ts">
  import { onMount } from 'svelte';
  import { route, navigate } from './lib/router';
  import { isAuthenticated, currentUser, clearAuth } from './lib/stores/auth';
  import { loadStatus, canLogin, canSignup } from './lib/stores/signupStatus';
  import Login from './routes/Login.svelte';
  import Signup from './routes/Signup.svelte';
  import Runs from './routes/Runs.svelte';
  import RunDetail from './routes/RunDetail.svelte';
  import Settings from './routes/Settings.svelte';
  import NotFound from './routes/NotFound.svelte';

  const protectedRoutes = new Set(['runs', 'run-detail', 'settings']);

  onMount(() => loadStatus());

  $: if (!$isAuthenticated && protectedRoutes.has($route.name)) {
    navigate('/login');
  }

  function logout(): void {
    clearAuth();
    navigate('/login');
  }

  function glow(e: PointerEvent): void {
    const s = document.documentElement.style;
    s.setProperty('--gx', `${e.clientX}px`);
    s.setProperty('--gy', `${e.clientY}px`);
  }

  function shortcuts(e: KeyboardEvent): void {
    if (e.metaKey || e.ctrlKey || e.altKey || !$isAuthenticated) return;
    const t = e.target as HTMLElement | null;
    if (t?.closest?.('input,textarea,select,[contenteditable]')) return;
    if (e.key === 'r') navigate('/runs');
    else if (e.key === 's') navigate('/settings');
  }
</script>

<svelte:window on:pointermove={glow} on:keydown={shortcuts} />

<header class="top">
  <div class="wrap bar">
    <a class="brand" href="/" on:click|preventDefault={() => navigate($isAuthenticated ? '/runs' : '/login')}>
      <svg width="20" height="20" viewBox="0 0 12 12" fill="#fff" aria-hidden="true">
        <rect x="0" y="0" width="4" height="4" /><rect x="8" y="0" width="4" height="4" />
        <rect x="4" y="4" width="4" height="4" />
        <rect x="0" y="8" width="4" height="4" /><rect x="8" y="8" width="4" height="4" />
      </svg>
      rox
    </a>
    <nav>
      {#if $isAuthenticated}
        <a class="nl" class:on={$route.name === 'runs' || $route.name === 'run-detail'} href="/runs" on:click|preventDefault={() => navigate('/runs')}>Runs <kbd>R</kbd></a>
        <a class="nl" class:on={$route.name === 'settings'} href="/settings" on:click|preventDefault={() => navigate('/settings')}>Settings <kbd>S</kbd></a>
        <span class="who">{$currentUser?.username ?? ''}</span>
        <button class="ghost" on:click={logout}>Log out</button>
      {:else}
        {#if $canLogin}
          <a class="nl" class:on={$route.name === 'login'} href="/login" on:click|preventDefault={() => navigate('/login')}>Log in</a>
        {/if}
        {#if $canSignup}
          <a class="btn primary" href="/signup" on:click|preventDefault={() => navigate('/signup')}>Sign up</a>
        {/if}
      {/if}
    </nav>
  </div>
</header>

<main>
  {#if $route.name === 'login'}<Login />
  {:else if $route.name === 'signup'}<Signup />
  {:else if $route.name === 'runs'}<Runs />
  {:else if $route.name === 'run-detail'}<RunDetail runId={$route.runId} />
  {:else if $route.name === 'settings'}<Settings />
  {:else}<NotFound />
  {/if}
</main>

<style>
  .top { position: sticky; top: 0; z-index: 20; background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(14px); border-bottom: 1px solid var(--line); }
  .bar { display: flex; align-items: center; height: 64px; }
  .brand { display: flex; align-items: center; gap: 0.65rem; font-size: 1.15rem; font-weight: 600; letter-spacing: -0.02em; text-decoration: none; }
  nav { display: flex; align-items: center; gap: 0.25rem; margin-left: auto; }
  .nl { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.4rem 0.85rem; border-radius: 999px; color: var(--fg-1); text-decoration: none; transition: color 0.15s, background 0.15s; }
  .nl:hover, .nl.on { color: #fff; background: rgba(255, 255, 255, 0.07); }
  .who { color: var(--fg-2); font-size: 0.9rem; padding: 0 0.5rem; }
  main { min-height: calc(100svh - 65px); }
</style>