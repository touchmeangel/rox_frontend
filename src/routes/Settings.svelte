<script lang="ts">
  import { currentUser } from '../lib/stores/auth';
  import { statusStore } from '../lib/stores/signupStatus';
  import { setSignupMode } from '../lib/api/admin';
  import { changePassword } from '../lib/api/account';
  import { ApiError } from '../lib/http';
  import { spotlight } from '../lib/ui';

  let signupLoading = false;
  let signupError: string | null = null;
  let signupMessage: string | null = null;

  $: signupOpen = $statusStore.mode === 'open';

  async function toggleSignup(open: boolean): Promise<void> {
    signupLoading = true;
    signupError = null;
    signupMessage = null;
    try {
      await setSignupMode(open);
      statusStore.update((s) => ({ ...s, mode: open ? 'open' : 'invite_only' }));
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

<section class="wrap narrow page">
  <h1 class="title">Settings</h1>

  <div class="card spot panel" use:spotlight>
    <h2>Profile</h2>
    <p class="muted">Username: <span class="val">{$currentUser?.username ?? '—'}</span></p>
  </div>

  <form class="card spot panel stack" use:spotlight on:submit|preventDefault={handleChangePassword}>
    <h2>Change password</h2>
    <label>Current password<input type="password" bind:value={oldPassword} required autocomplete="current-password" /></label>
    <label>New password<input type="password" bind:value={newPassword} required autocomplete="new-password" /></label>
    <label>Confirm new password<input type="password" bind:value={confirmPassword} required autocomplete="new-password" /></label>
    <label class="check"><input type="checkbox" bind:checked={revokeOtherSessions} />Log out other devices</label>
    {#if passwordError}<p class="err">{passwordError}</p>{/if}
    {#if passwordMessage}<p class="good">{passwordMessage}</p>{/if}
    <div>
      <button class="primary" type="submit" disabled={passwordLoading}>{passwordLoading ? 'Updating…' : 'Change password'}</button>
    </div>
  </form>

  {#if $currentUser?.roles?.includes('admin')}
    <div class="card spot panel stack" use:spotlight>
      <div class="split">
        <div class="stack" style="gap: 0.25rem">
          <h2>Open signup</h2>
          <p class="muted">Let new people create their own accounts.</p>
        </div>
        <button
          class="switch"
          class:on={signupOpen}
          role="switch"
          aria-checked={signupOpen}
          aria-label="Open signup"
          disabled={signupLoading || $statusStore.mode === null}
          on:click={() => toggleSignup(!signupOpen)}
        ><i></i></button>
      </div>
      {#if signupMessage}<p class="good">{signupMessage}</p>{/if}
      {#if signupError}<p class="err">{signupError}</p>{/if}
    </div>
  {/if}
</section>

<style>
  .page { display: flex; flex-direction: column; gap: 1.25rem; }
  .page h1 { margin-bottom: 1.25rem; }
  .panel { padding: 1.5rem; }
  .panel h2 { margin-bottom: 0.5rem; }
  .panel.stack h2 { margin-bottom: 0; }
  .val { color: #fff; }
  .split { display: flex; justify-content: space-between; align-items: center; gap: 1rem; }

  .switch { position: relative; flex: none; width: 46px; height: 26px; padding: 0; background: transparent; }
  .switch i { position: absolute; top: 3px; left: 3px; width: 18px; height: 18px; border-radius: 50%; background: #777; transition: left 0.2s, background 0.2s; }
  .switch.on { background: #fff; border-color: #fff; }
  .switch.on i { left: 23px; background: #000; }
</style>