/*
  Warnings:

  - Added the required column `meaning_id` to the `user_words` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "user_words" ADD COLUMN     "meaning_id" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "user_words" ADD CONSTRAINT "user_words_meaning_id_fkey" FOREIGN KEY ("meaning_id") REFERENCES "meanings"("meaning_id") ON DELETE RESTRICT ON UPDATE CASCADE;
