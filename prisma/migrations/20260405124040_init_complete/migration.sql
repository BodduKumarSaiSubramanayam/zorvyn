-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_financial_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "amount" REAL NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "notes" TEXT,
    "userId" TEXT NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "financial_records_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_financial_records" ("amount", "category", "createdAt", "date", "id", "isDeleted", "notes", "type", "updatedAt", "userId") SELECT "amount", "category", "createdAt", "date", "id", "isDeleted", "notes", "type", "updatedAt", "userId" FROM "financial_records";
DROP TABLE "financial_records";
ALTER TABLE "new_financial_records" RENAME TO "financial_records";
CREATE INDEX "financial_records_userId_idx" ON "financial_records"("userId");
CREATE INDEX "financial_records_category_idx" ON "financial_records"("category");
CREATE INDEX "financial_records_type_idx" ON "financial_records"("type");
CREATE INDEX "financial_records_date_idx" ON "financial_records"("date");
CREATE INDEX "financial_records_isDeleted_idx" ON "financial_records"("isDeleted");
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'VIEWER',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_users" ("createdAt", "email", "id", "password", "role", "status", "updatedAt") SELECT "createdAt", "email", "id", "password", "role", "status", "updatedAt" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
