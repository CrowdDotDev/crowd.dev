-- Drop the trigger first
DROP TRIGGER IF EXISTS segment_isLF_consistency_check ON public."segments";

-- Drop the trigger function
DROP FUNCTION IF EXISTS check_segment_isLF_consistency();

-- Then drop the column
ALTER TABLE public."segments"
DROP COLUMN IF EXISTS "isLF";
