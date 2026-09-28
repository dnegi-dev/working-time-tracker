<script lang="ts">
  /** Water rising inside a bubble; `level` 0–1, the surface waves while `moving`. */
  let { level, moving }: { level: number; moving: boolean } = $props();
</script>

<div class="water" style:height="{level * 100}%">
  {#if level > 0}
    <svg
      class="wave"
      class:moving
      viewBox="0 0 200 10"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path d="M0 5Q25 0 50 5T100 5T150 5T200 5V10H0Z" />
    </svg>
  {/if}
</div>

<style>
  .water {
    position: absolute;
    inset: auto 0 0;
    background: color-mix(in srgb, var(--tone) 26%, var(--surface));
    transition:
      height 1.2s ease,
      background-color 0.5s;
  }
  .wave {
    position: absolute;
    bottom: 100%;
    left: 0;
    width: 200%;
    height: 8px;
    fill: color-mix(in srgb, var(--tone) 26%, var(--surface));
  }
  .moving {
    animation: wave 3s linear infinite;
  }
  @keyframes wave {
    to {
      transform: translateX(-50%);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .moving {
      animation: none;
    }
  }
</style>
