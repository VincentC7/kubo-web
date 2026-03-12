<script setup>
/**
 * PlanningCard — Molécule carte de plat dans le menu hebdo
 */
import KuboTag from '@/components/ui/KuboTag.vue'
import KuboIcon from '@/components/ui/KuboIcon.vue'
import KuboButton from '@/components/ui/KuboButton.vue'

defineProps({
  recipe: { type: Object, required: true },
  done: { type: Boolean, default: false },
})
defineEmits(['done', 'remove', 'open'])
</script>

<template>
  <article
    :class="['plan-card', { 'plan-card--done': done }]"
    :data-testid="`plan-card-${recipe.id}`"
  >
    <div class="plan-card__body" @click="$emit('open')">
      <h3 :class="['plan-card__title', { 'plan-card__title--done': done }]">
        {{ recipe.title }}
      </h3>
      <div class="plan-card__tags">
        <KuboTag v-for="tag in recipe.tags" :key="tag" :label="tag" />
      </div>
      <p class="plan-card__sub">{{ recipe.time }}min · {{ recipe.kcal }} kcal</p>
    </div>

    <div class="plan-card__actions">
      <KuboButton
        :variant="done ? 'secondary' : 'primary'"
        size="sm"
        data-testid="plan-card-done-btn"
        @click="$emit('done')"
      >
        {{ done ? 'Cuisiné ✓' : 'Marquer fait' }}
      </KuboButton>
      <button
        class="plan-card__remove"
        title="Retirer"
        data-testid="plan-card-remove-btn"
        @click="$emit('remove')"
      >
        <KuboIcon name="trash-2" :size="16" />
      </button>
    </div>
  </article>
</template>

<style scoped>
.plan-card {
  background: var(--kubo-surface);
  border: 1px solid var(--kubo-border);
  border-radius: var(--radius-2xl);
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: var(--shadow-card);
  transition:
    border-color var(--transition-base),
    opacity var(--transition-base);
}
.plan-card--done {
  border-color: var(--kubo-green);
  opacity: 0.65;
}

.plan-card__body {
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.plan-card__title {
  font-size: 15px;
  font-weight: 800;
  color: var(--kubo-text);
}
.plan-card__title--done {
  text-decoration: line-through;
  opacity: 0.5;
}
.plan-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.plan-card__sub {
  font-size: 11px;
  font-weight: 700;
  color: var(--kubo-text-muted);
}

.plan-card__actions {
  display: flex;
  gap: 8px;
  align-items: center;
}
.plan-card__remove {
  padding: 10px;
  border-radius: var(--radius-sm);
  border: none;
  background: var(--kubo-surface-mute);
  color: var(--kubo-text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-base);
}
.plan-card__remove:hover {
  background: #fef2f2;
  color: #dc2626;
}
</style>
