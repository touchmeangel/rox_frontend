<script lang="ts">
  import { onMount } from 'svelte';
  import { signup } from '../lib/api/auth';
  import { ApiError } from '../lib/http';
  import { navigate } from '../lib/router';
  import { statusStore, loadStatus, canSignup, canLogin } from '../lib/stores/signupStatus';
  import { spotlight } from '../lib/ui';

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
  <div class="hero"><p class="muted">Loading…</p></div>
{:else if $statusStore.error}
  <div class="hero"><p class="err">{$statusStore.error}</p></div>
{:else if $canSignup}
  <section class="hero wrap">
    <h1 class="rise">{$statusStore.mode === 'bootstrap' ? 'Create the admin account.' : 'Create your account.'}</h1>
    <p class="sub rise" style="--d: 1">
      {$statusStore.mode === 'bootstrap' ? 'This first account manages signups for everyone else.' : 'Upload a workspace and let the agent start digging.'}
    </p>
    <form class="card spot form stack rise" style="--d: 2" use:spotlight on:submit|preventDefault={handleSubmit}>
      <label>Email<input type="email" bind:value={email} required autocomplete="email" placeholder="you@company.com" /></label>
      <label>Username<input type="text" bind:value={username} required autocomplete="username" /></label>
      <label>Password<input type="password" bind:value={password} required autocomplete="new-password" /></label>
      {#if error}<p class="err">{error}</p>{/if}
      <button class="primary" type="submit" disabled={loading}>
        {loading ? 'Creating account…' : 'Sign up'}{#if !loading}<kbd>↵</kbd>{/if}
      </button>
    </form>
    {#if $canLogin}
      <p class="muted rise" style="--d: 3">Already have an account? <a href="/login" on:click|preventDefault={() => navigate('/login')}>Log in</a></p>
    {/if}
  </section>
{/if}