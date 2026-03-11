<script setup>
/**
 * KuboProgressBar — Atome barre de progression
 */
defineProps({
  value: { type: Number, default: 0 }, // 0–100
  color: { type: String, default: 'green' }, // green | blue | orange
  thin: { type: Boolean, default: false },
})
</script>

<template>
  <div :class="['kpb', { 'kpb--thin': thin }]">
    <div
      :class="['kpb__fill', `kpb__fill--${color}`]"
      :style="{ width: `${Math.min(100, Math.max(0, value))}%` }"
    />
  </div>
</template>

<style scoped>
.kpb {
  width: 100%;
  height: 6px;
  background: var(--kubo-surface-mute);
  border-radius: 99px;
  overflow: hidden;
}

.kpb--thin {
  height: 4px;
}

.kpb__fill {
  height: 100%;
  border-radius: 99px;
  transition: width 0.7s ease;
}

.kpb__fill--green {
  background: var(--kubo-green);
}

.kpb__fill--blue {
  background: var(--kubo-prot);
}

.kpb__fill--orange {
  background: var(--kubo-fat);
}

.kpb__fill--emerald {
  background: #10b981;
}
</style>
