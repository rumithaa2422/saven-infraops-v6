/*
  Warnings:

  - The primary key for the `incidentresolutiondocument` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `fileName` on the `incidentresolutiondocument` table. The data in that column could be lost. The data in that column will be cast from `VarChar(255)` to `VarChar(191)`.
  - You are about to alter the column `storedName` on the `incidentresolutiondocument` table. The data in that column could be lost. The data in that column will be cast from `VarChar(255)` to `VarChar(191)`.
  - You are about to alter the column `uploadedByName` on the `incidentresolutiondocument` table. The data in that column could be lost. The data in that column will be cast from `VarChar(255)` to `VarChar(191)`.
  - You are about to drop the column `vendor` on the `inventorymaster` table. All the data in the column will be lost.
  - You are about to alter the column `status` on the `knowledgebasearticle` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(9))`.
  - You are about to drop the column `resolvedAt` on the `servicerequest` table. All the data in the column will be lost.
  - You are about to drop the `aiconversation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `compliancecontrolstatus` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `complianceframeworkstatus` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[projectCode]` on the table `ProjectEnvironment` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `projectCode` to the `ProjectEnvironment` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `incidentresolutiondocument` DROP FOREIGN KEY `IncidentResolutionDocument_incidentId_fkey`;

-- AlterTable
ALTER TABLE `compliancecontrol` MODIFY `description` TEXT NULL,
    ALTER COLUMN `updatedAt` DROP DEFAULT;

-- AlterTable
ALTER TABLE `complianceframework` MODIFY `description` TEXT NULL,
    ALTER COLUMN `updatedAt` DROP DEFAULT;

-- AlterTable
ALTER TABLE `incident` ADD COLUMN `resolutionDocReplacedAt` DATETIME(3) NULL,
    ADD COLUMN `resolutionDocUploadedAt` DATETIME(3) NULL,
    ADD COLUMN `statusChangedAt` DATETIME(3) NULL,
    ADD COLUMN `statusChangedBy` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `incidentresolutiondocument` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(191) NOT NULL,
    MODIFY `incidentId` VARCHAR(191) NOT NULL,
    MODIFY `fileName` VARCHAR(191) NOT NULL,
    MODIFY `storedName` VARCHAR(191) NOT NULL,
    MODIFY `mimeType` VARCHAR(191) NOT NULL,
    MODIFY `uploadedBy` VARCHAR(191) NULL,
    MODIFY `uploadedByName` VARCHAR(191) NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `inventorycategory` MODIFY `description` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `inventorymaster` DROP COLUMN `vendor`,
    ADD COLUMN `vendorId` VARCHAR(191) NULL,
    ADD COLUMN `vendorName` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `inventorysubcategory` MODIFY `description` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `knowledgebasearticle` MODIFY `status` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE `projectenvironment` ADD COLUMN `actualEndDate` DATETIME(3) NULL,
    ADD COLUMN `budget` DECIMAL(12, 2) NULL,
    ADD COLUMN `client` VARCHAR(191) NULL,
    ADD COLUMN `department` VARCHAR(191) NULL,
    ADD COLUMN `description` VARCHAR(191) NULL,
    ADD COLUMN `expectedEndDate` DATETIME(3) NULL,
    ADD COLUMN `managerId` VARCHAR(191) NULL,
    ADD COLUMN `primaryVendorId` VARCHAR(191) NULL,
    ADD COLUMN `priority` VARCHAR(191) NOT NULL DEFAULT 'MEDIUM',
    ADD COLUMN `projectCode` VARCHAR(191) NOT NULL,
    ADD COLUMN `projectLocation` VARCHAR(191) NULL,
    ADD COLUMN `projectType` VARCHAR(191) NULL,
    ADD COLUMN `remarks` VARCHAR(191) NULL,
    ADD COLUMN `startDate` DATETIME(3) NULL,
    ADD COLUMN `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    ADD COLUMN `teamMemberIds` VARCHAR(191) NULL,
    ADD COLUMN `technologyStack` VARCHAR(191) NULL,
    MODIFY `environmentName` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `role` ALTER COLUMN `updatedAt` DROP DEFAULT;

-- AlterTable
ALTER TABLE `servicerequest` DROP COLUMN `resolvedAt`;

-- AlterTable
ALTER TABLE `user` ADD COLUMN `address` VARCHAR(191) NULL,
    ADD COLUMN `dateJoined` DATETIME(3) NULL,
    ADD COLUMN `designation` VARCHAR(191) NULL,
    ADD COLUMN `employeeId` VARCHAR(191) NULL,
    ADD COLUMN `employmentType` VARCHAR(191) NULL,
    ADD COLUMN `remarks` VARCHAR(191) NULL,
    ADD COLUMN `team` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `vendorlicense` ADD COLUMN `vendorId` VARCHAR(191) NULL;

-- DropTable
DROP TABLE `aiconversation`;

-- DropTable
DROP TABLE `compliancecontrolstatus`;

-- DropTable
DROP TABLE `complianceframeworkstatus`;

-- CreateTable
CREATE TABLE `InventoryHistory` (
    `id` VARCHAR(191) NOT NULL,
    `inventoryId` VARCHAR(191) NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `performedBy` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `InventoryHistory_inventoryId_idx`(`inventoryId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InventoryDocument` (
    `id` VARCHAR(191) NOT NULL,
    `inventoryId` VARCHAR(191) NOT NULL,
    `fileName` VARCHAR(191) NOT NULL,
    `fileType` VARCHAR(191) NOT NULL,
    `fileSize` INTEGER NOT NULL,
    `url` VARCHAR(191) NOT NULL,
    `documentType` VARCHAR(191) NOT NULL DEFAULT 'Other',
    `uploadedBy` VARCHAR(191) NULL,
    `userId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `InventoryDocument_inventoryId_idx`(`inventoryId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InventoryAssignment` (
    `id` VARCHAR(191) NOT NULL,
    `inventoryId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `projectId` VARCHAR(191) NULL,
    `assignedBy` VARCHAR(191) NOT NULL,
    `assignedByName` VARCHAR(191) NOT NULL,
    `assignedDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `remarks` TEXT NULL,
    `returnedDate` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `InventoryAssignment_inventoryId_idx`(`inventoryId`),
    INDEX `InventoryAssignment_userId_idx`(`userId`),
    INDEX `InventoryAssignment_projectId_idx`(`projectId`),
    INDEX `InventoryAssignment_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ComplianceDocument` (
    `id` VARCHAR(191) NOT NULL,
    `fileName` VARCHAR(191) NOT NULL,
    `storedFileName` VARCHAR(191) NOT NULL,
    `mimeType` VARCHAR(191) NOT NULL,
    `fileSize` INTEGER NOT NULL,
    `uploadedBy` VARCHAR(191) NULL,
    `uploadedByEmail` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ComplianceDocument_storedFileName_key`(`storedFileName`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProjectDocument` (
    `id` VARCHAR(191) NOT NULL,
    `projectId` VARCHAR(191) NOT NULL,
    `fileName` VARCHAR(191) NOT NULL,
    `originalFileName` VARCHAR(191) NOT NULL,
    `fileType` VARCHAR(191) NOT NULL,
    `fileSize` INTEGER NOT NULL,
    `uploadedBy` VARCHAR(191) NULL,
    `uploadedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `remarks` VARCHAR(191) NULL,

    INDEX `ProjectDocument_projectId_idx`(`projectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProjectActivity` (
    `id` VARCHAR(191) NOT NULL,
    `projectId` VARCHAR(191) NOT NULL,
    `activityType` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `performedBy` VARCHAR(191) NULL,
    `performedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `metadata` JSON NULL,

    INDEX `ProjectActivity_projectId_idx`(`projectId`),
    INDEX `ProjectActivity_performedAt_idx`(`performedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Vendor` (
    `id` VARCHAR(191) NOT NULL,
    `vendorName` VARCHAR(191) NOT NULL,
    `vendorCode` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `website` VARCHAR(191) NULL,
    `country` VARCHAR(191) NULL,
    `gstNumber` VARCHAR(191) NULL,
    `registrationNumber` VARCHAR(191) NULL,
    `primaryContactName` VARCHAR(191) NOT NULL,
    `designation` VARCHAR(191) NULL,
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `address` TEXT NULL,
    `remarks` TEXT NULL,
    `contractStartDate` DATETIME(3) NULL,
    `contractExpiryDate` DATETIME(3) NULL,
    `renewalDate` DATETIME(3) NULL,
    `paymentTerms` VARCHAR(191) NULL,
    `internalOwnerId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Vendor_vendorCode_key`(`vendorCode`),
    INDEX `Vendor_vendorCode_idx`(`vendorCode`),
    INDEX `Vendor_status_idx`(`status`),
    INDEX `Vendor_category_idx`(`category`),
    INDEX `Vendor_contractExpiryDate_idx`(`contractExpiryDate`),
    INDEX `Vendor_renewalDate_idx`(`renewalDate`),
    INDEX `Vendor_internalOwnerId_idx`(`internalOwnerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DocumentFolder` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `parentFolderId` VARCHAR(191) NULL,
    `createdBy` VARCHAR(191) NULL,
    `createdByEmail` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `DocumentFolder_parentFolderId_idx`(`parentFolderId`),
    INDEX `DocumentFolder_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DocumentFile` (
    `id` VARCHAR(191) NOT NULL,
    `folderId` VARCHAR(191) NULL,
    `fileName` VARCHAR(191) NOT NULL,
    `originalFileName` VARCHAR(191) NOT NULL,
    `fileExtension` VARCHAR(191) NOT NULL,
    `mimeType` VARCHAR(191) NOT NULL,
    `fileSize` INTEGER NOT NULL,
    `storagePath` VARCHAR(191) NOT NULL,
    `uploadedBy` VARCHAR(191) NULL,
    `uploadedByEmail` VARCHAR(191) NULL,
    `uploadedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `modifiedAt` DATETIME(3) NOT NULL,
    `description` TEXT NULL,
    `downloadCount` INTEGER NOT NULL DEFAULT 0,
    `version` INTEGER NOT NULL DEFAULT 1,

    INDEX `DocumentFile_folderId_idx`(`folderId`),
    INDEX `DocumentFile_uploadedAt_idx`(`uploadedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DocumentTag` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `color` VARCHAR(191) NOT NULL DEFAULT '#5468ff',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `DocumentTag_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DocumentFileTag` (
    `fileId` VARCHAR(191) NOT NULL,
    `tagId` VARCHAR(191) NOT NULL,
    `addedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`fileId`, `tagId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DocumentActivity` (
    `id` VARCHAR(191) NOT NULL,
    `fileId` VARCHAR(191) NULL,
    `folderId` VARCHAR(191) NULL,
    `action` VARCHAR(191) NOT NULL,
    `details` TEXT NULL,
    `performedBy` VARCHAR(191) NULL,
    `performedByEmail` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `DocumentActivity_fileId_idx`(`fileId`),
    INDEX `DocumentActivity_folderId_idx`(`folderId`),
    INDEX `DocumentActivity_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Notification` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `referenceModule` VARCHAR(191) NULL,
    `referenceId` VARCHAR(191) NULL,
    `actionUrl` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Notification_userId_idx`(`userId`),
    INDEX `Notification_isRead_idx`(`isRead`),
    INDEX `Notification_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `InventoryMaster_vendorId_idx` ON `InventoryMaster`(`vendorId`);

-- CreateIndex
CREATE INDEX `KnowledgeBaseArticle_status_idx` ON `KnowledgeBaseArticle`(`status`);

-- CreateIndex
CREATE UNIQUE INDEX `ProjectEnvironment_projectCode_key` ON `ProjectEnvironment`(`projectCode`);

-- CreateIndex
CREATE INDEX `ProjectEnvironment_primaryVendorId_idx` ON `ProjectEnvironment`(`primaryVendorId`);

-- CreateIndex
CREATE INDEX `VendorLicense_vendorId_idx` ON `VendorLicense`(`vendorId`);

-- AddForeignKey
ALTER TABLE `IncidentResolutionDocument` ADD CONSTRAINT `IncidentResolutionDocument_incidentId_fkey` FOREIGN KEY (`incidentId`) REFERENCES `Incident`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InventoryMaster` ADD CONSTRAINT `InventoryMaster_vendorId_fkey` FOREIGN KEY (`vendorId`) REFERENCES `Vendor`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InventoryHistory` ADD CONSTRAINT `InventoryHistory_inventoryId_fkey` FOREIGN KEY (`inventoryId`) REFERENCES `InventoryMaster`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InventoryDocument` ADD CONSTRAINT `InventoryDocument_inventoryId_fkey` FOREIGN KEY (`inventoryId`) REFERENCES `InventoryMaster`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InventoryAssignment` ADD CONSTRAINT `InventoryAssignment_inventoryId_fkey` FOREIGN KEY (`inventoryId`) REFERENCES `InventoryMaster`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InventoryAssignment` ADD CONSTRAINT `InventoryAssignment_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InventoryAssignment` ADD CONSTRAINT `InventoryAssignment_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `ProjectEnvironment`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjectDocument` ADD CONSTRAINT `ProjectDocument_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `ProjectEnvironment`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjectActivity` ADD CONSTRAINT `ProjectActivity_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `ProjectEnvironment`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Vendor` ADD CONSTRAINT `Vendor_internalOwnerId_fkey` FOREIGN KEY (`internalOwnerId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DocumentFolder` ADD CONSTRAINT `DocumentFolder_parentFolderId_fkey` FOREIGN KEY (`parentFolderId`) REFERENCES `DocumentFolder`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DocumentFile` ADD CONSTRAINT `DocumentFile_folderId_fkey` FOREIGN KEY (`folderId`) REFERENCES `DocumentFolder`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DocumentFileTag` ADD CONSTRAINT `DocumentFileTag_fileId_fkey` FOREIGN KEY (`fileId`) REFERENCES `DocumentFile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DocumentFileTag` ADD CONSTRAINT `DocumentFileTag_tagId_fkey` FOREIGN KEY (`tagId`) REFERENCES `DocumentTag`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
