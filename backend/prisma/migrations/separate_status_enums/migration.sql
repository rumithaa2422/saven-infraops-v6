-- Migration: Separate Status Enums for Each Module
-- This migration separates the unified WorkStatus enum into module-specific enums
-- 
-- IMPORTANT: Backup your database before running this migration!
--
-- Status values mapping:
-- WorkStatus -> ServiceRequestStatus (for ServiceRequest):
--   OPEN -> OPEN
--   ASSIGNED -> ASSIGNED  
--   IN_PROGRESS -> IN_PROGRESS
--   WAITING_FOR_USER -> WAITING_FOR_USER
--   COMPLETED -> COMPLETED
--   CLOSED -> CLOSED
--
-- WorkStatus -> IncidentStatus (for Incident):
--   OPEN -> OPEN
--   ASSIGNED -> ASSIGNED
--   IN_PROGRESS -> IN_PROGRESS
--   RESOLVED -> RESOLVED
--   CLOSED -> CLOSED
--
-- WorkStatus -> ProblemStatus (for Problem):
--   OPEN -> OPEN
--   ASSIGNED -> ASSIGNED
--   IN_PROGRESS -> IN_PROGRESS
--   RESOLVED -> RESOLVED
--   CLOSED -> CLOSED
--
-- WorkStatus -> ChangeRequestStatus (for ChangeRequest):
--   OPEN -> OPEN
--   PENDING_APPROVAL -> PENDING_APPROVAL
--   APPROVED -> APPROVED
--   IMPLEMENTING -> IMPLEMENTING
--   COMPLETED -> COMPLETED
--   CLOSED -> CLOSED

-- Step 1: Create new enums
CREATE TYPE "ServiceRequestStatus" AS ENUM ('OPEN', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_FOR_USER', 'COMPLETED', 'CLOSED');
CREATE TYPE "IncidentStatus" AS ENUM ('OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');
CREATE TYPE "ProblemStatus" AS ENUM ('OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');
CREATE TYPE "ChangeRequestStatus" AS ENUM ('OPEN', 'PENDING_APPROVAL', 'APPROVED', 'IMPLEMENTING', 'COMPLETED', 'CLOSED');

-- Step 2: Drop the old enum constraint and update columns
-- Note: The exact constraint names may vary, so you may need to adjust them

-- For ServiceRequest
ALTER TABLE "ServiceRequest" ALTER COLUMN "status" TYPE "ServiceRequestStatus" USING "status"::text::"ServiceRequestStatus";

-- For Incident  
ALTER TABLE "Incident" ALTER COLUMN "status" TYPE "IncidentStatus" USING "status"::text::"IncidentStatus";

-- For Problem
ALTER TABLE "Problem" ALTER COLUMN "status" TYPE "ProblemStatus" USING "status"::text::"ProblemStatus";

-- For ChangeRequest
ALTER TABLE "ChangeRequest" ALTER COLUMN "status" TYPE "ChangeRequestStatus" USING "status"::text::"ChangeRequestStatus";

-- Step 3: Drop the old enum (after all columns are migrated)
DROP TYPE IF EXISTS "WorkStatus";

-- Step 4: Verify the migration
-- SELECT 
--     'ServiceRequest' as table_name,
--     status,
--     COUNT(*) as count
-- FROM "ServiceRequest"
-- GROUP BY status
-- ORDER BY status;

-- SELECT
--     'Incident' as table_name,
--     status,
--     COUNT(*) as count
-- FROM "Incident"
-- GROUP BY status
-- ORDER BY status;

-- etc.
