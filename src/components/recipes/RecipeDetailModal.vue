<script setup>
/**
 * RecipeDetailModal — Organisme modale de détail d'une recette
 */
import { computed } from 'vue'
import KuboIcon from '@/components/ui/KuboIcon.vue'
import KuboTag from '@/components/ui/KuboTag.vue'
import KuboButton from '@/components/ui/KuboButton.vue'
import MacroBar from '@/components/recipes/MacroBar.vue'

const props = defineProps({
  recipe: { type: Object, default: null },
  selected: { type: Boolean, default: false },
})
defineEmits(['close', 'toggle'])

const macroTotal = computed(() => {
  if (!props.recipe) return 1
  return props.recipe.prot + props.recipe.fat + props.recipe.carb || 1
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="recipe"
        class="rdm-overlay"
        data-testid="recipe-detail-modal"
        @click.self="$emit('close')"
      >
        <div class="rdm">
          <!-- Close -->
          <button class="rdm__close" data-testid="modal-close-btn" @click="$emit('close')">
            <KuboIcon name="x" :size="20" />
          </button>

          <!-- Left — image -->
          <div class="rdm__img-col">
            <img :src="recipe.img" :alt="recipe.title" class="rdm__img" />
            <div class="rdm__tags-overlay">
              <KuboTag v-for="tag in recipe.tags" :key="tag" :label="tag" />
            </div>
          </div>

          <!-- Right — content -->
          <div class="rdm__content custom-scrollbar">
            <div class="rdm__inner">
              <h2 class="rdm__title">{{ recipe.title }}</h2>
              <p class="rdm__sub">{{ recipe.sub }}</p>

              <!-- Stats -->
              <div class="rdm__stats">
                <div class="rdm__stat">
                  <KuboIcon name="flame" :size="16" class="rdm__stat-icon rdm__stat-icon--green" />
                  <span>{{ recipe.kcal }} kcal</span>
                </div>
                <div class="rdm__stat">
                  <KuboIcon name="clock" :size="16" class="rdm__stat-icon" />
                  <span>{{ recipe.time }} min</span>
                </div>
                <div class="rdm__stat">
                  <KuboIcon name="chef-hat" :size="16" class="rdm__stat-icon" />
                  <span>{{ recipe.difficulty }}</span>
                </div>
              </div>

              <!-- Macros -->
              <div class="rdm__macros">
                <p class="rdm__macros-title"><KuboIcon name="pie-chart" :size="12" /> Macros</p>
                <div class="rdm__macros-bars">
                  <MacroBar label="Protéines" :value="recipe.prot" :max="macroTotal" color="blue" />
                  <MacroBar label="Lipides" :value="recipe.fat" :max="macroTotal" color="orange" />
                  <MacroBar label="Glucides" :value="recipe.carb" :max="macroTotal" color="green" />
                </div>
              </div>

              <!-- Ingredients -->
              <section class="rdm__section">
                <h3 class="rdm__section-title">
                  <KuboIcon name="list-checks" :size="18" class="rdm__section-icon" />
                  Ingrédients
                </h3>
                <div class="rdm__ingredients">
                  <label v-for="ing in recipe.ingredients" :key="ing.name" class="rdm__ingredient">
                    <input type="checkbox" class="rdm__ing-check" />
                    <span class="rdm__ing-name">{{ ing.name }}</span>
                    <span v-if="ing.qty" class="rdm__ing-qty">{{ ing.qty }}</span>
                  </label>
                </div>
              </section>

              <!-- Steps -->
              <section class="rdm__section">
                <h3 class="rdm__section-title">
                  <KuboIcon name="chef-hat" :size="18" class="rdm__section-icon" />
                  Préparation
                </h3>
                <div class="rdm__steps">
                  <div v-for="(step, i) in recipe.steps" :key="i" class="rdm__step">
                    <div class="rdm__step-num">{{ i + 1 }}</div>
                    <p class="rdm__step-text">{{ step }}</p>
                  </div>
                </div>
              </section>

              <!-- CTA -->
              <div class="rdm__cta">
                <KuboButton
                  :variant="selected ? 'dark' : 'primary'"
                  size="lg"
                  :full-width="true"
                  data-testid="modal-toggle-btn"
                  @click="$emit('toggle')"
                >
                  {{ selected ? 'Retirer du menu' : 'Ajouter à ma semaine' }}
                </KuboButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.rdm-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(8px);
}

.rdm {
  position: relative;
  width: 100%;
  max-width: 960px;
  height: 100%;
  max-height: 88vh;
  background: var(--kubo-surface);
  border-radius: var(--radius-3xl);
  box-shadow: var(--shadow-lg);
  display: flex;
  overflow: hidden;
}

.rdm__close {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 10;
  padding: 8px;
  border: none;
  background: var(--kubo-surface-mute);
  border-radius: var(--radius-sm);
  color: var(--kubo-text-muted);
  cursor: pointer;
  transition: all var(--transition-base);
}
.rdm__close:hover {
  background: var(--kubo-surface-soft);
  color: var(--kubo-text);
}

/* Image column */
.rdm__img-col {
  flex: 1;
  position: relative;
  background: var(--kubo-surface-mute);
  min-height: 280px;
  display: none;
}
@media (min-width: 768px) {
  .rdm__img-col {
    display: block;
  }
}
.rdm__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.rdm__tags-overlay {
  position: absolute;
  top: 24px;
  left: 24px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

/* Content column */
.rdm__content {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}
.rdm__inner {
  padding: 40px;
  display: flex;
  flex-direction: column;
  gap: 28px;
  min-height: 100%;
}

.rdm__title {
  font-size: 26px;
  font-weight: 800;
  line-height: 1.2;
  color: var(--kubo-text);
}
.rdm__sub {
  font-size: 13px;
  font-weight: 700;
  font-style: italic;
  color: var(--kubo-text-muted);
}

/* Stats */
.rdm__stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}
.rdm__stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 14px 10px;
  background: var(--kubo-surface-mute);
  border-radius: var(--radius-xl);
  font-size: 12px;
  font-weight: 800;
  color: var(--kubo-text);
  text-align: center;
}
.rdm__stat-icon {
  color: var(--kubo-text-muted);
}
.rdm__stat-icon--green {
  color: var(--kubo-green);
}

