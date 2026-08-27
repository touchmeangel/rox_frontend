<script lang="ts">
  import { signup } from '../lib/api/auth';
  import { ApiError } from '../lib/http';
  import { navigate } from '../lib/router';

  let email = '';
  let username = '';
  let password = '';
  let loading = false;
  let error: string | null = null;

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

<h1>Sign up</h1>

<form on:submit|preventDefault={handleSubmit}>
  <label>
    Email
    <input type="email" bind:value={email} required autocomplete="email" />
  </label>
  <label>
    Username
    <input type="text" bind:value={username} required autocomplete="username" />
  </label>
  <label>
    Password
    <input type="password" bind:value={password} required autocomplete="new-password" />
  </label>
  {#if error}<p class="error">{error}</p>{/if}
  <button type="submit" disabled={loading}>{loading ? 'Creating account…' : 'Sign up'}</button>
</form>

<p>Already have an account? <a href="/login" on:click|preventDefault={() => navigate('/login')}>Log in</a></p>

<style>
  form { display: flex; flex-direction: column; gap: 0.75rem; max-width: 320px; }
  label { display: flex; flex-direction: column; gap: 0.25rem; }
  .error { color: #b00020; }
</style>