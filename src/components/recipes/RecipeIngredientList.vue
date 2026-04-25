<script setup lang="ts">
/**
 * RecipeIngredientList — Liste des ingrédients avec pictogrammes de saisonnalité
 */
import KuboIcon from '@/components/ui/KuboIcon.vue'
import type { Ingredient, SeasonStatus } from '@/types/recipe'

defineProps<{
  ingredients: Ingredient[]
  loading?: boolean
}>()

const seasonTooltip: Record<SeasonStatus, string> = {
  in: 'De saison ce mois-ci',
  ending: 'De saison ce mois-ci, mais plus le mois prochain',
  starting: 'Pas encore en saison, mais le sera le mois prochain',
  out: 'Hors saison',
}
</script>

<template>
  <section class="rdm__section">
    <h3 class="rdm__section-title">
      <KuboIcon name="list-checks" :size="16" class="rdm__section-icon" />
      Ingrédients
    </h3>
    <div v-if="!loading && ingredients.length === 0" class="rdm__ingredients">
      <div v-for="n in 6" :key="n" class="rdm__skeleton rdm__skeleton--ingredient" />
    </div>
    <div v-else class="rdm__ingredients">
      <div v-for="ing in ingredients" :key="ing.name" class="rdm__ingredient">
        <div class="rdm__ing-icon">
          <KuboIcon name="package" :size="14" />
        </div>
        <span class="rdm__ing-name">{{ ing.name }}</span>
        <span
          v-if="ing.seasonStatus"
          :class="['rdm__season-icon', `rdm__season-icon--${ing.seasonStatus}`]"
          :data-tooltip="seasonTooltip[ing.seasonStatus]"
        >
          <KuboIcon name="leaf" :size="12" />
        </span>
        <span v-if="ing.qty" class="rdm__ing-qty">{{ ing.qty }}</span>
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

.rdm__ingredients {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}
@media (max-width: 420px) {
  .rdm__ingredients {
    grid-template-columns: 1fr;
  }
}

.rdm__ingredient {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: var(--kubo-surface-mute);
  border-radius: var(--radius-md);
  border: 1px solid transparent;
  transition: border-color var(--transition-base);
}
.rdm__ingredient:hover {
  border-color: var(--kubo-border-mid);
}

.rdm__ing-icon {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-xs);
  background: var(--kubo-green-light);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--kubo-green);
  flex-shrink: 0;
}

.rdm__ing-name {
  font-size: 12px;
  font-weight: 700;
  color: var(--kubo-text);
  flex: 1;
}

.rdm__ing-qty {
  font-size: 10px;
  font-weight: 800;
  color: var(--kubo-green);
  background: var(--kubo-green-light);
  padding: 2px 7px;
  border-radius: var(--radius-xs);
  white-space: nowrap;
}

/* Pictogramme saisonnalité */
.rdm__season-icon {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  flex-shrink: 0;
  cursor: default;
}

.rdm__season-icon--in {
  color: #065f46;
  background: #d1fae5;
}
.rdm__season-icon--ending {
  color: #92400e;
  background: #fef3c7;
}
.rdm__season-icon--starting {
  color: #1e40af;
  background: #dbeafe;
}
.rdm__season-icon--out {
  color: #991b1b;
  background: #fee2e2;
}

.rdm__season-icon::after {
  content: attr(data-tooltip);
  position: absolute;
  bottom: calc(100% + 6px);
  left: 50%;
  transform: translateX(-50%);
  white-space: nowrap;
  background: var(--kubo-text);
  color: var(--kubo-surface);
  font-size: 10px;
  font-weight: 700;
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.15s ease;
  z-index: 10;
}
.rdm__season-icon::before {
  content: '';
  position: absolute;
  bottom: calc(100% + 2px);
  left: 50%;
  transform: translateX(-50%);
  border: 4px solid transparent;
  border-top-color: var(--kubo-text);
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.15s ease;
  z-index: 10;
}
.rdm__season-icon:hover::after,
.rdm__season-icon:hover::before {
  opacity: 1;
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

.rdm__skeleton--ingredient {
  height: 50px;
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
