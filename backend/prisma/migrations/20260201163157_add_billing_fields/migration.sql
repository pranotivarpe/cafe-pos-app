/*
  Warnings:

  - A unique constraint covering the columns `[billNumber]` on the table `Order` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `billNumber` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subtotal` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tax` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Order` ADD COLUMN `billNumber` VARCHAR(191) NOT NULL,
    ADD COLUMN `paidAt` DATETIME(3) NULL,
    ADD COLUMN `paymentMode` VARCHAR(191) NULL,
    ADD COLUMN `subtotal` DECIMAL(10, 2) NOT NULL,
    ADD COLUMN `tax` DECIMAL(10, 2) NOT NULL;

-- AlterTable
ALTER TABLE `Table` ADD COLUMN `capacity` INTEGER NOT NULL DEFAULT 4,
    ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX `Order_billNumber_key` ON `Order`(`billNumber`);
