-- CreateTable
CREATE TABLE "user_words" (
    "user_words_id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "word_id" INTEGER NOT NULL,
    "memory_hook_id" INTEGER,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_words_pkey" PRIMARY KEY ("user_words_id")
);

-- AddForeignKey
ALTER TABLE "user_words" ADD CONSTRAINT "user_words_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_words" ADD CONSTRAINT "user_words_word_id_fkey" FOREIGN KEY ("word_id") REFERENCES "words"("word_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_words" ADD CONSTRAINT "user_words_memory_hook_id_fkey" FOREIGN KEY ("memory_hook_id") REFERENCES "memory_hooks"("memory_hook_id") ON DELETE SET NULL ON UPDATE CASCADE;
