<script setup lang="ts">
/**
 * RecipeStepList — Liste des étapes de préparation
 */
import KuboIcon from '@/components/ui/KuboIcon.vue'
import type { Step } from '@/types/recipe'

defineProps<{
  steps: Step[]
  loading?: boolean
}>()
</script>

<template>
  <section class="rdm__section">
    <h3 class="rdm__section-title">
      <KuboIcon name="chef-hat" :size="16" class="rdm__section-icon" />
      Préparation
    </h3>
    <div v-if="!loading && steps.length === 0" class="rdm__steps">
      <div v-for="n in 2" :key="n" class="rdm__step-block">
        <div class="rdm__skeleton rdm__skeleton--step-header" />
        <div class="rdm__step-instructions">
          <div class="rdm__skeleton rdm__skeleton--step-text" />
          <div class="rdm__skeleton rdm__skeleton--step-text" />
        </div>
      </div>
    </div>
    <div v-else class="rdm__steps">
      <div v-for="step in steps" :key="step.numero" class="rdm__step-block">
        <div class="rdm__step-header">
          <div class="rdm__step-num">{{ step.numero }}</div>
          <span class="rdm__step-label">Étape {{ step.numero }}</span>
        </div>
        <ul class="rdm__step-instructions">
          <li v-for="(instruction, i) in step.instructions" :key="i" class="rdm__step-instruction">
            {{ instruction }}
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>

<style scoped>
.rdm__section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.rdm__section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 800;
  color: var(--kubo-text);
}

.rdm__section-icon {
  color: var(--kubo-green);
}

.rdm__steps {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.rdm__step-block {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.rdm__step-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.rdm__step-num {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--kubo-green);
  color: #fff;
  font-size: 11px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 3px 8px var(--kubo-green-shadow);
}

.rdm__step-label {
  font-size: 13px;
  font-weight: 800;
  color: var(--kubo-text);
}

.rdm__step-instructions {
  list-style: none;
  padding: 0;
  margin: 0 0 0 38px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.rdm__step-instruction {
  font-size: 13px;
  font-weight: 500;
  color: var(--kubo-text-muted);
  line-height: 1.65;
  padding-left: 14px;
  position: relative;
}
.rdm__step-instruction::before {
  content: '';
  position: absolute;
  left: 0;
  top: 9px;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--kubo-border-mid);
}

/* Skeleton */
.rdm__skeleton {
  background: linear-gradient(
    90deg,
    var(--kubo-surface-mute) 25%,
    var(--kubo-border) 50%,
    var(--kubo-surface-mute) 75%
  );
  background-size: 800px 100%;
  animation: shimmer 1.4s ease-in-out infinite;
  border-radius: var(--radius-md);
}

.rdm__skeleton--step-header {
  width: 90px;
  height: 28px;
  border-radius: var(--radius-md);
}

.rdm__skeleton--step-text {
  height: 40px;
  border-radius: var(--radius-md);
  margin-left: 38px;
}

@keyframes shimmer {
  0% {
    background-position: -400px 0;
  }
  100% {
    background-position: 400px 0;
  }
}
</style>
