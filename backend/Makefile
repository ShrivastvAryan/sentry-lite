.PHONY: up up-full down build logs migrate makemigrations superuser shell dbshell restart ps clean

## Mode 1: Infra only in Docker (Postgres, Redis, pgAdmin, Celery) - run backend locally yourself
up:
	docker compose up --build

## Mode 2: Everything in Docker, including the Django backend
up-full:
	docker compose -f docker-compose.yml -f docker-compose.full.yml up --build

## Stop all services
down:
	docker compose -f docker-compose.yml -f docker-compose.full.yml down

## Rebuild images without starting
build:
	docker compose build

## Tail logs from all services
logs:
	docker compose logs -f

## Tail logs from a specific service, e.g. make logs-s SERVICE=celery_worker
logs-s:
	docker compose logs -f $(SERVICE)

## Run Django migrations (inside backend container - use only in up-full mode)
migrate:
	docker compose exec backend uv run python manage.py migrate

## Run Django migrations locally (use in up mode, backend running locally)
migrate-local:
	uv run python manage.py migrate

## Create a Django superuser (inside backend container)
superuser:
	docker compose exec backend uv run python manage.py createsuperuser

## Create a Django superuser locally
superuser-local:
	uv run python manage.py createsuperuser

## Open a psql shell into the database
dbshell:
	docker compose exec db psql -U aryan -d sentry_db

## Restart a specific service, e.g. make restart SERVICE=celery_worker
restart:
	docker compose restart $(SERVICE)

## Show running containers
ps:
	docker compose ps

## Stop and remove everything, including volumes (WARNING: deletes DB data)
clean:
	docker compose -f docker-compose.yml -f docker-compose.full.yml down -v