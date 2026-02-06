-- AlterTable
ALTER TABLE `Order` ADD COLUMN `orderType` ENUM('DINE_IN', 'TAKEAWAY', 'DELIVERY') NOT NULL DEFAULT 'DINE_IN';

-- CreateTable
CREATE TABLE `DeliveryInfo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `orderId` INTEGER NOT NULL,
    `customerName` VARCHAR(191) NOT NULL,
    `customerPhone` VARCHAR(191) NOT NULL,
    `customerEmail` VARCHAR(191) NULL,
    `deliveryAddress` VARCHAR(191) NULL,
    `deliveryPlatform` ENUM('DIRECT', 'ZOMATO', 'SWIGGY') NOT NULL DEFAULT 'DIRECT',
    `platformOrderId` VARCHAR(191) NULL,
    `deliveryStatus` ENUM('PENDING', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `deliveryPartnerName` VARCHAR(191) NULL,
    `deliveryPartnerPhone` VARCHAR(191) NULL,
    `estimatedTime` DATETIME(3) NULL,
    `actualTime` DATETIME(3) NULL,
    `deliveryFee` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `packagingFee` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `platformFee` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `discount` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `specialInstructions` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `DeliveryInfo_orderId_key`(`orderId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `DeliveryInfo` ADD CONSTRAINT `DeliveryInfo_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
