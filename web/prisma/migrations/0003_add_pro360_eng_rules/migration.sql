-- CreateTable
CREATE TABLE "mpt"."pro360_eng_rules" (
    "id" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "billingType" TEXT NOT NULL,
    "tacticField" TEXT,
    "isEngagement" INTEGER NOT NULL,
    "isExposure" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isLatest" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "modifiedBy" TEXT NOT NULL,
    "inactivatedAt" TIMESTAMP(3),
    "inactivatedBy" TEXT,

    CONSTRAINT "pro360_eng_rules_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "pro360_eng_rules_eventName_version_key" UNIQUE ("eventName", "version"),
    CONSTRAINT "pro360_eng_rules_isEngagement_check" CHECK ("isEngagement" IN (0, 1)),
    CONSTRAINT "pro360_eng_rules_isExposure_check" CHECK ("isExposure" IN (0, 1)),
    CONSTRAINT "pro360_eng_rules_version_check" CHECK ("version" > 0),
    CONSTRAINT "pro360_eng_rules_validTo_check" CHECK ("validFrom" < "validTo" OR "validTo" IS NULL),
    CONSTRAINT "pro360_eng_rules_isLatest_check" CHECK (NOT ("isLatest" = true AND "validTo" IS NOT NULL))
);

-- CreateIndex
CREATE INDEX "pro360_eng_rules_eventName_isLatest_idx" ON "mpt"."pro360_eng_rules"("eventName", "isLatest");

-- CreateIndex
CREATE INDEX "pro360_eng_rules_eventName_validFrom_validTo_idx" ON "mpt"."pro360_eng_rules"("eventName", "validFrom", "validTo");

-- CreateIndex
CREATE INDEX "pro360_eng_rules_isActive_isLatest_idx" ON "mpt"."pro360_eng_rules"("isActive", "isLatest");

-- Create partial unique index for ensuring only one latest record per eventName
CREATE UNIQUE INDEX "pro360_eng_rules_eventName_isLatest_unique_idx" ON "mpt"."pro360_eng_rules"("eventName") WHERE "isLatest" = true;

