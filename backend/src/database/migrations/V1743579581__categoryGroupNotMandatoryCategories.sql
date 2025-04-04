-- Migration to make "categoryGroupId" nullable in the categories table
ALTER TABLE "categories"
    ALTER COLUMN "categoryGroupId" DROP NOT NULL;
