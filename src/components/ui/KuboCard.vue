<script setup lang="ts">
/**
 * KuboCard — Atome carte de surface avec shadow
 */
withDefaults(
  defineProps<{
    rounded?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'
    dark?: boolean
    noPad?: boolean
  }>(),
  {
    rounded: '2xl',
    dark: false,
    noPad: false,
  },
)
</script>

<template>
  <div
    :class="[
      'kubo-card',
      `kubo-card--r${rounded}`,
      { 'kubo-card--dark': dark, 'kubo-card--nopad': noPad },
    ]"
  >
    <slot />
  </div>
</template>

<style scoped>
.kubo-card {
  background: var(--kubo-surface);
  border: 1px solid var(--kubo-border);
  box-shadow: var(--shadow-card);
  padding: 32px;
}

.kubo-card--nopad {
  padding: 0;
}

.kubo-card--dark {
  background: var(--kubo-surface-inv);
  color: var(--kubo-surface);
  border-color: transparent;
  box-shadow: var(--shadow-lg);
}

.kubo-card--rsm {
  border-radius: var(--radius-sm);
}

.kubo-card--rmd {
  border-radius: var(--radius-md);
}

.kubo-card--rlg {
  border-radius: var(--radius-lg);
}

.kubo-card--rxl {
  border-radius: var(--radius-xl);
}

.kubo-card--r2xl {
  border-radius: var(--radius-2xl);
}

.kubo-card--r3xl {
  border-radius: var(--radius-3xl);
}
</style>
