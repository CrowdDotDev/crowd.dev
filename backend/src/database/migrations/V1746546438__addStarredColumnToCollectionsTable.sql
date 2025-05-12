-- Add the starred column to the collections table
ALTER TABLE collections
    ADD COLUMN "starred" boolean DEFAULT false NOT NULL;
