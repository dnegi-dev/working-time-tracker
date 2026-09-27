<script lang="ts">
  let { value, max, label }: { value: number; max: number; label: string } = $props();
  const pct = $derived(max > 0 ? Math.min(100, (value / max) * 100) : 100);
</script>

<div class="track" role="progressbar" aria-label={label} aria-valuenow={value} aria-valuemax={max}>
  <div class="fill" style:width={`${pct}%`}></div>
</div>

<style>
  .track {
    height: 8px;
    border-radius: 99px;
    background: var(--line);
    overflow: hidden;
  }
  .fill {
    height: 100%;
    background: var(--accent);
  }
</style>
