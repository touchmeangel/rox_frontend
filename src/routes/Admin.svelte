<script lang="ts">
  import { openSignup, closeSignup } from '../lib/api/admin';
  import { ApiError } from '../lib/http';

  let loading = false;
  let error: string | null = null;
  let message: string | null = null;

  async function run(action: () => Promise<void>, successMessage: string): Promise<void> {
    loading = true;
    error = null;
    message = null;
    try {
      await action();
      message = successMessage;
    } catch (err) {
      error = err instanceof ApiError ? err.message : 'Action failed.';
    } finally {
      loading = false;
    }
  }
</script>

<h1>Admin</h1>

<button disabled={loading} on:click={() => run(openSignup, 'Signup opened.')}>Open signup</button>
<button disabled={loading} on:click={() => run(closeSignup, 'Signup closed.')}>Close signup</button>

{#if message}<p>{message}</p>{/if}
{#if error}<p class="error">{error}</p>{/if}

<style>
  .error { color: #b00020; }
</style>