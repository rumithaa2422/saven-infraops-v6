-- Migration: Extend ProjectEnvironment table with projectCode and additional fields
-- This migration handles existing seeded data by generating unique project codes
-- MySQL compatible syntax

-- Step 1: Add projectCode column as nullable
ALTER TABLE `ProjectEnvironment` ADD COLUMN `projectCode` VARCHAR(255);

-- Step 2: Update existing records with unique project codes
-- Generate codes based on projectName with unique suffixes using a cursor-based approach
SET @row_number = 0;
SET @project_name = '';
SET @suffix = 0;

UPDATE `ProjectEnvironment` 
SET `projectCode` = (
    SELECT CONCAT(
        projectName, 
        '-', 
        LPAD(
            (SELECT COUNT(*) + 1 FROM `ProjectEnvironment` p2 WHERE p2.projectName = `ProjectEnvironment`.projectName AND p2.id < `ProjectEnvironment`.id), 
            3, 
            '0'
        )
    )
)
WHERE `projectCode` IS NULL;

-- For any remaining NULL values (edge cases), use a simple sequential code
UPDATE `ProjectEnvironment` 
SET `projectCode` = CONCAT('PRJ-', LPAD(id, 6, '0'))
WHERE `projectCode` IS NULL;

-- Step 3: Add unique constraint and make NOT NULL
ALTER TABLE `ProjectEnvironment` MODIFY COLUMN `projectCode` VARCHAR(255) NOT NULL;
ALTER TABLE `ProjectEnvironment` ADD UNIQUE INDEX `ProjectEnvironment_projectCode_key` (`projectCode`);

-- Step 4: Add new optional columns
ALTER TABLE `ProjectEnvironment` ADD COLUMN `client` TEXT;
ALTER TABLE `ProjectEnvironment` ADD COLUMN `description` TEXT;
ALTER TABLE `ProjectEnvironment` ADD COLUMN `department` TEXT;
ALTER TABLE `ProjectEnvironment` ADD COLUMN `technologyStack` TEXT;
ALTER TABLE `ProjectEnvironment` ADD COLUMN `priority` VARCHAR(50) DEFAULT 'MEDIUM';
ALTER TABLE `ProjectEnvironment` ADD COLUMN `status` VARCHAR(50) DEFAULT 'ACTIVE';
ALTER TABLE `ProjectEnvironment` ADD COLUMN `budget` DECIMAL(12, 2);
ALTER TABLE `ProjectEnvironment` ADD COLUMN `startDate` DATETIME;
ALTER TABLE `ProjectEnvironment` ADD COLUMN `expectedEndDate` DATETIME;
ALTER TABLE `ProjectEnvironment` ADD COLUMN `actualEndDate` DATETIME;
ALTER TABLE `ProjectEnvironment` ADD COLUMN `projectType` VARCHAR(100);
ALTER TABLE `ProjectEnvironment` ADD COLUMN `projectLocation` VARCHAR(255);
ALTER TABLE `ProjectEnvironment` ADD COLUMN `remarks` TEXT;

-- Step 5: Update existing records with default values for new columns
UPDATE `ProjectEnvironment` SET `priority` = 'MEDIUM' WHERE `priority` IS NULL;
UPDATE `ProjectEnvironment` SET `status` = 'ACTIVE' WHERE `status` IS NULL;

-- Step 6: Make priority and status NOT NULL
ALTER TABLE `ProjectEnvironment` MODIFY COLUMN `priority` VARCHAR(50) NOT NULL DEFAULT 'MEDIUM';
ALTER TABLE `ProjectEnvironment` MODIFY COLUMN `status` VARCHAR(50) NOT NULL DEFAULT 'ACTIVE';
