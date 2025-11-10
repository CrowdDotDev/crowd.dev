CREATE INDEX IF NOT EXISTS idx_msa_segment_activitycount_desc_member
ON public."memberSegmentsAgg" ("segmentId", "activityCount" DESC, "memberId");

CREATE INDEX IF NOT EXISTS idx_members_displayname_trgm
ON public."members"
USING gin (LOWER("displayName") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_memberidentities_email_verified_trgm
ON public."memberIdentities"
USING gin (LOWER("value") gin_trgm_ops)
WHERE verified = true
  AND type = 'email';