<script lang="ts">
  import { currentUser } from '../lib/stores/auth';
  import { setSignupMode } from '../lib/api/admin';
  import { changePassword } from '../lib/api/account';
  import { ApiError } from '../lib/http';

  let signupLoading = false;
  let signupError: string | null = null;
  let signupMessage: string | null = null;

  async function toggleSignup(open: boolean): Promise<void> {
    signupLoading = true;
    signupError = null;
    signupMessage = null;
    try {
      await setSignupMode(open);
      signupMessage = open ? 'Signup opened.' : 'Signup closed.';
    } catch (err) {
      signupError = err instanceof ApiError ? err.message : 'Action failed.';
    } finally {
      signupLoading = false;
    }
  }

  let oldPassword = '';
  let newPassword = '';
  let confirmPassword = '';
  let revokeOtherSessions = true;
  let passwordLoading = false;
  let passwordError: string | null = null;
  let passwordMessage: string | null = null;

  async function handleChangePassword(): Promise<void> {
    passwordError = null;
    passwordMessage = null;

    if (newPassword !== confirmPassword) {
      passwordError = 'New passwords do not match.';
      return;
    }

    passwordLoading = true;
    try {
      await changePassword({
        old_password: oldPassword,
        new_password: newPassword,
        revoke_other_sessions: revokeOtherSessions,
      });
      passwordMessage = revokeOtherSessions
        ? 'Password changed. Other sessions have been logged out.'
        : 'Password changed.';
      oldPassword = '';
      newPassword = '';
      confirmPassword = '';
    } catch (err) {
      passwordError = err instanceof ApiError ? err.message : 'Failed to change password.';
    } finally {
      passwordLoading = false;
    }
  }
</script>

<h1>Settings</h1>

<section>
  <h2>Profile</h2>
  <p>Username: {$currentUser?.username ?? '—'}</p>
</section>

<section>
  <h2>Change password</h2>
  <form on:submit|preventDefault={handleChangePassword}>
    <label>
      Current password
      <input type="password" bind:value={oldPassword} required autocomplete="current-password" />
    </label>
    <label>
      New password
      <input type="password" bind:value={newPassword} required autocomplete="new-password" />
    </label>
    <label>
      Confirm new password
      <input type="password" bind:value={confirmPassword} required autocomplete="new-password" />
    </label>
    <label class="checkbox">
      <input type="checkbox" bind:checked={revokeOtherSessions} />
      Log out other devices
    </label>
    {#if passwordError}<p class="error">{passwordError}</p>{/if}
    {#if passwordMessage}<p>{passwordMessage}</p>{/if}
    <button type="submit" disabled={passwordLoading}>
      {passwordLoading ? 'Updating…' : 'Change password'}
    </button>
  </form>
</section>

{#if $currentUser?.roles?.includes('admin')}
  <section>
    <h2>Signup</h2>
    <button disabled={signupLoading} on:click={() => toggleSignup(true)}>Open signup</button>
    <button disabled={signupLoading} on:click={() => toggleSignup(false)}>Close signup</button>
    {#if signupMessage}<p>{signupMessage}</p>{/if}
    {#if signupError}<p class="error">{signupError}</p>{/if}
  </section>
{/if}

<style>
  section { margin-bottom: 1.5rem; }
  form { display: flex; flex-direction: column; gap: 0.75rem; max-width: 320px; }
  label { display: flex; flex-direction: column; gap: 0.25rem; }
  label.checkbox { flex-direction: row; align-items: center; gap: 0.5rem; }
  .error { color: #b00020; }
</style>