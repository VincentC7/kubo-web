<script setup lang="ts">
/**
 * RecipeDetailModal — Fiche recette verticale : hero image + contenu scrollable
 */
import { ref, computed, watch } from 'vue'
import KuboIcon from '@/components/ui/KuboIcon.vue'
import KuboTag from '@/components/ui/KuboTag.vue'
import KuboButton from '@/components/ui/KuboButton.vue'
import MacroBar from '@/components/recipes/MacroBar.vue'
import type { RecipeWithPrice } from '@/types/recipe'

const props = withDefaults(
  defineProps<{
    recipe: RecipeWithPrice | null
    selected?: boolean
    loading?: boolean
  }>(),
  { recipe: null, selected: false, loading: false },
)
defineEmits<{ close: []; toggle: [] }>()

const macroTotal = computed(() => {
  if (!props.recipe) return 1
  return props.recipe.prot + props.recipe.fat + props.recipe.carb || 1
})

const hasDetail = computed(() => !props.loading && (props.recipe?.ingredients?.length ?? 0) > 0)

const imgError = ref(false)
watch(
  () => props.recipe?.id,
  () => {
    imgError.value = false
  },
)
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
          <!-- ── Hero image ── -->
          <div class="rdm__hero">
            <img
              v-if="!imgError"
              :src="recipe.img"
              :alt="recipe.title"
              class="rdm__hero-img"
              @error="imgError = true"
            />
            <div v-else class="rdm__hero-fallback" aria-hidden="true">
              <KuboIcon name="chef-hat" :size="56" />
            </div>
            <div class="rdm__hero-gradient" />

            <!-- Titre sur l'image -->
            <div class="rdm__hero-caption">
              <div class="rdm__tags-row">
                <KuboTag v-for="tag in recipe.tags" :key="tag" :label="tag" />
              </div>
              <h2 class="rdm__title">{{ recipe.title }}</h2>
            </div>

            <!-- Bouton close -->
            <button class="rdm__close" data-testid="modal-close-btn" @click="$emit('close')">
              <KuboIcon name="x" :size="18" />
            </button>
          </div>

          <!-- ── Contenu scrollable ── -->
          <div class="rdm__body custom-scrollbar">
            <!-- Stats inline -->
            <div class="rdm__stats">
              <div class="rdm__stat">
                <KuboIcon name="clock" :size="14" class="rdm__stat-icon" />
                <div>
                  <span class="rdm__stat-label">Temps</span>
                  <span class="rdm__stat-value">{{ recipe.time }} min</span>
                </div>
              </div>
              <div class="rdm__stat-sep" />
              <div class="rdm__stat">
                <KuboIcon name="flame" :size="14" class="rdm__stat-icon rdm__stat-icon--green" />
                <div>
                  <span class="rdm__stat-label">Calories</span>
                  <span class="rdm__stat-value">
                    <template v-if="loading">
                      <span class="rdm__skeleton rdm__skeleton--inline" />
                    </template>
                    <template v-else>{{ recipe.kcal }} kcal</template>
                  </span>
                </div>
              </div>
              <div class="rdm__stat-sep" />
              <div class="rdm__stat">
                <KuboIcon name="chef-hat" :size="14" class="rdm__stat-icon" />
                <div>
                  <span class="rdm__stat-label">Difficulté</span>
                  <span class="rdm__stat-value">{{ recipe.difficulty }}</span>
                </div>
              </div>
              <div class="rdm__stat-sep" />
              <div class="rdm__stat">
                <KuboIcon name="banknote" :size="14" class="rdm__stat-icon rdm__stat-icon--amber" />
                <div>
                  <span class="rdm__stat-label">Prix est.</span>
                  <span class="rdm__stat-value">{{ recipe.totalPrice?.toFixed(2) }} €</span>
                </div>
              </div>
            </div>

            <!-- Description -->
            <p v-if="recipe.sub" class="rdm__desc">{{ recipe.sub }}</p>

            <!-- Macros -->
            <div class="rdm__macros">
              <p class="rdm__macros-title"><KuboIcon name="pie-chart" :size="12" /> Macros</p>
              <div v-if="loading" class="rdm__macros-bars">
                <div class="rdm__skeleton rdm__skeleton--bar" />
                <div class="rdm__skeleton rdm__skeleton--bar" />
                <div class="rdm__skeleton rdm__skeleton--bar" />
              </div>
              <div v-else class="rdm__macros-bars">
                <MacroBar label="Protéines" :value="recipe.prot" :max="macroTotal" color="blue" />
                <MacroBar label="Lipides" :value="recipe.fat" :max="macroTotal" color="orange" />
                <MacroBar label="Glucides" :value="recipe.carb" :max="macroTotal" color="green" />
              </div>
            </div>

            <!-- Ingrédients -->
            <section class="rdm__section">
              <h3 class="rdm__section-title">
                <KuboIcon name="list-checks" :size="16" class="rdm__section-icon" />
                Ingrédients
              </h3>
              <div v-if="!hasDetail" class="rdm__ingredients">
                <div v-for="n in 6" :key="n" class="rdm__skeleton rdm__skeleton--ingredient" />
              </div>
              <div v-else class="rdm__ingredients">
                <div v-for="ing in recipe.ingredients" :key="ing.name" class="rdm__ingredient">
                  <div class="rdm__ing-icon">
                    <KuboIcon name="package" :size="14" />
                  </div>
                  <span class="rdm__ing-name">{{ ing.name }}</span>
                  <span v-if="ing.qty" class="rdm__ing-qty">{{ ing.qty }}</span>
                </div>
              </div>
            </section>

            <!-- Étapes -->
            <section class="rdm__section">
              <h3 class="rdm__section-title">
                <KuboIcon name="chef-hat" :size="16" class="rdm__section-icon" />
                Préparation
              </h3>
              <div v-if="!hasDetail" class="rdm__steps">
                <div v-for="n in 2" :key="n" class="rdm__step-block">
                  <div class="rdm__skeleton rdm__skeleton--step-header" />
                  <div class="rdm__step-instructions">
                    <div class="rdm__skeleton rdm__skeleton--step-text" />
                    <div class="rdm__skeleton rdm__skeleton--step-text" />
                  </div>
                </div>
              </div>
              <div v-else class="rdm__steps">
                <div v-for="step in recipe.steps" :key="step.numero" class="rdm__step-block">
                  <div class="rdm__step-header">
                    <div class="rdm__step-num">{{ step.numero }}</div>
                    <span class="rdm__step-label">Étape {{ step.numero }}</span>
                  </div>
                  <ul class="rdm__step-instructions">
                    <li
                      v-for="(instruction, i) in step.instructions"
                      :key="i"
                      class="rdm__step-instruction"
                    >
                      {{ instruction }}
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            <!-- Spacer pour que le CTA sticky ne cache pas le dernier élément -->
            <div class="rdm__scroll-pad" />
          </div>

          <!-- ── CTA sticky ── -->
          <div class="rdm__cta">
            <KuboButton
              :variant="selected ? 'dark' : 'primary'"
              size="lg"
              :full-width="true"
              data-testid="modal-toggle-btn"
              @click="$emit('toggle')"
            >
              {{ selected ? 'Retirer du menu' : 'Ajouter au menu' }}
            </KuboButton>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* ── Overlay ── */
