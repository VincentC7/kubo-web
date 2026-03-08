# Instructions GitHub Copilot — kubo-web

## Contexte du projet

**kubo-web** est le frontend d'une application de **gestion alimentaire personnelle**.  
C'est une Single Page Application (SPA) développée avec **Vue 3** et **Vite 7**.

### Domaine métier
L'application permet à l'utilisateur de :
- **Gérer ses recettes** : création, édition, suppression, tags, catégories, notation
- **Planifier ses repas** : planning hebdomadaire (petit-déjeuner, déjeuner, dîner), gestion des portions
- **Gérer sa liste de courses** : génération automatique depuis le planning, regroupement par catégorie, estimation de coût
- **Gérer son garde-manger** : inventaire des ingrédients, suggestions de recettes selon les stocks, alertes de péremption
- **Suivre son équilibre nutritionnel** _(optionnel)_ : apports par repas/journée, indicateurs d'équilibre

### Entités métier principales
- `Recette` : nom, description, catégorie, tags, portions, temps de préparation, ingrédients, note
- `Ingredient` : nom, catégorie (légume, viande, épicerie…), unité par défaut
- `PlanningRepas` : semaine, jour, moment (matin/midi/soir), recette associée, nombre de personnes
- `ListeCourses` : générée depuis un planning, ingrédients groupés par catégorie, statut coché/non coché
- `GardeManger` : stock d'ingrédients disponibles, quantités, dates de péremption

Le projet utilise uniquement la **Composition API** avec `<script setup>`.  
Il n'y a pas de routeur (Vue Router) ni de store (Pinia/Vuex) installés **pour l'instant**, mais leur ajout est prévu.  
Le code source est en **JavaScript** (pas TypeScript).

---

## Stack & versions

- **Vue** : `^3.5.29`
- **Vite** : `^7.3.1`
- **Node.js** : `^20.19.0 || >=22.12.0`
- **Module system** : ESM natif (`"type": "module"` dans `package.json`)

Ne jamais suggérer de syntaxes ou d'APIs liées à Vue 2, Webpack, ou CommonJS.

---

## Conventions Vue 3

### Composition API
- Toujours utiliser `<script setup>` — ne jamais utiliser l'Options API ni `defineComponent()`.
- Déclarer les props avec `defineProps({})`.
- Déclarer les événements émis avec `defineEmits([])` ou `defineEmits({})`.
- Utiliser `ref()` et `reactive()` pour la réactivité.
- Préférer `computed()` aux getters calculés dans le template.

### Nommage
- Fichiers de composants : **PascalCase** (ex. `RecipeCard.vue`).
- Référencer les composants dans les templates en **PascalCase** (ex. `<RecipeCard />`).
- Composants d'icônes : préfixe `Icon` + nom en PascalCase, placés dans `src/components/icons/` (ex. `IconRecipe.vue`).
- Un seul composant par fichier `.vue`.

### Ordre dans un SFC
Respecter systématiquement l'ordre suivant dans tout fichier `.vue` :
1. `<script setup>`
2. `<template>`
3. `<style scoped>`

---

## Structure cible de `src/`

```
src/
├── main.js
├── App.vue
├── assets/
│   ├── base.css          # Variables CSS globales
│   └── main.css          # Styles globaux
├── components/
│   ├── icons/            # Composants d'icônes (IconXxx.vue)
│   ├── recipes/          # Composants liés aux recettes
│   ├── planning/         # Composants liés au planning de repas
│   ├── shopping/         # Composants liés à la liste de courses
│   └── pantry/           # Composants liés au garde-manger
├── views/                # Pages/vues (avec Vue Router)
│   ├── RecipesView.vue
│   ├── PlanningView.vue
│   ├── ShoppingView.vue
│   └── PantryView.vue
├── stores/               # Stores Pinia (un fichier par domaine)
│   ├── recipes.js
│   ├── planning.js
│   ├── shopping.js
│   └── pantry.js
├── composables/          # Composables réutilisables (useXxx.js)
└── services/             # Appels API / logique d'accès aux données
```

> Cette structure est la cible à atteindre. Ne pas créer de dossiers vides d'avance, les ajouter au fur et à mesure.

---

## Conventions de style CSS

- Utiliser `<style scoped>` dans chaque composant — ne jamais omettre l'attribut `scoped`.
- CSS natif uniquement (pas de Tailwind, pas de SCSS/SASS, pas de CSS-in-JS) sauf décision explicite.
- Les variables CSS globales et le reset sont définis dans `src/assets/base.css` — réutiliser ces variables plutôt que d'en redéfinir.
- Les styles globaux sont dans `src/assets/main.css`.

---

## Imports & chemins

- Toujours utiliser l'alias `@` pour les imports depuis `src/` :
  ```js
  // ✅ Correct
  import RecipeCard from '@/components/recipes/RecipeCard.vue'
  import { useRecipes } from '@/composables/useRecipes.js'

  // ❌ À éviter
  import RecipeCard from '../../components/RecipeCard.vue'
  ```
- Ne jamais utiliser de chemins relatifs remontants (`../..`).

---

## Structure des fichiers & assets

| Type d'asset | Emplacement |
|---|---|
| Assets référencés dans le code (importés) | `src/assets/` |
| Assets statiques non importés (favicon, robots.txt…) | `public/` |
| Composants d'interface | `src/components/` |
| Composants d'icônes | `src/components/icons/` |
| Pages / vues (Vue Router) | `src/views/` |
| Stores (Pinia) | `src/stores/` |
| Composables | `src/composables/` |
| Accès API / données | `src/services/` |

---

## Configuration Vite

- Ne pas modifier `vite.config.js` sans raison — les plugins `@vitejs/plugin-vue` et `vite-plugin-vue-devtools` sont déjà configurés.
- L'alias `@` → `src/` est défini dans `vite.config.js`, ne pas le redéfinir ailleurs.

---

## Ce qu'il faut éviter

| ❌ À éviter | Raison |
|---|---|
| Options API (`data()`, `methods`, `computed` comme objet) | Le projet utilise exclusivement `<script setup>` |
| `this` dans les composants | Inutile avec `<script setup>` |
| `require()` | Projet ESM natif, utiliser `import` |
| `import { createRouter } from 'vue-router'` | Vue Router n'est pas encore installé |
| `import { createPinia } from 'pinia'` | Pinia n'est pas encore installé |
| `import Vuex from 'vuex'` | Vuex n'est pas utilisé dans Vue 3 |
| Chemins relatifs remontants (`../../`) | Utiliser l'alias `@` |
| CSS global dans un `<style>` sans `scoped` | Risque de fuite de styles |

