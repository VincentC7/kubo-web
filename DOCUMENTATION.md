# Kubo Web — Documentation technique complète

> Générée le 25 avril 2026  
> Stack : Vue 3 · TypeScript · Pinia · Vite · Playwright

---

## Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Architecture générale](#2-architecture-générale)
3. [Types TypeScript](#3-types-typescript)
4. [Services](#4-services)
5. [Stores Pinia](#5-stores-pinia)
6. [Composables](#6-composables)
7. [Utils](#7-utils)
8. [Data](#8-data)
9. [Vues](#9-vues)
10. [Composants](#10-composants)
11. [Tests E2E (Playwright)](#11-tests-e2e-playwright)
12. [Variables d'environnement](#12-variables-denvironnement)

---

## 1. Vue d'ensemble

Kubo Web est une **Single Page Application (SPA)** de gestion culinaire : catalogue de recettes, planning de repas, liste de courses, inventaire et tableau de bord saisonnier.

### Choix techniques notables

| Aspect           | Choix                                                                |
| ---------------- | -------------------------------------------------------------------- |
| Framework        | Vue 3 (Composition API + `<script setup>`)                           |
| State management | Pinia                                                                |
| Routing          | **Virtuel** — aucun Vue Router, navigation via `uiStore.currentView` |
| Backend          | Symfony + LexikJWT (tokens stockés en `localStorage`)                |
| Auth tokens      | `kubo_token` (access) · `kubo_refresh_token` (refresh)               |
| Services mockés  | `planningService`, `inventoryService`, `settingsService`             |
| Icons saison     | OpenMoji 15 (CC BY-SA 4.0), SVG locaux                               |
| Tests            | Playwright — auth persistée dans `playwright/.auth/user.json`        |

---

## 2. Architecture générale

```
src/
├── main.ts                  # Bootstrap Vue + Pinia
├── App.vue                  # Racine : routing virtuel + init auth
├── types/                   # Interfaces TypeScript
├── services/                # Couche API + logique métier
├── stores/                  # Stores Pinia (état global)
├── composables/             # Logique réutilisable Vue
├── utils/                   # Fonctions pures
├── data/                    # Données statiques compilées
├── views/                   # Pages (une par vue virtuelle)
├── components/              # Composants UI organisés par domaine
│   ├── layout/
│   ├── auth/
│   ├── recipes/
│   ├── planning/
│   ├── shopping/
│   ├── dashboard/
│   └── ui/
└── assets/
    └── icons/season/        # SVG OpenMoji fruits & légumes
```

### Flux de navigation

```
App.vue
  └─ uiStore.currentView ──► 'dashboard' | 'catalog' | 'planning'
                                        | 'groceries' | 'inventory'
                                        | 'settings' | 'profile'
```

### Flux d'authentification

```
App.vue (onMounted)
  └─ authStore.tryRefresh()
       └─ tokenService.getToken()  ──► localStorage kubo_token
            ├─ valide  ──► decodeUser(token)  (pas d'appel réseau)
            └─ expiré  ──► authService.refresh(refreshToken)
                                └─ httpClient intercepteur 401 auto-refresh
```

---

## 3. Types TypeScript

### `src/types/auth.ts`

```typescript
interface LoginCredentials {
  email: string
  password: string
}
interface RegisterCredentials {
  email: string
  password: string
  username: string
}
interface AuthTokens {
  token: string
  refresh_token: string
}
interface AuthState {
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}
```

### `src/types/user.ts`

```typescript
type UserRole = 'user' | 'admin' // mappé depuis ROLE_USER / ROLE_ADMIN Symfony

interface User {
  id: number
  email: string
  username: string
  roles: string[] // rôles bruts Symfony
  createdAt: string
  avatar?: string // URL ou null
}

interface UserProfile {
  // sous-ensemble affiché dans ProfileView
  username: string
  email: string
  avatar?: string
}
```

### `src/types/recipe.ts`

```typescript
interface Ingredient {
  name: string
  quantity: string
  unit: string
}
interface Step {
  order: number
  description: string
}
interface Nutrition {
  calories: number
  proteins: number
  carbs: number
  fats: number
}

interface Recipe {
  id: number
  title: string
  description: string
  imageUrl?: string
  prepTime: number // minutes
  cookTime: number // minutes
  servings: number
  difficulty: 'easy' | 'medium' | 'hard'
  tags: string[]
  ingredients: Ingredient[]
  steps: Step[]
  nutrition?: Nutrition
  season?: string[] // ex. ['spring', 'summer']
}

// DTOs API — les tableaux peuvent être envoyés en array OU en Record indexé
interface RecipeCreateDTO {
  /* mêmes champs sans id */
}
interface RecipeUpdateDTO {
  /* tous champs optionnels */
}
```

> **Note** : `recipeService` expose une méthode `toArray()` pour normaliser
> les champs `ingredients`, `steps`, `nutrition` qui arrivent parfois comme
> `{ "0": ..., "1": ... }` depuis l'API Symfony.

### `src/types/planning.ts`

```typescript
type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'

interface PlanningEntry {
  id: number
  date: string // ISO 8601
  mealType: MealType
  recipeId: number
  servings: number
}

interface WeeklyPlanning {
  weekStart: string // ISO 8601 lundi de la semaine
  entries: PlanningEntry[]
}
```

---

## 4. Services

### `src/services/httpClient.ts`

Axios instance préconfigurée.

| Aspect               | Détail                                                                                                         |
| -------------------- | -------------------------------------------------------------------------------------------------------------- |
| Base URL             | `import.meta.env.VITE_API_URL`                                                                                 |
| Header par défaut    | `X-API-KEY: VITE_API_KEY`                                                                                      |
| Intercepteur requête | Injecte `Authorization: Bearer <token>`                                                                        |
| Intercepteur réponse | Sur 401 → tente `authService.refreshToken()` puis rejoue la requête ; si refresh échoue → `authStore.logout()` |

---

### `src/services/tokenService.ts`

Gestion bas niveau des tokens JWT dans `localStorage`.

| Méthode                 | Description                                           |
| ----------------------- | ----------------------------------------------------- |
| `getAccessToken()`      | Lit `kubo_token`                                      |
| `getRefreshToken()`     | Lit `kubo_refresh_token`                              |
| `setTokens(tokens)`     | Écrit les deux clés                                   |
| `clearTokens()`         | Supprime les deux clés                                |
| `isTokenExpired(token)` | Décode le payload JWT et compare `exp` à `Date.now()` |

---

### `src/services/authService.ts`

| Méthode                 | Endpoint              | Description                                               |
| ----------------------- | --------------------- | --------------------------------------------------------- |
| `login(payload)`        | `POST /login`         | Retourne `AuthTokens`                                     |
| `register(payload)`     | `POST /register`      | Pas de retour (void)                                      |
| `refresh(refreshToken)` | `POST /token/refresh` | Corps `{ refresh_token }`, retourne nouveaux `AuthTokens` |

> Pas de méthode `logout()` dans authService — le logout est géré par `tokenService.clearTokens()` directement depuis `authStore`.

---

### `src/services/userService.ts`

| Méthode                   | Endpoint              | Description                                                              |
| ------------------------- | --------------------- | ------------------------------------------------------------------------ |
| `getUserFromToken()`      | —                     | Décode le JWT local, retourne `{ id, email, role }` (pas d'appel réseau) |
| `updateProfile(payload)`  | `PATCH /user`         | Corps `UpdateProfilePayload`, retourne `{ firstName, lastName, email }`  |
| `changePassword(payload)` | `POST /user/password` | Corps `ChangePasswordPayload` (void)                                     |

> `firstName`/`lastName` ne sont **pas** dans le JWT Symfony — ils sont renseignés uniquement après un `PATCH /user` réussi.

---

### `src/services/recipeService.ts`

| Méthode                            | Endpoint             | Description                                                                                    |
| ---------------------------------- | -------------------- | ---------------------------------------------------------------------------------------------- |
| `getRecipes(page, limit)`          | `GET /recettes`      | Params : `page`, `limit`. Retourne `PaginatedResponse<RecipeListItem>`                         |
| `getRecipeById(id)`                | `GET /recettes/{id}` | Recette détaillée mappée depuis `RecetteDetailDto`                                             |
| `getCatalogue(page, limit, week?)` | `GET /catalogue`     | Params : `page`, `limit`, `week?`. Retourne `CatalogueResponse` avec `selectionSize` et `week` |
| `toArray(value)`                   | —                    | Helper interne : normalise array ou Record indexé → array                                      |

> Pas de CRUD admin dans ce service — `createRecipe`, `updateRecipe`, `deleteRecipe` n'existent pas.

---

### `src/services/planningService.ts` ⚠️ mocké en mémoire

| Méthode              | Description                                                   |
| -------------------- | ------------------------------------------------------------- |
| `getPlanning()`      | Retourne `WeeklyData` (toutes les semaines, objet en mémoire) |
| `savePlanning(data)` | Remplace `WeeklyData` en mémoire (pas d'appel réseau)         |

---

### `src/services/inventoryService.ts` ⚠️ mocké en mémoire

| Méthode                | Description                    |
| ---------------------- | ------------------------------ |
| `getInventory()`       | Retourne la liste des items    |
| `addItem(item)`        | Ajoute un item                 |
| `updateItem(id, data)` | Met à jour quantité/expiration |
| `removeItem(id)`       | Supprime un item               |

---

### `src/services/settingsService.ts` ⚠️ mocké en mémoire

| Méthode                | Description                          |
| ---------------------- | ------------------------------------ |
| `getSettings()`        | Retourne les préférences utilisateur |
| `updateSettings(data)` | Met à jour les préférences           |

---

### `src/services/seasonService.ts`

| Méthode                        | Endpoint                  | Description                                                                                      |
| ------------------------------ | ------------------------- | ------------------------------------------------------------------------------------------------ |
| `getSeasonIngredients(month?)` | `GET /ingredients/saison` | Param optionnel `mois`. Retourne `SaisonResponse` avec liste d'ingrédients filtrés par whitelist |

---

### `src/services/featureAccessService.ts`

Matrice de permissions statique (aucune requête réseau).

| Feature        | visitor | user | admin |
| -------------- | ------- | ---- | ----- |
| `catalog`      | ✅      | ✅   | ✅    |
| `recipeDetail` | ✅      | ✅   | ✅    |
| `planning`     | ❌      | ✅   | ✅    |
| `groceries`    | ❌      | ✅   | ✅    |
| `inventory`    | ❌      | ✅   | ✅    |
| `settings`     | ❌      | ✅   | ✅    |
| `profile`      | ❌      | ✅   | ✅    |
| `recipeCreate` | ❌      | ❌   | ✅    |
| `recipeEdit`   | ❌      | ❌   | ✅    |
| `recipeDelete` | ❌      | ❌   | ✅    |

Méthode principale : `canAccess(feature, role): boolean`

---

## 5. Stores Pinia

### `src/stores/authStore.ts`

**État**

```typescript
user: Pick<User, 'email' | 'role'> | null
isAuthenticated: boolean
isLoading: boolean
error: string | null
```

**Getters**

- `currentRole`: `UserRole` — `user.role` ou `'visitor'` si non connecté

**Actions**
| Action | Description |
|---|---|
| `tryRefresh()` | Appelé au boot dans `App.vue` — vérifie/rafraîchit le token silencieusement |
| `login(credentials)` | `POST /login` → stocke les tokens, décode le user, init les stores protégés, navigue vers `dashboard` |
| `register(credentials)` | `POST /register` (void) → navigue vers `login` |
| `logout()` | Efface les tokens, remet `user` à null, navigue vers `catalog` |
| `forceLogout()` | Idem mais appelé par `httpClient` en cas de refresh échoué (sans await) |

---

### `src/stores/userStore.ts`

**État**

```typescript
user: User | null
portions: number // défaut : 2
mealsGoal: number // défaut : 5
viewMode: 'week' | 'list'
```

**Getters** : aucun getter calculé (pas de `userRole`, `isAdmin`, `displayName` dans ce store — le rôle est dans `authStore.currentRole`)

**Actions**
| Action | Description |
|---|---|
| `init()` | Décode le user depuis le JWT via `userService.getUserFromToken()` + charge les settings via `settingsService.getSettings()` |
| `updateProfile(payload)` | `PATCH /user` → met à jour `user.firstName/lastName/email` localement |
| `changePassword(payload)` | `POST /user/password` (délègue à `userService`) |
| `updatePortions(delta)` | Incrémente/décrémente `portions` (min 1) |
| `updateMealsGoal(delta)` | Incrémente/décrémente `mealsGoal` (min 1) |
| `switchViewMode(mode)` | Change `viewMode` |

---

### `src/stores/recipeStore.ts`

**État**

```typescript
recipes: RecipeListItem[]
loading: boolean
loadingDetailId: string | null
filters: { category: string; maxTime: number; activeTags: string[]; search: string }
catalogPage: number
catalogPages: number
catalogLoading: boolean
weeklySelectionSize: number   // N premières recettes = sélection de la semaine
currentWeek: string           // clé semaine retournée par /catalogue
```

**Getters**

- `recipesWithPrice` — enrichit chaque recette avec `totalPrice` calculé depuis `portions`
- `weeklySelection` — les `weeklySelectionSize` premières recettes (sélection scorée)
- `catalogueRest` — recettes après la sélection
- `filteredRecipes` — filtre `catalogueRest` (ou toutes si filtre actif)
- `hasActiveFilters`, `allCategories`, `allTags`
- `catalogHasMore` — `catalogPage < catalogPages`

**Actions**
| Action | Description |
|---|---|
| `init()` | `GET /catalogue` (page 1) — guard anti-double-appel |
| `loadMoreRecipes()` | `GET /catalogue` (page suivante) — append à `recipes` |
| `fetchDetail(id)` | `GET /recettes/{id}` — enrichit la recette dans `recipes[]`, avec cache en mémoire |
| `setFilterCategory(cat)` | Met à jour `filters.category` |
| `setFilterMaxTime(time)` | Met à jour `filters.maxTime` |
| `toggleFilterTag(tag)` | Ajoute/retire un tag de `filters.activeTags` |
| `setSearch(value)` | Met à jour `filters.search` |
| `resetFilters()` | Réinitialise tous les filtres |

---

### `src/stores/planningStore.ts`

**État**

```typescript
weeklyData: WeeklyData // reactive — Record<weekKey, Record<recipeId, WeekEntry>>
currentDate: Date // date de référence pour la semaine affichée
```

**Getters**

- `weekKey` — clé semaine courante format `"2026-W17"` (ISO)
- `weekRange` / `periodLabel` — plage FR ex: `"21 avr. — 27 avr."`
- `selectedRecipes` — recettes ayant `selected: true` pour la semaine courante
- `doneRecipes` — sous-ensemble de `selectedRecipes` avec `done: true`
- `nutritionTotals` — somme `{ prot, fat, carb }` ou `null` si aucune recette sélectionnée
- `totalPrice`, `avgPrice` — calculés depuis `recipesWithPrice`

**Actions**
| Action | Description |
|---|---|
| `init()` | Charge `WeeklyData` via `planningService.getPlanning()` |
| `changePeriod(delta)` | Décale `currentDate` de ±`delta` semaines |
| `toggleRecipe(id)` | Sélectionne/désélectionne une recette ; désélectionner remet `done` à false |
| `markAsDone(id)` | Toggle `done` + toast si passage à true |
| `clearPlanning()` | Vide la semaine courante + toast |
| `isSelected(id)` | Getter booléen (non réactif) |
| `isDone(id)` | Getter booléen (non réactif) |

---

### `src/stores/inventoryStore.ts`

**État**

```typescript
items: InventoryItem[]
isLoading: boolean
error: string | null
```

**Getters**

- `expiringSoon` — items expirant dans les 3 jours
- `expired` — items déjà expirés
- `itemsByCategory` — groupés par catégorie

**Actions** : `fetchInventory()`, `addItem()`, `updateItem()`, `removeItem()`

---

### `src/stores/uiStore.ts`

Store de navigation virtuelle et d'état UI global.

**État**

```typescript
currentView: ViewName         // 'dashboard' | 'catalog' | 'planning' | ...
isAuthModalOpen: boolean
authModalMode: 'login' | 'register'
toast: { message: string; type: 'success'|'error'|'info'; visible: boolean } | null
isSidebarCollapsed: boolean
```

**Actions**
| Action | Description |
|---|---|
| `navigateTo(view)` | Change `currentView` |
| `openAuthModal(mode?)` | Ouvre la modale d'auth |
| `closeAuthModal()` | Ferme la modale d'auth |
| `showToast(message, type)` | Affiche un toast (auto-hide 3 s) |
| `toggleSidebar()` | Collapse/expand la sidebar |

---

### `src/stores/seasonStore.ts`

**État**

```typescript
currentSeason: Season         // 'spring' | 'summer' | 'autumn' | 'winter'
seasonalProducts: { fruits: SeasonalProduct[]; vegetables: SeasonalProduct[] }
isLoading: boolean
```

**Getters**

- `seasonLabel` — libellé FR de la saison courante
- `seasonEmoji` — emoji de la saison

**Actions** : `fetchSeasonalProducts()`, `refreshSeason()`

---

## 6. Composables

### `src/composables/useFeatureAccess.ts`

```typescript
function useFeatureAccess(): {
  canAccess: (feature: string) => boolean // utilise userStore.userRole
  requireAuth: (feature: string) => boolean // ouvre AuthModal si besoin
}
```

Wrapper réactif autour de `featureAccessService.canAccess()`.

---

### `src/composables/usePasswordRules.ts`

```typescript
function usePasswordRules(password: Ref<string>): {
  rules: ComputedRef<PasswordRule[]> // { label, valid }[]
  isValid: ComputedRef<boolean>
}
```

Règles vérifiées : longueur ≥ 8, majuscule, chiffre, caractère spécial.

---

### `src/composables/useSeason.ts`

```typescript
function useSeason(): {
  currentSeason: ComputedRef<Season>
  seasonLabel: ComputedRef<string>
  seasonEmoji: ComputedRef<string>
  seasonalProducts: ComputedRef<SeasonalProducts>
  isLoading: ComputedRef<boolean>
}
```

Wrapper réactif sur `seasonStore`.

---

## 7. Utils

### `src/utils/season.ts`

```typescript
function getCurrentSeason(): Season
// Calcul pur basé sur Date.now() :
// Déc–Fév → 'winter' | Mar–Mai → 'spring' | Juin–Août → 'summer' | Sep–Nov → 'autumn'

function getSeasonLabel(season: Season): string
// 'spring' → 'Printemps', 'summer' → 'Été', etc.

function getSeasonEmoji(season: Season): string
// 'spring' → '🌸', 'summer' → '☀️', 'autumn' → '🍂', 'winter' → '❄️'
```

---

### `src/utils/avatar.ts`

```typescript
function getAvatarUrl(user: User | null): string
// Retourne user.avatar si défini, sinon génère une URL via ui-avatars.com
// avec les initiales du username.

function getInitials(name: string): string
// Extrait jusqu'à 2 initiales (ex. "Jean Dupont" → "JD")
```

---

## 8. Data

### `src/data/seasonImages.ts`

Mapping statique **nom de produit → asset SVG local + emoji fallback**.  
Les assets sont des icônes **OpenMoji 15 (CC BY-SA 4.0)** dans `src/assets/icons/season/`.

```typescript
function getSeasonImage(nom: string, type: 'legume' | 'fruit'): SeasonImageEntry
// { url: string (chemin Vite résolu), emoji: string }
```

**Logique de résolution** :

1. Normalisation du nom : `toLowerCase()` + suppression diacritiques + trim
2. Recherche exacte dans la table
3. Recherche partielle (inclusion dans les deux sens)
4. Fallback : `url: ''` + emoji `🍎` (fruit) ou `🌿` (légume)

**Couverture** : ~45 légumes et ~35 fruits, avec aliases (ex. `butternut` → SVG `courge`, `potiron` → SVG `potimarron`).

---

## 9. Vues

Toutes les vues sont chargées dans `App.vue` via `v-if` sur `uiStore.currentView`.

### `DashboardView.vue`

- **Accès** : tous (visiteurs voient une version réduite)
- **Composants** : `DashboardSeasonSection`, `KuboCard`, `KuboButton`
- **Stores** : `seasonStore`, `recipeStore`, `authStore`
- **Contenu** : section saison courante + suggestions de recettes de saison + CTA connexion pour visiteurs

---

### `CatalogView.vue`

- **Accès** : tous
- **Composants** : `RecipeCard`, `FilterModal`, `KuboInput`, `KuboButton`, `KuboTag`
- **Stores** : `recipeStore`, `uiStore`, `userStore`
- **Fonctionnalités** : recherche texte, filtres (tags, difficulté, saison), pagination, ouverture `RecipeDetailModal`

---

### `PlanningView.vue`

- **Accès** : `user`, `admin`
- **Composants** : `PlanningCard`, `KuboButton`, `KuboIcon`
- **Stores** : `planningStore`, `recipeStore`
- **Fonctionnalités** : navigation semaine (prev/next), affichage 7 jours × 4 repas, ajout/suppression d'entrées

---

### `GroceriesView.vue`

- **Accès** : `user`, `admin`
- **Composants** : `GroceryGroup`, `KuboButton`, `KuboIcon`
- **Stores** : `planningStore`, `recipeStore`
- **Fonctionnalités** : génération automatique de la liste de courses depuis le planning de la semaine, groupement par catégorie d'ingrédient, cochage des items

---

### `InventoryView.vue`

- **Accès** : `user`, `admin`
- **Composants** : `KuboInput`, `KuboButton`, `KuboTag`, `KuboCard`
- **Stores** : `inventoryStore`
- **Fonctionnalités** : liste du garde-manger, ajout/modification/suppression d'items, alertes expiration

---

### `SettingsView.vue`

- **Accès** : `user`, `admin`
- **Composants** : `KuboInput`, `KuboButton`, `KuboCard`
- **Stores** : n/a (appelle `settingsService` directement via le store n/a)
- **Fonctionnalités** : préférences alimentaires, notifications (toutes mockées)

---

### `ProfileView.vue`

- **Accès** : `user`, `admin`
- **Composants** : `KuboInput`, `KuboButton`, `KuboCard`, `KuboProgressBar`
- **Stores** : `userStore`, `authStore`
- **Fonctionnalités** : affichage/édition du profil, changement de mot de passe, upload avatar, règles de mot de passe via `usePasswordRules`

---

## 10. Composants

### Layout

#### `AppSidebar.vue`

- Navigation principale desktop
- Props : aucune
- Émet : aucun
- Stores : `uiStore`, `authStore`, `userStore`
- Affiche les liens de navigation, collapse/expand, avatar utilisateur, bouton login/logout
- `data-testid` : `sidebar`, `nav-*`, `sidebar-toggle`

#### `AppHeader.vue`

- Barre supérieure mobile et desktop
- Stores : `uiStore`, `authStore`, `userStore`
- Affiche le titre de la vue courante, bouton profil, bouton auth
- `data-testid` : `header`, `header-title`, `header-auth-btn`

#### `AppBottomNav.vue`

- Navigation bas d'écran mobile uniquement (`md:hidden`)
- Stores : `uiStore`, `authStore`
- 5 onglets : Dashboard, Catalog, Planning, Groceries, Inventory
- `data-testid` : `bottom-nav`, `bottom-nav-*`

#### `ToastNotification.vue`

- Toast global (succès / erreur / info)
- Stores : `uiStore`
- Auto-hide après 3 s, transition fade
- `data-testid` : `toast`, `toast-message`

---

### Auth

#### `AuthModal.vue`

- Modale d'authentification
- Stores : `uiStore`
- Affiche `AuthLoginForm` ou `AuthRegisterForm` selon `uiStore.authModalMode`
- `data-testid` : `auth-modal`, `auth-modal-close`

#### `AuthLoginForm.vue`

- Formulaire de connexion
- Stores : `authStore`, `uiStore`
- Emits : `success`, `switch-to-register`
- `data-testid` : `login-form`, `login-email`, `login-password`, `login-submit`

#### `AuthRegisterForm.vue`

- Formulaire d'inscription
- Stores : `authStore`, `uiStore`
- Composable : `usePasswordRules`
- Emits : `success`, `switch-to-login`
- `data-testid` : `register-form`, `register-email`, `register-username`, `register-password`, `register-submit`

---

### Recipes

#### `RecipeCard.vue`

- Carte de recette dans la grille du catalogue
- Props : `recipe: Recipe`, `showActions?: boolean` (admin)
- Emits : `click`, `edit`, `delete`
- `data-testid` : `recipe-card-{id}`, `recipe-card-title`, `recipe-card-tags`

#### `RecipeDetailModal.vue`

- Modale de détail complet d'une recette
- Props : `recipe: Recipe`
- Emits : `close`
- Composants enfants : `RecipeIngredientList`, `RecipeStepList`, `MacroBar`, `NutritionLegendItem`
- `data-testid` : `recipe-detail-modal`, `recipe-detail-close`

#### `RecipeIngredientList.vue`

- Props : `ingredients: Ingredient[]`, `servings: number`
- Affiche la liste avec ajustement des quantités selon le nombre de portions

#### `RecipeStepList.vue`

- Props : `steps: Step[]`
- Affiche les étapes numérotées

#### `NutritionLegendItem.vue`

- Props : `label: string`, `value: number`, `unit: string`, `color: string`
- Un item de la légende nutritionnelle

#### `MacroBar.vue`

- Props : `nutrition: Nutrition`
- Barre visuelle des macronutriments (protéines / glucides / lipides)
- Utilise `KuboProgressBar`

#### `FilterModal.vue`

- Modale de filtres du catalogue
- Props : `modelValue: RecipeFilters`
- Emits : `update:modelValue`, `close`, `apply`
- `data-testid` : `filter-modal`, `filter-tags`, `filter-difficulty`, `filter-season`, `filter-apply`, `filter-reset`

---

### Planning

#### `PlanningCard.vue`

- Carte d'un repas dans la vue planning
- Props : `entry?: PlanningEntry`, `date: string`, `mealType: MealType`
- Emits : `add`, `remove`
- Affiche le nom de la recette si une entrée existe, sinon un bouton "+"
- `data-testid` : `planning-card-{date}-{mealType}`

---

### Shopping

#### `GroceryGroup.vue`

- Groupe d'ingrédients par catégorie dans la liste de courses
- Props : `category: string`, `items: GroceryItem[]`
- Emits : `toggle-item`
- `data-testid` : `grocery-group-{category}`, `grocery-item-{name}`

---

### Dashboard

#### `DashboardSeasonSection.vue`

- Section saisonnière du tableau de bord
- Stores : `seasonStore`
- Data : `getSeasonImage()` depuis `src/data/seasonImages.ts`
- Affiche la saison courante, les fruits & légumes de saison avec leurs icônes SVG / emoji fallback
- `data-testid` : `season-section`, `season-title`, `season-products`

---

### UI (Design System)

#### `KuboButton.vue`

- Props : `variant?: 'primary'|'secondary'|'ghost'|'danger'`, `size?: 'sm'|'md'|'lg'`, `disabled?`, `loading?`, `type?`
- Emits : `click`

#### `KuboCard.vue`

- Props : `padding?: 'none'|'sm'|'md'|'lg'`, `hoverable?: boolean`
- Slot par défaut

#### `KuboIcon.vue`

- Props : `name: string` (nom d'icône Heroicons), `size?: 'sm'|'md'|'lg'`, `class?`

#### `KuboInput.vue`

- Props : `modelValue: string`, `label?: string`, `placeholder?`, `type?`, `error?: string`, `disabled?`
- Emits : `update:modelValue`, `blur`, `focus`

#### `KuboProgressBar.vue`

- Props : `value: number` (0–100), `color?: string`, `label?: string`, `showValue?: boolean`

#### `KuboTag.vue`

- Props : `label: string`, `variant?: 'default'|'season'|'difficulty'`, `removable?: boolean`
- Emits : `remove`

---

## 11. Tests E2E (Playwright)

### Configuration (`playwright.config.js`)

| Paramètre   | Valeur                                                        |
| ----------- | ------------------------------------------------------------- |
| Base URL    | `http://localhost:5173`                                       |
| Navigateurs | Chromium uniquement                                           |
| Retries     | 2 (CI), 0 (local)                                             |
| Reporter    | HTML                                                          |
| Auth setup  | `playwright/.auth/user.json` (créé par `setup/auth.setup.js`) |

### Setup projet — `tests/e2e/setup/auth.setup.js`

Exécuté **une seule fois avant tous les tests**. Effectue un vrai login via l'UI, sauvegarde le `storageState` (tokens localStorage) dans `playwright/.auth/user.json` pour éviter les logins répétés (et le rate-limit 429 de l'API).

### Helpers — `tests/e2e/helpers.js`

```javascript
loginAs(page, role) // 'user' | 'admin' — injecte les tokens depuis le fichier auth
navigateTo(page, view) // clique sur le nav item correspondant
waitForView(page, view) // attend le data-testid de la vue
```

### Fichiers de tests

| Fichier             | Couverture                                                                   |
| ------------------- | ---------------------------------------------------------------------------- |
| `app.spec.js`       | Chargement initial, vue par défaut (`dashboard`), présence du layout         |
| `auth.spec.js`      | Ouverture modale, login succès/erreur, register, logout, persistance token   |
| `sidebar.spec.js`   | Liens de navigation, collapse, affichage conditionnel selon auth             |
| `header.spec.js`    | Titre de vue, bouton auth, avatar                                            |
| `catalog.spec.js`   | Affichage recettes, recherche, filtres, pagination, détail recette           |
| `dashboard.spec.js` | Section saison, produits de saison, suggestions recettes, CTA visiteur       |
| `planning.spec.js`  | Affichage semaine, navigation prev/next, ajout/suppression repas             |
| `groceries.spec.js` | Génération liste depuis planning, groupes, cochage items                     |
| `inventory.spec.js` | Liste items, ajout, modification, suppression, alertes expiration            |
| `settings.spec.js`  | Affichage préférences, modification (mock)                                   |
| `profile.spec.js`   | Affichage profil, édition username/email, changement mdp, upload avatar      |
| `season.spec.js`    | Saison calculée correctement, produits affichés, icônes SVG / fallback emoji |

---

## 12. Variables d'environnement

### `.env` (application)

| Variable       | Obligatoire | Description                                                |
| -------------- | ----------- | ---------------------------------------------------------- |
| `VITE_API_URL` | ✅          | URL de base de l'API Symfony (ex. `http://localhost:8000`) |
| `VITE_API_KEY` | ✅          | Clé API injectée dans le header `X-API-KEY`                |

### `.env` (tests Playwright)

| Variable             | Obligatoire | Description                    |
| -------------------- | ----------- | ------------------------------ |
| `TEST_USER_EMAIL`    | ✅          | Email du compte de test        |
| `TEST_USER_PASSWORD` | ✅          | Mot de passe du compte de test |

---

_Fin de la documentation._
