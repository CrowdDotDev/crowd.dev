CREATE UNIQUE INDEX IF NOT EXISTS ix_unique_member_org_no_end_date_nulls
ON "memberOrganizations" ("memberId", "organizationId", "dateStart")
WHERE "dateEnd" is NULL;
