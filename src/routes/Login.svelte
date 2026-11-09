<script lang="ts">
  import { onMount } from 'svelte';
  import { login } from '../lib/api/auth';
  import { ApiError } from '../lib/http';
  import { navigate } from '../lib/router';
  import { statusStore, loadStatus, canLogin, canSignup } from '../lib/stores/signupStatus';
  import { spotlight } from '../lib/ui';

  let email = '';
  let password = '';
  let loading = false;
  let error: string | null = null;

  onMount(() => loadStatus());

  $: if ($statusStore.mode && !$canLogin) navigate('/signup');

  async function handleSubmit(): Promise<void> {
    error = null;
    loading = true;
    try {
      await login({ email, password });
      navigate('/runs');
    } catch (err) {
      error = err instanceof ApiError ? err.message : 'Something went wrong. Please try again.';
    } finally {
      loading = false;
    }
  }
</script>

{#if $statusStore.loading && !$statusStore.mode}
  <div class="hero"><p class="muted">Loading…</p></div>
{:else if $statusStore.error}
  <div class="hero"><p class="err">{$statusStore.error}</p></div>
{:else if $canLogin}
  <section class="hero wrap">
    <h1 class="rise">Welcome back.</h1>
    <p class="sub rise" style="--d: 1">Log in to launch and monitor your agent runs.</p>
    <form class="card spot form stack rise" style="--d: 2" use:spotlight on:submit|preventDefault={handleSubmit}>
      <label>Email<input type="email" bind:value={email} required autocomplete="email" placeholder="you@company.com" /></label>
      <label>Password<input type="password" bind:value={password} required autocomplete="current-password" /></label>
      {#if error}<p class="err">{error}</p>{/if}
      <button class="primary" type="submit" disabled={loading}>
        {loading ? 'Logging in…' : 'Log in'}{#if !loading}<kbd>↵</kbd>{/if}
      </button>
    </form>
    {#if $canSignup}
      <p class="muted rise" style="--d: 3">No account? <a href="/signup" on:click|preventDefault={() => navigate('/signup')}>Sign up</a></p>
    {/if}
  </section>
{/if}