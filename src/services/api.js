/**
 * kubo — Service API simulé
 * Simule des appels réseau avec délai artificiel.
 * En production, remplacer fetch() ici.
 */

const MOCK_DELAY = 400 // ms

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ---- Données de test ----

const MOCK_USER = {
  id: 1,
  name: 'Jean Dupont',
  initials: 'JD',
  role: 'Chef Kubo',
  goalKcal: 2000,
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
}

const MOCK_RECIPES = [
  {
    id: 1,
    title: 'Curry de Légumes Thaï',
    sub: 'riz coco & basilic frais',
    img: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=800&q=80',
    time: 25,
    kcal: 450,
    prot: 12,
    fat: 22,
    carb: 55,
    cat: 'Végétarien',
    difficulty: 'Facile',
    tags: ['Bio', 'Épicé', 'Frais'],
    ingredients: [
      { name: 'Pâte de curry rouge', qty: '2 c.s.', price: 3.5 },
      { name: 'Lait de coco', qty: '400 ml', price: 1.8 },
      { name: 'Aubergines', qty: '2', price: 2.2 },
      { name: 'Basilic thaï', qty: '1 botte', price: 1.5 },
    ],
    steps: [
      "Faire revenir la pâte de curry dans un wok avec un filet d'huile jusqu'à ce qu'elle soit parfumée.",
      'Verser le lait de coco et porter à frémissement.',
      'Ajouter les légumes taillés et cuire 15 min à feu doux.',
      'Dresser sur du riz jasmin, garnir de basilic frais.',
    ],
  },
  {
    id: 2,
    title: 'Bowl broccolini & labneh',
    sub: 'salsa herbes & pistaches',
    img: 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?w=800&q=80',
    time: 40,
    kcal: 840,
    prot: 21,
    fat: 32,
    carb: 45,
    cat: 'Végétarien',
    difficulty: 'Facile',
    tags: ['Végé', 'Crunchy', 'Bio'],
    ingredients: [
      { name: 'Labneh', qty: '200 g', price: 4.2 },
      { name: 'Broccolini', qty: '300 g', price: 3.8 },
      { name: "Za'atar", qty: '1 c.s.', price: 1.5 },
      { name: 'Noisettes torréfiées', qty: '40 g', price: 2.5 },
    ],
    steps: [
      "Rôtir les broccolinis au four à 200 °C pendant 20 min avec huile et za'atar.",
      'Torréfier les noisettes à sec dans une poêle.',
      'Dresser le labneh en base, poser les broccolinis, parsemer de noisettes.',
    ],
  },
  {
    id: 3,
    title: 'Lasagne végé Champignons',
    sub: 'fromage râpé & salade',
    img: 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=800&q=80',
    time: 55,
    kcal: 753,
    prot: 26,
    fat: 38,
    carb: 65,
    cat: 'Gourmet',
    difficulty: 'Moyen',
    tags: ['Gratiné', 'Gourmet'],
    ingredients: [
      { name: 'Champignons mixtes', qty: '500 g', price: 3.2 },
      { name: 'Feuilles de lasagne', qty: '12', price: 2.5 },
      { name: 'Béchamel maison', qty: '500 ml', price: 2.0 },
      { name: 'Gruyère râpé', qty: '150 g', price: 4.5 },
    ],
    steps: [
      'Faire sauter les champignons à feu vif avec ail et thym.',
      'Monter les couches : lasagne, champignons, béchamel.',
      'Terminer par du fromage et cuire 35 min à 180 °C.',
    ],
  },
  {
    id: 4,
    title: 'La Vercors aux Poires',
    sub: 'pommes de terre rôties & noix',
    img: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80',
    time: 40,
    kcal: 776,
    prot: 16,
    fat: 30,
    carb: 50,
    cat: 'Gourmet',
    difficulty: 'Facile',
    tags: ['AOP', 'Noix', 'Bio'],
    ingredients: [
      { name: 'Poires conférence', qty: '2', price: 2.8 },
      { name: 'Bleu du Vercors', qty: '120 g', price: 3.5 },
      { name: 'Pommes de terre', qty: '400 g', price: 1.5 },
      { name: 'Cerneaux de noix', qty: '50 g', price: 3.0 },
    ],
    steps: [
      'Rôtir les pommes de terre en quartiers à 200 °C pendant 30 min.',
      'Couper les poires en tranches et poêler 3 min côté chair.',
      'Griller au four avec le Bleu et les noix 5 min.',
    ],
  },
  {
    id: 5,
    title: 'Gnocchis Burrata Rosso',
    sub: 'pesto rouge & pignons',
    img: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800&q=80',
    time: 15,
    kcal: 710,
    prot: 20,
    fat: 42,
    carb: 58,
    cat: 'Express',
    difficulty: 'Facile',
    tags: ['Express', 'Gourmand'],
    ingredients: [
      { name: 'Gnocchis frais', qty: '500 g', price: 2.2 },
      { name: 'Pesto rosso', qty: '4 c.s.', price: 3.4 },
      { name: 'Burrata', qty: '1', price: 4.9 },
      { name: 'Pignons de pin', qty: '30 g', price: 2.8 },
    ],
    steps: [
      'Faire dorer les gnocchis à la poêle dans du beurre noisette.',
      'Mélanger hors du feu avec le pesto rosso.',
      'Déposer la burrata déchirée et les pignons torréfiés.',
    ],
  },
  {
    id: 6,
    title: 'Bibimbap au Bœuf',
    sub: 'légumes & œuf parfait',
    img: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=800&q=80',
    time: 40,
    kcal: 840,
    prot: 42,
    fat: 25,
    carb: 85,
    cat: 'Gourmet',
    difficulty: 'Moyen',
    tags: ['Protéines', 'Bio'],
    ingredients: [
      { name: 'Bœuf haché', qty: '300 g', price: 5.5 },
      { name: 'Riz à sushi', qty: '300 g', price: 2.8 },
      { name: 'Épinards, carottes, courgettes', qty: '300 g total', price: 3.0 },
      { name: 'Gochujang', qty: '2 c.s.', price: 4.2 },
    ],
    steps: [
      'Cuire le riz collant, assaisonner légèrement.',
      'Sauter chaque légume séparément avec sésame et sauce soja.',
      "Poêler le bœuf avec le gochujang. Dresser en bol, poser l'œuf.",
    ],
  },
  {
    id: 7,
    title: 'Saumon Laqué Teriyaki',
    sub: 'brocolis & sésame',
    img: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&q=80',
    time: 20,
    kcal: 650,
    prot: 38,
    fat: 22,
    carb: 48,
    cat: 'Express',
    difficulty: 'Facile',
    tags: ['Bio', 'Protéines', 'Frais'],
    ingredients: [
      { name: 'Pavés de saumon', qty: '2 × 150 g', price: 8.5 },
      { name: 'Sauce teriyaki', qty: '4 c.s.', price: 2.9 },
      { name: 'Brocolis', qty: '300 g', price: 2.2 },
      { name: 'Graines de sésame', qty: '1 c.s.', price: 1.0 },
    ],
    steps: [
      'Saisir le saumon côté peau 4 min, retourner 2 min.',
      'Laquer avec la sauce teriyaki et finir au four 3 min.',
      'Cuire les brocolis à la vapeur, parsemer de sésame.',
    ],
  },
  {
    id: 8,
    title: 'Poke Saumon Avocat',
    sub: 'mangue & riz vinaigré',
    img: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
    time: 15,
    kcal: 580,
    prot: 30,
    fat: 18,
    carb: 68,
    cat: 'Express',
    difficulty: 'Facile',
    tags: ['Frais', 'Léger'],
    ingredients: [
      { name: 'Saumon sashimi', qty: '200 g', price: 9.0 },
      { name: 'Avocat mûr', qty: '1', price: 1.8 },
      { name: 'Mangue', qty: '½', price: 2.5 },
      { name: 'Riz vinaigré', qty: '200 g cuit', price: 1.5 },
    ],
    steps: [
      'Préparer le riz vinaigré et laisser tiédir.',
      'Couper le saumon en dés, assaisonner avec sauce soja et sésame.',
      'Dresser le riz en base, disposer avocat, mangue et saumon.',
    ],
  },
  {
    id: 9,
    title: 'Risotto aux Asperges',
    sub: 'parmesan & citron vert',
    img: 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=800&q=80',
    time: 40,
    kcal: 610,
    prot: 14,
    fat: 25,
    carb: 78,
    cat: 'Gourmet',
    difficulty: 'Moyen',
    tags: ['Gourmet', 'Frais'],
    ingredients: [
      { name: 'Riz Arborio', qty: '300 g', price: 3.2 },
      { name: 'Asperges vertes', qty: '500 g', price: 4.5 },
      { name: 'Parmesan', qty: '80 g', price: 3.8 },
      { name: 'Citron vert', qty: '1', price: 0.8 },
    ],
    steps: [
      'Nacrer le riz dans du beurre et échalote ciselée.',
      'Mouiller progressivement avec le bouillon chaud.',
      'En fin de cuisson, lier avec parmesan et beurre, ajouter les asperges.',
    ],
  },
  {
    id: 10,
    title: 'Tacos Poulet Salsa',
    sub: 'avocat & coriandre',
    img: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&q=80',
    time: 20,
    kcal: 550,
    prot: 32,
    fat: 20,
    carb: 45,
    cat: 'Express',
    difficulty: 'Facile',
    tags: ['Express', 'Épicé'],
    ingredients: [
      { name: 'Tortillas blé', qty: '4', price: 2.0 },
      { name: 'Blanc de poulet', qty: '300 g', price: 5.0 },
      { name: 'Avocat', qty: '1', price: 1.8 },
      { name: 'Salsa tomate', qty: '3 c.s.', price: 2.5 },
    ],
    steps: [
      "Mariner le poulet dans cumin, paprika, huile d'olive 10 min.",
      'Griller à feu vif 4 min de chaque côté, trancher.',
      'Garnir les tortillas chaudes avec poulet, avocat, salsa et coriandre.',
    ],
  },
]

// ---- Endpoints simulés ----

export const apiService = {
  /** Récupère le profil utilisateur courant */
  async getUser() {
    await sleep(MOCK_DELAY)
    return { ...MOCK_USER }
  },

  /** Récupère toutes les recettes */
  async getRecipes() {
    await sleep(MOCK_DELAY)
    return MOCK_RECIPES.map((r) => ({ ...r }))
  },

  /** Récupère une recette par son id */
  async getRecipeById(id) {
    await sleep(MOCK_DELAY / 2)
    const recipe = MOCK_RECIPES.find((r) => r.id === id)
    if (!recipe) throw new Error(`Recette #${id} introuvable`)
    return { ...recipe }
  },

  /** Sauvegarde le profil utilisateur (simulation) */
  async saveUser(payload) {
    await sleep(MOCK_DELAY)
    Object.assign(MOCK_USER, payload)
    return { ...MOCK_USER }
  },
}
