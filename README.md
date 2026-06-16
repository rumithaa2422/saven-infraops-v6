# Saven InfraOps Command Center

This package is a separated frontend and backend product build for the Saven InfraOps Command Center.

It uses:

- Frontend: React, TypeScript, Vite
- Backend: Node.js, Express, TypeScript
- Database: MySQL with Prisma
- Auth: Custom Saven login with Microsoft login extension point
- AI: Provider switch for Mock, OpenAI, Claude, and private model
- Notifications: Email and Microsoft Teams adapters
- Import: Excel preview and mapping entry point

## Folder structure

```text
saven-infraops-enterprise-v5
├── frontend
├── backend
├── docs
├── docker-compose.yml
└── README.md
```

## Windows run steps

### 1. Install dependencies

```powershell
cd "D:\Projects\Saven\AI\Saven InfraOps Command Center\saven-infraops-enterprise-v5"
npm run install:all
```

### 2. Start MySQL using Docker, optional

```powershell
docker compose up -d
```

You can also use your local Windows MySQL. Update `backend\.env` with your connection string.

### 3. Configure backend

```powershell
copy backend\.env.example backend\.env
```

Update:

```env
DATABASE_URL="mysql://infraops:infraops123@localhost:3306/saven_infraops"
JWT_SECRET="replace-this-with-a-secure-secret"
```

### 4. Prepare DB

```powershell
cd backend
npm run prisma:generate
npm run db:migrate
npm run db:seed
```

### 5. Start backend

```powershell
npm run dev
```

Backend runs at:

```text
http://localhost:4000/api/health
```

### 6. Start frontend

Open another PowerShell window:

```powershell
cd frontend
copy .env.example .env
npm run dev
```

Frontend runs at:

```text
http://localhost:3001
```

## Seed login

```text
Email: admin@saven.in
Password: Admin@12345
```

## Important status

This is separated FE and BE code. It is a proper enterprise product foundation, but final production sign-off still needs:

- Real Saven SMTP
- Teams webhook
- Microsoft Entra app registration
- AI provider keys
- Production RBAC review
- Security testing
- Deployment pipeline
- User acceptance testing
