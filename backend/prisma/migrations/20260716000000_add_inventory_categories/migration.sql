-- Migration: Add Inventory Categories and Subcategories
-- Created: 2024-07-16

-- Create InventoryCategory table
CREATE TABLE `InventoryCategory` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    UNIQUE INDEX `InventoryCategory_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create InventorySubCategory table
CREATE TABLE `InventorySubCategory` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `categoryId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    INDEX `InventorySubCategory_categoryId_idx`(`categoryId`),
    UNIQUE INDEX `InventorySubCategory_categoryId_name_key`(`categoryId`, `name`),
    PRIMARY KEY (`id`),
    CONSTRAINT `InventorySubCategory_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `InventoryCategory`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Add categoryId and subcategoryId to Asset table
ALTER TABLE `Asset` ADD COLUMN `categoryId` VARCHAR(191) NULL;
ALTER TABLE `Asset` ADD COLUMN `subcategoryId` VARCHAR(191) NULL;

-- Add foreign key constraints to Asset table
ALTER TABLE `Asset` ADD CONSTRAINT `Asset_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `InventoryCategory`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `Asset` ADD CONSTRAINT `Asset_subcategoryId_fkey` FOREIGN KEY (`subcategoryId`) REFERENCES `InventorySubCategory`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Create indexes for better query performance
CREATE INDEX `Asset_categoryId_idx` ON `Asset`(`categoryId`);
CREATE INDEX `Asset_subcategoryId_idx` ON `Asset`(`subcategoryId`);

-- Insert default categories and subcategories
INSERT INTO `InventoryCategory` (`id`, `name`, `description`, `status`, `createdAt`, `updatedAt`) VALUES
('cat_hardware', 'Hardware', 'Physical equipment and devices', 'ACTIVE', NOW(), NOW()),
('cat_software', 'Software', 'Software licenses and subscriptions', 'ACTIVE', NOW(), NOW()),
('cat_network', 'Networking', 'Network equipment and infrastructure', 'ACTIVE', NOW(), NOW()),
('cat_peripherals', 'Peripherals', 'Accessories and peripheral devices', 'ACTIVE', NOW(), NOW());

INSERT INTO `InventorySubCategory` (`id`, `name`, `description`, `status`, `categoryId`, `createdAt`, `updatedAt`) VALUES
-- Hardware subcategories
('sub_laptop', 'Laptop', 'Portable computers', 'ACTIVE', 'cat_hardware', NOW(), NOW()),
('sub_desktop', 'Desktop', 'Desktop computers and workstations', 'ACTIVE', 'cat_hardware', NOW(), NOW()),
('sub_server', 'Server', 'Server hardware', 'ACTIVE', 'cat_hardware', NOW(), NOW()),
('sub_mobile', 'Mobile', 'Mobile devices like phones and tablets', 'ACTIVE', 'cat_hardware', NOW(), NOW()),
-- Software subcategories
('sub_os', 'Operating System', 'OS licenses', 'ACTIVE', 'cat_software', NOW(), NOW()),
('sub_productivity', 'Productivity', 'Office and productivity software', 'ACTIVE', 'cat_software', NOW(), NOW()),
('sub_security', 'Security', 'Antivirus and security software', 'ACTIVE', 'cat_software', NOW(), NOW()),
-- Networking subcategories
('sub_router', 'Router', 'Network routers', 'ACTIVE', 'cat_network', NOW(), NOW()),
('sub_switch', 'Switch', 'Network switches', 'ACTIVE', 'cat_network', NOW(), NOW()),
('sub_firewall', 'Firewall', 'Security appliances', 'ACTIVE', 'cat_network', NOW(), NOW()),
-- Peripherals subcategories
('sub_monitor', 'Monitor', 'Display monitors', 'ACTIVE', 'cat_peripherals', NOW(), NOW()),
('sub_keyboard', 'Keyboard', 'Keyboard devices', 'ACTIVE', 'cat_peripherals', NOW(), NOW()),
('sub_mouse', 'Mouse', 'Mouse and pointing devices', 'ACTIVE', 'cat_peripherals', NOW(), NOW()),
('sub_printer', 'Printer', 'Printing devices', 'ACTIVE', 'cat_peripherals', NOW(), NOW());
