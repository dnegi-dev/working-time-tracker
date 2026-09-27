<script lang="ts">
  import { useUi } from '../state/context.svelte.ts';

  const ui = useUi();
</script>

{#if ui.toast}
  <div role="status" data-testid="toast">{ui.toast}</div>
{/if}

<style>
  div {
    position: fixed;
    left: 50%;
    bottom: calc(84px + env(safe-area-inset-bottom));
    transform: translateX(-50%);
    background: var(--text);
    color: var(--bg);
    padding: 10px 16px;
    border-radius: 999px;
    font-size: 0.9rem;
    z-index: 20;
    max-width: calc(100% - 32px);
  }
</style>
