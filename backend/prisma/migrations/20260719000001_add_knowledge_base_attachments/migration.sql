-- CreateKnowledgeBaseAttachment
CREATE TABLE `KnowledgeBaseAttachment` (
    `id` VARCHAR(191) NOT NULL,
    `articleId` VARCHAR(191) NOT NULL,
    `originalFileName` VARCHAR(191) NOT NULL,
    `storedFileName` VARCHAR(191) NOT NULL,
    `mimeType` VARCHAR(191) NOT NULL,
    `fileSize` INT NOT NULL,
    `uploadedBy` VARCHAR(191) NULL,
    `uploadedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`),
    INDEX `KnowledgeBaseAttachment_articleId_idx`(`articleId`),
    CONSTRAINT `KnowledgeBaseAttachment_articleId_fkey` FOREIGN KEY (`articleId`) REFERENCES `KnowledgeBaseArticle`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
