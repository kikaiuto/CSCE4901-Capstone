.PHONY: up down logs ps build clean migrate revision test lint

up:
	docker compose up --build -d

down:
	docker compose down

logs:
	docker compose logs -f

ps:
	docker compose ps

build:
	docker compose build

clean:
	docker compose down -v --remove-orphans

migrate:
	docker compose run --rm migrate

revision:
	docker compose run --rm migrate alembic revision --autogenerate -m "$(m)"

test:
	docker compose run --rm --no-deps backend sh -c "pytest || [ \$$? -eq 5 ]"
	docker compose run --rm --no-deps frontend npm test

lint:
	docker compose run --rm --no-deps backend ruff check .
	docker compose run --rm --no-deps frontend npm run lint
