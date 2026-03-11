<script setup>
/**
 * NutritionLegendItem — Molécule ligne de légende du graphe nutritionnel
 */
import KuboIcon from '@/components/ui/KuboIcon.vue'

defineProps({
  label: { type: String, required: true },
  percent: { type: Number, required: true },
  grams: { type: Number, required: true },
  icon: { type: String, required: true },
  color: { type: String, required: true }, // hex
})
</script>

<template>
  <div class="nli">
    <div class="nli__icon" :style="{ color: color }">
      <KuboIcon :name="icon" :size="16" />
    </div>
    <span class="nli__label">{{ label }}</span>
    <div class="nli__values">
      <span class="nli__pct">{{ percent }}%</span>
      <span class="nli__g">{{ grams }}g</span>
    </div>
  </div>
</template>

<style scoped>
.nli {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: var(--kubo-surface-mute);
  border: 1px solid transparent;
  border-radius: var(--radius-lg);
  transition: border-color var(--transition-base);
  cursor: default;
}
.nli:hover {
  border-color: var(--kubo-border-mid);
}
.nli__icon {
  width: 32px;
  height: 32px;
  background: var(--kubo-surface);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-card);
  flex-shrink: 0;
}
.nli__label {
  font-size: 12px;
  font-weight: 700;
  color: var(--kubo-text-muted);
  flex: 1;
}
.nli__values {
  text-align: right;
}
.nli__pct {
  display: block;
  font-size: 14px;
  font-weight: 800;
  color: var(--kubo-text);
}
.nli__g {
  display: block;
  font-size: 9px;
  font-weight: 700;
  color: var(--kubo-text-muted);
}
</style>
