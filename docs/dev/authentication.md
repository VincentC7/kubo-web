# Authentification & Gestion des accès

## Vue d'ensemble

Système d'authentification JWT double-couche implémenté côté SPA (Vue 3 + Pinia + Axios).  
Chaque requête vers l'API Symfony transmet obligatoirement une clé applicative (`X-Api-Key`) et, pour les routes protégées, un Bearer token JWT.

---

## Architecture

```
src/
├── types/
│   ├── auth.ts               # UserRole, JwtPayload, LoginPayload, RegisterPayload, AuthTokens
│   └── user.ts               # User (email, role: UserRole)
├── services/
│   ├── tokenService.ts       # CRUD localStorage + décodage JWT + détection expiration
│   ├── authService.ts        # Appels API : /register, /login, /token/refresh
│   ├── featureAccessService.ts  # Matrice de permissions + can(role, feature)
│   └── httpClient.ts         # Axios : interceptors X-Api-Key + Bearer + retry 401
├── composables/
│   └── useFeatureAccess.ts   # Composable can(feature) pour les templates Vue
├── stores/
│   └── authStore.ts          # State auth, actions login/logout/register/tryRefresh
└── views/
    ├── LoginView.vue          # Formulaire connexion
    ├── RegisterView.vue       # Formulaire inscription + validation
    └── ProfileView.vue        # Espace utilisateur (lecture seule)
```

---

## Double sécurité API

Toutes les requêtes transmettent :

| Header          | Valeur                  | Obligatoire                 |
| --------------- | ----------------------- | --------------------------- |
| `X-Api-Key`     | `VITE_API_KEY` (env)    | Toujours                    |
| `Authorization` | `Bearer <access_token>` | Routes protégées uniquement |

Injectés automatiquement par les interceptors Axios dans `httpClient.ts`.

---

## Endpoints consommés

| Méthode | Endpoint                  | Auth                           | Description                     |
| ------- | ------------------------- | ------------------------------ | ------------------------------- |
| `POST`  | `/api/register`           | X-Api-Key                      | Création de compte              |
| `POST`  | `/api/login`              | X-Api-Key                      | Login → tokens                  |
| `POST`  | `/api/token/refresh`      | X-Api-Key                      | Refresh du token                |
| `GET`   | `/api/catalogue`          | X-Api-Key (+ Bearer optionnel) | Recettes de la semaine (public) |
| `GET`   | `/api/recettes`           | X-Api-Key + Bearer             | Liste des recettes              |
| `GET`   | `/api/recettes/:uuid`     | X-Api-Key + Bearer             | Détail recette                  |
| `GET`   | `/api/ingredients/saison` | X-Api-Key + Bearer             | Ingrédients de saison           |

---

## Tokens

### Stockage

| Token           | Durée      | Stockage                                  |
| --------------- | ---------- | ----------------------------------------- |
| `access_token`  | 15 minutes | `localStorage` (clé `kubo_token`)         |
| `refresh_token` | 7 jours    | `localStorage` (clé `kubo_refresh_token`) |

### Payload JWT (Symfony)

```json
{
  "iat": 1745496000,
  "exp": 1745496900,
  "roles": ["ROLE_USER"],
  "username": "user@example.com"
}
```

Le user est entièrement **décodé depuis le JWT** via `atob()` — aucun appel `/me` nécessaire.  
Mapping des rôles Symfony → `UserRole` :

| Symfony      | SPA       |
| ------------ | --------- |
| `ROLE_ADMIN` | `admin`   |
| `ROLE_USER`  | `user`    |
| _(absent)_   | `visitor` |

### Refresh automatique

Flux géré par l'interceptor response d'Axios (`httpClient.ts`) :

```
Requête → 401
  └─ refresh_token présent ?
       ├─ Oui → POST /api/token/refresh
       │         ├─ Succès → nouveaux tokens → rejouer la requête originale
       │         └─ Échec  → clearTokens() → forceLogout() → navTo('login')
       └─ Non → clearTokens() → forceLogout() → navTo('login')
```

- Flag `_retry` sur la requête pour éviter les boucles infinies
- File d'attente (`refreshQueue`) si plusieurs requêtes simultanées arrivent pendant un refresh
- Marge de **30 secondes** pour le refresh proactif (détection avant expiration réelle)
- Les requêtes vers `/token/refresh` et `/login` sont exclues du retry

---

## Boot de l'application

`App.vue` — séquence au `onMounted` :

