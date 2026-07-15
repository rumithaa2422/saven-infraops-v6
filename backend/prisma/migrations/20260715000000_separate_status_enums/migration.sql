-- Migration: Separate Status Enums for Each Module
-- This migration separates the unified WorkStatus enum into module-specific enums
-- Generated for MySQL 8.0

-- Step 1: Create new enum type for ServiceRequestStatus (MySQL uses MODIFY COLUMN with enum)
-- Step 2: Create new enum type for IncidentStatus
-- Step 3: Create new enum type for ProblemStatus
-- Step 4: Create new enum type for ChangeRequestStatus

-- Note: MySQL ALTER TABLE with ENUM requires MODIFY COLUMN

-- Modify ServiceRequest status column to new enum
ALTER TABLE `ServiceRequest` MODIFY COLUMN `status` ENUM('OPEN', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_FOR_USER', 'COMPLETED', 'CLOSED') NOT NULL DEFAULT 'OPEN';

-- Modify Incident status column to new enum
ALTER TABLE `Incident` MODIFY COLUMN `status` ENUM('OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED') NOT NULL DEFAULT 'OPEN';

-- Modify Problem status column to new enum
ALTER TABLE `Problem` MODIFY COLUMN `status` ENUM('OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED') NOT NULL DEFAULT 'OPEN';

-- Modify ChangeRequest status column to new enum
ALTER TABLE `ChangeRequest` MODIFY COLUMN `status` ENUM('OPEN', 'PENDING_APPROVAL', 'APPROVED', 'IMPLEMENTING', 'COMPLETED', 'CLOSED') NOT NULL DEFAULT 'OPEN';
