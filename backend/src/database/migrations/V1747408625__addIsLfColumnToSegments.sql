ALTER TABLE public."segments"
 ADD COLUMN "isLF" BOOLEAN NOT NULL DEFAULT TRUE;

-- Create a trigger function to enforce isLF consistency
CREATE OR REPLACE FUNCTION check_segment_isLF_consistency()
RETURNS TRIGGER AS $$
DECLARE
  parent_isLF BOOLEAN; -- Grandparent's check (projectGroup) is not required because it will be performed upon project creation/update
BEGIN
  -- Only check if there's a parent
  IF NEW."parentId" IS NOT NULL THEN
    SELECT "isLF" INTO parent_isLF 
    FROM public."segments" 
    WHERE id = NEW."parentId";
    
    -- Verify segment's isLF matches parent
    IF parent_isLF IS NOT NULL AND NEW."isLF" != parent_isLF THEN
      RAISE EXCEPTION 'Segment (%) isLF value (%) must match its parent''s isLF value (%)',
        NEW.id, NEW."isLF", parent_isLF;
    END IF;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create a constraint trigger that checks at transaction end because subprojects are updated in the same transaction as their parent segment
CREATE CONSTRAINT TRIGGER segment_isLF_consistency_check
AFTER INSERT OR UPDATE ON public."segments"
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION check_segment_isLF_consistency();