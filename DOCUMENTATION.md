# Kubo Web — Documentation technique complète

> Mise à jour le 26 avril 2026  
> Stack : Vue 3 · TypeScript · Pinia · Vite · Vitest · Playwright

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
11. [Tests unitaires (Vitest)](#11-tests-unitaires-vitest)
12. [Tests E2E (Playwright)](#12-tests-e2e-playwright)
13. [Variables d'environnement](#13-variables-denvironnement)

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
| Tests unitaires  | Vitest — stores et services                                          |
| Tests E2E        | Playwright — auth persistée dans `playwright/.auth/user.json`        |
| Icons saison     | OpenMoji 15 (CC BY-SA 4.0), SVG locaux                               |

---

## 2. Architecture générale

```
src/
├── main.ts                  # Bootstrap Vue + Pinia
├── App.vue                  # Racine : routing virtuel + init auth
├── types/                   # Interfaces TypeScript
├── services/                # Couche API (appels HTTP réels via httpClient)
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
  id: string // UUID Symfony
  email: string
  firstName?: string
  lastName?: string
  role: UserRole
  roles: string[] // rôles bruts Symfony ex. ['ROLE_USER']
  createdAt?: string
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
  id: number | string
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
  season?: string[]
}
```

> **Note** : `recipeService` expose une méthode `toArray()` pour normaliser les champs `ingredients`, `steps`, `nutrition` qui arrivent parfois comme `{ "0": ..., "1": ... }` depuis l'API Symfony.

### `src/types/planning.ts`

```typescript
interface PlanningEntry {
  id: string
  week: string // ex. '2026-W18'
  recette: { id: string; title: string }
  portions: number
  done: boolean
}

interface PlanningMeta {
  week: string
  totalEntries: number
}

interface PlanningResponse {
  data: PlanningEntry[]
  meta: PlanningMeta
}

interface CreatePlanningEntry {
  recetteId: string
  week: string
  portions: number
}
type UpdatePlanningEntry = Partial<{ portions: number; done: boolean }>
```

### `src/types/shopping.ts`

```typescript
interface ShoppingItem {
  id: string
  ingredientName: string
  quantity: number | null
  unit: string | null
  category: string | null
  checked: boolean
  source: 'planning' | 'manual'
}

interface ShoppingList {
  id: string
  week: string
  items: ShoppingItem[]
}

interface CreateShoppingItem {
  week: string
  ingredientName: string
  quantity?: number
  unit?: string
  category?: string
}
```

### `src/types/inventory.ts`

```typescript
type InventoryItemStatus = 'ok' | 'expiring_soon' | 'expired' | null

interface InventoryItem {
  id: string
  name: string
  quantity: number
  unit: string | null
  category: string | null
  expiresAt: string | null // 'YYYY-MM-DD'
  daysUntilExpiry: number | null
  status: InventoryItemStatus
}

interface CreateInventoryItem {
  name: string
  quantity: number
  unit?: string
  category?: string
  expiresAt?: string
}

type UpdateInventoryItem = Partial<CreateInventoryItem>

interface InventoryFilters {
  category?: string
  expiring_soon?: boolean
}
```

### `src/types/settings.ts`

```typescript
interface UserSettings {
  portionsDefault: number
  mealsGoal: number
  viewMode: 'week' | 'list'
  dietaryPrefs: string[]
  notifications: { planningReminder: boolean; expiryAlert: boolean }
}
```

---

## 4. Services

Tous les services utilisent `httpClient` (Axios préconfiguré). **Aucun service n'est mocké** — tous effectuent de vrais appels HTTP.

### `src/services/httpClient.ts`

| Aspect               | Détail                                                                                                         |
| -------------------- | -------------------------------------------------------------------------------------------------------------- |
| Base URL             | `import.meta.env.VITE_API_URL`                                                                                 |
| Header par défaut    | `X-API-KEY: VITE_API_KEY`                                                                                      |
| Intercepteur requête | Injecte `Authorization: Bearer <token>`                                                                        |
| Intercepteur réponse | Sur 401 → tente `authService.refreshToken()` puis rejoue la requête ; si refresh échoue → `authStore.logout()` |

---

### `src/services/tokenService.ts`

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

---

### `src/services/userService.ts`

| Méthode                   | Endpoint              | Description                                                              |
| ------------------------- | --------------------- | ------------------------------------------------------------------------ |
| `getUser()`               | `GET /user`           | Retourne le profil complet `User` depuis l'API                           |
| `getUserFromToken()`      | —                     | Décode le JWT local, retourne `{ id, email, role, roles }` (sans réseau) |
| `updateProfile(payload)`  | `PATCH /user`         | Corps `UpdateProfilePayload`, retourne `{ firstName, lastName, email }`  |
| `changePassword(payload)` | `POST /user/password` | Corps `ChangePasswordPayload` (void)                                     |

---

### `src/services/recipeService.ts`

| Méthode                            | Endpoint             | Description                                                                                    |
| ---------------------------------- | -------------------- | ---------------------------------------------------------------------------------------------- |
| `getRecipes(page, limit, filters)` | `GET /recettes`      | Params : `page`, `limit`, filtres optionnels. Retourne `PaginatedResponse<RecipeListItem>`     |
| `getRecipeById(id)`                | `GET /recettes/{id}` | Recette détaillée mappée depuis `RecetteDetailDto`                                             |
| `getCatalogue(page, limit, week?)` | `GET /catalogue`     | Params : `page`, `limit`, `week?`. Retourne `CatalogueResponse` avec `selectionSize` et `week` |
| `toArray(value)`                   | —                    | Helper interne : normalise array ou Record indexé → array                                      |

---

### `src/services/planningService.ts`

| Méthode                 | Endpoint                | Description                               |
| ----------------------- | ----------------------- | ----------------------------------------- |
| `getPlanning(week)`     | `GET /planning`         | Param `week`. Retourne `PlanningResponse` |
| `addEntry(payload)`     | `POST /planning`        | Retourne `PlanningEntry`                  |
| `updateEntry(id, data)` | `PATCH /planning/{id}`  | Retourne `PlanningEntry` mis à jour       |
| `removeEntry(id)`       | `DELETE /planning/{id}` | void                                      |

---

### `src/services/shoppingService.ts`

| Méthode                      | Endpoint                      | Description                                     |
| ---------------------------- | ----------------------------- | ----------------------------------------------- |
| `getList(week)`              | `GET /shopping`               | Retourne `{ data: ShoppingList \| null }`       |
| `generateFromPlanning(week)` | `POST /shopping/generate`     | Retourne `ShoppingList` générée depuis planning |
| `addItem(payload)`           | `POST /shopping`              | Retourne `ShoppingItem`                         |
| `updateItem(id, payload)`    | `PATCH /shopping/items/{id}`  | Retourne `ShoppingItem` mis à jour              |
| `removeItem(id)`             | `DELETE /shopping/items/{id}` | void                                            |
| `clearList(week)`            | `DELETE /shopping`            | Vide la liste de la semaine                     |

---

### `src/services/inventoryService.ts`

| Méthode                 | Endpoint                 | Description                         |
| ----------------------- | ------------------------ | ----------------------------------- |
| `getInventory(filters)` | `GET /inventory`         | Retourne `InventoryResponse`        |
| `addItem(payload)`      | `POST /inventory`        | Retourne `InventoryItem`            |
| `updateItem(id, data)`  | `PATCH /inventory/{id}`  | Retourne `InventoryItem` mis à jour |
| `removeItem(id)`        | `DELETE /inventory/{id}` | void                                |

---

### `src/services/settingsService.ts`

| Méthode                | Endpoint          | Description                        |
| ---------------------- | ----------------- | ---------------------------------- |
| `getSettings()`        | `GET /settings`   | Retourne `UserSettings`            |
| `updateSettings(data)` | `PATCH /settings` | Retourne `UserSettings` mis à jour |

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

| Action                  | Description                                                                                                           |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `tryRefresh()`          | Appelé au boot dans `App.vue` — vérifie/rafraîchit le token silencieusement                                           |
| `login(credentials)`    | `POST /login` → stocke les tokens, décode le user, initialise `userStore` + `shoppingStore`, navigue vers `dashboard` |
| `register(credentials)` | `POST /register` (void) → navigue vers `login`                                                                        |
| `logout()`              | Efface les tokens, remet `user` à null, navigue vers `catalog`                                                        |
| `forceLogout()`         | Idem mais appelé par `httpClient` en cas de refresh échoué (sans await)                                               |

---

### `src/stores/userStore.ts`

**État**

```typescript
user: User | null
settings: UserSettings | null
```

**Getters (computed depuis settings)**

- `portions` — `settings.portionsDefault` ou `2` par défaut
- `mealsGoal` — `settings.mealsGoal` ou `5` par défaut
- `viewMode` — `settings.viewMode` ou `'week'` par défaut

**Actions**

| Action                    | Description                                                            |
| ------------------------- | ---------------------------------------------------------------------- |
| `init()`                  | `GET /user` (avec fallback `getUserFromToken()`) + `GET /settings`     |
| `updateProfile(payload)`  | `PATCH /user` → met à jour `user.firstName/lastName/email` localement  |
| `changePassword(payload)` | `POST /user/password`                                                  |
| `updatePortions(delta)`   | `PATCH /settings` avec `portionsDefault` incrémenté/décrémenté (min 1) |
| `updateMealsGoal(delta)`  | `PATCH /settings` avec `mealsGoal` incrémenté/décrémenté (min 1)       |
| `switchViewMode(mode)`    | `PATCH /settings` avec `viewMode`                                      |

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
weeklySelectionSize: number
currentWeek: string
```

**Getters**

- `recipesWithPrice` — enrichit chaque recette avec `totalPrice` calculé depuis `portions`
- `weeklySelection` — les `weeklySelectionSize` premières recettes (sélection scorée)
- `catalogueRest` — recettes après la sélection
- `filteredRecipes` — filtre `catalogueRest` (ou toutes si filtre actif)
- `hasActiveFilters`, `allCategories`, `allTags`
- `catalogHasMore` — `catalogPage < catalogPages`

**Actions**

| Action                   | Description                                                             |
| ------------------------ | ----------------------------------------------------------------------- |
| `init()`                 | `GET /catalogue` (page 1) — guard anti-double-appel                     |
| `loadMoreRecipes()`      | `GET /catalogue` (page suivante) — append à `recipes`                   |
| `fetchDetail(id)`        | `GET /recettes/{id}` — enrichit la recette dans `recipes[]`, avec cache |
| `setFilterCategory(cat)` | Met à jour `filters.category`                                           |
| `setFilterMaxTime(time)` | Met à jour `filters.maxTime`                                            |
| `toggleFilterTag(tag)`   | Ajoute/retire un tag de `filters.activeTags`                            |
| `setSearch(value)`       | Met à jour `filters.search`                                             |
| `resetFilters()`         | Réinitialise tous les filtres                                           |

---

### `src/stores/planningStore.ts`

**État**

```typescript
entries: PlanningEntry[]   // liste des recettes planifiées pour la semaine courante
meta: PlanningMeta | null
currentDate: Date
loading: boolean
error: string | null
```

**Getters**

- `weekKey` — clé semaine courante format `"2026-W18"` (ISO)
- `weekRange` / `periodLabel` — plage FR ex: `"21 avr. — 27 avr."`
- `selectedRecipes` — recettes ayant une `PlanningEntry` pour la semaine, enrichies via `recipeStore`
- `doneRecipes` — sous-ensemble de `selectedRecipes` avec `done: true`
- `nutritionTotals` — somme `{ prot, fat, carb }` ou `null` si aucune recette
- `totalPrice`, `avgPrice`

**Actions**

| Action                | Description                                                                                                                       |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `init()`              | `GET /planning?week=...` → charge `entries` et `meta`                                                                             |
| `changePeriod(delta)` | Décale `currentDate` de ±`delta` semaines puis rappelle `init()`                                                                  |
| `toggleRecipe(id)`    | Ajoute (`POST /planning`) ou retire (`DELETE /planning/{id}`) une recette ; **puis régénère automatiquement la liste de courses** |
| `markAsDone(id)`      | `PATCH /planning/{id}` → toggle `done` + toast                                                                                    |
| `clearPlanning()`     | `DELETE` sur toutes les entries + toast ; **puis régénère automatiquement la liste de courses**                                   |
| `isSelected(id)`      | Getter booléen non réactif                                                                                                        |
| `isDone(id)`          | Getter booléen non réactif                                                                                                        |

> **Régénération automatique des courses** : `toggleRecipe` et `clearPlanning` appellent `shoppingStore.generate()` après modification du planning (import dynamique pour éviter la dépendance circulaire).

---

### `src/stores/shoppingStore.ts`

**État**

```typescript
list: ShoppingList | null
loading: boolean
error: string | null
```

**Getters**

- `itemsByCategory` — `Record<string, ShoppingItem[]>` groupé par catégorie
- `checkedCount` — nombre d'items cochés
- `totalCount` — nombre total d'items

**Actions**

| Action             | Description                                                                                                            |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `init()`           | Alias de `fetchList()`                                                                                                 |
| `fetchList(week?)` | `GET /shopping` — charge la liste existante ou null                                                                    |
| `generate()`       | `POST /shopping/generate` — génère la liste depuis le planning courant                                                 |
| `addItem(payload)` | `POST /shopping` — ajoute un item manuellement                                                                         |
| `toggleItem(id)`   | `PATCH /shopping/items/{id}` — coche/décoche un item (remplace l'item dans le tableau pour garantir la réactivité Vue) |
| `removeItem(id)`   | `DELETE /shopping/items/{id}` — supprime un item                                                                       |
| `clearList()`      | `DELETE /shopping` — vide toute la liste                                                                               |

---

### `src/stores/inventoryStore.ts`

**État**

```typescript
items: InventoryItem[]
loading: boolean
error: string | null
```

**Getters**

- `expiringSoon` — items avec `status === 'expiring_soon'`
- `expired` — items avec `status === 'expired'`
- `itemsByCategory` — `Record<string, InventoryItem[]>` groupé par catégorie

**Actions**

| Action                     | Description                          |
| -------------------------- | ------------------------------------ |
| `fetchInventory(filters?)` | `GET /inventory` — charge les items  |
| `addItem(payload)`         | `POST /inventory` — ajoute un item   |
| `updateItem(id, data)`     | `PATCH /inventory/{id}` — met à jour |
| `removeItem(id)`           | `DELETE /inventory/{id}` — supprime  |

---

### `src/stores/uiStore.ts`

Store de navigation virtuelle et d'état UI global.

**État**

```typescript
currentView: ViewName
isAuthModalOpen: boolean
authModalMode: 'login' | 'register'
toast: { message: string; type: 'success'|'error'|'info'; visible: boolean } | null
isSidebarCollapsed: boolean
isDarkMode: boolean
```

**Actions**

| Action                 | Description                      |
| ---------------------- | -------------------------------- |
| `navTo(view)`          | Change `currentView`             |
| `openAuthModal(mode?)` | Ouvre la modale d'auth           |
| `closeAuthModal()`     | Ferme la modale d'auth           |
| `notify(message)`      | Affiche un toast (auto-hide 3 s) |
| `setDarkMode(bool)`    | Active/désactive le mode sombre  |
| `toggleSidebar()`      | Collapse/expand la sidebar       |

---

### `src/stores/seasonStore.ts`

**État**

```typescript
currentSeason: Season
seasonalProducts: { fruits: SeasonalProduct[]; vegetables: SeasonalProduct[] }
isLoading: boolean
```

**Getters** : `seasonLabel`, `seasonEmoji`

**Actions** : `fetchSeasonalProducts()`, `refreshSeason()`

---

## 6. Composables

### `src/composables/useFeatureAccess.ts`

```typescript
function useFeatureAccess(): {
  canAccess: (feature: string) => boolean
  requireAuth: (feature: string) => boolean
}
```

Wrapper réactif autour de `featureAccessService.canAccess()`, utilise `authStore.currentRole`.

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

1. Normalisation : `toLowerCase()` + suppression diacritiques + trim
2. Recherche exacte dans la table
3. Recherche partielle (inclusion dans les deux sens)
4. Fallback : `url: ''` + emoji `🍎` (fruit) ou `🌿` (légume)

**Couverture** : ~45 légumes et ~35 fruits, avec aliases (ex. `butternut` → SVG `courge`).

---

## 9. Vues

Toutes les vues sont chargées dans `App.vue` via `v-if` sur `uiStore.currentView`.

### `DashboardView.vue`

- **Accès** : tous (visiteurs voient une version réduite)
- **Stores** : `seasonStore`, `recipeStore`, `authStore`
- **Contenu** : section saison courante + suggestions de recettes de saison + CTA connexion pour visiteurs

---

### `CatalogView.vue`

- **Accès** : tous
- **Stores** : `recipeStore`, `uiStore`, `userStore`
- **Fonctionnalités** : recherche texte, filtres (tags, difficulté, saison), pagination, ouverture `RecipeDetailModal`

---

### `PlanningView.vue`

- **Accès** : `user`, `admin`
- **Stores** : `planningStore`, `recipeStore`
- **Fonctionnalités** : navigation semaine (prev/next), affichage des recettes planifiées, ajout/suppression via `toggleRecipe`

---

### `GroceriesView.vue`

- **Accès** : `user`, `admin`
- **Stores** : `shoppingStore`, `planningStore`
- **Comportement au montage** : `fetchList()` → si aucune liste, `generate()` automatiquement
- **Régénération automatique** : toute modification du planning (`toggleRecipe`, `clearPlanning`) déclenche `generate()` en arrière-plan
- **Fonctionnalités** : liste groupée par catégorie, cochage/décochage des items, ajout manuel, suppression, bouton "Regénérer" pour forcer une mise à jour

---

### `InventoryView.vue`

- **Accès** : `user`, `admin`
- **Stores** : `inventoryStore`
- **Comportement au montage** : `fetchInventory()` automatique
- **Fonctionnalités** :
  - Liste des items groupés par catégorie
  - Badges en stock / bientôt périmés / périmés dans le header
  - Formulaire d'ajout inline (nom, quantité, unité, catégorie, date d'expiration)
  - Suppression d'items
  - Mise en évidence visuelle des items `expiring_soon` (jaune) et `expired` (rouge)

---

### `SettingsView.vue`

- **Accès** : `user`, `admin`
- **Stores** : `userStore`
- **Fonctionnalités** : préférences alimentaires, portions par défaut, objectif repas, mode d'affichage, notifications

---

### `ProfileView.vue`

- **Accès** : `user`, `admin`
- **Stores** : `userStore`, `authStore`
- **Fonctionnalités** : affichage/édition du profil, changement de mot de passe (icône cadenas sur les champs), règles de mot de passe via `usePasswordRules`

---

## 10. Composants

### Layout

#### `AppSidebar.vue`

- Navigation principale desktop
- Stores : `uiStore`, `authStore`, `userStore`
- `data-testid` : `sidebar`, `nav-*`, `sidebar-toggle`

#### `AppHeader.vue`

- Barre supérieure mobile et desktop
- Stores : `uiStore`, `authStore`, `userStore`

#### `AppBottomNav.vue`

- Navigation bas d'écran mobile uniquement (`md:hidden`)
- Stores : `uiStore`, `authStore`
- `data-testid` : `bottom-nav`, `bottom-nav-*`

#### `ToastNotification.vue`

- Toast global (succès / erreur / info), auto-hide 3 s
- Stores : `uiStore`

---

### Auth

#### `AuthModal.vue`

- Modale d'authentification — affiche `AuthLoginForm` ou `AuthRegisterForm`

#### `AuthLoginForm.vue`

- Stores : `authStore`, `uiStore`
- `data-testid` : `login-form`, `login-email`, `login-password`, `login-submit`

#### `AuthRegisterForm.vue`

- Composable : `usePasswordRules`
- `data-testid` : `register-form`, `register-email`, `register-username`, `register-password`, `register-submit`

---

### Recipes

#### `RecipeCard.vue`

- Props : `recipe: Recipe`, `showActions?: boolean`
- `data-testid` : `recipe-card-{id}`

#### `RecipeDetailModal.vue`

- Props : `recipe: Recipe`
- Composants enfants : `RecipeIngredientList`, `RecipeStepList`, `MacroBar`, `NutritionLegendItem`

#### `FilterModal.vue`

- Props : `modelValue: RecipeFilters`
- Emits : `update:modelValue`, `close`, `apply`

---

### Planning

#### `PlanningCard.vue`

- Props : `entry?: PlanningEntry`, `date: string`, `mealType: MealType`
- Emits : `add`, `remove`

---

### Shopping

#### `GroceryGroup.vue`

- Props : `category: string`, `items: GroceryItem[]`
- Emits : `toggle-item`

---

### Dashboard

#### `DashboardSeasonSection.vue`

- Stores : `seasonStore`
- Data : `getSeasonImage()` depuis `src/data/seasonImages.ts`

---

### UI (Design System)

#### `KuboButton.vue`

Props : `variant?: 'primary'|'secondary'|'ghost'|'danger'`, `size?: 'sm'|'md'|'lg'`, `disabled?`, `loading?`

#### `KuboCard.vue`

Props : `padding?: 'none'|'sm'|'md'|'lg'`, `hoverable?: boolean`

#### `KuboIcon.vue`

Props : `name: string` (Lucide icons), `size?: number`

Icônes disponibles (non exhaustif) : `package`, `shopping-cart`, `list-checks`, `rotate-ccw`, `check`, `plus`, `x`, `x-circle`, `alert-triangle`, `box`, `lock`, `key`, `eye`, `eye-off`, `check-circle`, `alert-circle`, `log-in`, `log-out`, `mail`, `save`, et autres icônes Lucide.

#### `KuboInput.vue`

Props : `modelValue: string`, `label?`, `placeholder?`, `type?`, `error?`, `disabled?`

#### `KuboProgressBar.vue`

Props : `value: number` (0–100), `color?`, `label?`, `showValue?`

#### `KuboTag.vue`

Props : `label: string`, `variant?: 'default'|'season'|'difficulty'`, `removable?`
Emits : `remove`

---

## 11. Tests unitaires (Vitest)

### Configuration (`vite.config.ts`)

- Runner : Vitest
- Environment : `jsdom`
- Include : `src/__tests__/**/*.spec.ts` uniquement
- Setup : Pinia recréée via `setActivePinia(createPinia())` dans chaque `beforeEach`

### Fichiers de tests

| Fichier                        | Couverture                                                                 |
| ------------------------------ | -------------------------------------------------------------------------- |
| `tokenService.spec.ts`         | Lecture/écriture/suppression tokens, détection expiration JWT              |
| `featureAccessService.spec.ts` | Matrice de permissions pour tous les rôles et features                     |
| `useSeason.spec.ts`            | Calcul saison selon le mois, labels FR, emojis                             |
| `planningStore.spec.ts`        | Init, toggleRecipe (ajout/retrait), markAsDone, clearPlanning (tous async) |
| `shoppingStore.spec.ts`        | fetchList, generate, addItem, toggleItem, removeItem, clearList, computeds |
| `inventoryStore.spec.ts`       | fetchInventory, addItem, updateItem, removeItem, filtres expiration        |
| `userStore.spec.ts`            | init (getUser + fallback token), updateProfile, updatePortions, viewMode   |

### Conventions de mock

- `vi.mock('@/services/...')` pour tous les services HTTP
- `vi.hoisted()` pour les fixtures référencées dans les factories `vi.mock`
- Import dynamique `await import(...)` pour les stores avec dépendances circulaires

---

## 12. Tests E2E (Playwright)

### Configuration (`playwright.config.js`)

| Paramètre   | Valeur                                                        |
| ----------- | ------------------------------------------------------------- |
| Base URL    | `http://localhost:5173`                                       |
| Navigateurs | Chromium uniquement                                           |
| Retries     | 2 (CI), 0 (local)                                             |
| Reporter    | HTML                                                          |
| Auth setup  | `playwright/.auth/user.json` (créé par `setup/auth.setup.js`) |

### Setup projet — `tests/e2e/setup/auth.setup.js`

Exécuté une seule fois avant tous les tests. Effectue un vrai login via l'UI, sauvegarde le `storageState` (tokens localStorage) pour éviter les logins répétés.

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
| `groceries.spec.js` | Génération automatique à l'ouverture, groupes, cochage items                 |
| `inventory.spec.js` | Liste items, ajout via formulaire, suppression, alertes expiration           |
| `settings.spec.js`  | Affichage préférences, modification                                          |
| `profile.spec.js`   | Affichage profil, édition, changement mdp                                    |
| `season.spec.js`    | Saison calculée correctement, produits affichés, icônes SVG / fallback emoji |

---

## 13. Variables d'environnement

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
