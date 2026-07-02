# Phase 4 – Service Request Ownership and Action Permissions

## Overview

Phase 4 implements **ticket ownership-based authorization** for the Service Requests module. This ensures that:
- **Super Admins** can perform all actions on any ticket
- **Admins** can only perform actions on tickets assigned to them
- **Employees** can only view their own tickets

---

## Modified Files

### Backend
1. **`/backend/src/modules/serviceRequests/serviceRequest.routes.ts`**
   - Added `canPerformAction()` helper function
   - Added ownership authorization check to `PATCH /:id` endpoint
   - Returns HTTP 403 for unauthorized actions

### Frontend
1. **`/frontend/src/pages/ServiceRequestsPage.tsx`**
   - Added `isAdmin` role check
   - Added `canPerformActions` ownership logic
   - Updated action button visibility to use ownership-based checks
   - Added informational message for Admins viewing non-owned tickets

---

## Authorization Logic

### Backend Implementation

```typescript
function canPerformAction(user: Express.Request['user'], ticket: { assigneeId?: string | null }): boolean {
  if (!user) return false;
  
  // Super Admin can perform all actions
  if (user.roles.includes('Super Admin')) return true;
  
  // Admin can only perform actions if they are the assignee
  if (user.roles.includes('Admin')) {
    return ticket.assigneeId === user.id;
  }
  
  // Employees cannot perform admin actions
  return false;
}
```

### Frontend Implementation

```typescript
// Role checks
const isSuperAdmin = user?.roles.includes('Super Admin') ?? false;
const isAdmin = user?.roles.includes('Admin') ?? false;

// Ownership check: Admin can only perform actions on tickets assigned to them
const canPerformActions = isSuperAdmin || (isAdmin && selected?.assigneeId === user?.id);
```

---

## Permission Matrix

| Role | View All Tickets | Assign Tickets | Actions on Owned Tickets | Actions on Others' Tickets |
|------|------------------|----------------|--------------------------|---------------------------|
| Super Admin | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| Admin | ✅ Yes | ❌ No | ✅ Yes | ❌ No (403 error) |
| Employee | ❌ Own only | ❌ No | ❌ N/A | ❌ N/A |

---

## API Endpoints

### PATCH `/service-requests/:id`
**Permission Required:** `tickets:write` or `tickets:manage`

**Authorization Flow:**
1. User must be authenticated
2. User must have `tickets:manage` or `tickets:write` permission
3. User must be Super Admin OR (Admin AND assigneeId matches user.id)

**Error Responses:**
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - User not authorized to perform action on this ticket
- `404 Not Found` - Ticket does not exist

### PATCH `/service-requests/:id/assign`
**Permission Required:** Super Admin role only

**Authorization Flow:**
1. User must be Super Admin
2. Assignee must have Admin role

**Error Responses:**
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - User is not Super Admin
- `400 Bad Request` - Assignee does not have Admin role
- `404 Not Found` - Ticket does not exist

---

## UI Behavior

### Action Buttons
Action buttons (Escalate, Wait for User, Close, Add Comment) are displayed when:
- User is Super Admin, OR
- User is Admin AND the ticket is assigned to them (`selected.assigneeId === user.id`)

### Assignment Dropdown
The "Assigned To" dropdown is **only visible to Super Admins**. Admins cannot reassign tickets.

### Informational Notice
When an Admin opens a ticket that is:
- Assigned to another Admin, OR
- Unassigned

They see an informational message:
> "This ticket is assigned to another admin or is unassigned. You can only perform actions on tickets assigned to you."

---

## Test Scenarios

### Test 1: Super Admin
- [ ] Login as Super Admin
- [ ] View all Service Requests
- [ ] Open any ticket and see all action buttons
- [ ] Assign a ticket to Admin A
- [ ] Verify assignment saved correctly

### Test 2: Admin with Owned Ticket
- [ ] Login as Admin A
- [ ] View all Service Requests
- [ ] Open a ticket assigned to Admin A
- [ ] Verify all action buttons are visible
- [ ] Perform action (e.g., Close ticket) - should succeed

### Test 3: Admin with Non-Owned Ticket
- [ ] Login as Admin A
- [ ] Open a ticket assigned to Admin B or unassigned
- [ ] Verify action buttons are NOT visible
- [ ] Verify informational message is displayed
- [ ] Try to perform action via API directly - should return 403

### Test 4: Employee
- [ ] Login as Employee
- [ ] View only their own Service Requests
- [ ] Open their ticket - no action buttons visible
- [ ] Verify they cannot see other employees' tickets

---

## Screenshots (Placeholder)

Due to external testing environment being unavailable, screenshots would be captured as follows:

### Screenshot 1: Super Admin View
- Shows all tickets in table
- Ticket drawer with: Assignment dropdown, Action buttons (Escalate, Wait for User, Close), Comment box

### Screenshot 2: Assigned Admin View
- Shows all tickets in table
- Ticket drawer with: Action buttons visible, No assignment dropdown

### Screenshot 3: Non-Assigned Admin View
- Shows all tickets in table
- Ticket drawer with: No action buttons, Informational notice visible

### Screenshot 4: Employee View
- Shows only own tickets in table
- Ticket drawer with: No action buttons, No assignment dropdown

---

## Security Considerations

1. **Defense in Depth:** Both frontend (UI hiding) and backend (403 errors) enforce authorization
2. **Least Privilege:** Admins can only modify tickets assigned to them
3. **Audit Logging:** All actions are logged with actor information
4. **No Client-Side Trust:** Backend validates ownership on every request

---

## Rollout Recommendations

1. Deploy backend changes first (authorization enforcement)
2. Deploy frontend changes second (UI improvements)
3. Monitor for 403 errors as expected behavior
4. Update user documentation if needed
