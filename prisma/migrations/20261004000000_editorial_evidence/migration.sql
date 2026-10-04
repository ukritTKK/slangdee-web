CREATE TABLE "Source" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "url" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "publisher" TEXT NOT NULL,
  "kind" TEXT NOT NULL CHECK ("kind" IN ('DICTIONARY', 'ARTICLE', 'POST')),
  "publishedAt" DATETIME,
  "accessedAt" DATETIME NOT NULL
);
CREATE UNIQUE INDEX "Source_url_key" ON "Source"("url");

ALTER TABLE "Slang" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'DRAFT' CHECK ("status" IN ('DRAFT', 'PUBLISHED', 'ARCHIVED'));
ALTER TABLE "Slang" ADD COLUMN "revision" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Slang" ADD COLUMN "reviewedAt" DATETIME;
ALTER TABLE "Slang" ADD COLUMN "reviewedBy" TEXT;
UPDATE "Slang" SET "status" = 'PUBLISHED';
CREATE INDEX "Slang_status_createdAt_idx" ON "Slang"("status", "createdAt");

ALTER TABLE "SlangTranslation" ADD COLUMN "originStatus" TEXT NOT NULL DEFAULT 'UNKNOWN' CHECK ("originStatus" IN ('UNKNOWN', 'UNCERTAIN', 'DOCUMENTED'));
UPDATE "SlangTranslation" SET "originStatus" = 'UNCERTAIN' WHERE "origin" IS NOT NULL AND LENGTH(TRIM("origin")) > 0;

ALTER TABLE "Example" ADD COLUMN "kind" TEXT NOT NULL DEFAULT 'EDITORIAL' CHECK ("kind" IN ('EDITORIAL', 'SOURCED'));
ALTER TABLE "Example" ADD COLUMN "sourceId" INTEGER REFERENCES "Source"("id") ON DELETE RESTRICT ON UPDATE CASCADE CHECK (("kind" = 'EDITORIAL' AND "sourceId" IS NULL) OR ("kind" = 'SOURCED' AND "sourceId" IS NOT NULL));

CREATE TABLE "SlangSource" (
  "slangId" INTEGER NOT NULL REFERENCES "Slang"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "sourceId" INTEGER NOT NULL REFERENCES "Source"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "locator" TEXT,
  "note" TEXT,
  PRIMARY KEY ("slangId", "sourceId")
);
CREATE TABLE "TranslationSource" (
  "translationId" INTEGER NOT NULL REFERENCES "SlangTranslation"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "sourceId" INTEGER NOT NULL REFERENCES "Source"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "claim" TEXT NOT NULL CHECK ("claim" IN ('MEANING', 'PRONUNCIATION', 'ORIGIN')),
  "locator" TEXT,
  "note" TEXT,
  PRIMARY KEY ("translationId", "sourceId", "claim")
);
CREATE TABLE "SlangRevision" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "slangId" INTEGER NOT NULL REFERENCES "Slang"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "number" INTEGER NOT NULL,
  "action" TEXT NOT NULL,
  "actor" TEXT NOT NULL,
  "note" TEXT NOT NULL,
  "snapshot" TEXT NOT NULL,
  "contentHash" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "SlangRevision_slangId_number_key" ON "SlangRevision"("slangId", "number");
CREATE TRIGGER "SlangRevision_no_update" BEFORE UPDATE ON "SlangRevision" BEGIN SELECT RAISE(ABORT, 'Revisions are immutable'); END;
CREATE TRIGGER "SlangRevision_no_delete" BEFORE DELETE ON "SlangRevision" BEGIN SELECT RAISE(ABORT, 'Revisions are immutable'); END;
