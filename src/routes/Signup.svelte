<script lang="ts">
  import { onMount } from 'svelte';
  import { signup } from '../lib/api/auth';
  import { ApiError } from '../lib/http';
  import { navigate } from '../lib/router';
  import { statusStore, loadStatus, canSignup, canLogin } from '../lib/stores/signupStatus';

  let email = '';
  let username = '';
  let password = '';
  let loading = false;
  let error: string | null = null;

  onMount(() => loadStatus());

  $: if ($statusStore.mode && !$canSignup) navigate('/login');

  async function handleSubmit(): Promise<void> {
    error = null;
    loading = true;
    try {
      await signup({ email, username, password });
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
{:else if $canSignup}
  <h1>{$statusStore.mode === 'bootstrap' ? 'Create admin account' : 'Sign up'}</h1>
  <form on:submit|preventDefault={handleSubmit}>
    <label>Email<input type="email" bind:value={email} required autocomplete="email" /></label>
    <label>Username<input type="text" bind:value={username} required autocomplete="username" /></label>
    <label>Password<input type="password" bind:value={password} required autocomplete="new-password" /></label>
    {#if error}<p class="error">{error}</p>{/if}
    <button type="submit" disabled={loading}>{loading ? 'Creating account…' : 'Sign up'}</button>
  </form>
  {#if $canLogin}
    <p>Already have an account? <a href="/login" on:click|preventDefault={() => navigate('/login')}>Log in</a></p>
  {/if}
{/if}

<style>
  form { display: flex; flex-direction: column; gap: 0.75rem; max-width: 320px; }
  label { display: flex; flex-direction: column; gap: 0.25rem; }
  .error { color: #b00020; }
</style>