#!/usr/bin/env bash

cd /app/backend || exit 1

/app/.venv/bin/python manage.py migrate --noinput
/app/.venv/bin/python manage.py createsuperuser --noinput || true
/app/.venv/bin/python manage.py runserver 0.0.0.0:8000
