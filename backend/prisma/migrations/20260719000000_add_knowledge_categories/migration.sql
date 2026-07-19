-- Migration: Add Knowledge Categories
-- Created: 2024-07-19
-- Description: Add KnowledgeCategory model and extend KnowledgeBaseArticle with genuinely new fields
-- This migration is IDEMPOTENT and safe for existing databases

-- ============================================
-- STEP 1: Create KnowledgeCategory table (if not exists)
-- ============================================
CREATE TABLE IF NOT EXISTS `KnowledgeCategory` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `color` VARCHAR(191) NULL DEFAULT '#5468ff',
    `icon` VARCHAR(191) NULL,
    `displayOrder` INT NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `createdBy` VARCHAR(191) NULL,
    `updatedBy` VARCHAR(191) NULL,
    UNIQUE INDEX `KnowledgeCategory_name_key`(`name`),
    INDEX `KnowledgeCategory_isActive_idx`(`isActive`),
    INDEX `KnowledgeCategory_displayOrder_idx`(`displayOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ============================================
-- STEP 2: Add genuinely NEW columns to KnowledgeBaseArticle
-- These columns do NOT exist in the current database:
-- - categoryId
-- - summary
-- - tags
-- - featured
-- - viewCount
-- - lastViewedAt
-- - publishedAt
-- - updatedBy
-- ============================================

-- Add categoryId column (if not exists)
SET @column_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'KnowledgeBaseArticle' AND COLUMN_NAME = 'categoryId');
SET @sql = IF(@column_exists = 0, 'ALTER TABLE `KnowledgeBaseArticle` ADD COLUMN `categoryId` VARCHAR(191) NULL', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add summary column (if not exists)
SET @column_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'KnowledgeBaseArticle' AND COLUMN_NAME = 'summary');
SET @sql = IF(@column_exists = 0, 'ALTER TABLE `KnowledgeBaseArticle` ADD COLUMN `summary` TEXT NULL', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add tags column (if not exists)
SET @column_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'KnowledgeBaseArticle' AND COLUMN_NAME = 'tags');
SET @sql = IF(@column_exists = 0, 'ALTER TABLE `KnowledgeBaseArticle` ADD COLUMN `tags` LONGTEXT NULL', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add featured column (if not exists)
SET @column_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'KnowledgeBaseArticle' AND COLUMN_NAME = 'featured');
SET @sql = IF(@column_exists = 0, 'ALTER TABLE `KnowledgeBaseArticle` ADD COLUMN `featured` BOOLEAN NOT NULL DEFAULT false', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add viewCount column (if not exists)
SET @column_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'KnowledgeBaseArticle' AND COLUMN_NAME = 'viewCount');
SET @sql = IF(@column_exists = 0, 'ALTER TABLE `KnowledgeBaseArticle` ADD COLUMN `viewCount` INT NOT NULL DEFAULT 0', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add lastViewedAt column (if not exists)
SET @column_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'KnowledgeBaseArticle' AND COLUMN_NAME = 'lastViewedAt');
SET @sql = IF(@column_exists = 0, 'ALTER TABLE `KnowledgeBaseArticle` ADD COLUMN `lastViewedAt` DATETIME(3) NULL', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add publishedAt column (if not exists)
SET @column_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'KnowledgeBaseArticle' AND COLUMN_NAME = 'publishedAt');
SET @sql = IF(@column_exists = 0, 'ALTER TABLE `KnowledgeBaseArticle` ADD COLUMN `publishedAt` DATETIME(3) NULL', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add updatedBy column (if not exists)
SET @column_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'KnowledgeBaseArticle' AND COLUMN_NAME = 'updatedBy');
SET @sql = IF(@column_exists = 0, 'ALTER TABLE `KnowledgeBaseArticle` ADD COLUMN `updatedBy` VARCHAR(191) NULL', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- STEP 3: Add foreign key constraint (if not exists)
-- ============================================
SET @fk_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'KnowledgeBaseArticle' 
    AND CONSTRAINT_NAME = 'KnowledgeBaseArticle_categoryId_fkey');
SET @sql = IF(@fk_exists = 0, 'ALTER TABLE `KnowledgeBaseArticle` ADD CONSTRAINT `KnowledgeBaseArticle_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `KnowledgeCategory`(`id`) ON DELETE SET NULL ON UPDATE CASCADE', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- STEP 4: Create indexes (if not exists)
-- ============================================

-- categoryId index
SET @idx_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'KnowledgeBaseArticle' 
    AND INDEX_NAME = 'KnowledgeBaseArticle_categoryId_idx');
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX `KnowledgeBaseArticle_categoryId_idx` ON `KnowledgeBaseArticle`(`categoryId`)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- featured index
SET @idx_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'KnowledgeBaseArticle' 
    AND INDEX_NAME = 'KnowledgeBaseArticle_featured_idx');
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX `KnowledgeBaseArticle_featured_idx` ON `KnowledgeBaseArticle`(`featured`)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- STEP 5: Insert default knowledge categories (idempotent with IGNORE)
-- ============================================
INSERT IGNORE INTO `KnowledgeCategory` (`id`, `name`, `description`, `color`, `displayOrder`, `isActive`, `createdAt`, `updatedAt`) VALUES
('kbcat_getting_started', 'Getting Started', 'Guides and tutorials for new users', '#10b981', 1, true, NOW(), NOW()),
('kbcat_infrastructure', 'Infrastructure', 'Infrastructure setup and management', '#3b82f6', 2, true, NOW(), NOW()),
('kbcat_development', 'Development', 'Development best practices and guides', '#8b5cf6', 3, true, NOW(), NOW()),
('kbcat_cloud', 'Cloud', 'Cloud platforms and services', '#06b6d4', 4, true, NOW(), NOW()),
('kbcat_security', 'Security', 'Security policies and procedures', '#ef4444', 5, true, NOW(), NOW()),
('kbcat_ai', 'AI', 'AI and machine learning resources', '#f59e0b', 6, true, NOW(), NOW()),
('kbcat_hr', 'HR', 'Human resources policies and guides', '#ec4899', 7, true, NOW(), NOW()),
('kbcat_policies', 'Policies', 'Company policies and procedures', '#64748b', 8, true, NOW(), NOW()),
('kbcat_internal_tools', 'Internal Tools', 'Internal tool documentation', '#84cc16', 9, true, NOW(), NOW());
