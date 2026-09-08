Saven InfraOps Command Center
1. Project Overview
# Saven InfraOps Command Center

Saven InfraOps Command Center is an internal infrastructure and operations management application.

The application provides modules for infrastructure operations, users and roles, RBAC, projects, inventory, compliance, incidents, service requests, knowledge management, notifications, AI assistance, and related administrative functions.

## Technology Stack

- Frontend: React + TypeScript + Vite
- Backend: Node.js + Express + TypeScript
- Database: MySQL
- ORM: Prisma
- Authentication: Custom authentication with optional Microsoft authentication
- AI: Configurable AI provider
2. Prerequisites
## Prerequisites

Before setting up the project, install the following software on Windows:

- Git
- Node.js
- npm
- MySQL Server
- Visual Studio Code (recommended)

### Verify Installation

Open Command Prompt and run:

```cmd
git --version
node --version
npm --version
mysql --version

All commands should return a version number.

Recommended

Use Command Prompt (CMD) if PowerShell shows an error such as:

npm.ps1 cannot be loaded because running scripts is disabled on this system.


---

# 3. Clone the Repository

```md
## Clone the Repository

Open Command Prompt and navigate to the location where you want to keep the project.

Example:

```cmd
cd C:\Users\<YOUR_USERNAME>\Projects

Clone the repository:

git clone <YOUR_REPOSITORY_URL>

Navigate into the project:

cd saven-infraops-v6

Check the remote repository:

git remote -v

Check the current branch:

git branch

If the project uses the feature/rbac-redesign branch:

git checkout feature/rbac-redesign

Pull the latest changes:

git pull origin feature/rbac-redesign

**Replace `<YOUR_REPOSITORY_URL>` with the actual GitHub repository URL.**

---

# 4. Project Structure

```md
## Project Structure

```text
saven-infraops-v6/
│
├── backend/
│   ├── prisma/
│   │   ├── migrations/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── src/
│   ├── package.json
│   └── .env
│
├── frontend/
│   ├── src/
│   ├── package.json
│   └── ...
│
├── package.json
└── README.md
Backend

Contains the Express/TypeScript API, Prisma database configuration, authentication, business logic, and backend modules.

Frontend

Contains the React/TypeScript/Vite user interface.

Prisma

Contains the database schema, migrations, and seed data.


---

# 5. Install Dependencies

```md
## Install Dependencies

From the project root:

```cmd
npm run install:all

This installs dependencies for the frontend and backend.

If npm run install:all is not available in the current version of the project, install them separately:

Backend
cd backend
npm install
Frontend

Open another Command Prompt window or return to the project root:

cd frontend
npm install

**Before putting this section into the README, check your current root `package.json` to confirm `install:all` still exists.**

---

# 6. MySQL Setup

This is important because **your actual project uses local MySQL, not Docker**.

```md
## MySQL Database Setup

The application uses a local MySQL database.

Docker is not required for the standard local development setup.

### Check MySQL Service

On Windows, open Command Prompt and run:

```cmd
sc query MySQL80

The service should show:

STATE : 4  RUNNING

If MySQL is not running, start the MySQL service.

net start MySQL80
Connect to MySQL
mysql -u root -p

Enter your local MySQL password when prompted.

Create the Database

Create the application database if it does not already exist:

CREATE DATABASE saven_infraops;

Verify it:

SHOW DATABASES;

The database should contain:

saven_infraops

---

# 7. Backend `.env`

```md
## Backend Environment Configuration

Navigate to the backend folder:

```cmd
cd backend

Create or update the .env file.

Example:

NODE_ENV=development

PORT=4000

FRONTEND_ORIGIN=http://localhost:3001

DATABASE_URL="mysql://YOUR_DB_USER:YOUR_DB_PASSWORD@localhost:3306/saven_infraops"

JWT_SECRET="YOUR_LOCAL_JWT_SECRET"
JWT_EXPIRES_IN="8h"

CUSTOM_LOGIN_ENABLED=true

MICROSOFT_LOGIN_ENABLED=false
MICROSOFT_TENANT_ID=
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=
MICROSOFT_REDIRECT_URI=http://localhost:4000/api/auth/microsoft/callback

AI_PROVIDER=mock

OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini

CLAUDE_API_KEY=
CLAUDE_MODEL=claude-3-5-sonnet-latest

PRIVATE_AI_BASE_URL=
PRIVATE_AI_API_KEY=
PRIVATE_AI_MODEL=saven-private-model

EMAIL_ENABLED=false

SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM="Saven InfraOps <your-email@example.com>"

TEAMS_ENABLED=false
TEAMS_WEBHOOK_URL=

EXCEL_MAX_FILE_SIZE_MB=20

AUDIT_ENABLED=true
Important

Never commit the .env file to Git.

Never put API keys, passwords, SMTP passwords, JWT secrets, or other credentials in README.md.


---

# 8. Prisma Setup

```md
## Prisma Setup

