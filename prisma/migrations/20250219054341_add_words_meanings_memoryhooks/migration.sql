-- CreateTable
CREATE TABLE "words" (
    "word_id" SERIAL NOT NULL,
    "word" TEXT NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "words_pkey" PRIMARY KEY ("word_id")
);

-- CreateTable
CREATE TABLE "meanings" (
    "meaning_id" SERIAL NOT NULL,
    "word_id" INTEGER NOT NULL,
    "user_id" TEXT NOT NULL,
    "meaning" TEXT NOT NULL,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meanings_pkey" PRIMARY KEY ("meaning_id")
);

-- CreateTable
CREATE TABLE "memory_hooks" (
    "memory_hook_id" SERIAL NOT NULL,
    "word_id" INTEGER NOT NULL,
    "user_id" TEXT NOT NULL,
    "memory_hook" TEXT NOT NULL,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "memory_hooks_pkey" PRIMARY KEY ("memory_hook_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "words_word_key" ON "words"("word");

-- AddForeignKey
ALTER TABLE "meanings" ADD CONSTRAINT "meanings_word_id_fkey" FOREIGN KEY ("word_id") REFERENCES "words"("word_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meanings" ADD CONSTRAINT "meanings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memory_hooks" ADD CONSTRAINT "memory_hooks_word_id_fkey" FOREIGN KEY ("word_id") REFERENCES "words"("word_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memory_hooks" ADD CONSTRAINT "memory_hooks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
