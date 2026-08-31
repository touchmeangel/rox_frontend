<script lang="ts">
  import { currentUser } from '../lib/stores/auth';
  import { setSignupMode } from '../lib/api/admin';
  import { ApiError } from '../lib/http';

  let loading = false;
  let error: string | null = null;
  let message: string | null = null;

  async function toggleSignup(open: boolean): Promise<void> {
    loading = true;
    error = null;
    message = null;
    try {
      await setSignupMode(open);
      message = open ? 'Signup opened.' : 'Signup closed.';
    } catch (err) {
      error = err instanceof ApiError ? err.message : 'Action failed.';
    } finally {
      loading = false;
    }
  }
</script>

<h1>Settings</h1>

<section>
  <h2>Profile</h2>
  <p>Username: {$currentUser?.username ?? '—'}</p>
  <p>Email: {$currentUser?.email ?? '—'}</p>
</section>

{#if $currentUser?.roles?.includes('admin')}
  <section>
    <h2>Signup</h2>
    <button disabled={loading} on:click={() => toggleSignup(true)}>Open signup</button>
    <button disabled={loading} on:click={() => toggleSignup(false)}>Close signup</button>
    {#if message}<p>{message}</p>{/if}
    {#if error}<p class="error">{error}</p>{/if}
  </section>
{/if}

<style>
  section { margin-bottom: 1.5rem; }
  .error { color: #b00020; }
</style>