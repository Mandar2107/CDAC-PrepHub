# CDAC PrepHub

CDAC PrepHub is a commercial preparation platform for CDAC entrance examinations and courses. The repository is organized as an npm-workspaces monorepo with an Angular student/admin client and a NestJS REST API backed by PostgreSQL.

## Current foundation

- `apps/frontend`: standalone Angular app with sign-in/registration, protected student/admin dashboard shells, refresh handling and role route checks.
- `apps/backend`: NestJS API with PostgreSQL migrations, student registration, login, hashed refresh-token rotation, throttling and role guard foundations.
- `docker-compose.yml`: local PostgreSQL service.
- `.env.example`: required local configuration keys.

The dashboards are layout shells; their metrics and content are not connected to data APIs yet. The local development build includes fixed demo accounts to preview each dashboard without a database; these credentials and the demo sign-in are excluded from the production build. The public marketing pages, password recovery, student/course management, payment processing, AI features, learning content and dynamic student experience manager are not implemented in this initial foundation.

## Prerequisites

- Node.js 22.22.3+, 24.15+, or 26.0+, and npm 10.9+
- Docker Desktop (or a PostgreSQL 17 service)

## Local setup

1. Copy `.env.example` to `.env` and replace both JWT secrets with independently generated random values.
2. Start PostgreSQL with `docker compose up -d postgres`.
3. Install dependencies with `npm install`.
4. Run database migrations with `npm run migration:run`.
5. Start the API with `npm run dev:backend` and the UI with `npm run dev:frontend`.
6. Run backend unit tests with `npm run test:backend`.

The API listens on port 3000 and exposes its OpenAPI document at `/api/docs` in development. The Angular app listens on port 4200.

For production, route the frontend origin's `/api` path to the NestJS service (the production Angular build uses a same-origin `/api` base URL), set `WEB_ORIGIN` to the exact frontend origin, and use HTTPS. The refresh cookie is `SameSite=Strict` by default; only change `REFRESH_COOKIE_SAME_SITE` when the deployment topology requires it.

## Authentication foundation

- `POST /api/auth/register` creates student accounts only.
- `POST /api/auth/login` returns a short-lived access token and sets a rotating refresh token in an HTTP-only cookie.
- `POST /api/auth/refresh` rotates that cookie; `POST /api/auth/logout` revokes it.
- `GET /api/auth/me` returns the authenticated account.
- `GET /api/health` checks the API and PostgreSQL connection.

Bootstrap the first administrator with `ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_INITIAL_PASSWORD` set in the environment, then run `npm run admin:create --workspace @cdac-prephub/backend`. The one-time password must be at least 16 characters. Admin accounts cannot be created through public registration.

## Architecture decisions

- Keep authorization decisions on the API. UI route checks are only navigation aids.
- Store refresh tokens as hashes and rotate them on use; never return password hashes or refresh-token material from endpoints.
- Use migrations in every environment. Automatic schema synchronization is disabled.
- Add feature modules behind a centralized access policy before exposing paid or student-specific data.

## Planned sequence

1. Authentication, roles, database migrations and dashboard shell.
2. Student, course and enrollment management.
3. Student Experience Manager and centralized module permissions.
4. Notes, videos, question bank, quizzes and mock tests.
5. AI learning tools, subscriptions and Razorpay integration.
6. Notifications, analytics, hardening and deployment.
