ALTER PUBLICATION sequin_pub ADD TABLE "githubRepos";
ALTER TABLE public."githubRepos" REPLICA IDENTITY FULL;
GRANT SELECT ON "githubRepos" to sequin;

ALTER PUBLICATION sequin_pub ADD TABLE "memberOrganizationAffiliationOverrides";
ALTER TABLE public."memberOrganizationAffiliationOverrides" REPLICA IDENTITY FULL;
GRANT SELECT ON "memberOrganizationAffiliationOverrides" to sequin;

ALTER PUBLICATION sequin_pub ADD TABLE "memberOrganizations";
ALTER TABLE public."memberOrganizations" REPLICA IDENTITY FULL;
GRANT SELECT ON "memberOrganizations" to sequin;
