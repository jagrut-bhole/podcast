-- AlterTable
ALTER TABLE "Meeting" ADD COLUMN     "memberCapacity" INTEGER NOT NULL DEFAULT 4,
ADD COLUMN     "viewerCapacity" INTEGER NOT NULL DEFAULT 10;
