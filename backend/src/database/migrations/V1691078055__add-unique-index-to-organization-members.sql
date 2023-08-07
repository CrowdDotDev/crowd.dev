CREATE UNIQUE INDEX IF NOT EXISTS ix_unique_member_org_no_date_nulls ON "memberOrganizations" ("memberId", "organizationId")
WHERE
  "dateStart" IS NULL
  and "dateEnd" is NULL;