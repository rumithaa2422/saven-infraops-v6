-- Create enum types for compliance management
CREATE TABLE IF NOT EXISTS `ComplianceFrameworkStatus` (
    `name` VARCHAR(191) NOT NULL,
    PRIMARY KEY (`name`)
);

INSERT INTO `ComplianceFrameworkStatus` (`name`) VALUES
    ('DRAFT'),
    ('ACTIVE'),
    ('ARCHIVED');

CREATE TABLE IF NOT EXISTS `ComplianceControlStatus` (
    `name` VARCHAR(191) NOT NULL,
    PRIMARY KEY (`name`)
);

INSERT INTO `ComplianceControlStatus` (`name`) VALUES
    ('DRAFT'),
    ('PENDING'),
    ('APPROVED'),
    ('REJECTED'),
    ('COMPLETED');

-- Create ComplianceFramework table
CREATE TABLE `ComplianceFramework` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` LONGTEXT NULL,
    `status` ENUM('DRAFT', 'ACTIVE', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `createdBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
);

CREATE INDEX `ComplianceFramework_status_idx` ON `ComplianceFramework`(`status`);
CREATE INDEX `ComplianceFramework_createdAt_idx` ON `ComplianceFramework`(`createdAt`);

-- Create ComplianceControl table
CREATE TABLE `ComplianceControl` (
    `id` VARCHAR(191) NOT NULL,
    `frameworkId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` LONGTEXT NULL,
    `status` ENUM('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'COMPLETED') NOT NULL DEFAULT 'DRAFT',
    `createdBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    CONSTRAINT `ComplianceControl_frameworkId_fkey` FOREIGN KEY (`frameworkId`) REFERENCES `ComplianceFramework`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX `ComplianceControl_frameworkId_idx` ON `ComplianceControl`(`frameworkId`);
CREATE INDEX `ComplianceControl_status_idx` ON `ComplianceControl`(`status`);
CREATE INDEX `ComplianceControl_createdAt_idx` ON `ComplianceControl`(`createdAt`);

-- Create ComplianceEvidence table
CREATE TABLE `ComplianceEvidence` (
    `id` VARCHAR(191) NOT NULL,
    `controlId` VARCHAR(191) NOT NULL,
    `fileName` VARCHAR(191) NOT NULL,
    `filePath` VARCHAR(191) NOT NULL,
    `fileSize` INT NOT NULL DEFAULT 0,
    `mimeType` VARCHAR(191) NOT NULL DEFAULT 'application/octet-stream',
    `uploadedBy` VARCHAR(191) NULL,
    `uploadedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    CONSTRAINT `ComplianceEvidence_controlId_fkey` FOREIGN KEY (`controlId`) REFERENCES `ComplianceControl`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX `ComplianceEvidence_controlId_idx` ON `ComplianceEvidence`(`controlId`);
CREATE INDEX `ComplianceEvidence_uploadedAt_idx` ON `ComplianceEvidence`(`uploadedAt`);
