<script lang="ts">
  import { navigate } from '../lib/router';
</script>

<section class="hero wrap">
  <h1 class="rise">404</h1>
  <p class="sub rise" style="--d: 1">This page doesn't exist.</p>
  <a class="btn primary rise" style="--d: 2" href="/runs" on:click|preventDefault={() => navigate('/runs')}>Back to runs</a>
</section>