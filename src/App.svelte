<script lang="ts">
  import { route, navigate } from './lib/router';
  import { isAuthenticated, currentUser, clearAuth } from './lib/stores/auth';
  import Login from './routes/Login.svelte';
  import Signup from './routes/Signup.svelte';
  import Runs from './routes/Runs.svelte';
  import RunDetail from './routes/RunDetail.svelte';
  import Admin from './routes/Admin.svelte';
  import NotFound from './routes/NotFound.svelte';

  const protectedRoutes = new Set(['runs', 'run-detail', 'admin']);

  $: if (!$isAuthenticated && protectedRoutes.has($route.name)) {
    navigate('/login');
  }

  function logout(): void {
    clearAuth();
    navigate('/login');
  }
</script>

<header>
  <nav>
    <a href="/runs" on:click|preventDefault={() => navigate('/runs')}>Runs</a>
    {#if $currentUser?.role === 'admin'}
      <a href="/admin" on:click|preventDefault={() => navigate('/admin')}>Admin</a>
    {/if}
    <span class="spacer"></span>
    {#if $isAuthenticated}
      <span>{$currentUser?.email ?? ''}</span>
      <button on:click={logout}>Log out</button>
    {:else}
      <a href="/login" on:click|preventDefault={() => navigate('/login')}>Log in</a>
      <a href="/signup" on:click|preventDefault={() => navigate('/signup')}>Sign up</a>
    {/if}
  </nav>
</header>

<main>
  {#if $route.name === 'login'}
    <Login />
  {:else if $route.name === 'signup'}
    <Signup />
  {:else if $route.name === 'runs'}
    <Runs />
  {:else if $route.name === 'run-detail'}
    <RunDetail runId={$route.runId} />
  {:else if $route.name === 'admin'}
    <Admin />
  {:else}
    <NotFound />
  {/if}
</main>

<style>
  nav { display: flex; gap: 1rem; align-items: center; padding: 0.75rem 1rem; border-bottom: 1px solid #ccc; }
  .spacer { flex: 1; }
  main { padding: 1rem; max-width: 800px; margin: 0 auto; }
</style>