/*
  Warnings:

  - You are about to drop the `CUSTOMERUSERMASTER` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE `CUSTOMERUSERMASTER`;

-- CreateTable
CREATE TABLE `TEMPORARAYUSER` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `phoneNumber` VARCHAR(20) NOT NULL,
    `address` VARCHAR(255) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `TEMPORARAYUSER_phoneNumber_key`(`phoneNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
