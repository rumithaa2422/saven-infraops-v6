-- Add system fields to Role table
ALTER TABLE `Role` ADD COLUMN `isSystem` BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE `Role` ADD COLUMN `isActive` BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE `Role` ADD COLUMN `createdBy` VARCHAR(191) NULL;
ALTER TABLE `Role` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);
ALTER TABLE `Role` ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3);

-- Mark existing system roles as isSystem = true
UPDATE `Role` SET `isSystem` = true WHERE `name` IN ('Super Admin', 'Admin', 'Employee');
