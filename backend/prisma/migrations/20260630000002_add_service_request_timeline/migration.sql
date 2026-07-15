-- CreateServiceRequestTimeline
CREATE TABLE `ServiceRequestTimeline` (
    `id` VARCHAR(191) NOT NULL,
    `requestId` VARCHAR(191) NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `performedBy` VARCHAR(191) NULL,
    `performedByName` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`),
    INDEX `ServiceRequestTimeline_requestId_idx`(`requestId`),
    CONSTRAINT `ServiceRequestTimeline_requestId_fkey` FOREIGN KEY (`requestId`) REFERENCES `ServiceRequest`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE 'utf8mb4_unicode_ci';
