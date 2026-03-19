# Instructions GitHub Copilot — kubo-web

## Contexte du projet

**kubo-web** est le frontend d'une application de **gestion alimentaire personnelle**.  
C'est une Single Page Application (SPA) développée avec **Vue 3**, **Vite 7** et **TypeScript**.

### Domaine métier

L'application permet à l'utilisateur de :

- **Gérer ses recettes** : catalogue, filtres, tags, catégories, prix estimé par portion
- **Planifier ses repas** : planning hebdomadaire, sélection/désélection de recettes, marquage "fait"
- **Gérer sa liste de courses** : génération automatique depuis le planning, regroupement par recette, total estimé
- **Gérer son inventaire** : stock d'ingrédients, ingrédients manquants par rapport au menu
- **Suivre son équilibre nutritionnel** : répartition protéines/lipides/glucides, progression, budget

---

## Stack & versions

| Outil             | Version                        |
| ----------------- | ------------------------------ |
| **Vue**           | `^3.5.29`                      |
| **Vite**          | `^7.3.1`                       |
| **TypeScript**    | `^5.x` (via `vue-tsc`)         |
| **Pinia**         | `^3.x`                         |
| **Axios**         | présent via `httpClient.ts`    |
| **Chart.js**      | utilisé dans `DashboardView`   |
| **Node.js**       | `^20.19.0 \|\| >=22.12.0`      |
| **Module system** | ESM natif (`"type": "module"`) |

Ne jamais suggérer de syntaxes ou d'APIs liées à Vue 2, Webpack, CommonJS ou Vuex.

---

## Conventions Vue 3 + TypeScript

### Script

- Toujours utiliser `<script setup lang="ts">` — ne jamais utiliser l'Options API ni `defineComponent()`.
- Déclarer les props avec `defineProps<{...}>()` (générique TypeScript).
- Déclarer les émissions avec `defineEmits<{...}>()` (générique TypeScript).
- Typer explicitement tous les `ref()` : `ref<Type>(valeur)`.
- Préférer `computed()` aux calculs dans le template.

### Nommage

- Fichiers de composants : **PascalCase** (ex. `RecipeCard.vue`).
- Référencer les composants dans les templates en **PascalCase** (ex. `<RecipeCard />`).
- Composants d'icônes : `KuboIcon` avec prop `name` (voir `src/components/ui/KuboIcon.vue`).
- Un seul composant par fichier `.vue`.

### Ordre dans un SFC

Respecter systématiquement l'ordre suivant dans tout fichier `.vue` :

1. `<script setup lang="ts">`
2. `<template>`
3. `<style scoped>`

---

## Structure de `src/`

```
src/
├── main.ts
├── App.vue
├── assets/
│   ├── base.css              # Variables CSS globales (--kubo-*)
│   └── main.css              # Styles globaux
├── types/                    # Types TypeScript partagés
│   ├── recipe.ts             # Ingredient, RecipeListItem, RecipeWithPrice
│   ├── user.ts               # User, Settings
│   └── planning.ts           # WeekEntry, WeeklyData
├── services/                 # Accès données (API réelle ou mock)
│   ├── httpClient.ts         # Instance axios (VITE_API_BASE_URL)
│   ├── recipeService.ts      # getRecipes(), getRecipeById()  ← API réelle /api/recettes
│   ├── userService.ts        # getUser(), saveUser()          ← mock
│   ├── settingsService.ts    # getSettings(), saveSettings()  ← mock
│   ├── planningService.ts    # getPlanning(), savePlanning()  ← mock
│   └── inventoryService.ts   # getInventory(), saveInventory() ← mock
├── stores/                   # Pinia Setup Stores (un par domaine)
│   ├── uiStore.ts            # navigation, sidebar, darkMode, toast
│   ├── userStore.ts          # user, portions, mealsGoal, viewMode
│   ├── recipeStore.ts        # recipes, pagination, filtres
│   ├── planningStore.ts      # weeklyData, selectedRecipes, helpers semaine
│   └── inventoryStore.ts     # inventory, showInventory, showGroceries, progress
├── components/
│   ├── layout/
│   │   ├── AppHeader.vue
│   │   ├── AppSidebar.vue
│   │   └── ToastNotification.vue
│   ├── recipes/
│   │   ├── RecipeCard.vue
│   │   ├── RecipeDetailModal.vue
│   │   ├── FilterModal.vue
│   │   ├── MacroBar.vue
│   │   └── NutritionLegendItem.vue
│   ├── planning/
│   │   └── PlanningCard.vue
│   ├── shopping/
│   │   └── GroceryGroup.vue
│   └── ui/                   # Design system Kubo
│       ├── KuboButton.vue
│       ├── KuboCard.vue
│       ├── KuboIcon.vue      # Icônes SVG inline (prop: name, size)
│       ├── KuboInput.vue
│       ├── KuboProgressBar.vue
│       └── KuboTag.vue
└── views/
    ├── DashboardView.vue     # uiStore + userStore + planningStore
    ├── CatalogView.vue       # recipeStore + planningStore + userStore + uiStore
    ├── PlanningView.vue      # planningStore + uiStore
    ├── GroceriesView.vue     # planningStore
    ├── InventoryView.vue     # inventoryStore + planningStore + uiStore
    └── SettingsView.vue      # uiStore + userStore + inventoryStore
```

