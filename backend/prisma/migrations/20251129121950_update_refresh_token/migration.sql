/*
  Warnings:

  - You are about to drop the column `parentId` on the `RefreshToken` table. All the data in the column will be lost.
  - You are about to drop the column `revokedAt` on the `RefreshToken` table. All the data in the column will be lost.
  - Made the column `expiresAt` on table `RefreshToken` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "RefreshToken" DROP CONSTRAINT "RefreshToken_parentId_fkey";

-- AlterTable
ALTER TABLE "RefreshToken" DROP COLUMN "parentId",
DROP COLUMN "revokedAt",
ALTER COLUMN "expiresAt" SET NOT NULL;