Prisma is used as the ORM for the MySQL database.

Navigate to the backend:

```cmd
cd backend
Generate Prisma Client

Run:

npm run prisma:generate

This generates the Prisma Client based on the current Prisma schema.

Check Migration Status

Run:

npx prisma migrate status

This shows whether the database is up to date with the migration files.

Run Database Migrations

For a new local setup, run:

npm run db:migrate

This applies the required Prisma migrations to the local database.

Seed the Database

Run:

npm run db:seed

This inserts the development seed data.

Important Warning

Do not run:

npx prisma migrate reset

unless you specifically intend to delete and recreate the local database.

This command can remove existing local database data.


---

# 9. Seed / Development Login

Your actual seed file has the development admin account we found earlier.

You can document it like this:

```md
## Development Login

The database seed creates a development administrator account.

The development credentials are defined in:

```text
backend/prisma/seed.ts

Use the credentials currently defined in the seed file.

Do not copy production credentials into this README.

If the seed credentials are changed, update the seed file rather than storing production credentials in documentation.


I actually recommend **not putting the username/password directly in README**, because the seed file is the source of truth.

---

# 10. Start Backend

```md
## Start the Backend

Open Command Prompt.

Navigate to the backend:

```cmd
cd C:\Users\<YOUR_USERNAME>\Projects\saven-infraops-v6\backend

Start the backend:

npm run dev

The backend runs on:

http://localhost:4000
Backend Health Check

If the health endpoint is available:

http://localhost:4000/api/health

Open the URL in a browser to verify that the backend is running.


---

# 11. Start Frontend

```md
## Start the Frontend

Open a second Command Prompt window.

Navigate to the frontend:

```cmd
cd C:\Users\<YOUR_USERNAME>\Projects\saven-infraops-v6\frontend

Start the frontend:

npm run dev

The frontend runs on:

http://localhost:3001

Open the application in a browser:

http://localhost:3001

Again, confirm the actual port in your current Vite configuration before committing this.

---

# 12. Complete First-Time Setup

This is the **most important section** for someone new to the project.

```md
## First-Time Setup – Complete Steps

Follow these steps in order.

### Step 1 – Install Prerequisites

Install:

- Git
- Node.js
- npm
- MySQL
- VS Code

Verify:

```cmd
git --version
node --version
npm --version
mysql --version
Step 2 – Clone the Repository
git clone <YOUR_REPOSITORY_URL>
cd saven-infraops-v6
Step 3 – Checkout the Required Branch
git checkout feature/rbac-redesign
Step 4 – Install Dependencies

From the project root:

npm run install:all
Step 5 – Start MySQL
sc query MySQL80

Make sure the service is running.

Step 6 – Create the Database

Connect to MySQL:

mysql -u root -p

Create the database if required:

CREATE DATABASE saven_infraops;
Step 7 – Configure Backend Environment

Create/update:

backend/.env

Configure the database connection and other required environment variables.

Step 8 – Generate Prisma Client
cd backend
npm run prisma:generate
Step 9 – Run Database Migrations
npm run db:migrate
Step 10 – Seed Development Data
npm run db:seed
Step 11 – Start Backend
npm run dev

Keep this terminal running.

Step 12 – Verify Backend

Open the backend health endpoint in the browser if available.

Step 13 – Start Frontend

Open a second Command Prompt:

cd frontend
npm run dev
Step 14 – Open the Application

Open the frontend URL shown by Vite.

Step 15 – Login

Use the development credentials created by the database seed.


---

# 13. Daily Startup

```md
## Daily Startup

After the initial setup has been completed, you normally only need to:

### 1. Start MySQL

