-- DropForeignKey
ALTER TABLE "meanings" DROP CONSTRAINT "meanings_user_id_fkey";

-- DropForeignKey
ALTER TABLE "memory_hooks" DROP CONSTRAINT "memory_hooks_user_id_fkey";

-- AddForeignKey
ALTER TABLE "meanings" ADD CONSTRAINT "meanings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("providerAccountId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memory_hooks" ADD CONSTRAINT "memory_hooks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("providerAccountId") ON DELETE RESTRICT ON UPDATE CASCADE;
