-- Remove DELETED from UserStatus enum (user deletion now uses hard delete)
ALTER TABLE `User` MODIFY COLUMN `status` ENUM('PENDING_ACTIVATION', 'ACTIVE', 'DISABLED', 'LOCKED') NOT NULL DEFAULT 'PENDING_ACTIVATION';
