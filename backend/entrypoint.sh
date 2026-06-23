#!/bin/bash
set -e

echo "Waiting for PostgreSQL..."
while ! pg_isready -h postgres -p 5432 -U $POSTGRES_USER; do
  sleep 1
done
echo "PostgreSQL is ready!"

echo "Creating database if it doesn't exist..."
PGPASSWORD=$POSTGRES_PASSWORD psql -h postgres -U $POSTGRES_USER -d postgres -tc "SELECT 1 FROM pg_database WHERE datname = '$POSTGRES_DB'" | grep -q 1 || PGPASSWORD=$POSTGRES_PASSWORD createdb -h postgres -U $POSTGRES_USER $POSTGRES_DB
echo "Database ready!"

echo "Running database migrations..."
alembic upgrade head

echo "Seeding database with initial data..."
python scripts/seed_database.py || echo "Seed data already exists or failed - continuing..."

echo "Starting FastAPI application..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
