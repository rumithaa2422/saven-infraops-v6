# Architecture

## Separation model

The system is split into two independent applications.

```text
frontend  -> React UI, runs on port 3001
backend   -> Node API, runs on port 4000
mysql     -> Database
```

The frontend never connects directly to MySQL. It calls backend APIs only.

## Backend layers

```text
routes -> controllers -> services -> repositories -> Prisma -> MySQL
```

This keeps HTTP logic, business rules, and data access separate.

## AI provider switch

The backend owns AI routing.

```text
AI request -> provider factory -> OpenAI | Claude | Private model | Mock
```

The selected provider is controlled through environment values and settings.

## Security

- JWT for API access
- RBAC middleware for protected actions
- Helmet headers
- Rate limiting
- CORS allowlist
- Audit logging for sensitive actions
- Secrets in environment files

## Notifications

Notification events use adapters:

```text
Notification service -> Email adapter
Notification service -> Teams adapter
```

Both can be enabled or disabled through settings.
