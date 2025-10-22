-- Convert isActive and isLatest from BOOLEAN to INTEGER (0/1)
-- Step 1: Add temporary INTEGER columns
ALTER TABLE
    "mpt"."pro360_eng_rules"
ADD
    COLUMN "isActive_new" INTEGER;

ALTER TABLE
    "mpt"."pro360_eng_rules"
ADD
    COLUMN "isLatest_new" INTEGER;

-- Step 2: Copy data (TRUE -> 1, FALSE -> 0)
UPDATE
    "mpt"."pro360_eng_rules"
SET
    "isActive_new" = CASE
        WHEN "isActive" = true THEN 1
        ELSE 0
    END;

UPDATE
    "mpt"."pro360_eng_rules"
SET
    "isLatest_new" = CASE
        WHEN "isLatest" = true THEN 1
        ELSE 0
    END;

-- Step 3: Drop old BOOLEAN columns and their dependent indexes
DROP INDEX IF EXISTS "mpt"."pro360_eng_rules_isActive_isLatest_idx";

ALTER TABLE
    "mpt"."pro360_eng_rules" DROP COLUMN "isActive";

ALTER TABLE
    "mpt"."pro360_eng_rules" DROP COLUMN "isLatest";

-- Step 4: Rename new columns
ALTER TABLE
    "mpt"."pro360_eng_rules" RENAME COLUMN "isActive_new" TO "isActive";

ALTER TABLE
    "mpt"."pro360_eng_rules" RENAME COLUMN "isLatest_new" TO "isLatest";

-- Step 5: Add NOT NULL constraints and defaults
ALTER TABLE
    "mpt"."pro360_eng_rules"
ALTER COLUMN
    "isActive"
SET
    NOT NULL;

ALTER TABLE
    "mpt"."pro360_eng_rules"
ALTER COLUMN
    "isActive"
SET
    DEFAULT 1;

ALTER TABLE
    "mpt"."pro360_eng_rules"
ALTER COLUMN
    "isLatest"
SET
    NOT NULL;

ALTER TABLE
    "mpt"."pro360_eng_rules"
ALTER COLUMN
    "isLatest"
SET
    DEFAULT 1;

-- Step 6: Add CHECK constraints
ALTER TABLE
    "mpt"."pro360_eng_rules"
ADD
    CONSTRAINT "pro360_eng_rules_isActive_check" CHECK ("isActive" IN (0, 1));

ALTER TABLE
    "mpt"."pro360_eng_rules"
ADD
    CONSTRAINT "pro360_eng_rules_isLatest_check" CHECK ("isLatest" IN (0, 1));

-- Step 7: Recreate the index
CREATE INDEX "pro360_eng_rules_isActive_isLatest_idx" ON "mpt"."pro360_eng_rules"("isActive", "isLatest");

-- Step 8: Update the unique index constraint for isLatest=1 (true)
DROP INDEX IF EXISTS "mpt"."pro360_eng_rules_eventName_isLatest_unique_idx";

CREATE UNIQUE INDEX "pro360_eng_rules_eventName_isLatest_unique_idx" ON "mpt"."pro360_eng_rules"("eventName")
WHERE
    "isLatest" = 1;

-- Step 9: Update the CHECK constraint for isLatest and validTo
ALTER TABLE
    "mpt"."pro360_eng_rules" DROP CONSTRAINT IF EXISTS "pro360_eng_rules_isLatest_check" CASCADE;

ALTER TABLE
    "mpt"."pro360_eng_rules"
ADD
    CONSTRAINT "pro360_eng_rules_isLatest_validTo_check" CHECK (
        NOT (
            "isLatest" = 1
            AND "validTo" IS NOT NULL
        )
    );