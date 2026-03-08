.PHONY: dev build preview install clean up down logs rebuild

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

