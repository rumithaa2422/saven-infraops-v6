# INFRAOPS ENTERPRISE - COMPLETE RBAC ACTION ANALYSIS REPORT

**Document Version:** 1.0  
**Date:** 2026-07-19  
**Repository:** Saven InfraOps Enterprise V6  
**Scope:** Frontend & Backend Complete Action Inventory

---

## EXECUTIVE SUMMARY

This report provides a comprehensive analysis of every action available in the InfraOps application, documented across all modules, pages, API endpoints, and workflows. The analysis identifies 16 modules with over 150 distinct actions requiring granular permission control.

### Current State
- **16 Modules** identified
- **150+ Actions** documented
- **67 Permissions** currently in database
- **3 Roles** defined (Super Admin, Admin, Employee)
- **Generic Permissions** still in use: `view`, `create`, `edit`, `delete`, `manage`, `read`, `write`

### Key Findings
1. Most modules use generic `manage` permissions that bundle multiple actions
2. Service Requests have the most granular workflow with 20+ distinct actions
3. Several modules (Inventory, Projects, Vendors) are restricted to Super Admin only
4. Document Repository has complex folder/file hierarchy requiring 15+ permissions
5. Knowledge Base uses mixed permission namespaces (kb:* and knowledge.category:*)

---

## TABLE OF CONTENTS

