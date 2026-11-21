-- CreateTable
CREATE TABLE "CrossrefCache" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "status" INTEGER NOT NULL,
    "response" TEXT NOT NULL,
    "fetchedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
