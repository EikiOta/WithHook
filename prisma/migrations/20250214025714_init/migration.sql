-- CreateTable
CREATE TABLE "users" (
    "user_id" TEXT NOT NULL,
    "nickname" TEXT,
    "profile_image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);
