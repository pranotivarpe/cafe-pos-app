/*
  Warnings:

  - You are about to alter the column `status` on the `Order` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(0))`.
  - You are about to alter the column `orderTime` on the `tables` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `DateTime(3)`.
  - You are about to alter the column `reservedUntil` on the `tables` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `DateTime(3)`.
  - A unique constraint covering the columns `[number]` on the table `tables` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `number` to the `tables` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Order` ADD COLUMN `updatedAt` DATETIME(3) NOT NULL,
    MODIFY `status` ENUM('PENDING', 'PREPARING', 'SERVED', 'PAID', 'CANCELLED') NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE `tables` ADD COLUMN `capacity` INTEGER NOT NULL DEFAULT 4,
    ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `number` INTEGER NOT NULL,
    ADD COLUMN `reservedFrom` DATETIME(3) NULL,
    MODIFY `orderTime` DATETIME(3) NULL,
    MODIFY `reservedUntil` DATETIME(3) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `tables_number_key` ON `tables`(`number`);