.rdm-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(15, 23, 42, 0.65);
  backdrop-filter: blur(8px);
}

/* ── Modale ── */
.rdm {
  position: relative;
  width: 100%;
  max-width: 580px;
  max-height: 90vh;
  background: var(--kubo-surface);
  border-radius: var(--radius-3xl);
  box-shadow: var(--shadow-lg);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ── Hero ── */
.rdm__hero {
  position: relative;
  height: 260px;
  flex-shrink: 0;
  background: var(--kubo-surface-mute);
}

.rdm__hero-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.rdm__hero-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--kubo-text-muted);
  background: var(--kubo-surface-mute);
}

.rdm__hero-gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to top,
    rgba(10, 15, 30, 0.82) 0%,
    rgba(10, 15, 30, 0.2) 55%,
    transparent 100%
  );
  pointer-events: none;
}

.rdm__hero-caption {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.rdm__tags-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}

.rdm__title {
  font-size: 22px;
  font-weight: 900;
  line-height: 1.2;
  letter-spacing: -0.02em;
  color: #fff;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
}

/* ── Bouton close ── */
.rdm__close {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.92);
  color: var(--kubo-text);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
  transition:
    background var(--transition-base),
    transform var(--transition-base);
}
.rdm__close:hover {
  background: #fff;
  transform: scale(1.08);
}

/* ── Corps scrollable ── */
.rdm__body {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 24px 24px 0;
}

.rdm__scroll-pad {
  height: 8px;
  flex-shrink: 0;
}

/* ── Stats ── */
.rdm__stats {
  display: flex;
  align-items: center;
  gap: 0;
  background: var(--kubo-surface-mute);
  border-radius: var(--radius-xl);
  border: 1px solid var(--kubo-border);
  padding: 14px 0;
}

.rdm__stat {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 16px;
}

.rdm__stat > div {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.rdm__stat-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--kubo-text-muted);
}

.rdm__stat-value {
  font-size: 13px;
  font-weight: 800;
  color: var(--kubo-text);
  display: flex;
  align-items: center;
}

.rdm__stat-sep {
  width: 1px;
  height: 32px;
  background: var(--kubo-border);
  flex-shrink: 0;
}

.rdm__stat-icon {
  color: var(--kubo-text-muted);
  flex-shrink: 0;
}
.rdm__stat-icon--green {
  color: var(--kubo-green);
}
.rdm__stat-icon--amber {
  color: #d97706;
}

/* ── Description ── */
.rdm__desc {
  font-size: 13px;
  font-weight: 500;
  color: var(--kubo-text-muted);
  line-height: 1.65;
}

/* ── Macros ── */
.rdm__macros {
  background: var(--kubo-surface-mute);
  border-radius: var(--radius-xl);
  padding: 18px;
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
  margin-bottom: 14px;
}

.rdm__macros-bars {
  display: flex;
  gap: 12px;
}

/* ── Sections ── */
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

/* ── Ingrédients ── */
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

/* ── Étapes ── */
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

/* ── CTA sticky ── */
.rdm__cta {
  padding: 16px 24px;
  background: var(--kubo-surface);
  border-top: 1px solid var(--kubo-border);
  flex-shrink: 0;
}

/* ── Skeleton shimmer ── */
@keyframes shimmer {
  0% {
    background-position: -400px 0;
  }
  100% {
    background-position: 400px 0;
  }
}

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

.rdm__skeleton--inline {
  display: inline-block;
  width: 64px;
  height: 13px;
  vertical-align: middle;
  border-radius: var(--radius-xs);
}

.rdm__skeleton--bar {
  flex: 1;
  height: 48px;
}

.rdm__skeleton--ingredient {
  height: 50px;
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

/* ── Transitions ── */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.25s ease;
}
.modal-enter-active .rdm,
.modal-leave-active .rdm {
  transition:
    transform 0.25s ease,
    opacity 0.25s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from .rdm,
.modal-leave-to .rdm {
  transform: scale(0.96) translateY(8px);
  opacity: 0;
}
</style>
