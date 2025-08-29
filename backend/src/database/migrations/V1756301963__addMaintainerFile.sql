ALTER TABLE git.repositories 
ADD COLUMN "maintainerFile" text DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN git.repositories."maintainerFile" IS 'Name of the file containing repository maintainer information and responsibilities (e.g., MAINTAINERS, CODEOWNERS)';
