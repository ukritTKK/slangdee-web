/*
  Warnings:

  - You are about to drop the column `examples` on the `Slang` table. All the data in the column will be lost.
  - You are about to drop the column `meaningTh` on the `Slang` table. All the data in the column will be lost.
  - You are about to drop the column `origin` on the `Slang` table. All the data in the column will be lost.
  - You are about to drop the column `tags` on the `Slang` table. All the data in the column will be lost.
  - You are about to drop the column `word` on the `Slang` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "SlangTranslation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "slangId" INTEGER NOT NULL,
    "locale" TEXT NOT NULL,
    "word" TEXT NOT NULL,
    "meaning" TEXT NOT NULL,
    "origin" TEXT,
    CONSTRAINT "SlangTranslation_slangId_fkey" FOREIGN KEY ("slangId") REFERENCES "Slang" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Example" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "slangId" INTEGER NOT NULL,
    "locale" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    CONSTRAINT "Example_slangId_fkey" FOREIGN KEY ("slangId") REFERENCES "Slang" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "SlangTag" (
    "slangId" INTEGER NOT NULL,
    "tagId" INTEGER NOT NULL,

    PRIMARY KEY ("slangId", "tagId"),
    CONSTRAINT "SlangTag_slangId_fkey" FOREIGN KEY ("slangId") REFERENCES "Slang" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SlangTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Slang" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "slug" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Slang" ("createdAt", "id", "slug", "updatedAt") SELECT "createdAt", "id", "slug", "updatedAt" FROM "Slang";
DROP TABLE "Slang";
ALTER TABLE "new_Slang" RENAME TO "Slang";
CREATE UNIQUE INDEX "Slang_slug_key" ON "Slang"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "SlangTranslation_slangId_locale_key" ON "SlangTranslation"("slangId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_slug_key" ON "Tag"("slug");
