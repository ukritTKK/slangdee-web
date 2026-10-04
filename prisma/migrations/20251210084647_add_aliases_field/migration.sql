-- CreateTable
CREATE TABLE "SlangAlias" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "slangId" INTEGER NOT NULL,
    "value" TEXT NOT NULL,
    CONSTRAINT "SlangAlias_slangId_fkey" FOREIGN KEY ("slangId") REFERENCES "Slang" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "SlangAlias_value_idx" ON "SlangAlias"("value");