```
1. authStore.tryRefresh()
      refresh_token en localStorage ?
        Oui + token valide  → décoder le user → currentRole = 'user' | 'admin'
        Oui + token expiré  → POST /token/refresh → décoder → currentRole = 'user' | 'admin'
        Non / échec refresh → currentRole = 'visitor'

2. Vue initiale
      isAuthenticated → navTo('dashboard')
      visitor         → navTo('catalog')

3. Init stores
      Toujours : userStore.init(), recipeStore.init()  (catalogue = public)
      Si connecté uniquement : planningStore.init(), inventoryStore.init()
```

---

## Rôles & permissions

### Niveaux d'accès

| Rôle      | Description                               |
| --------- | ----------------------------------------- |
| `visitor` | Non connecté. Accès catalogue uniquement. |
| `user`    | Connecté. Accès complet à l'application.  |
| `admin`   | Connecté avec droits étendus (réservé).   |

### Matrice de permissions (`featureAccessService.ts`)

| Feature              | visitor | user | admin |
| -------------------- | ------- | ---- | ----- |
| `view:catalog`       | ✓       | ✓    | ✓     |
| `view:dashboard`     | —       | ✓    | ✓     |
| `view:planning`      | —       | ✓    | ✓     |
| `view:groceries`     | —       | ✓    | ✓     |
| `view:inventory`     | —       | ✓    | ✓     |
| `view:settings`      | —       | ✓    | ✓     |
| `view:profile`       | —       | ✓    | ✓     |
| `nav:link:catalog`   | ✓       | ✓    | ✓     |
| `nav:link:dashboard` | —       | ✓    | ✓     |
| `nav:link:planning`  | —       | ✓    | ✓     |
| `nav:link:groceries` | —       | ✓    | ✓     |
| `nav:link:inventory` | —       | ✓    | ✓     |
| `nav:link:settings`  | —       | ✓    | ✓     |

### Usage dans les composants

```vue
<script setup>
import { useFeatureAccess } from '@/composables/useFeatureAccess'
const { can } = useFeatureAccess()
</script>

<template>
  <NavLink v-if="can('view:planning')" />
</template>
```

La matrice est statique pour l'instant. Elle est conçue pour être remplacée par une réponse API (`GET /api/features`) sans modifier les composants.

---

## Vues d'authentification

### LoginView

- Formulaire email + password (affichage toggle)
- Erreur 401 → "Email ou mot de passe incorrect"
- Cooldown 3s + bouton désactivé pendant le chargement
- Lien vers RegisterView

### RegisterView

- Formulaire email + password
- Validation frontend en temps réel :
  - 8 caractères minimum
  - 1 majuscule
  - 1 chiffre
- Gestion des erreurs API :
  - `400` → erreurs par champ
  - `409` → "Un compte existe déjà avec cet email"
  - `429` → "Trop de tentatives. Réessayez dans 1 heure."
- Cooldown 3s après erreur
- `201` → navTo('login') avec message de succès

### ProfileView

- Affiche email + rôle (badge coloré)
- Modification de profil désactivée (prévu)
- Bouton déconnexion → `authStore.logout()` → navTo('catalog')

---

## Variables d'environnement

| Variable       | Dev                             | Prod                           |
| -------------- | ------------------------------- | ------------------------------ |
| `VITE_API_URL` | `/api` (proxy Vite, évite CORS) | `https://api.kubo.app/api`     |
| `VITE_API_KEY` | Clé de développement            | Clé de production (différente) |

En dev, le proxy Vite redirige `/api/*` → `http://localhost:8000/*`, évitant les erreurs CORS sans configuration backend supplémentaire.

---

## Gestion des erreurs

| Code                 | Contexte              | Comportement SPA                  |
| -------------------- | --------------------- | --------------------------------- |
| `401` route publique | X-Api-Key invalide    | Erreur critique (config)          |
| `401` route protégée | Token expiré          | Refresh automatique, sinon logout |
| `401` `/login`       | Mauvaises credentials | "Email ou mot de passe incorrect" |
| `400`                | Données invalides     | Erreurs affichées par champ       |
| `403`                | Rôle insuffisant      | "Accès refusé"                    |
| `409` `/register`    | Email déjà utilisé    | Message dédié                     |
| `429` `/register`    | Rate limit (3/h/IP)   | "Réessayez dans 1 heure"          |

---

## Évolutions prévues

- Modification du profil (email, mot de passe)
- Récupération de mot de passe
- Chargement dynamique de la matrice de permissions depuis `GET /api/features`
- Migration du `refresh_token` vers un cookie `httpOnly` (si SSR activé)
