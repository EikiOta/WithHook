/*
  Warnings:

  - You are about to drop the column `is_deleted` on the `meanings` table. All the data in the column will be lost.
  - You are about to drop the column `is_deleted` on the `memory_hooks` table. All the data in the column will be lost.
  - You are about to drop the column `is_deleted` on the `user_words` table. All the data in the column will be lost.
  - You are about to drop the column `is_deleted` on the `words` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "meanings" DROP COLUMN "is_deleted";

-- AlterTable
ALTER TABLE "memory_hooks" DROP COLUMN "is_deleted";

-- AlterTable
ALTER TABLE "user_words" DROP COLUMN "is_deleted";

-- AlterTable
ALTER TABLE "words" DROP COLUMN "is_deleted";