1. [Sidebar Navigation Analysis](#sidebar-navigation-analysis)
2. [Dashboard Module](#dashboard)
3. [Service Requests Module](#service-requests)
4. [Incidents Module](#incidents)
5. [Problems Module](#problems)
6. [Changes Module](#changes)
7. [Inventory Module](#inventory)
8. [Access Management Module](#access-management)
9. [Compliance Module](#compliance)
10. [Projects & Environments Module](#projects--environments)
11. [Vendors & Licenses Module](#vendors--licenses)
12. [Knowledge Base Module](#knowledge-base)
13. [Reports & Analytics Module](#reports--analytics)
14. [Users & Teams Module](#users--teams)
15. [Roles & Permissions Module](#roles--permissions)
16. [Settings Module](#settings)
17. [AI Assistant Module](#ai-assistant)
18. [Current Permission Analysis](#current-permission-analysis)
19. [Workflow Analysis Per Module](#workflow-analysis-per-module)
20. [Hidden Actions Inventory](#hidden-actions-inventory)
21. [Final Permission Blueprint](#final-permission-blueprint)
22. [Recommendations](#recommendations)

---

## SIDEBAR NAVIGATION ANALYSIS

### Current Sidebar Structure

| Module | Route | Permission Required | Disappears When Missing |
|--------|-------|-------------------|------------------------|
| Dashboard | `/` | `dashboard:view` | YES |
| Service Requests | `/service-requests` | `tickets:view` | YES |
| Incidents | `/incidents` | `incidents:view` | YES |
| Problems | `/problems` | `problems:view` | YES |
| Changes | `/changes` | `changes:view` | YES |
| Inventory | `/inventory` | `inventory:view` | YES |
| Access Management | `/access-management` | `access:view` | YES |
| Compliance | `/compliance` | `compliance:view` | YES |
| Projects & Environments | `/projects-environments` | `projects:view` | YES |
| Vendors & Licenses | `/vendors-licenses` | `vendors:view` | YES |
| Reports & Analytics | `/reports-analytics` | `reports:view` | YES |
| Knowledge Base | `/knowledge-base` | `kb:view` | YES |
| Users & Teams | `/users-teams` | `users:view` | YES |
| Roles & Permissions | `/roles-permissions` | `roles:view` | YES |
| Settings | `/settings` | `settings:view` | YES |

---

## DASHBOARD

### Module Overview
Central landing page showing system-wide metrics, quick actions, and activity feeds.

### Actions Identified

| Action Name | Frontend Location | Backend API | Current Permission | Who Performs | Recommended Permission |
|------------|-----------------|-------------|------------------|-------------|---------------------|
| View Dashboard | DashboardPage.tsx | `GET /api/dashboard/summary` | `dashboard:view` | All users | `dashboard:view` |
| View My Tasks | DashboardPage.tsx → MyWorkWidget | `GET /api/dashboard/my-tasks` | `dashboard:view` | All users | `dashboard:view_my_tasks` |
| View Recent Activity | DashboardPage.tsx → RecentActivity | `GET /api/dashboard/recent-activity` | `dashboard:view` | All users | `dashboard:view_activity` |
| Quick Actions Navigation | DashboardPage.tsx → QuickActions | Navigation links | `dashboard:view` | All users | `dashboard:view` |
| Navigate to Module | DashboardPage.tsx → ModuleOverview | Navigation | `dashboard:view` | All users | Module-specific permission |
| View System Health | DashboardPage.tsx | `GET /api/dashboard/health` | `dashboard:view` | All users | `dashboard:view_health` |
| Refresh Dashboard | DashboardHeader.tsx | Page reload | `dashboard:view` | All users | `dashboard:view` |
| Search (Global) | DashboardPage.tsx → DashboardSearch | Client-side | `dashboard:view` | All users | `dashboard:view` |
| View Knowledge Hub | DashboardPage.tsx → KnowledgeHub | Navigation to KB | `dashboard:view` | All users | `kb:view` |

### Workflow
```
User Login
    ↓
Dashboard Loads
    ↓
View Summary Stats (read-only)
    ↓
Click Quick Action OR Navigate to Module
```

### Recommended Permissions
```
dashboard:view           - View dashboard and widgets
dashboard:view_my_tasks   - View personal task counts
dashboard:view_activity   - View recent activity feed
dashboard:view_health     - View system health status
```

---

## SERVICE REQUESTS

### Module Overview
ITSM service request/ticket management system with full lifecycle workflow.

### Actions Identified

| Action Name | Frontend Location | Backend API | Current Permission | Who Performs | Recommended Permission |
|------------|-----------------|-------------|------------------|-------------|---------------------|
| View Module | ServiceRequestsPage.tsx | `GET /api/service-requests` | `tickets:view` | All users | `tickets:view` |
| View My Requests Only | ServiceRequestsPage.tsx | Filtered by user | `tickets:view` | Employees | `tickets:view_own` |
| View All Requests | ServiceRequestsPage.tsx | Admin unfiltered | `tickets:view` | Admins | `tickets:view_all` |
| Raise Request | ServiceRequestsPage.tsx → Create Button | `POST /api/service-requests` | `tickets:create` | All users | `tickets:create` |
| Edit Request | ServiceRequestsPage.tsx → Edit Modal | `PUT /api/service-requests/:id` | `tickets:manage` | Admins | `tickets:edit` |
| Delete Request | ServiceRequestsPage.tsx → Delete Button | `DELETE /api/service-requests/:id` | `tickets:manage` | Super Admin | `tickets:delete` |
| Export to CSV | ServiceRequestsPage.tsx → Export Button | Client-side CSV generation | `tickets:view` | All users | `tickets:export` |
| Open Request Details | ServiceRequestsPage.tsx → Open Button | Navigate to detail page | `tickets:view` | All users | `tickets:view` |
| Assign Request | ServiceRequestDetailPage.tsx | `PATCH /api/service-requests/:id` | `tickets:manage` | Admins | `tickets:assign` |
| Reassign Request | ServiceRequestDetailPage.tsx | `PATCH /api/service-requests/:id` | `tickets:manage` | Admins | `tickets:reassign` |
| Update Status | ServiceRequestDetailPage.tsx → Action Buttons | `PATCH /api/service-requests/:id` | `tickets:manage` | Assigned Admin | `tickets:update_status` |
| - Set to OPEN | ServiceRequestDetailPage.tsx | PATCH | `tickets:manage` | Admin | `tickets:status_open` |
| - Set to ASSIGNED | ServiceRequestDetailPage.tsx | PATCH | `tickets:manage` | Admin | `tickets:status_assigned` |
| - Set to IN_PROGRESS | ServiceRequestDetailPage.tsx | PATCH | `tickets:manage` | Admin | `tickets:status_in_progress` |
| - Set to WAITING_FOR_USER | ServiceRequestDetailPage.tsx | PATCH | `tickets:manage` | Admin | `tickets:status_waiting` |
| - Set to COMPLETED | ServiceRequestDetailPage.tsx | PATCH | `tickets:manage` | Admin | `tickets:status_completed` |
| - Set to CLOSED | ServiceRequestDetailPage.tsx | PATCH | `tickets:manage` | Admin | `tickets:status_closed` |
| Reopen Request | ServiceRequestDetailPage.tsx → Reopen Button | `PATCH /api/service-requests/:id` | `tickets:manage` | Super Admin | `tickets:reopen` |
| Add Comment | ServiceRequestDetailPage.tsx → Comment Box | `POST /api/service-requests/:id/comments` | `tickets:manage` | All participants | `tickets:add_comment` |
| View Comments | ServiceRequestDetailPage.tsx | `GET /api/service-requests/:id/comments` | `tickets:view` | All participants | `tickets:view_comments` |
| View Timeline | ServiceRequestDetailPage.tsx | `GET /api/service-requests/:id/timeline` | `tickets:view` | Assigned Admin | `tickets:view_timeline` |
| Upload Attachment | ServiceRequestDetailPage.tsx → Upload Button | `POST /api/service-requests/:id/attachments` | `tickets:manage` | All participants | `tickets:upload_attachment` |
| Download Attachment | ServiceRequestDetailPage.tsx → Attachment Link | `GET /api/service-requests/:id/attachments/:id/download` | `tickets:view` | All participants | `tickets:download_attachment` |
| Delete Attachment | ServiceRequestDetailPage.tsx → Delete Button | `DELETE /api/service-requests/:id/attachments/:id` | `tickets:manage` | Super Admin | `tickets:delete_attachment` |
| Print Request | ServiceRequestDetailPage.tsx → Print Button | Browser print | `tickets:view` | All users | `tickets:print` |

### Workflow
```
Employee raises request (OPEN)
    ↓
Admin assigns (ASSIGNED)
    ↓
Assigned Engineer starts work (IN_PROGRESS)
    ↓
Engineer waits for user input (WAITING_FOR_USER)
    ↓
Engineer completes work (COMPLETED)
    ↓
Engineer or Admin closes (CLOSED)
    ↓
Super Admin can reopen (OPEN)
```

### Status Transition Matrix

| From Status | To Status | Action Button | Required Permission |
|-------------|-----------|---------------|---------------------|
| OPEN | ASSIGNED | Assign | `tickets:assign` |
| OPEN | IN_PROGRESS | Start Progress | `tickets:status_in_progress` |
| ASSIGNED | IN_PROGRESS | Start Progress | `tickets:status_in_progress` |
| ASSIGNED | CLOSED | Close | `tickets:status_closed` |
| IN_PROGRESS | WAITING_FOR_USER | Wait for User | `tickets:status_waiting` |
| IN_PROGRESS | COMPLETED | Mark Complete | `tickets:status_completed` |
| WAITING_FOR_USER | IN_PROGRESS | Resume Progress | `tickets:status_in_progress` |
| WAITING_FOR_USER | COMPLETED | Mark Complete | `tickets:status_completed` |
| COMPLETED | CLOSED | Close | `tickets:status_closed` |
| CLOSED | OPEN | Reopen | `tickets:reopen` |

### Recommended Permissions
```
tickets:view                - View service requests list
tickets:view_own           - View own requests only
tickets:view_all           - View all requests (Admin)
tickets:create             - Raise new request
tickets:edit               - Edit request details
tickets:delete             - Delete request
tickets:assign             - Assign request to user
tickets:reassign           - Reassign to different user
tickets:update_status     - Generic status update
tickets:status_open        - Set status to OPEN
tickets:status_assigned    - Set status to ASSIGNED
tickets:status_in_progress  - Set status to IN_PROGRESS
tickets:status_waiting     - Set status to WAITING_FOR_USER
tickets:status_completed   - Set status to COMPLETED
tickets:status_closed      - Set status to CLOSED
tickets:reopen             - Reopen closed request
tickets:add_comment        - Add comment to request
tickets:view_comments     - View request comments
tickets:view_timeline     - View request timeline
tickets:upload_attachment  - Upload file attachment
tickets:download_attachment - Download attachment
tickets:delete_attachment   - Delete attachment
tickets:export             - Export requests to CSV
tickets:print              - Print request details
```

---

## INCIDENTS

### Module Overview
Incident management for production outages and service disruptions.

### Actions Identified

| Action Name | Frontend Location | Backend API | Current Permission | Who Performs | Recommended Permission |
|------------|-----------------|-------------|------------------|-------------|---------------------|
| View Module | IncidentDetailPage.tsx | `GET /api/incidents` | `incidents:view` | All users | `incidents:view` |
| View Incident Details | IncidentDetailPage.tsx | `GET /api/incidents/:id` | `incidents:view` | All users | `incidents:view` |
| Create Incident | ModulePage.tsx (incidents) | `POST /api/incidents` | `incidents:create` | Admins | `incidents:create` |
| Update Incident | IncidentDetailPage.tsx | `PUT /api/incidents/:id` | `incidents:manage` | Admins | `incidents:update` |
| Update Status | IncidentDetailPage.tsx | `PATCH /api/incidents/:id/status` | `incidents:manage` | Admins | `incidents:update_status` |
| Update Severity | IncidentDetailPage.tsx | `PATCH /api/incidents/:id` | `incidents:manage` | Admins | `incidents:update_severity` |
| Upload Resolution Document | IncidentDetailPage.tsx | `POST /api/incidents/:id/resolution-document` | `incidents:manage` | Owner | `incidents:upload_resolution` |
| Delete Resolution Document | IncidentDetailPage.tsx | `DELETE /api/incidents/:id/resolution-document` | `incidents:manage` | Owner | `incidents:delete_resolution` |
| Export Incidents | ModulePage.tsx | Client-side CSV | `incidents:export` | Admins | `incidents:export` |

### Incident Status Workflow
```
OPEN → ASSIGNED → IN_PROGRESS → RESOLVED → CLOSED
```

### Recommended Permissions
```
incidents:view                  - View incidents list
incidents:create                - Create new incident
incidents:update                - Update incident details
incidents:update_status        - Update incident status
incidents:update_severity       - Update severity level
incidents:upload_resolution     - Upload resolution document
incidents:delete_resolution     - Delete resolution document
incidents:export                - Export incidents
```

---

## PROBLEMS

### Module Overview
Problem management for root cause analysis and known error tracking.

### Actions Identified

| Action Name | Frontend Location | Backend API | Current Permission | Who Performs | Recommended Permission |
|------------|-----------------|-------------|------------------|-------------|---------------------|
| View Module | ModulePage.tsx (problems) | `GET /api/problems` | `problems:view` | All users | `problems:view` |
| Create Problem | ModulePage.tsx | `POST /api/problems` | `problems:create` | Admins | `problems:create` |
| Update Problem | ModulePage.tsx | `PUT /api/problems/:id` | `problems:manage` | Admins | `problems:update` |
| Update Status | ModulePage.tsx | `PATCH /api/problems/:id/status` | `problems:manage` | Admins | `problems:update_status` |
| Link to Incident | ModulePage.tsx | Backend logic | `problems:manage` | Admins | `problems:link_incident` |
| Export Problems | ModulePage.tsx | Client-side | `problems:export` | Admins | `problems:export` |

### Recommended Permissions
```
problems:view             - View problems list
problems:create           - Create new problem
problems:update           - Update problem details
problems:update_status    - Update problem status
problems:link_incident    - Link problem to incident
problems:export           - Export problems
```

---

## CHANGES

### Module Overview
Change request management with approval workflow.

### Actions Identified

| Action Name | Frontend Location | Backend API | Current Permission | Who Performs | Recommended Permission |
|------------|-----------------|-------------|------------------|-------------|---------------------|
| View Module | ModulePage.tsx (changes) | `GET /api/changes` | `changes:view` | All users | `changes:view` |
| Create Change Request | ModulePage.tsx | `POST /api/changes` | `changes:create` | Employees | `changes:create` |
| Update Change | ModulePage.tsx | `PUT /api/changes/:id` | `changes:manage` | Owner | `changes:update` |
| Update Status | ModulePage.tsx | `PATCH /api/changes/:id/status` | `changes:manage` | Admins | `changes:update_status` |
| Approve Change | ModulePage.tsx | `PATCH /api/changes/:id/approve` | `changes:approve` | Admins | `changes:approve` |
| Reject Change | ModulePage.tsx | `PATCH /api/changes/:id/reject` | `changes:approve` | Admins | `changes:reject` |
| Implement Change | ModulePage.tsx | `PATCH /api/changes/:id/implement` | `changes:manage` | Owner | `changes:implement` |
| Export Changes | ModulePage.tsx | Client-side | `changes:export` | Admins | `changes:export` |

### Change Status Workflow
```
OPEN → PENDING_APPROVAL → APPROVED → IMPLEMENTING → COMPLETED → CLOSED
                            ↓
                         REJECTED (terminal)
```

### Recommended Permissions
```
changes:view             - View change requests
changes:create            - Submit new change request
changes:update           - Update change details
changes:update_status    - Update change status
changes:approve          - Approve change request
changes:reject           - Reject change request
changes:implement        - Mark change as implemented
changes:export           - Export changes
```

---

## INVENTORY

### Module Overview
Asset and inventory management with categories, subcategories, and stock tracking.

### Actions Identified

| Action Name | Frontend Location | Backend API | Current Permission | Who Performs | Recommended Permission |
|------------|-----------------|-------------|------------------|-------------|---------------------|
| View Module | AssetManagementPage.tsx | `GET /api/inventory` | `inventory:view` | All users | `inventory:view` |
| View Categories | AssetManagementPage.tsx → Categories Tab | `GET /api/inventory/categories` | `inventory:view` | All users | `inventory:view_categories` |
| View Items | AssetManagementPage.tsx | `GET /api/inventory-master` | `inventory:view` | All users | `inventory:view_items` |
| View Item Details | InventoryDetailPage.tsx | `GET /api/inventory-master/:id` | `inventory:view` | All users | `inventory:view_details` |
| Create Item | InventoryMasterPage.tsx | `POST /api/inventory-master` | Super Admin only | Super Admin | `inventory:create` |
| Update Item | InventoryMasterPage.tsx | `PATCH /api/inventory-master/:id` | Super Admin only | Super Admin | `inventory:update` |
| Delete Item | InventoryMasterPage.tsx | `DELETE /api/inventory-master/:id` | Super Admin only | Super Admin | `inventory:delete` |
| Bulk Import Items | Import Framework | `POST /api/import/execute` | `settings:write` | Super Admin | `inventory:import` |
| View History | InventoryDetailPage.tsx → History Tab | `GET /api/inventory/history/:id` | `inventory:view` | All users | `inventory:view_history` |
| View Analytics | InventoryAnalyticsPage.tsx | `GET /api/inventory/analytics` | `inventory:view` | Admins | `inventory:view_analytics` |
| Assign to User | AssetDetailsPage.tsx | `POST /api/inventory-assignments` | `inventory:manage` | Admins | `inventory:assign_user` |
| Assign to Project | AssetDetailsPage.tsx | `POST /api/inventory-assignments` | `inventory:manage` | Admins | `inventory:assign_project` |
| Unassign | AssetDetailsPage.tsx | `DELETE /api/inventory-assignments/:id` | `inventory:manage` | Admins | `inventory:unassign` |
| Export Inventory | AssetManagementPage.tsx | Client-side | `inventory:export` | Admins | `inventory:export` |
| Create Category | InventoryCategoryPage.tsx | `POST /api/inventory/categories` | `inventory:manage` | Super Admin | `inventory:create_category` |
| Update Category | InventoryCategoryPage.tsx | `PATCH /api/inventory/categories/:id` | `inventory:manage` | Super Admin | `inventory:update_category` |
| Delete Category | InventoryCategoryPage.tsx | `DELETE /api/inventory/categories/:id` | `inventory:manage` | Super Admin | `inventory:delete_category` |

### Recommended Permissions
```
inventory:view                - View inventory module
inventory:view_categories    - View inventory categories
inventory:view_items          - View inventory items
inventory:view_details        - View item details
inventory:view_history       - View item history/log
inventory:view_analytics      - View inventory analytics
inventory:create             - Create inventory item
inventory:update             - Update inventory item
inventory:delete             - Delete inventory item
inventory:import             - Bulk import items
inventory:create_category     - Create category
inventory:update_category     - Update category
inventory:delete_category     - Delete category
inventory:assign_user        - Assign item to user
inventory:assign_project     - Assign item to project
inventory:unassign           - Unassign item
inventory:export             - Export inventory
```

---

## ACCESS MANAGEMENT

### Module Overview
User access request and provisioning management.

### Actions Identified

| Action Name | Frontend Location | Backend API | Current Permission | Who Performs | Recommended Permission |
|------------|-----------------|-------------|------------------|-------------|---------------------|
| View Module | AssetManagementPage.tsx → Access Tab | `GET /api/access-requests` | `access:view` | All users | `access:view` |
| View My Access | UserAssetsPage.tsx | `GET /api/inventory-assignments?userId=` | `access:view` | All users | `access:view_own` |
| View User Access | UserAssetsPage.tsx | `GET /api/inventory-assignments?userId=:id` | `access:view` | Admins | `access:view_user` |
| Request Access | AssetDetailsPage.tsx | `POST /api/access-requests` | `access:request` | Employees | `access:request` |
| Approve Access | AssetDetailsPage.tsx | `PATCH /api/access-requests/:id/approve` | `access:approve` | Admins | `access:approve` |
| Reject Access | AssetDetailsPage.tsx | `PATCH /api/access-requests/:id/reject` | `access:approve` | Admins | `access:reject` |
| Provision Access | AssetDetailsPage.tsx | `POST /api/inventory-assignments` | `access:provision` | Admins | `access:provision` |
| Revoke Access | AssetDetailsPage.tsx | `DELETE /api/inventory-assignments/:id` | `access:revoke` | Admins | `access:revoke` |
| View Project Access | ProjectAssetsPage.tsx | `GET /api/inventory-assignments?projectId=` | `access:view` | Admins | `access:view_project` |
| Export Access Reports | AssetManagementPage.tsx | Client-side | `access:export` | Admins | `access:export` |

### Recommended Permissions
```
access:view              - View access management module
access:view_own          - View own access/assignments
access:view_user         - View specific user's access
access:view_project     - View project access assignments
access:request          - Request access to resource
access:approve           - Approve access request
access:reject            - Reject access request
access:provision         - Provision granted access
access:revoke            - Revoke access
access:export            - Export access reports
```

---

## COMPLIANCE

### Module Overview
Document repository for compliance documents with folder hierarchy.

### Actions Identified

| Action Name | Frontend Location | Backend API | Current Permission | Who Performs | Recommended Permission |
|------------|-----------------|-------------|------------------|-------------|---------------------|
| View Module | DocumentRepositoryPage.tsx | `GET /api/compliance/items` | `compliance:view` | All users | `compliance:view` |
| View Folder | DocumentRepositoryPage.tsx | `GET /api/compliance/items?folderId=` | `compliance:view` | All users | `compliance:view_folder` |
| Create Folder | DocumentRepositoryPage.tsx → Create Button | `POST /api/compliance/folders` | `compliance:manage` | Admins | `compliance:create_folder` |
| Rename Folder | DocumentRepositoryPage.tsx | `PATCH /api/compliance/folders/:id` | `compliance:manage` | Admins | `compliance:rename_folder` |
| Move Folder | DocumentRepositoryPage.tsx | `PATCH /api/compliance/folders/:id` | `compliance:manage` | Admins | `compliance:move_folder` |
| Delete Folder | DocumentRepositoryPage.tsx | `DELETE /api/compliance/folders/:id` | `compliance:manage` | Admins | `compliance:delete_folder` |
| Upload File | DocumentRepositoryPage.tsx → Upload Button | `POST /api/compliance/files/upload` | `compliance:create` | Admins | `compliance:upload_file` |
| Download File | DocumentRepositoryPage.tsx | `GET /api/compliance/files/:id/download` | `compliance:view` | All users | `compliance:download_file` |
| Preview File | DocumentRepositoryPage.tsx | `GET /api/compliance/files/:id/preview` | `compliance:view` | All users | `compliance:preview_file` |
| Rename File | DocumentRepositoryPage.tsx | `PATCH /api/compliance/files/:id` | `compliance:manage` | Admins | `compliance:rename_file` |
| Move File | DocumentRepositoryPage.tsx | `PATCH /api/compliance/files/:id/move` | `compliance:manage` | Admins | `compliance:move_file` |
| Delete File | DocumentRepositoryPage.tsx | `DELETE /api/compliance/files/:id` | `compliance:manage` | Admins | `compliance:delete_file` |
| Replace File Version | DocumentRepositoryPage.tsx | `POST /api/compliance/files/:id/replace` | `compliance:manage` | Admins | `compliance:replace_version` |
| Restore Version | DocumentRepositoryPage.tsx | `POST /api/compliance/files/:id/restore` | `compliance:manage` | Admins | `compliance:restore_version` |
| Add Tag to File | DocumentRepositoryPage.tsx | `POST /api/compliance/files/:id/tags` | `compliance:manage` | Admins | `compliance:add_tag` |
| Remove Tag from File | DocumentRepositoryPage.tsx | `DELETE /api/compliance/files/:id/tags/:tagId` | `compliance:manage` | Admins | `compliance:remove_tag` |
| Create Tag | DocumentRepositoryPage.tsx | `POST /api/compliance/tags` | `compliance:manage` | Admins | `compliance:create_tag` |
| View Activity Log | DocumentRepositoryPage.tsx | `GET /api/compliance/activity` | `compliance:view` | Admins | `compliance:view_activity` |
| Bulk Upload | DocumentRepositoryPage.tsx | `POST /api/compliance/import` | `compliance:create` | Admins | `compliance:bulk_upload` |
| Export Repository | DocumentRepositoryPage.tsx | `GET /api/compliance/export` | `compliance:manage` | Admins | `compliance:export` |

### Recommended Permissions
```
compliance:view               - View compliance module
compliance:view_folder         - Navigate folders
compliance:download_file       - Download documents
compliance:preview_file        - Preview documents
compliance:view_activity       - View activity log
compliance:create_folder       - Create folders
compliance:rename_folder       - Rename folders
compliance:move_folder        - Move folders
compliance:delete_folder      - Delete folders
compliance:upload_file         - Upload files
compliance:rename_file         - Rename files
compliance:move_file          - Move files
compliance:delete_file        - Delete files
compliance:replace_version     - Replace file version
compliance:restore_version     - Restore previous version
compliance:add_tag            - Add tag to file
compliance:remove_tag          - Remove tag from file
compliance:create_tag          - Create new tag
compliance:bulk_upload        - Bulk upload files
compliance:export              - Export repository
```

---

## PROJECTS & ENVIRONMENTS

### Module Overview
Project and environment management with document storage.

### Actions Identified

| Action Name | Frontend Location | Backend API | Current Permission | Who Performs | Recommended Permission |
|------------|-----------------|-------------|------------------|-------------|---------------------|
| View Module | ProjectDashboardPage.tsx | `GET /api/projects-environments` | `projects:view` | All users | `projects:view` |
| View Project Details | ProjectDetailsPage.tsx | `GET /api/projects-environments/:id` | `projects:view` | All users | `projects:view_details` |
| Create Project | ProjectCreatePage.tsx | `POST /api/projects-environments` | `projects:create` | Super Admin | `projects:create` |
| Edit Project | ProjectEditPage.tsx | `PUT /api/projects-environments/:id` | `projects:manage` | Super Admin | `projects:update` |
| Delete Project | ProjectDashboardPage.tsx | `DELETE /api/projects-environments/:id` | `projects:manage` | Super Admin | `projects:delete` |
| Update Status | ProjectDetailsPage.tsx | `PATCH /api/projects-environments/:id` | `projects:manage` | Super Admin | `projects:update_status` |
| Add Team Member | ProjectDetailsPage.tsx | `PATCH /api/projects-environments/:id` | `projects:manage` | Super Admin | `projects:add_member` |
| Remove Team Member | ProjectDetailsPage.tsx | `PATCH /api/projects-environments/:id` | `projects:manage` | Super Admin | `projects:remove_member` |
| View Project Documents | ProjectDetailsPage.tsx | `GET /api/projects-environments/:id/documents` | `projects:view` | All users | `projects:view_documents` |
| Upload Document | ProjectDetailsPage.tsx | `POST /api/projects-environments/:id/documents` | `projects:manage` | Admins | `projects:upload_document` |
| Download Document | ProjectDetailsPage.tsx | `GET /api/projects-environments/:id/documents/:id` | `projects:view` | All users | `projects:download_document` |
| Delete Document | ProjectDetailsPage.tsx | `DELETE /api/projects-environments/:id/documents/:id` | `projects:manage` | Admins | `projects:delete_document` |
| View Activities | ProjectDetailsPage.tsx | `GET /api/projects-environments/:id/activities` | `projects:view` | All users | `projects:view_activities` |
| Export Projects | ProjectDashboardPage.tsx | Client-side CSV | `projects:export` | Admins | `projects:export` |

### Recommended Permissions
```
projects:view              - View projects list
projects:view_details      - View project details
projects:view_documents    - View project documents
projects:view_activities   - View project activities
projects:create           - Create new project
projects:update           - Update project details
projects:delete           - Delete project
projects:update_status     - Update project status
projects:add_member       - Add team member
projects:remove_member    - Remove team member
projects:upload_document   - Upload project document
projects:download_document - Download project document
projects:delete_document   - Delete project document
projects:export            - Export projects
```

---

## VENDORS & LICENSES

### Module Overview
Vendor directory and license tracking.

### Actions Identified

| Action Name | Frontend Location | Backend API | Current Permission | Who Performs | Recommended Permission |
|------------|-----------------|-------------|------------------|-------------|---------------------|
| View Module | VendorDirectoryPage.tsx | `GET /api/vendors` | `vendors:view` | All users | `vendors:view` |
| View Vendor Details | VendorDetailsPage.tsx | `GET /api/vendors/:id` | `vendors:view` | All users | `vendors:view_details` |
| Create Vendor | VendorDirectoryPage.tsx → Create Button | `POST /api/vendors` | `vendors:create` | Admins | `vendors:create` |
| Update Vendor | VendorDirectoryPage.tsx → Edit Dialog | `PUT /api/vendors/:id` | `vendors:manage` | Admins | `vendors:update` |
| Delete Vendor | VendorDirectoryPage.tsx → Delete Button | `DELETE /api/vendors/:id` | `vendors:manage` | Admins | `vendors:delete` |
| Update Status | VendorDetailsPage.tsx | `PUT /api/vendors/:id` | `vendors:manage` | Admins | `vendors:update_status` |
| Set Internal Owner | VendorDetailsPage.tsx | `PUT /api/vendors/:id` | `vendors:manage` | Admins | `vendors:set_owner` |
| View Vendor Inventory | VendorDetailsPage.tsx | `GET /api/vendors/:id/inventory` | `vendors:view` | Admins | `vendors:view_inventory` |
| Export Vendors | VendorDirectoryPage.tsx → Export | Client-side | `vendors:export` | Admins | `vendors:export` |
| Filter by Category | VendorDirectoryPage.tsx | Query param | `vendors:view` | All users | `vendors:view` |
| Filter by Status | VendorDirectoryPage.tsx | Query param | `vendors:view` | All users | `vendors:view` |
| Sort Vendors | VendorDirectoryPage.tsx | Query param | `vendors:view` | All users | `vendors:view` |

### Recommended Permissions
```
vendors:view              - View vendors list
vendors:view_details     - View vendor details
vendors:view_inventory   - View vendor's inventory
vendors:create           - Create new vendor
vendors:update           - Update vendor details
vendors:delete           - Delete vendor
vendors:update_status    - Update vendor status
vendors:set_owner        - Set internal owner
vendors:export           - Export vendors
```

---

## KNOWLEDGE BASE

### Module Overview
Knowledge article management with categories and rich text editor.

### Actions Identified

| Action Name | Frontend Location | Backend API | Current Permission | Who Performs | Recommended Permission |
|------------|-----------------|-------------|------------------|-------------|---------------------|
| View Module | KnowledgeCategoryPage.tsx | `GET /api/knowledge/categories` | `kb:view` | All users | `kb:view` |
| View Categories | KnowledgeCategoryPage.tsx | `GET /api/knowledge/categories` | `kb:view` | All users | `kb:view` |
| View Articles | KnowledgeCategoryPage.tsx | `GET /api/knowledge/articles` | `kb:view` | All users | `kb:view` |
| View Article | KnowledgeCategoryPage.tsx | `GET /api/knowledge/articles/:id` | `kb:view` | All users | `kb:view` |
| Create Category | KnowledgeCategoryPage.tsx | `POST /api/knowledge/categories` | `kb:manage` or `knowledge.category:create` | Admins | `kb:create_category` |
| Update Category | KnowledgeCategoryPage.tsx | `PATCH /api/knowledge/categories/:id` | `kb:manage` or `knowledge.category:update` | Admins | `kb:update_category` |
| Delete Category | KnowledgeCategoryPage.tsx | `DELETE /api/knowledge/categories/:id` | `kb:manage` or `knowledge.category:delete` | Admins | `kb:delete_category` |
| Create Article | KnowledgeCategoryPage.tsx | `POST /api/knowledge/articles` | `kb:manage` | Admins | `kb:create_article` |
| Update Article | KnowledgeCategoryPage.tsx | `PUT /api/knowledge/articles/:id` | `kb:manage` | Admins | `kb:update_article` |
| Delete Article | KnowledgeCategoryPage.tsx | `DELETE /api/knowledge/articles/:id` | `kb:manage` | Admins | `kb:delete_article` |
| Publish Article | KnowledgeCategoryPage.tsx | `PATCH /api/knowledge/articles/:id/status` | `kb:publish` or `kb:manage` | Admins | `kb:publish_article` |
| Archive Article | KnowledgeCategoryPage.tsx | `PATCH /api/knowledge/articles/:id/status` | `kb:archive` or `kb:manage` | Admins | `kb:archive_article` |
| Upload Attachment | KnowledgeCategoryPage.tsx | `POST /api/knowledge/articles/:id/attachments` | `kb:manage` | Admins | `kb:upload_attachment` |
| Download Attachment | KnowledgeCategoryPage.tsx | `GET /api/knowledge/articles/:id/attachments/:id/download` | `kb:view` | All users | `kb:download_attachment` |
| Delete Attachment | KnowledgeCategoryPage.tsx | `DELETE /api/knowledge/articles/:id/attachments/:id` | `kb:manage` | Admins | `kb:delete_attachment` |
| View Analytics | KnowledgeAnalyticsPage.tsx | `GET /api/knowledge/analytics` | `kb:view` | Admins | `kb:view_analytics` |
| Search Articles | KnowledgeCategoryPage.tsx | Query param | `kb:view` | All users | `kb:view` |
| Sort Articles | KnowledgeCategoryPage.tsx | Query param | `kb:view` | All users | `kb:view` |
| Export Articles | KnowledgeCategoryPage.tsx | Client-side | `kb:export` | Admins | `kb:export` |

### Recommended Permissions
```
kb:view                   - View knowledge base
kb:create_category         - Create category
kb:update_category         - Update category
kb:delete_category         - Delete category
kb:create_article          - Create article
kb:update_article          - Update article
kb:delete_article          - Delete article
kb:publish_article         - Publish article
kb:archive_article         - Archive article
kb:upload_attachment       - Upload attachment
kb:download_attachment      - Download attachment
kb:delete_attachment       - Delete attachment
kb:view_analytics         - View KB analytics
kb:export                 - Export KB
```

---

## REPORTS & ANALYTICS

### Module Overview
Report generation and analytics across all modules.

### Actions Identified

| Action Name | Frontend Location | Backend API | Current Permission | Who Performs | Recommended Permission |
|------------|-----------------|-------------|------------------|-------------|---------------------|
| View Module | ReportsPage.tsx | `GET /api/reports` | `reports:view` | All users | `reports:view` |
| View Report List | ReportsPage.tsx | `GET /api/reports` | `reports:view` | All users | `reports:view` |
| View Report Stats | ReportsPage.tsx | `GET /api/reports/stats/summary` | `reports:view` | All users | `reports:view_stats` |
| Generate Report | ReportsPage.tsx | `GET /api/reports/:type/download` | `reports:export` | All users | `reports:generate` |
| Preview Report | ReportsPage.tsx | `GET /api/reports/:type/preview` | `reports:view` | All users | `reports:preview` |
| Get Report Count | ReportsPage.tsx | `GET /api/reports/:type/count` | `reports:view` | All users | `reports:count` |
| Apply Filters | ReportsPage.tsx → ReportFilterModal | Query params | `reports:view` | All users | `reports:view` |
| Download Report | ReportsPage.tsx | `GET /api/reports/:type/download` | `reports:export` | All users | `reports:download` |

### Report Types Available
- Incidents
- Service Requests
- Problems
- Changes
- Inventory
- Access Requests
- Compliance
- Projects
- Vendors
- Knowledge Base
- Documents
- Users
- Roles
- Permissions
- Audit Logs

### Recommended Permissions
```
reports:view           - View reports module and list
reports:view_stats      - View report statistics
reports:preview         - Preview report data
reports:count           - Get record counts
reports:generate        - Generate report
reports:download        - Download report file
```

---

## USERS & TEAMS

### Module Overview
User account management and team administration.

### Actions Identified

| Action Name | Frontend Location | Backend API | Current Permission | Who Performs | Recommended Permission |
|------------|-----------------|-------------|------------------|-------------|---------------------|
| View Module | UsersDashboardPage.tsx | `GET /api/users-teams` | `users:view` | All users | `users:view` |
| View User List | UsersDashboardPage.tsx | `GET /api/users-teams` | `users:view` | All users | `users:view_list` |
| View User Details | UserDetailsPage.tsx | `GET /api/users-teams/:id` | `users:view` | All users | `users:view_details` |
| Create User | CreateUserPage.tsx | `POST /api/users-teams` | `users:create` | Super Admin | `users:create` |
| Edit User | EditUserPage.tsx | `PUT /api/users-teams/:id` | `users:manage` | Super Admin | `users:update` |
| Delete User | UsersDashboardPage.tsx → Delete Button | `DELETE /api/users-teams/:id` | `users:delete` | Super Admin | `users:delete` |
| Activate User | UserDetailsPage.tsx | `PATCH /api/users-teams/:id/activate` | `users:manage` | Super Admin | `users:activate` |
| Deactivate User | UserDetailsPage.tsx | `PATCH /api/users-teams/:id/deactivate` | `users:manage` | Super Admin | `users:deactivate` |
| Assign Role | UserDetailsPage.tsx | `PATCH /api/users-teams/:id/roles` | `users:manage` | Super Admin | `users:assign_role` |
| Remove Role | UserDetailsPage.tsx | `DELETE /api/users-teams/:id/roles/:roleId` | `users:manage` | Super Admin | `users:remove_role` |
| Reset Password | UserDetailsPage.tsx | `POST /api/users-teams/:id/reset-password` | `users:manage` | Super Admin | `users:reset_password` |
| Import Users | UsersImportExportPage.tsx | `POST /api/import/execute` | `settings:write` | Super Admin | `users:import` |
| Export Users | UsersImportExportPage.tsx → Export Button | Client-side Excel | `users:export` | Super Admin | `users:export` |
| View My Profile | AuthContext | `GET /api/users/me` | Auth required | All users | `users:view_own_profile` |
| Update My Profile | Profile Page | `PUT /api/users/me` | Auth required | All users | `users:update_own_profile` |
| Update Preferences | Settings | `PUT /api/users/me/preferences` | Auth required | All users | `users:update_preferences` |
| Filter Users | UsersDashboardPage.tsx | Query params | `users:view` | All users | `users:view` |
| Sort Users | UsersDashboardPage.tsx | Query params | `users:view` | All users | `users:view` |

### Recommended Permissions
```
users:view               - View users module
users:view_list          - View user list
users:view_details       - View user details
users:view_own_profile   - View own profile
users:create             - Create new user
users:update             - Update user details
users:delete             - Delete user
users:activate           - Activate user account
users:deactivate         - Deactivate user account
users:assign_role        - Assign role to user
users:remove_role        - Remove role from user
users:reset_password     - Reset user password
users:update_own_profile - Update own profile
users:update_preferences  - Update own preferences
users:import             - Bulk import users
users:export             - Export users
```

---

## ROLES & PERMISSIONS

### Module Overview
Role definition and permission management.

### Actions Identified

| Action Name | Frontend Location | Backend API | Current Permission | Who Performs | Recommended Permission |
|------------|-----------------|-------------|------------------|-------------|---------------------|
| View Module | RolesPermissionsPage.tsx | `GET /api/roles` | `roles:view` | All admins | `roles:view` |
| View Roles List | RolesPermissionsPage.tsx | `GET /api/roles` | `roles:view` | All admins | `roles:view_list` |
| View Role Details | RolesPermissionsPage.tsx | `GET /api/roles/:id` | `roles:view` | All admins | `roles:view_details` |
| View Permissions Catalog | RolesPermissionsPage.tsx | `GET /api/roles/permissions` | `roles:view` | All admins | `roles:view_permissions` |
| Create Role | RolesPermissionsPage.tsx → Create Button | `POST /api/roles` | `roles:create` | Super Admin | `roles:create` |
| Edit Role | RolesPermissionsPage.tsx → Edit Button | `PATCH /api/roles/:id` | `roles:manage` | Super Admin | `roles:update` |
| Delete Role | RolesPermissionsPage.tsx → Delete Button | `DELETE /api/roles/:id` | `roles:delete` | Super Admin | `roles:delete` |
| Update Permissions | RolesPermissionsPage.tsx | `PATCH /api/roles/:id/permissions` | `roles:manage` | Super Admin | `roles:update_permissions` |
| Select All Permissions | RolesPermissionsPage.tsx → Button | N/A | `roles:manage` | Super Admin | `roles:update_permissions` |
| Deselect All Permissions | RolesPermissionsPage.tsx → Button | N/A | `roles:manage` | Super Admin | `roles:update_permissions` |
| Search Permissions | RolesPermissionsPage.tsx | N/A | `roles:view` | All admins | `roles:view` |

### Recommended Permissions
```
roles:view                 - View roles module
roles:view_list            - View roles list
roles:view_details         - View role details
roles:view_permissions     - View permissions catalog
roles:create               - Create new role
roles:update               - Update role name/description
roles:delete               - Delete role
roles:update_permissions   - Update role permissions
```

---

## SETTINGS

### Module Overview
System configuration and settings management.

### Actions Identified

| Action Name | Frontend Location | Backend API | Current Permission | Who Performs | Recommended Permission |
|------------|-----------------|-------------|------------------|-------------|---------------------|
| View Module | SettingsPage.tsx | `GET /api/settings` | `settings:view` | All users | `settings:view` |
| View Settings List | SettingsPage.tsx | `GET /api/settings` | `settings:view` | All users | `settings:view` |
| Update Setting | SettingsPage.tsx | `PUT /api/settings/:key` | `settings:manage` | Super Admin | `settings:update` |

### Settings Categories
- AI Settings (provider, model)
- Authentication (login type, Microsoft)
- Notifications (email, teams)
- SLA (response time thresholds)
- Import (validation rules)

### Recommended Permissions
```
settings:view      - View system settings
settings:update    - Update system settings
```

---

## AI ASSISTANT

### Module Overview
Natural language AI interface for IT operations.

### Actions Identified

| Action Name | Frontend Location | Backend API | Current Permission | Who Performs | Recommended Permission |
|------------|-----------------|-------------|------------------|-------------|---------------------|
| Ask AI Question | CommandBar.tsx | `POST /api/ai/ask` | `ai:ask` | All users | `ai:ask` |
| Auto-Navigate | CommandBar.tsx | Built-in | `ai:ask` | All users | `ai:ask` |

### Recommended Permissions
```
ai:ask           - Use AI assistant
```

---

## CURRENT PERMISSION ANALYSIS

### Existing Permissions in Database

| Permission | Where Used | Replace With | Reason |
|-----------|-----------|--------------|--------|
| `dashboard:read` | Legacy dashboard routes | `dashboard:view` | Rename to view standard |
| `dashboard:view` | Dashboard, RecentActivity | Keep | Standard view permission |
| `tickets:read` | Legacy SR routes | `tickets:view` | Rename to view standard |
| `tickets:write` | Legacy SR create | `tickets:create` | Split into create/update |
| `tickets:assign` | SR assignment | Keep | Specific action permission |
| `tickets:manage` | SR status updates, delete | Split into granular | Too generic |
| `tickets:comment` | SR comments | `tickets:add_comment` | Rename for clarity |
| `tickets:export` | SR export | Keep | Specific export permission |
| `incidents:read` | Legacy incidents | `incidents:view` | Rename |
| `incidents:write` | Legacy incidents | `incidents:create` | Rename |
| `incidents:manage` | Status updates | Split granular | Too generic |
| `incidents:export` | Incident export | Keep | Specific export |
| `problems:view` | Problems module | Keep | Standard view |
| `problems:create` | Problems create | Keep | Specific create |
| `problems:manage` | Problems status | Split granular | Too generic |
| `problems:export` | Problems export | Keep | Specific export |
| `changes:read` | Legacy changes | `changes:view` | Rename |
| `changes:approve` | Change approval | Keep | Specific approval action |
| `changes:view` | Changes module | Keep | Standard view |
| `changes:create` | Change create | Keep | Specific create |
| `changes:manage` | Change updates | Split granular | Too generic |
| `changes:export` | Changes export | Keep | Specific export |
| `inventory:read` | Legacy inventory | `inventory:view` | Rename |
| `inventory:write` | Legacy inventory | `inventory:update` | Rename |
| `inventory:view` | Inventory module | Keep | Standard view |
| `inventory:create` | Item create | Keep | Specific create |
| `inventory:manage` | Item updates | Split granular | Too generic |
| `inventory:delete` | Item delete | Keep | Specific delete |
| `inventory:export` | Inventory export | Keep | Specific export |
| `access:read` | Legacy access | `access:view` | Rename |
| `access:approve` | Access approval | Keep | Specific approval |
| `access:view` | Access module | Keep | Standard view |
| `access:request` | Access request | Keep | Specific request |
| `access:provision` | Access provision | Keep | Specific provision |
| `access:revoke` | Access revoke | Keep | Specific revoke |
| `access:export` | Access export | Keep | Specific export |
| `compliance:read` | Legacy compliance | `compliance:view` | Rename |
| `compliance:write` | Legacy compliance | Split granular | Too generic |
| `compliance:view` | Compliance module | Keep | Standard view |
| `compliance:create` | File upload | Split granular | Too generic |
| `compliance:manage` | Folder/file operations | Split granular | Too generic |
| `compliance:audit` | Audit controls | Keep | Specific audit |
| `compliance:export` | Compliance export | Keep | Specific export |
| `projects:view` | Projects module | Keep | Standard view |
| `projects:create` | Project create | Keep | Specific create |
| `projects:manage` | Project updates | Split granular | Too generic |
| `projects:delete` | Project delete | Keep | Specific delete |
| `projects:export` | Projects export | Keep | Specific export |
| `vendors:view` | Vendors module | Keep | Standard view |
| `vendors:create` | Vendor create | Keep | Specific create |
| `vendors:manage` | Vendor updates | Split granular | Too generic |
| `vendors:delete` | Vendor delete | Keep | Specific delete |
| `vendors:export` | Vendors export | Keep | Specific export |
| `kb:view` | Knowledge base | Keep | Standard view |
| `kb:create` | Article create | Split granular | Too generic |
| `kb:manage` | Article updates | Split granular | Too generic |
| `kb:publish` | Article publish | Keep | Specific publish |
| `kb:archive` | Article archive | Keep | Specific archive |
| `kb:export` | KB export | Keep | Specific export |
| `knowledge.category:view` | KB categories | `kb:view` | Merge namespaces |
| `knowledge.category:create` | Category create | `kb:create_category` | Merge namespaces |
| `knowledge.category:update` | Category update | `kb:update_category` | Merge namespaces |
| `knowledge.category:delete` | Category delete | `kb:delete_category` | Merge namespaces |
| `reports:view` | Reports module | Keep | Standard view |
| `reports:create` | Custom reports | Keep | Specific create |
| `reports:export` | Report export | Keep | Specific export |
| `settings:read` | Legacy settings | `settings:view` | Rename |
| `settings:write` | Legacy settings | `settings:manage` | Rename |
| `settings:view` | Settings module | Keep | Standard view |
| `settings:manage` | Settings updates | Keep | Standard manage |
| `users:read` | Legacy users | `users:view` | Rename |
| `users:write` | Legacy users | Split granular | Too generic |
| `users:delete` | User delete | Keep | Specific delete |
| `users:view` | Users module | Keep | Standard view |
| `users:create` | User create | Keep | Specific create |
| `users:manage` | User updates | Split granular | Too generic |
| `users:export` | Users export | Keep | Specific export |
| `roles:view` | Roles module | Keep | Standard view |
| `roles:create` | Role create | Keep | Specific create |
| `roles:manage` | Role updates | Split granular | Too generic |
| `roles:delete` | Role delete | Keep | Specific delete |
| `ai:ask` | AI assistant | Keep | Specific AI action |

---

## WORKFLOW ANALYSIS PER MODULE

### Service Requests Workflow
```
Employee
    ↓
Raises Request → OPEN
    ↓
Admin assigns → ASSIGNED
    ↓
Assigned Engineer starts work → IN_PROGRESS
    ↓
Engineer needs input → WAITING_FOR_USER
    ↓
Employee provides input
    ↓
Engineer resumes → IN_PROGRESS
    ↓
Engineer completes → COMPLETED
    ↓
Admin/Engineer closes → CLOSED
    ↓
[Optional] Super Admin reopens → OPEN
```

### Incident Workflow
```
Opened → Assigned → In Progress → Resolved → Closed
```

### Change Request Workflow
```
Submitted → Pending Approval → Approved → Implementing → Completed → Closed
                                    ↓
                                Rejected (terminal)
```

### Document Repository Workflow
```
Create Folder
    ↓
Navigate into Folder
    ↓
Upload Files
    ↓
Rename/Move/Delete as needed
    ↓
Add Tags for organization
    ↓
Download/Preview when needed
```

### Knowledge Base Workflow
```
Create Category
    ↓
Create Article (Draft)
    ↓
Edit Article Content
    ↓
Upload Attachments
    ↓
Publish Article (or Archive)
    ↓
Viewers read and use
```

---

## HIDDEN ACTIONS INVENTORY

These are actions that may not be immediately obvious but change data:

### Bulk Operations
| Action | Location | Backend API |
|--------|----------|-------------|
| Bulk Import Users | UsersImportExportPage.tsx | `POST /api/import/execute` |
| Bulk Import Inventory | Import Framework | `POST /api/import/execute` |
| Bulk Upload Documents | DocumentRepositoryPage.tsx | `POST /api/compliance/import` |
| Bulk Delete Documents | DocumentRepositoryPage.tsx | `DELETE /api/compliance/files/:id` |

### File Operations
| Action | Location | Backend API |
|--------|----------|-------------|
| Upload Resolution Document | IncidentDetailPage.tsx | `POST /api/incidents/:id/resolution-document` |
| Replace File Version | DocumentRepositoryPage.tsx | `POST /api/compliance/files/:id/replace` |
| Restore File Version | DocumentRepositoryPage.tsx | `POST /api/compliance/files/:id/restore` |

### Data Export
| Action | Location | Backend API |
|--------|----------|-------------|
| Export to CSV (SR) | ServiceRequestsPage.tsx | Client-side |
| Export to Excel (Users) | UsersDashboardPage.tsx | Client-side |
| Export to CSV (Projects) | ProjectDashboardPage.tsx | Client-side |
| Generate Report | ReportsPage.tsx | `GET /api/reports/:type/download` |

### Administrative
| Action | Location | Backend API |
|--------|----------|-------------|
| Reset User Password | UserDetailsPage.tsx | `POST /api/users-teams/:id/reset-password` |
| Activate User | UserDetailsPage.tsx | `PATCH /api/users-teams/:id/activate` |
| Deactivate User | UserDetailsPage.tsx | `PATCH /api/users-teams/:id/deactivate` |
| Assign Role | UserDetailsPage.tsx | `PATCH /api/users-teams/:id/roles` |
| Remove Role | UserDetailsPage.tsx | `DELETE /api/users-teams/:id/roles/:roleId` |

---

## FINAL PERMISSION BLUEPRINT

### Complete Permission Catalog

#### Module: Dashboard
| Permission | Description | Recommended Roles |
|-----------|-------------|-------------------|
| `dashboard:view` | View dashboard | Employee, Admin, Super Admin |
| `dashboard:view_my_tasks` | View personal task counts | Employee, Admin, Super Admin |
| `dashboard:view_activity` | View recent activity feed | Employee, Admin, Super Admin |
| `dashboard:view_health` | View system health status | Admin, Super Admin |

#### Module: Service Requests
| Permission | Description | Recommended Roles |
|-----------|-------------|-------------------|
| `tickets:view` | View service requests | Employee, Admin, Super Admin |
| `tickets:view_own` | View own requests | Employee, Admin, Super Admin |
| `tickets:view_all` | View all requests | Admin, Super Admin |
| `tickets:create` | Raise new request | Employee, Admin, Super Admin |
| `tickets:edit` | Edit request | Admin, Super Admin |
| `tickets:delete` | Delete request | Super Admin |
| `tickets:assign` | Assign request | Admin, Super Admin |
| `tickets:reassign` | Reassign request | Admin, Super Admin |
| `tickets:update_status` | Generic status update | Admin, Super Admin |
| `tickets:status_open` | Set to OPEN | Admin, Super Admin |
| `tickets:status_assigned` | Set to ASSIGNED | Admin, Super Admin |
| `tickets:status_in_progress` | Set to IN_PROGRESS | Admin, Super Admin |
| `tickets:status_waiting` | Set to WAITING_FOR_USER | Admin, Super Admin |
| `tickets:status_completed` | Set to COMPLETED | Admin, Super Admin |
| `tickets:status_closed` | Set to CLOSED | Admin, Super Admin |
| `tickets:reopen` | Reopen closed request | Super Admin |
| `tickets:add_comment` | Add comment | Employee, Admin, Super Admin |
| `tickets:view_comments` | View comments | Employee, Admin, Super Admin |
| `tickets:view_timeline` | View timeline | Admin, Super Admin |
| `tickets:upload_attachment` | Upload attachment | Employee, Admin, Super Admin |
| `tickets:download_attachment` | Download attachment | Employee, Admin, Super Admin |
| `tickets:delete_attachment` | Delete attachment | Super Admin |
| `tickets:export` | Export to CSV | Employee, Admin, Super Admin |
| `tickets:print` | Print request | Employee, Admin, Super Admin |

#### Module: Incidents
| Permission | Description | Recommended Roles |
|-----------|-------------|-------------------|
| `incidents:view` | View incidents | Employee, Admin, Super Admin |
| `incidents:create` | Create incident | Admin, Super Admin |
| `incidents:update` | Update incident | Admin, Super Admin |
| `incidents:update_status` | Update status | Admin, Super Admin |
| `incidents:update_severity` | Update severity | Admin, Super Admin |
| `incidents:upload_resolution` | Upload resolution doc | Admin, Super Admin |
| `incidents:delete_resolution` | Delete resolution doc | Admin, Super Admin |
| `incidents:export` | Export incidents | Admin, Super Admin |

#### Module: Problems
| Permission | Description | Recommended Roles |
|-----------|-------------|-------------------|
| `problems:view` | View problems | Employee, Admin, Super Admin |
| `problems:create` | Create problem | Admin, Super Admin |
| `problems:update` | Update problem | Admin, Super Admin |
| `problems:update_status` | Update status | Admin, Super Admin |
| `problems:link_incident` | Link to incident | Admin, Super Admin |
| `problems:export` | Export problems | Admin, Super Admin |

#### Module: Changes
| Permission | Description | Recommended Roles |
|-----------|-------------|-------------------|
| `changes:view` | View changes | Employee, Admin, Super Admin |
| `changes:create` | Submit change request | Employee, Admin, Super Admin |
| `changes:update` | Update change | Owner, Admin, Super Admin |
| `changes:update_status` | Update status | Admin, Super Admin |
| `changes:approve` | Approve change | Admin, Super Admin |
| `changes:reject` | Reject change | Admin, Super Admin |
| `changes:implement` | Mark as implemented | Owner, Admin, Super Admin |
| `changes:export` | Export changes | Admin, Super Admin |

#### Module: Inventory
| Permission | Description | Recommended Roles |
|-----------|-------------|-------------------|
| `inventory:view` | View inventory | Employee, Admin, Super Admin |
| `inventory:view_categories` | View categories | Employee, Admin, Super Admin |
| `inventory:view_items` | View items | Employee, Admin, Super Admin |
| `inventory:view_details` | View item details | Employee, Admin, Super Admin |
| `inventory:view_history` | View history | Admin, Super Admin |
| `inventory:view_analytics` | View analytics | Admin, Super Admin |
| `inventory:create` | Create item | Super Admin |
| `inventory:update` | Update item | Super Admin |
| `inventory:delete` | Delete item | Super Admin |
| `inventory:import` | Bulk import | Super Admin |
| `inventory:create_category` | Create category | Super Admin |
| `inventory:update_category` | Update category | Super Admin |
| `inventory:delete_category` | Delete category | Super Admin |
| `inventory:assign_user` | Assign to user | Admin, Super Admin |
| `inventory:assign_project` | Assign to project | Admin, Super Admin |
| `inventory:unassign` | Unassign | Admin, Super Admin |
| `inventory:export` | Export inventory | Admin, Super Admin |

#### Module: Access Management
| Permission | Description | Recommended Roles |
|-----------|-------------|-------------------|
| `access:view` | View access module | Employee, Admin, Super Admin |
| `access:view_own` | View own access | Employee, Admin, Super Admin |
| `access:view_user` | View user access | Admin, Super Admin |
| `access:view_project` | View project access | Admin, Super Admin |
| `access:request` | Request access | Employee, Admin, Super Admin |
| `access:approve` | Approve request | Admin, Super Admin |
| `access:reject` | Reject request | Admin, Super Admin |
| `access:provision` | Provision access | Admin, Super Admin |
| `access:revoke` | Revoke access | Admin, Super Admin |
| `access:export` | Export access | Admin, Super Admin |

#### Module: Compliance
| Permission | Description | Recommended Roles |
|-----------|-------------|-------------------|
| `compliance:view` | View compliance | Employee, Admin, Super Admin |
| `compliance:view_folder` | Navigate folders | Employee, Admin, Super Admin |
| `compliance:download_file` | Download documents | Employee, Admin, Super Admin |
| `compliance:preview_file` | Preview documents | Employee, Admin, Super Admin |
| `compliance:view_activity` | View activity log | Admin, Super Admin |
| `compliance:create_folder` | Create folders | Admin, Super Admin |
| `compliance:rename_folder` | Rename folders | Admin, Super Admin |
| `compliance:move_folder` | Move folders | Admin, Super Admin |
| `compliance:delete_folder` | Delete folders | Admin, Super Admin |
| `compliance:upload_file` | Upload files | Admin, Super Admin |
| `compliance:rename_file` | Rename files | Admin, Super Admin |
| `compliance:move_file` | Move files | Admin, Super Admin |
| `compliance:delete_file` | Delete files | Admin, Super Admin |
| `compliance:replace_version` | Replace version | Admin, Super Admin |
| `compliance:restore_version` | Restore version | Admin, Super Admin |
| `compliance:add_tag` | Add tag | Admin, Super Admin |
| `compliance:remove_tag` | Remove tag | Admin, Super Admin |
| `compliance:create_tag` | Create tag | Admin, Super Admin |
| `compliance:bulk_upload` | Bulk upload | Admin, Super Admin |
| `compliance:export` | Export repository | Admin, Super Admin |

#### Module: Projects
| Permission | Description | Recommended Roles |
|-----------|-------------|-------------------|
| `projects:view` | View projects | Employee, Admin, Super Admin |
| `projects:view_details` | View project details | Employee, Admin, Super Admin |
| `projects:view_documents` | View documents | Employee, Admin, Super Admin |
| `projects:view_activities` | View activities | Employee, Admin, Super Admin |
| `projects:create` | Create project | Super Admin |
| `projects:update` | Update project | Super Admin |
| `projects:delete` | Delete project | Super Admin |
| `projects:update_status` | Update status | Super Admin |
| `projects:add_member` | Add team member | Super Admin |
| `projects:remove_member` | Remove member | Super Admin |
| `projects:upload_document` | Upload document | Admin, Super Admin |
| `projects:download_document` | Download document | Employee, Admin, Super Admin |
| `projects:delete_document` | Delete document | Admin, Super Admin |
| `projects:export` | Export projects | Admin, Super Admin |

#### Module: Vendors
| Permission | Description | Recommended Roles |
|-----------|-------------|-------------------|
| `vendors:view` | View vendors | Employee, Admin, Super Admin |
| `vendors:view_details` | View vendor details | Employee, Admin, Super Admin |
| `vendors:view_inventory` | View vendor inventory | Admin, Super Admin |
| `vendors:create` | Create vendor | Admin, Super Admin |
| `vendors:update` | Update vendor | Admin, Super Admin |
| `vendors:delete` | Delete vendor | Admin, Super Admin |
| `vendors:update_status` | Update status | Admin, Super Admin |
| `vendors:set_owner` | Set internal owner | Admin, Super Admin |
| `vendors:export` | Export vendors | Admin, Super Admin |

#### Module: Knowledge Base
| Permission | Description | Recommended Roles |
|-----------|-------------|-------------------|
| `kb:view` | View knowledge base | Employee, Admin, Super Admin |
| `kb:create_category` | Create category | Admin, Super Admin |
| `kb:update_category` | Update category | Admin, Super Admin |
| `kb:delete_category` | Delete category | Admin, Super Admin |
| `kb:create_article` | Create article | Admin, Super Admin |
| `kb:update_article` | Update article | Admin, Super Admin |
| `kb:delete_article` | Delete article | Admin, Super Admin |
| `kb:publish_article` | Publish article | Admin, Super Admin |
| `kb:archive_article` | Archive article | Admin, Super Admin |
| `kb:upload_attachment` | Upload attachment | Admin, Super Admin |
| `kb:download_attachment` | Download attachment | Employee, Admin, Super Admin |
| `kb:delete_attachment` | Delete attachment | Admin, Super Admin |
| `kb:view_analytics` | View KB analytics | Admin, Super Admin |
| `kb:export` | Export KB | Admin, Super Admin |

#### Module: Reports
| Permission | Description | Recommended Roles |
|-----------|-------------|-------------------|
| `reports:view` | View reports | Employee, Admin, Super Admin |
| `reports:view_stats` | View statistics | Employee, Admin, Super Admin |
| `reports:preview` | Preview report | Employee, Admin, Super Admin |
| `reports:count` | Get record counts | Employee, Admin, Super Admin |
| `reports:generate` | Generate report | Employee, Admin, Super Admin |
| `reports:download` | Download report | Employee, Admin, Super Admin |

#### Module: Users
| Permission | Description | Recommended Roles |
|-----------|-------------|-------------------|
| `users:view` | View users | Admin, Super Admin |
| `users:view_list` | View user list | Admin, Super Admin |
| `users:view_details` | View user details | Admin, Super Admin |
| `users:view_own_profile` | View own profile | Employee, Admin, Super Admin |
| `users:create` | Create user | Super Admin |
| `users:update` | Update user | Super Admin |
| `users:delete` | Delete user | Super Admin |
| `users:activate` | Activate user | Super Admin |
| `users:deactivate` | Deactivate user | Super Admin |
| `users:assign_role` | Assign role | Super Admin |
| `users:remove_role` | Remove role | Super Admin |
| `users:reset_password` | Reset password | Super Admin |
| `users:update_own_profile` | Update own profile | Employee, Admin, Super Admin |
| `users:update_preferences` | Update preferences | Employee, Admin, Super Admin |
| `users:import` | Import users | Super Admin |
| `users:export` | Export users | Super Admin |

#### Module: Roles
| Permission | Description | Recommended Roles |
|-----------|-------------|-------------------|
| `roles:view` | View roles | Admin, Super Admin |
| `roles:view_list` | View roles list | Admin, Super Admin |
| `roles:view_details` | View role details | Admin, Super Admin |
| `roles:view_permissions` | View permissions | Admin, Super Admin |
| `roles:create` | Create role | Super Admin |
| `roles:update` | Update role | Super Admin |
| `roles:delete` | Delete role | Super Admin |
| `roles:update_permissions` | Update permissions | Super Admin |

#### Module: Settings
| Permission | Description | Recommended Roles |
|-----------|-------------|-------------------|
| `settings:view` | View settings | Admin, Super Admin |
| `settings:update` | Update settings | Super Admin |

#### Module: AI Assistant
| Permission | Description | Recommended Roles |
|-----------|-------------|-------------------|
| `ai:ask` | Use AI assistant | Employee, Admin, Super Admin |

---

## RECOMMENDATIONS

### 1. Deprecate Generic Permissions
Remove the following generic permissions and replace with granular actions:
- `tickets:manage` → Split into `tickets:update_status`, `tickets:reopen`, `tickets:delete`
- `incidents:manage` → Split into `incidents:update_status`, `incidents:update_severity`
- `problems:manage` → Split into `problems:update_status`
- `changes:manage` → Split into `changes:update_status`, `changes:implement`
- `inventory:manage` → Split into `inventory:update`, `inventory:delete`, `inventory:assign_*`
- `vendors:manage` → Split into `vendors:update`, `vendors:delete`, `vendors:set_owner`
- `kb:manage` → Split into `kb:update_article`, `kb:delete_article`
- `users:manage` → Split into `users:update`, `users:activate`, `users:deactivate`, `users:reset_password`
- `roles:manage` → Split into `roles:update`, `roles:update_permissions`
- `compliance:manage` → Split into folder/file operations

### 2. Merge Permission Namespaces
Merge knowledge.category namespace into kb namespace:
- `knowledge.category:view` → `kb:view`
- `knowledge.category:create` → `kb:create_category`
- `knowledge.category:update` → `kb:update_category`
- `knowledge.category:delete` → `kb:delete_category`

### 3. Rename Legacy Permissions
Rename legacy permissions to follow standard naming:
- `*:*:read` → `*:*:view`
- `*:*:write` → `*:*:update` or `*:*:create`

### 4. Role-Based Default Permissions

#### Super Admin
All permissions

#### Admin
```
Dashboard: view, view_my_tasks, view_activity
Service Requests: view, view_all, create, edit, assign, reassign, update_status, reopen, add_comment, view_comments, view_timeline, upload_attachment, download_attachment, export, print
Incidents: view, create, update, update_status, update_severity, upload_resolution, delete_resolution, export
Problems: view, create, update, update_status, link_incident, export
Changes: view, create, update, update_status, approve, reject, implement, export
Inventory: view, view_categories, view_items, view_details, view_history, view_analytics, create_category, update_category, delete_category, assign_user, assign_project, unassign, export
Access Management: view, view_user, view_project, request, approve, reject, provision, revoke, export
Compliance: view, view_folder, download_file, preview_file, view_activity, create_folder, rename_folder, move_folder, delete_folder, upload_file, rename_file, move_file, delete_file, replace_version, restore_version, add_tag, remove_tag, create_tag, bulk_upload, export
Projects: view, view_details, view_documents, view_activities, upload_document, download_document, delete_document, export
Vendors: view, view_details, view_inventory, create, update, delete, update_status, set_owner, export
Knowledge Base: view, create_category, update_category, delete_category, create_article, update_article, delete_article, publish_article, archive_article, upload_attachment, delete_attachment, view_analytics, export
Reports: view, view_stats, preview, count, generate, download
Users: view, view_list, view_details, activate, deactivate, assign_role, remove_role, update_preferences, export
Roles: view, view_list, view_details, view_permissions
Settings: view, update
AI: ask
```

#### Employee
```
Dashboard: view, view_my_tasks, view_activity
Service Requests: view, view_own, create, add_comment, view_comments, upload_attachment, download_attachment, export, print
Incidents: view
Problems: view
Changes: view, create
Inventory: view, view_categories, view_items, view_details
Access Management: view, view_own, request
Compliance: view, view_folder, download_file, preview_file
Projects: view, view_details, view_documents, view_activities, download_document
Vendors: view, view_details
Knowledge Base: view, download_attachment
Reports: view, view_stats, preview, count, generate, download
Users: view_own_profile, update_own_profile, update_preferences
AI: ask
```

### 5. Implementation Phases

**Phase 1: Add New Permissions**
- Add all granular permissions to database
- Keep old permissions for backward compatibility

**Phase 2: Update Backend**
- Add new permission checks to all routes
- Support both old and new permissions during transition

**Phase 3: Update Frontend**
- Add permission guards to all buttons
- Remove old permission references

**Phase 4: Clean Up**
- Remove deprecated permissions from database
- Update seed file

### 6. Verification Checklist

- [ ] All frontend pages inspected
- [ ] All components inspected
- [ ] All buttons documented
- [ ] All dropdown actions documented
- [ ] All context menus documented
- [ ] All API routes inspected
- [ ] All Express controllers inspected
- [ ] All Prisma models reviewed
- [ ] All workflows documented
- [ ] All hidden actions identified
- [ ] Current permissions catalogued
- [ ] Recommended permissions defined
- [ ] Role recommendations provided

---

*End of Report*