```cmd
sc query MySQL80

Make sure MySQL is running.

2. Start Backend

Terminal 1:

cd backend
npm run dev
3. Start Frontend

Terminal 2:

cd frontend
npm run dev
4. Open the Application

Open the frontend URL in your browser.


---

# 14. AI Configuration

```md
## AI Configuration

The application supports configurable AI providers.

The selected provider is controlled using:

```env
AI_PROVIDER=

Configure the required API key and model according to the selected provider.

Mock Provider

For local development without an external AI API:

AI_PROVIDER=mock
External AI Providers

If an external AI provider is enabled, configure its API key and model in backend/.env.

Never commit API keys to Git.

Never place API keys directly in source code or README.md.


If your current code supports Gemini specifically, add a Gemini subsection after verifying the actual source/env variable names.

---

# 15. Email Configuration

```md
## Email Configuration

Email functionality can be enabled using the SMTP configuration in `backend/.env`.

Example:

```env
EMAIL_ENABLED=true
SMTP_HOST=<SMTP_HOST>
SMTP_PORT=587
SMTP_USER=<SMTP_USERNAME>
SMTP_PASS=<SMTP_PASSWORD_OR_APP_PASSWORD>
SMTP_FROM="Saven InfraOps <your-email@example.com>"

For local development, email can remain disabled:

EMAIL_ENABLED=false

Never commit SMTP passwords or app passwords.


---

# 16. Troubleshooting

```md
## Troubleshooting

### npm.ps1 Cannot Be Loaded

If PowerShell displays:

```text
npm.ps1 cannot be loaded because running scripts is disabled

Use Command Prompt (CMD) instead of PowerShell and run the npm command again.

MySQL Cannot Connect

If you see:

ERROR 2003 (HY000): Can't connect to MySQL server

Check the MySQL service:

sc query MySQL80

If it is stopped:

net start MySQL80

Then try:

mysql -u root -p
Prisma Client Error

Run:

cd backend
npm run prisma:generate

Then check:

npx prisma migrate status
Frontend Cannot Connect to Backend

Check:

MySQL is running.
Backend is running.
Backend port is correct.
Frontend is running.
FRONTEND_ORIGIN is correctly configured.
Browser developer tools do not show API/network errors.
Login Does Not Work

Check:

MySQL is running.
Backend is running.
Database migrations have been applied.
Seed has been executed.
Development login exists in backend/prisma/seed.ts.
Port Already in Use

If the backend or frontend port is already being used by another process, stop the existing process or configure a different development port according to the project's configuration.

AI Is Not Working

Check:

AI_PROVIDER
Required API key
Model name
Backend .env
Backend terminal for errors

Restart the backend after changing .env.

Email Is Not Working

Check:

EMAIL_ENABLED
SMTP host
SMTP port
SMTP username
SMTP password/app password
SMTP_FROM

Restart the backend after changing .env.


---

# 17. Git Workflow

```md
## Git Workflow

Before making changes:

```cmd
git status
git branch

Get the latest changes:

git pull origin feature/rbac-redesign

After making changes:

git status

Review your changes:

git diff

Stage the required files:

git add <file>

Commit:

git commit -m "Describe your change"

Push:

git push origin feature/rbac-redesign

Do not force push unless specifically instructed by the project maintainer.


---

# 18. Security

```md
## Security

Never commit sensitive information to Git.

Do not commit:

- API keys
- Passwords
- SMTP credentials
- Gmail app passwords
- JWT secrets
- Microsoft client secrets
- Teams webhook URLs
- Production credentials

Store sensitive configuration in environment variables.

Before committing changes, check:

```cmd
git status

Make sure .env and other sensitive files are not being committed.


---

# 19. Quick Reference

At the very bottom, I'd add this because it will be useful for your team:

```md
## Quick Reference

| Component | URL / Command |
|---|---|
| Frontend | http://localhost:3001 |
| Backend | http://localhost:4000 |
| Backend health | http://localhost:4000/api/health |
| Backend start | `cd backend` → `npm run dev` |
| Frontend start | `cd frontend` → `npm run dev` |
| Prisma generate | `npm run prisma:generate` |
| Prisma migration status | `npx prisma migrate status` |
| Database migration | `npm run db:migrate` |
| Database seed | `npm run db:seed` |
| MySQL service | `MySQL80` |
| Database | `saven_infraops` |