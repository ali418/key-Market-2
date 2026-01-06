# Grocery Sales & Inventory Management System

This guide explains everything you need to run the system on another machine, either locally or using Docker.

## 1) Prerequisites
- Operating system: Windows 10/11, macOS, or Linux
- Node.js (recommended: 18.16.0) + npm
- PostgreSQL (recommended: 14 or later)
- Git (optional)
- Docker Desktop + Docker Compose (optional for containerized deployment)

Note: The project includes an `.nvmrc` file that pins Node.js version 18.16.0.

## 2) Get the Project
- Copy the folder or clone the repository via Git on your target machine.

## 3) Environment Configuration (.env)
Create the following environment files by copying the example files provided in the project (`.env.example`).

### Backend Configuration
1. Navigate to the `backend` directory.
2. Copy `.env.example` to a new file named `.env`.
3. Open `.env` and update the values to match your local environment, particularly the database credentials:

   - `DB_HOST`: Your database host (e.g., `localhost`)
   - `DB_USER`: Your database username
   - `DB_PASSWORD`: Your database password
   - `DB_NAME`: Your database name
   - `JWT_SECRET`: Set a strong secret key for JWT
   - `JWT_REFRESH_SECRET`: Set a strong secret key for refresh tokens

### Frontend Configuration
1. Navigate to the `frontend` directory.
2. Copy `.env.example` to a new file named `.env`.
3. Update `REACT_APP_API_URL` if your backend is running on a different port than default.

Ensure the port used in `REACT_APP_API_URL` matches the `BACKEND_PORT` configured in the backend.

## 4) Install Dependencies
- Backend:
  - `npm --prefix backend install`
- Frontend:
  - `npm --prefix frontend install`

## 5) Database Setup
- Ensure PostgreSQL is running and accessible.
- Create a database named `grocery_management` (if it does not already exist).
- Run migrations:
  - `npm --prefix backend run db:migrate`
- Optional: seed sample data:
  - `npm --prefix backend run db:seed`

Alternative: see `MANUAL_DB_SETUP.md` if you prefer to set up tables manually.

## 6) Run Locally
- Backend (development):
  - `npm --prefix backend run dev`
  - Defaults to port `3002` (configurable via `BACKEND_PORT`)
- Frontend:
  - `npm --prefix frontend run start`
  - Defaults to port `3000`

Open the browser:
- Frontend: `http://localhost:3000`
- API: `http://localhost:3002/api/v1`

Note: During development, `frontend/src/setupProxy.js` proxies requests to `http://localhost:3002`. If you change `BACKEND_PORT` or `REACT_APP_API_URL`, update this file accordingly.

## 7) Run with Docker (Optional)
- Ensure environment values in `docker-compose.yml` match the desired application ports.
- Start services:
  - `docker-compose up -d`
- After containers start, run migrations inside the backend container if needed:
  - `docker exec -it grocery-backend npm run db:migrate`

Important notes:
- Default port mappings in the current `docker-compose`:
  - Frontend: `http://localhost:3005` (ports map `3005:3000`)
  - Backend API: `http://localhost:3001` (ports map `3001:3001`)
  - PgAdmin: `http://localhost:5050` (check `docker-compose.yml` for login credentials)
- If the backend inside the container uses `BACKEND_PORT=3002` by default, either:
  - Set `BACKEND_PORT=3001` in the backend service in `docker-compose` (recommended), or
  - Change the port mapping to `3002:3002` if you prefer to keep `3002` inside the container.
- Update the frontend to point to the correct API port:
  - `REACT_APP_API_URL=http://localhost:3001/api/v1` when using the default compose above.
- Ensure `CORS_ORIGIN` in the backend matches the frontend port:
  - Example: `CORS_ORIGIN=http://localhost:3005` when the frontend runs in the container on port `3005`.

## 8) Uploads & Images
- Default upload directory: `backend/uploads`
- The backend serves static files under the path `/uploads`
- Ensure the directory exists and is writable.

## 9) Default Ports
- Backend: `3002` (configurable via `BACKEND_PORT`)
- Frontend: `3000` (configurable via npm scripts)
- PostgreSQL: `5432`

## 10) Common Issues & Solutions
- Port in use (`EADDRINUSE`):
  - Stop the process using the port or change `BACKEND_PORT` (then update `REACT_APP_API_URL`).
- Database permission errors:
  - Verify `DB_USER`/`DB_PASSWORD` and database existence.
- Frontend request failures:
  - Check `REACT_APP_API_URL` and compatibility with `CORS_ORIGIN` in the backend.

## 11) Useful Commands
- Run migrations: `npm --prefix backend run db:migrate`
- Run seeders: `npm --prefix backend run db:seed`
- Start backend (dev): `npm --prefix backend run dev`
- Start frontend: `npm --prefix frontend run start`

Good luck!
