-- DropForeignKey
ALTER TABLE `Order` DROP FOREIGN KEY `Order_tableId_fkey`;

-- DropIndex
DROP INDEX `Order_tableId_fkey` ON `Order`;

-- AlterTable
ALTER TABLE `Order` MODIFY `tableId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `Order` ADD CONSTRAINT `Order_tableId_fkey` FOREIGN KEY (`tableId`) REFERENCES `tables`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