/* Macros */
.rdm__macros {
  background: var(--kubo-surface-mute);
  border-radius: var(--radius-xl);
  padding: 20px;
  border: 1px solid var(--kubo-border);
}
.rdm__macros-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--kubo-text-muted);
  margin-bottom: 16px;
}
.rdm__macros-bars {
  display: flex;
  gap: 16px;
}

/* Section */
.rdm__section {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.rdm__section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 17px;
  font-weight: 800;
  color: var(--kubo-text);
}
.rdm__section-icon {
  color: var(--kubo-green);
}

/* Ingredients */
.rdm__ingredients {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}
@media (max-width: 480px) {
  .rdm__ingredients {
    grid-template-columns: 1fr;
  }
}
.rdm__ingredient {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  background: var(--kubo-surface-mute);
  border-radius: var(--radius-md);
  border: 1px solid transparent;
  cursor: pointer;
  transition: border-color var(--transition-base);
}
.rdm__ingredient:hover {
  border-color: var(--kubo-border-mid);
}
.rdm__ing-check {
  accent-color: var(--kubo-green);
  cursor: pointer;
  width: 16px;
  height: 16px;
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
  color: var(--kubo-text-muted);
  white-space: nowrap;
}

/* Steps */
.rdm__steps {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.rdm__step {
  display: flex;
  gap: 16px;
}
.rdm__step-num {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--kubo-green);
  color: #fff;
  font-size: 12px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4px 10px var(--kubo-green-shadow);
}
.rdm__step-text {
  font-size: 13px;
  font-weight: 600;
  color: var(--kubo-text-muted);
  line-height: 1.7;
  padding-top: 6px;
}

/* CTA */
.rdm__cta {
  margin-top: auto;
  padding-top: 20px;
  border-top: 1px solid var(--kubo-border);
}

/* Transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}
.modal-enter-active .rdm,
.modal-leave-active .rdm {
  transition:
    transform 0.3s ease,
    opacity 0.3s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from .rdm,
.modal-leave-to .rdm {
  transform: scale(0.95);
  opacity: 0;
}
</style>
