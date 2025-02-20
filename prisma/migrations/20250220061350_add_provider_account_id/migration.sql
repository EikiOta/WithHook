/*
  Warnings:

  - A unique constraint covering the columns `[providerAccountId]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "providerAccountId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_providerAccountId_key" ON "users"("providerAccountId");
