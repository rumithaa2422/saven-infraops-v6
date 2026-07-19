-- Migration: Add Knowledge Categories
-- Created: 2024-07-19
-- Description: Add KnowledgeCategory model and extend KnowledgeBaseArticle with new fields

-- Create KnowledgeCategory table
CREATE TABLE `KnowledgeCategory` (
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

-- Add new columns to KnowledgeBaseArticle for extended metadata
ALTER TABLE `KnowledgeBaseArticle` ADD COLUMN `categoryId` VARCHAR(191) NULL;
ALTER TABLE `KnowledgeBaseArticle` ADD COLUMN `summary` TEXT NULL;
ALTER TABLE `KnowledgeBaseArticle` ADD COLUMN `tags` LONGTEXT NULL;
ALTER TABLE `KnowledgeBaseArticle` ADD COLUMN `status` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT';
ALTER TABLE `KnowledgeBaseArticle` ADD COLUMN `featured` BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE `KnowledgeBaseArticle` ADD COLUMN `viewCount` INT NOT NULL DEFAULT 0;
ALTER TABLE `KnowledgeBaseArticle` ADD COLUMN `lastViewedAt` DATETIME(3) NULL;
ALTER TABLE `KnowledgeBaseArticle` ADD COLUMN `publishedAt` DATETIME(3) NULL;
ALTER TABLE `KnowledgeBaseArticle` ADD COLUMN `updatedBy` VARCHAR(191) NULL;

-- Add foreign key constraint for categoryId
ALTER TABLE `KnowledgeBaseArticle` ADD CONSTRAINT `KnowledgeBaseArticle_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `KnowledgeCategory`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Create indexes for KnowledgeBaseArticle
CREATE INDEX `KnowledgeBaseArticle_categoryId_idx` ON `KnowledgeBaseArticle`(`categoryId`);
CREATE INDEX `KnowledgeBaseArticle_status_idx` ON `KnowledgeBaseArticle`(`status`);
CREATE INDEX `KnowledgeBaseArticle_featured_idx` ON `KnowledgeBaseArticle`(`featured`);

-- Insert default knowledge categories (idempotent with IGNORE)
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