---

## Stores — règles d'utilisation

- **Pas de store racine orchestrateur** : chaque store est importé directement là où il est nécessaire.
- Utiliser `storeToRefs()` pour destructurer les propriétés réactives (state + computed).
- Destructurer les actions directement depuis l'instance du store (pas de `storeToRefs` pour les fonctions).

```ts
// ✅ Correct
const planningStore = usePlanningStore()
const { selectedRecipes, totalPrice } = storeToRefs(planningStore)
const { toggleRecipe, isDone } = planningStore

// ❌ À éviter
const store = useAppStore() // appStore.js n'existe plus
```

- `showInventory` et `showGroceries` vivent dans **`inventoryStore`**, pas dans `userStore`.
- `mealsGoal` et `portions` vivent dans **`userStore`**.
- `notify()`, `navTo()`, `darkMode`, `toggleDarkMode()` vivent dans **`uiStore`**.

---

## Services — règles d'utilisation

- Les services sont appelés uniquement depuis les stores (dans les actions `init()` ou autres).
- Ne jamais appeler un service directement depuis un composant ou une vue.
- `httpClient.ts` exporte une instance axios configurée avec `VITE_API_BASE_URL`.
- En développement, `VITE_API_BASE_URL` doit être une chaîne vide dans `.env.local` pour utiliser le proxy Vite (évite les erreurs CORS).

---

## Types partagés

Les types sont dans `src/types/`. Les importer avec `import type` :

```ts
import type { RecipeWithPrice, Ingredient } from '@/types/recipe'
import type { WeekEntry } from '@/types/planning'
import type { User, Settings } from '@/types/user'
```

---

## Imports & chemins

- Toujours utiliser l'alias `@` pour les imports depuis `src/` :

```ts
// ✅ Correct
import RecipeCard from '@/components/recipes/RecipeCard.vue'
import { useRecipeStore } from '@/stores/recipeStore'
import type { RecipeWithPrice } from '@/types/recipe'

// ❌ À éviter
import RecipeCard from '../../components/RecipeCard.vue'
```

- Ne jamais utiliser de chemins relatifs remontants (`../..`).
- Ne jamais importer depuis `appStore.js`, `api.js`, `httpClient.js` ou `useApp.js` — ces fichiers n'existent plus.

---

## Conventions de style CSS

- Utiliser `<style scoped>` dans chaque composant — ne jamais omettre `scoped`.
- CSS natif uniquement (pas de Tailwind, pas de SCSS, pas de CSS-in-JS).
- Réutiliser les variables CSS globales définies dans `src/assets/base.css` (préfixe `--kubo-`).
- Ne pas redéfinir de variables déjà existantes.

---

## Configuration Vite

- Ne pas modifier `vite.config.ts` sans raison — `@vitejs/plugin-vue` et `vite-plugin-vue-devtools` sont déjà configurés.
- L'alias `@` → `src/` est défini dans `vite.config.ts`.

---

## Commande de build

```bash
npm run build
# équivaut à : vue-tsc --noEmit && vite build
```

Le build doit passer avec **0 erreur TypeScript** avant tout commit.

---

## Ce qu'il faut éviter

| ❌ À éviter                             | Raison                                                   |
| --------------------------------------- | -------------------------------------------------------- |
| `<script setup>` sans `lang="ts"`       | Tout le projet est en TypeScript                         |
| Options API (`data()`, `methods`…)      | Exclusivement `<script setup lang="ts">`                 |
| `this` dans les composants              | Inutile avec `<script setup>`                            |
| `require()`                             | Projet ESM natif                                         |
| `import { useAppStore }`                | `appStore.js` supprimé — utiliser les stores par domaine |
| `import … from '@/services/api.js'`     | `api.js` supprimé — utiliser les services par domaine    |
| Chemins relatifs remontants (`../../`)  | Utiliser l'alias `@`                                     |
| CSS global dans `<style>` sans `scoped` | Risque de fuite de styles                                |
| Appel de service depuis un composant    | Les services sont réservés aux stores                    |
