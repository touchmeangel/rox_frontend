<script lang="ts">
  import { onMount } from 'svelte';
  import { login } from '../lib/api/auth';
  import { ApiError } from '../lib/http';
  import { navigate } from '../lib/router';
  import { statusStore, loadStatus, canLogin, canSignup } from '../lib/stores/signupStatus';

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
  <p>Loading…</p>
{:else if $statusStore.error}
  <p class="error">{$statusStore.error}</p>
{:else if $canLogin}
  <h1>Log in</h1>
  <form on:submit|preventDefault={handleSubmit}>
    <label>Email<input type="email" bind:value={email} required autocomplete="email" /></label>
    <label>Password<input type="password" bind:value={password} required autocomplete="current-password" /></label>
    {#if error}<p class="error">{error}</p>{/if}
    <button type="submit" disabled={loading}>{loading ? 'Logging in…' : 'Log in'}</button>
  </form>
  {#if $canSignup}
    <p>No account? <a href="/signup" on:click|preventDefault={() => navigate('/signup')}>Sign up</a></p>
  {/if}
{/if}

<style>
  form { display: flex; flex-direction: column; gap: 0.75rem; max-width: 320px; }
  label { display: flex; flex-direction: column; gap: 0.25rem; }
  .error { color: #b00020; }
</style>