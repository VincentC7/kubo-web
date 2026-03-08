# kubo-web

> Frontend de **kubo** — application de gestion alimentaire personnelle pour planifier ses repas, gérer ses recettes et optimiser ses courses du quotidien.

---

## 🎯 Description du projet

**kubo-web** est l'interface utilisateur de l'application **kubo**, une SPA Vue 3 qui aide à :

- 🥗 **Manger plus sainement** — suivre l'équilibre nutritionnel des repas de la semaine
- 💰 **Faire des économies** — générer une liste de courses optimisée depuis le planning
- 😋 **Cuisiner avec plaisir** — choisir et organiser ses recettes selon ses envies et ses stocks

---

## ✨ Fonctionnalités

### 📖 Gestion des recettes
- Créer, modifier et supprimer des recettes personnelles
- Associer des ingrédients avec quantités et unités
- Catégoriser (entrée, plat, dessert, snack…) et taguer (végétarien, rapide, économique, healthy…)
- Filtrer et rechercher par tags, ingrédients disponibles, temps de préparation
- Évaluer et noter ses recettes favorites

### 🗓️ Planification des repas
- Planifier la semaine : petit-déjeuner, déjeuner, dîner
- Visualiser le planning hebdomadaire
- Adapter les portions selon le nombre de personnes

### 🛒 Liste de courses intelligente
- Génération automatique depuis le planning de la semaine
- Regroupement des ingrédients par catégorie (légumes, viandes, épicerie…)
- Déduction des ingrédients déjà disponibles dans le garde-manger
- Estimation du coût approximatif des courses
- Export et partage de la liste

### 🏪 Gestion du garde-manger
- Inventaire des ingrédients disponibles à la maison
- Suggestion de recettes réalisables avec les stocks actuels
- Alertes sur les produits bientôt périmés

### 🥦 Suivi nutritionnel _(optionnel)_
- Apports nutritionnels par repas et par journée
- Indicateur d'équilibre alimentaire du planning
- Mise en avant des recettes saines selon des critères définis

---

## Stack technique

| Technologie | Version |
|---|---|
| [Vue](https://vuejs.org/) | `^3.5.29` |
| [Vite](https://vite.dev/) | `^7.3.1` |
| [@vitejs/plugin-vue](https://github.com/vitejs/vite-plugin-vue) | `^6.0.4` |
| [vite-plugin-vue-devtools](https://devtools.vuejs.org/) | `^8.0.6` |
| Node.js | `^20.19.0 \|\| >=22.12.0` |

---

## Prérequis

- **Node.js** `^20.19.0` ou `>=22.12.0`  
  *(Utiliser [nvm](https://github.com/nvm-sh/nvm) ou [fnm](https://github.com/Schniz/fnm) est recommandé)*
- **npm** `>=10`

---

## Installation

```bash
npm install
```

> L'alias `@` est configuré pour pointer vers `src/`, utilisez-le dans tous vos imports.

---

## Scripts disponibles

| Commande | Description |
|---|---|
| `npm run dev` | Lance le serveur de développement avec hot-reload |
| `npm run build` | Compile l'application pour la production dans `dist/` |
| `npm run preview` | Prévisualise le build de production localement |

---

## Structure du projet

```
kubo-web/
├── index.html              # Point d'entrée HTML
├── vite.config.js          # Configuration Vite
├── public/
│   └── favicon.ico         # Assets statiques (non importés)
└── src/
    ├── main.js             # Point d'entrée JavaScript
    ├── App.vue             # Composant racine
    ├── assets/
    │   ├── base.css        # Variables CSS globales
    │   ├── main.css        # Styles globaux
    │   └── logo.svg        # Logo de l'application
    └── components/
        └── icons/          # Composants d'icônes isolés
```

> ⚙️ La structure de `src/` évoluera avec l'ajout de Vue Router, Pinia et les modules métier (recettes, planning, courses, garde-manger).

---

## Configuration Vite

Le fichier [`vite.config.js`](./vite.config.js) active :
- **`@vitejs/plugin-vue`** — support des Single File Components (`.vue`)
- **`vite-plugin-vue-devtools`** — intégration des Vue DevTools dans le navigateur
- **Alias `@`** — raccourci vers `src/` pour tous les imports

---

## Environnement de développement recommandé

- **IDE** : [VS Code](https://code.visualstudio.com/) + extension [Vue - Official (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.volar)
- **Extension navigateur** : [Vue.js DevTools](https://devtools.vuejs.org/)

---

## Licence

À définir.
