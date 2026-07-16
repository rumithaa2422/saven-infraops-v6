-- Migration: Extend ProjectEnvironment table with projectCode and additional fields
-- This migration handles existing seeded data by generating unique project codes

-- Step 1: Add projectCode column as nullable
ALTER TABLE "ProjectEnvironment" ADD COLUMN "projectCode" TEXT;

-- Step 2: Update existing records with unique project codes
-- Generate codes based on projectName with unique suffixes
UPDATE "ProjectEnvironment" 
SET "projectCode" = (
    SELECT COALESCE(
        "ProjectEnvironment"."projectName" || '-' || 
        (SELECT COUNT(*)::TEXT FROM "ProjectEnvironment" p2 WHERE p2."projectName" = "ProjectEnvironment"."projectName" AND p2.id <= "ProjectEnvironment".id),
        'PRJ-' || (SELECT COUNT(*)::TEXT + 1 FROM "ProjectEnvironment")
    )
)
WHERE "projectCode" IS NULL;

-- Step 3: Add unique constraint and make NOT NULL
ALTER TABLE "ProjectEnvironment" ALTER COLUMN "projectCode" SET NOT NULL;
ALTER TABLE "ProjectEnvironment" ADD CONSTRAINT "ProjectEnvironment_projectCode_key" UNIQUE ("projectCode");

-- Step 4: Add new optional columns
ALTER TABLE "ProjectEnvironment" ADD COLUMN "client" TEXT;
ALTER TABLE "ProjectEnvironment" ADD COLUMN "description" TEXT;
ALTER TABLE "ProjectEnvironment" ADD COLUMN "department" TEXT;
ALTER TABLE "ProjectEnvironment" ADD COLUMN "technologyStack" TEXT;
ALTER TABLE "ProjectEnvironment" ADD COLUMN "priority" TEXT DEFAULT 'MEDIUM';
ALTER TABLE "ProjectEnvironment" ADD COLUMN "status" TEXT DEFAULT 'ACTIVE';
ALTER TABLE "ProjectEnvironment" ADD COLUMN "budget" DECIMAL(12, 2);
ALTER TABLE "ProjectEnvironment" ADD COLUMN "startDate" TIMESTAMP(3);
ALTER TABLE "ProjectEnvironment" ADD COLUMN "expectedEndDate" TIMESTAMP(3);
ALTER TABLE "ProjectEnvironment" ADD COLUMN "actualEndDate" TIMESTAMP(3);
ALTER TABLE "ProjectEnvironment" ADD COLUMN "projectType" TEXT;
ALTER TABLE "ProjectEnvironment" ADD COLUMN "projectLocation" TEXT;
ALTER TABLE "ProjectEnvironment" ADD COLUMN "remarks" TEXT;

-- Step 5: Update existing records with default values for new columns
UPDATE "ProjectEnvironment" SET "priority" = 'MEDIUM' WHERE "priority" IS NULL;
UPDATE "ProjectEnvironment" SET "status" = 'ACTIVE' WHERE "status" IS NULL;

-- Step 6: Make priority and status NOT NULL with defaults
ALTER TABLE "ProjectEnvironment" ALTER COLUMN "priority" SET NOT NULL;
ALTER TABLE "ProjectEnvironment" ALTER COLUMN "status" SET NOT NULL;
