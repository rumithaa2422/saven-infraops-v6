-- Migration: Add Inventory Master table
-- Created: 2026-07-16

-- Create InventoryMaster table
CREATE TABLE `InventoryMaster` (
    `id` VARCHAR(191) NOT NULL,
    `itemNo` VARCHAR(191) NOT NULL,
    `itemName` VARCHAR(191) NOT NULL,
    `brand` VARCHAR(191) NULL,
    `model` VARCHAR(191) NULL,
    `vendor` VARCHAR(191) NULL,
    `invoiceNo` VARCHAR(191) NULL,
    `purchaseCost` DOUBLE NULL,
    `gst` DOUBLE NULL,
    `purchaseDate` DATETIME(3) NULL,
    `warrantyMonths` INT NULL,
    `warrantyExpiry` DATETIME(3) NULL,
    `location` VARCHAR(191) NULL,
    `minStock` INT NULL,
    `currentQty` INT NOT NULL DEFAULT 0,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `categoryId` VARCHAR(191) NOT NULL,
    `subcategoryId` VARCHAR(191) NOT NULL,
    
    UNIQUE INDEX `InventoryMaster_itemNo_key`(`itemNo`),
    INDEX `InventoryMaster_categoryId_idx`(`categoryId`),
    INDEX `InventoryMaster_subcategoryId_idx`(`subcategoryId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Add foreign key for category
ALTER TABLE `InventoryMaster` ADD CONSTRAINT `InventoryMaster_categoryId_fkey`
    FOREIGN KEY (`categoryId`) REFERENCES `InventoryCategory`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add foreign key for subcategory
ALTER TABLE `InventoryMaster` ADD CONSTRAINT `InventoryMaster_subcategoryId_fkey`
    FOREIGN KEY (`subcategoryId`) REFERENCES `InventorySubCategory`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
