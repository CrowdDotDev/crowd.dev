-- Drop the column categoryId from the collections table
ALTER TABLE collections
    DROP COLUMN categoryId;

-- Drop the categories table
DROP TABLE IF EXISTS categories;

-- Drop the categoryGroups table
DROP TABLE IF EXISTS categoryGroups;
