# Render Single-Container Deployment (Frontend + Backend + DB)

This repository now includes a single Docker container setup for:
- React frontend (served by Nginx)
- Spring Boot backend
- MariaDB (MySQL-compatible)

## Files Added
- `Dockerfile`
- `docker/start.sh`
- `docker/nginx.conf.template`
- `render.yaml`
- `.dockerignore`

## How It Works
- Nginx listens on Render's `PORT` and serves the frontend.
- Nginx proxies `/playbox/*` requests to Spring Boot on `127.0.0.1:8080`.
- Spring Boot uses profile `prod`.
- MariaDB runs in the same container and stores data in `/var/lib/mysql`.
- Render disk is mounted to `/var/lib/mysql` for persistence.

## Deploy Steps
1. Commit and push all changes to GitHub.
2. In Render, choose `New +` -> `Blueprint` and select this repository.
3. Render reads `render.yaml` and creates service `eliteclub-all-in-one`.
4. In Render dashboard, set secret environment values:
   - `MYSQL_PASSWORD`
   - `MYSQL_ROOT_PASSWORD`
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - `TWILIO_PHONE_NUMBER`
5. Deploy.

## First Login URL
- Frontend: `https://<your-service>.onrender.com/`
- Backend API base (same host): `https://<your-service>.onrender.com/playbox`

## Notes
- This is convenient for early-stage deployment.
- For stronger production reliability, move DB to a separate managed service later.
