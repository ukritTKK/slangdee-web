-- CreateTable
CREATE TABLE "Slang" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "word" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "meaningTh" TEXT NOT NULL,
    "origin" TEXT,
    "examples" TEXT NOT NULL,
    "tags" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Slang_slug_key" ON "Slang"("slug");
