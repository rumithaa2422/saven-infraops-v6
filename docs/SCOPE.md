# Saven InfraOps Command Center, Scope

## 1. Product vision

Saven InfraOps Command Center is an AI-first operations portal for Admin, Infra, DevOps, InfoSec, Delivery, and Management teams.

The system combines structured module screens with a persistent AI command layer. Users can use menus for standard work and natural language for quick answers, summaries, and guided actions.

## 2. Core modules

1. Command Center
2. Service Request Management
3. Incident Management
4. Problem Management
5. Change Management
6. Inventory Management
7. Access Management
8. Compliance Management
9. Projects and Environments
10. Vendors and Licenses
11. Reports and Analytics
12. Knowledge Base
13. Users and Teams
14. Settings and Configuration

## 3. AI-first navigation

The portal keeps three interaction modes:

- Menu navigation for module access
- Central work area for tables, detail pages, forms, and approvals
- Always-on AI assistant and bottom command bar for natural language queries

Example commands:

- How many service requests are open?
- Show SLA breached tickets.
- Show assets assigned to Vaishnavi.
- Summarize today’s incidents.
- Draft RCA for incident INC-1023.
- Show compliance controls due this month.

## 4. Full product capabilities

### Service Requests

- Ticket creation
- Assignment
- Priority and severity
- SLA tracking
- Comments and attachments
- Status transitions
- Reopen and closure
- AI category suggestion
- AI similar ticket search

### Incidents

- Severity classification
- Impacted service mapping
- Incident timeline
- Workaround and resolution
- RCA and CAPA
- AI incident summary
- AI RCA draft

### Change Management

- Change request
- Risk level
- Approval flow
- Change window
- Rollback plan
- Pre and post checks
- Implementation status

### Inventory

- Asset master
- Assignment
- Warranty and AMC
- Repair tracking
- Return and disposal
- Excel import

### Access Management

- Access request
- Approval workflow
- Temporary access expiry
- Quarterly access review
- Exit access revocation checklist

### Compliance

- Control master
- Evidence tracking
- Owner mapping
- Due date reminders
- Audit trail
- Corrective action tracking

### Vendors and Licenses

- Vendor records
- License allocation
- Renewal tracking
- Cost tracking
- Contract document metadata

### Knowledge Base

- SOPs
- How-to guides
- Past fixes
- Incident learnings
- AI suggested articles

## 5. Technical scope

- Frontend: React, TypeScript, Vite
- Backend: Node.js, Express, TypeScript
- Database: MySQL
- ORM: Prisma
- Authentication: Custom login and Microsoft login extension
- Authorization: RBAC permissions
- AI providers: Mock, OpenAI, Claude, private model
- Notifications: Email and Teams
- Import: Excel preview and validation
- Audit: Full audit log table

## 6. Enterprise controls

- RBAC enforcement
- Audit logging
- API rate limiting
- Request validation
- Error handling middleware
- Central settings table
- Environment based secrets
- Notification log
- AI source tracking extension point

## 7. Production readiness checklist

- Connect Microsoft Entra application
- Add real SMTP configuration
- Add Teams webhook
- Add AI provider keys
- Finalize role permissions
- Enable HTTPS in deployment
- Add CI and release workflow
- Run SAST and dependency checks
- Run UAT with Saven Admin team
