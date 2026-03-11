<script setup>
/**
 * GroceryGroup — Molécule groupe d'ingrédients d'une recette
 */
import { ref } from 'vue'
import KuboIcon from '@/components/ui/KuboIcon.vue'

const props = defineProps({
  recipe: { type: Object, required: true },
  done: { type: Boolean, default: false },
})

const checked = ref({})
function toggle(name) {
  checked.value[name] = !checked.value[name]
}
</script>

<template>
  <div class="gg" :class="{ 'gg--done': done }">
    <h4 class="gg__title">
      <span class="gg__dot" />
      {{ recipe.title }}
    </h4>
    <div class="gg__grid">
      <label
        v-for="ing in recipe.ingredients"
        :key="ing.name"
        :class="['gg__item', { 'gg__item--checked': checked[ing.name] }]"
      >
        <input
          type="checkbox"
          :checked="checked[ing.name]"
          class="gg__checkbox"
          @change="toggle(ing.name)"
        />
        <span class="gg__ing">{{ ing.name }}</span>
        <span v-if="ing.qty" class="gg__qty">{{ ing.qty }}</span>
      </label>
    </div>
  </div>
</template>

<style scoped>
.gg {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.gg--done {
  opacity: 0.35;
}

.gg__title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  font-weight: 800;
  color: var(--kubo-text);
}
.gg__dot {
  width: 4px;
  height: 12px;
  background: var(--kubo-green);
  border-radius: 99px;
  flex-shrink: 0;
}

.gg__grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}
@media (max-width: 480px) {
  .gg__grid {
    grid-template-columns: 1fr;
  }
}

.gg__item {
  display: flex;
  align-items: center;
  gap: 10px;
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
.gg__qty {
  font-size: 10px;
  font-weight: 800;
  color: var(--kubo-text-muted);
  white-space: nowrap;
}
</style>
