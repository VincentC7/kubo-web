<script setup>
/**
 * RecipeCard — Molécule carte de recette dans le catalogue
 */
import KuboTag from '@/components/ui/KuboTag.vue'
import KuboIcon from '@/components/ui/KuboIcon.vue'

defineProps({
  recipe: { type: Object, required: true },
  selected: { type: Boolean, default: false },
})
defineEmits(['select', 'toggle'])
</script>

<template>
  <article :class="['recipe-card', { 'recipe-card--selected': selected }]" @click="$emit('select')">
    <!-- Image -->
    <div class="recipe-card__img-wrap">
      <img :src="recipe.img" :alt="recipe.title" class="recipe-card__img" loading="lazy" />
      <div class="recipe-card__overlay" />
    </div>

    <!-- Body -->
    <div class="recipe-card__body">
      <h3 class="recipe-card__title">{{ recipe.title }}</h3>
      <p class="recipe-card__sub">{{ recipe.sub }}</p>

      <div class="recipe-card__tags">
        <KuboTag v-for="tag in recipe.tags" :key="tag" :label="tag" />
      </div>

      <div class="recipe-card__footer">
        <div class="recipe-card__meta">
          <span class="recipe-card__meta-item">
            <KuboIcon name="clock" :size="12" />
            {{ recipe.time }}m
          </span>
          <span class="recipe-card__meta-item">
            <KuboIcon name="flame" :size="12" />
            {{ recipe.kcal }}k
          </span>
        </div>

        <button
          :class="['recipe-card__toggle', { 'recipe-card__toggle--active': selected }]"
          :title="selected ? 'Retirer du menu' : 'Ajouter au menu'"
          @click.stop="$emit('toggle')"
        >
          <KuboIcon :name="selected ? 'check' : 'plus'" :size="18" />
        </button>
      </div>
    </div>
  </article>
</template>

<style scoped>
.recipe-card {
  background: var(--kubo-surface);
  border: 1px solid var(--kubo-border);
  border-radius: var(--radius-2xl);
  overflow: hidden;
  box-shadow: var(--shadow-card);
  display: flex;
  flex-direction: column;
  cursor: pointer;
  transition:
    transform var(--transition-base),
    box-shadow var(--transition-base),
    border-color var(--transition-base);
}

.recipe-card:hover {
  transform: translateY(-6px);
  box-shadow: var(--shadow-lg);
}

.recipe-card--selected {
  border-color: var(--kubo-green);
}

.recipe-card__img-wrap {
  position: relative;
  aspect-ratio: 4 / 3;
  overflow: hidden;
}

.recipe-card__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.6s ease;
}

.recipe-card:hover .recipe-card__img {
  transform: scale(1.08);
}

.recipe-card__overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.15), transparent);
}

.recipe-card__body {
  padding: 20px 24px 24px;
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 8px;
}

.recipe-card__title {
  font-size: 15px;
  font-weight: 800;
  line-height: 1.25;
  color: var(--kubo-text);
  transition: color var(--transition-base);
}

.recipe-card:hover .recipe-card__title {
  color: var(--kubo-green);
}

.recipe-card__sub {
  font-size: 11px;
  font-weight: 700;
  font-style: italic;
  color: var(--kubo-text-muted);
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
}

.recipe-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 4px;
}

.recipe-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
  padding-top: 12px;
}

.recipe-card__meta {
  display: flex;
  gap: 12px;
}

.recipe-card__meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--kubo-text-muted);
}

.recipe-card__toggle {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  border: 1px solid var(--kubo-border);
  background: var(--kubo-surface-mute);
  color: var(--kubo-text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--transition-bounce);
}

.recipe-card__toggle:hover {
  color: var(--kubo-green);
  border-color: var(--kubo-green);
  transform: scale(1.1);
}

.recipe-card__toggle--active {
  background: var(--kubo-green);
  border-color: var(--kubo-green);
  color: #fff;
  box-shadow: 0 6px 14px -3px var(--kubo-green-shadow);
}
</style>
