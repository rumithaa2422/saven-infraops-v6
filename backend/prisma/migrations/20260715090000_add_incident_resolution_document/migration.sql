-- Migration: Add IncidentResolutionDocument model
-- Created: 2026-07-15

-- Create IncidentResolutionDocument table
CREATE TABLE `IncidentResolutionDocument` (
  `id` CHAR(25) NOT NULL,
  `incidentId` CHAR(25) NOT NULL,
  `fileName` VARCHAR(255) NOT NULL,
  `storedName` VARCHAR(255) NOT NULL,
  `mimeType` VARCHAR(100) NOT NULL,
  `fileSize` INT NOT NULL,
  `uploadedBy` CHAR(25) NULL,
  `uploadedByName` VARCHAR(255) NULL,
  `uploadedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `IncidentResolutionDocument_incidentId_key` (`incidentId`),
  UNIQUE INDEX `IncidentResolutionDocument_storedName_key` (`storedName`),
  INDEX `IncidentResolutionDocument_incidentId_idx` (`incidentId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Add foreign key constraint
ALTER TABLE `IncidentResolutionDocument` ADD CONSTRAINT `IncidentResolutionDocument_incidentId_fkey` FOREIGN KEY (`incidentId`) REFERENCES `Incident`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
