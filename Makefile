.PHONY: dev build preview install clean up down logs rebuild test-e2e test-e2e-ui test-e2e-report lint lint-fix format

## Démarre le serveur de développement
dev:
	npm run dev

## Compile l'application pour la production
build:
	npm run build

## Prévisualise le build de production
preview:
	npm run preview

## Installe les dépendances
install:
	npm install

## Supprime node_modules et le dossier dist
clean:
	rm -rf node_modules dist

## Lance les tests E2E Playwright
## Usage :
##   make test-e2e                          → tous les tests
##   make test-e2e FILE=catalog             → fichier catalog.spec.js
##   make test-e2e FILE=planning            → fichier planning.spec.js
##   make test-e2e FILE="catalog planning"  → plusieurs fichiers
##   make test-e2e TEST="ajout au menu"     → un test par son nom (--grep)
##   make test-e2e FILE=catalog TEST="toast"→ combiné fichier + nom
test-e2e:
ifdef FILE
	npx playwright test $(patsubst %,tests/e2e/%.spec.js,$(FILE)) $(if $(TEST),--grep "$(TEST)",)
else ifdef TEST
	npx playwright test --grep "$(TEST)"
else
	npx playwright test
endif

## Lance les tests E2E en mode UI interactif (Playwright UI)
## Usage : make test-e2e-ui
##         make test-e2e-ui FILE=catalog
test-e2e-ui:
ifdef FILE
	npx playwright test $(patsubst %,tests/e2e/%.spec.js,$(FILE)) --ui
else
	npx playwright test --ui
endif

## Ouvre le rapport HTML du dernier run
test-e2e-report:
	npx playwright show-report

## Lint
lint:
	npm run lint

lint-fix:
	npm run lint:fix

format:
	npm run format

## Construit et lance les conteneurs Docker
up:
	docker compose up -d --build

## Arrête et supprime les conteneurs Docker
down:
	docker compose down

## Affiche les logs des conteneurs
logs:
	docker compose logs -f

## Reconstruit les images sans cache
rebuild:
	docker compose build --no-cache

