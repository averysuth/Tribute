/*
  Warnings:

  - Added the required column `timeZone` to the `events` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "events" ADD COLUMN     "mapUrl" TEXT,
ADD COLUMN     "posterUrl" TEXT,
ADD COLUMN     "timeZone" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "performer_profiles" ADD COLUMN     "community" TEXT,
ADD COLUMN     "region" TEXT;

-- AlterTable
ALTER TABLE "user_profiles" ADD COLUMN     "coverImageUrl" TEXT;
