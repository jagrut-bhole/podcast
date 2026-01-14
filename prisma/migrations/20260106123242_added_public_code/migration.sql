/*
  Warnings:

  - You are about to alter the column `inviteCode` on the `Meeting` table. The data in that column could be lost. The data in that column will be cast from `VarChar(8)` to `VarChar(6)`.
  - A unique constraint covering the columns `[publicCode]` on the table `Meeting` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `publicCode` to the `Meeting` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Meeting" ADD COLUMN     "publicCode" VARCHAR(6) NOT NULL,
ALTER COLUMN "inviteCode" SET DATA TYPE VARCHAR(6);

-- CreateIndex
CREATE UNIQUE INDEX "Meeting_publicCode_key" ON "Meeting"("publicCode");
