<script setup>
/**
 * FilterModal — Organisme panneau latéral de filtres
 */
import KuboIcon from '@/components/ui/KuboIcon.vue'
import KuboButton from '@/components/ui/KuboButton.vue'
import { useApp } from '@/composables/useApp.js'

defineProps({ visible: { type: Boolean, default: false } })
defineEmits(['close'])

const {
  filters,
  allCategories,
  allTags,
  setFilterCategory,
  setFilterMaxTime,
  toggleFilterTag,
  resetFilters,
} = useApp()

const TIME_OPTIONS = [
  { label: 'Tout', value: 0 },
  { label: '20 min', value: 20 },
  { label: '40 min', value: 40 },
]
</script>

<template>
  <Teleport to="body">
    <Transition name="filter-panel">
      <div v-if="visible" class="fm-overlay" @click.self="$emit('close')">
        <div class="fm">
          <div class="fm__header">
            <h2 class="fm__title">Filtrer</h2>
            <button class="fm__close" @click="$emit('close')">
              <KuboIcon name="x" :size="20" />
            </button>
          </div>

          <div class="fm__body custom-scrollbar">
            <!-- Catégories -->
            <div class="fm__group">
              <h3 class="fm__group-label">Catégorie</h3>
              <div class="fm__chips">
                <button
                  v-for="cat in allCategories"
                  :key="cat"
                  :class="['fm__chip', { 'fm__chip--active': filters.category === cat }]"
                  @click="setFilterCategory(cat)"
                >
                  {{ cat }}
                </button>
              </div>
            </div>

            <!-- Temps max -->
            <div class="fm__group">
              <h3 class="fm__group-label">Temps max</h3>
              <div class="fm__chips">
                <button
                  v-for="opt in TIME_OPTIONS"
                  :key="opt.value"
                  :class="['fm__chip', { 'fm__chip--active': filters.maxTime === opt.value }]"
                  @click="setFilterMaxTime(opt.value)"
                >
                  {{ opt.label }}
                </button>
              </div>
            </div>

            <!-- Tags -->
            <div class="fm__group">
              <h3 class="fm__group-label">Tags</h3>
              <div class="fm__chips">
                <button
                  v-for="tag in allTags"
                  :key="tag"
                  :class="[
                    'fm__chip',
                    'fm__chip--tag',
                    { 'fm__chip--active-tag': filters.activeTags.includes(tag) },
                  ]"
                  @click="toggleFilterTag(tag)"
                >
                  #{{ tag }}
                </button>
              </div>
            </div>
          </div>

          <div class="fm__footer">
            <button class="fm__reset" @click="resetFilters">Réinitialiser</button>
            <KuboButton variant="primary" @click="$emit('close')">Appliquer</KuboButton>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fm-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  justify-content: flex-end;
}
.fm {
  width: 100%;
  max-width: 400px;
  height: 100%;
  background: var(--kubo-surface);
  display: flex;
  flex-direction: column;
  box-shadow: -10px 0 40px rgba(0, 0, 0, 0.1);
}

.fm__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32px 32px 24px;
  border-bottom: 1px solid var(--kubo-border);
}
.fm__title {
  font-size: 22px;
  font-weight: 800;
  color: var(--kubo-text);
}
.fm__close {
  padding: 8px;
  border: none;
  background: var(--kubo-surface-mute);
  border-radius: var(--radius-sm);
  color: var(--kubo-text-muted);
  cursor: pointer;
  transition: all var(--transition-base);
}
.fm__close:hover {
  color: var(--kubo-text);
}

.fm__body {
  flex: 1;
  overflow-y: auto;
  padding: 24px 32px;
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.fm__group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.fm__group-label {
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--kubo-text-muted);
}
.fm__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.fm__chip {
  padding: 8px 16px;
  border-radius: var(--radius-md);
  border: 1px solid var(--kubo-border);
  background: var(--kubo-surface-mute);
  font-family: var(--font-base);
  font-size: 12px;
  font-weight: 700;
  color: var(--kubo-text-muted);
  cursor: pointer;
  transition: all var(--transition-base);
}
.fm__chip:hover {
  background: var(--kubo-surface);
  border-color: var(--kubo-border-mid);
  color: var(--kubo-text);
}
.fm__chip--active {
  background: var(--kubo-green);
  border-color: var(--kubo-green);
  color: #fff;
}
.fm__chip--active-tag {
  background: var(--kubo-green-light);
  border-color: var(--kubo-green);
  color: var(--kubo-green);
}

.fm__footer {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 24px 32px;
  border-top: 1px solid var(--kubo-border);
}
.fm__reset {
  flex: 1;
  padding: 14px;
  border: none;
  background: transparent;
  font-family: var(--font-base);
  font-size: 13px;
  font-weight: 700;
  color: var(--kubo-text-muted);
  cursor: pointer;
  border-radius: var(--radius-md);
  transition: all var(--transition-base);
}
.fm__reset:hover {
  background: var(--kubo-surface-mute);
  color: var(--kubo-text);
}

/* Transitions */
.filter-panel-enter-active,
.filter-panel-leave-active {
  transition: opacity 0.25s ease;
}
.filter-panel-enter-active .fm,
.filter-panel-leave-active .fm {
  transition: transform 0.25s ease;
}
.filter-panel-enter-from,
.filter-panel-leave-to {
  opacity: 0;
}
.filter-panel-enter-from .fm,
.filter-panel-leave-to .fm {
  transform: translateX(100%);
}
</style>
