<script setup>
/**
 * GroceryGroup — Molécule groupe d'ingrédients d'une recette
 * Intégré avec l'inventaire global et affiche les prix.
 */
import { computed } from 'vue'
import KuboButton from '@/components/ui/KuboButton.vue'
import { storeToRefs } from 'pinia'
import { useAppStore } from '@/stores/appStore.js'

const props = defineProps({
  recipe: { type: Object, required: true },
  done: { type: Boolean, default: false },
})

const store = useAppStore()
const { portions } = storeToRefs(store)
const { isInInventory, updateInventory, toggleRecipeIngredients } = store

const allChecked = computed(() => props.recipe.ingredients.every((ing) => isInInventory(ing.name)))

function scaledPrice(ing) {
  return ((ing.price || 0) / 2) * portions.value
}
</script>

<template>
  <div class="gg" :class="{ 'gg--done': done }">
    <div class="gg__header">
      <h4 class="gg__title">
        <span class="gg__dot" />
        {{ recipe.title }}
      </h4>
      <div class="gg__header-right">
        <KuboButton
          :variant="allChecked ? 'dark' : 'primary'"
          size="sm"
          @click="toggleRecipeIngredients(recipe.id)"
        >
          Tout {{ allChecked ? 'décocher' : 'cocher' }}
        </KuboButton>
        <span class="gg__price-badge">Est. {{ recipe.totalPrice?.toFixed(2) }} €</span>
      </div>
    </div>
    <div class="gg__grid">
      <label
        v-for="ing in recipe.ingredients"
        :key="ing.name"
        :class="['gg__item', { 'gg__item--checked': isInInventory(ing.name) }]"
      >
        <input
          type="checkbox"
          :checked="isInInventory(ing.name)"
          class="gg__checkbox"
          @change="
            updateInventory(
              { name: ing.name, qty: ing.qty, price: ing.price },
              $event.target.checked,
            )
          "
        />
        <span class="gg__ing">{{ ing.name }}</span>
        <span class="gg__price">{{ scaledPrice(ing).toFixed(2) }} €</span>
      </label>
    </div>
  </div>
</template>

<style scoped>
.gg {
  background: var(--kubo-surface);
  border: 1px solid var(--kubo-border);
  border-radius: var(--radius-2xl);
  padding: 28px;
  box-shadow: var(--shadow-card);
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.gg--done {
  opacity: 0.35;
}

.gg__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}
.gg__title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 800;
  color: var(--kubo-text);
  letter-spacing: -0.02em;
}
.gg__dot {
  width: 6px;
  height: 18px;
  background: var(--kubo-green);
  border-radius: 99px;
  flex-shrink: 0;
}
.gg__header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}
.gg__price-badge {
  font-size: 12px;
  font-weight: 800;
  padding: 6px 16px;
  background: var(--kubo-surface-mute);
  border: 1px solid var(--kubo-border);
  border-radius: var(--radius-lg);
  color: var(--kubo-text);
  white-space: nowrap;
}

.gg__grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}

.gg__item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: var(--kubo-surface-mute);
  border: 1px solid transparent;
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-base);
}
.gg__item:hover {
  border-color: var(--kubo-border-mid);
}
.gg__item--checked {
  opacity: 0.5;
}
.gg__item--checked .gg__ing {
  text-decoration: line-through;
}

.gg__checkbox {
  width: 18px;
  height: 18px;
  border-radius: 6px;
  accent-color: var(--kubo-green);
  cursor: pointer;
  flex-shrink: 0;
}
.gg__ing {
  font-size: 12px;
  font-weight: 700;
  color: var(--kubo-text);
  flex: 1;
}
.gg__price {
  font-size: 10px;
  font-weight: 800;
  color: var(--kubo-text-muted);
  white-space: nowrap;
  transition: color var(--transition-base);
}
.gg__item:hover .gg__price {
  color: var(--kubo-green);
}
</style>
