<script setup>
/**
 * MacroBar — Molécule affichage d'un macro-nutriment
 */
import { computed } from 'vue'

const props = defineProps({
  label: { type: String, required: true },
  value: { type: Number, required: true },
  max: { type: Number, required: true },
  color: { type: String, default: 'blue' },
})

const percent = computed(() => {
  if (!props.max) return 0
  return Math.min(100, Math.round((props.value / props.max) * 100))
})
</script>

<template>
  <div class="macro-bar">
    <p class="macro-bar__label">{{ label }}</p>
    <div class="macro-bar__track">
      <div
        :class="['macro-bar__fill', `macro-bar__fill--${color}`]"
        :style="{ width: percent + '%' }"
      />
    </div>
    <p class="macro-bar__value">{{ value }}g</p>
  </div>
</template>

<style scoped>
.macro-bar {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}
.macro-bar__label {
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--kubo-text-muted);
}
.macro-bar__track {
  height: 8px;
  background: var(--kubo-surface-mute);
  border-radius: 99px;
  overflow: hidden;
}
.macro-bar__fill {
  height: 100%;
  border-radius: 99px;
  transition: width 0.7s ease;
}
.macro-bar__fill--blue {
  background: var(--kubo-prot);
}
.macro-bar__fill--orange {
  background: var(--kubo-fat);
}
.macro-bar__fill--green {
  background: var(--kubo-carb);
}
.macro-bar__value {
  font-size: 12px;
  font-weight: 800;
  color: var(--kubo-text);
}
</style>
