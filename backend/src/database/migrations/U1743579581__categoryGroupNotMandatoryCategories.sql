-- Migration to make "categoryGroupId" NOT NULL in the categories table
ALTER TABLE "categories"
    ALTER COLUMN "categoryGroupId" SET NOT NULL;
