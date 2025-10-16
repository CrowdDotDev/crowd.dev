ALTER PUBLICATION sequin_pub ADD TABLE "githubRepos";
ALTER TABLE public."githubRepos" REPLICA IDENTITY FULL;

ALTER PUBLICATION sequin_pub ADD TABLE "memberOrganizationAffiliationOverrides";
ALTER TABLE public."memberOrganizationAffiliationOverrides" REPLICA IDENTITY FULL;

ALTER PUBLICATION sequin_pub ADD TABLE "memberOrganizations";
ALTER TABLE public."memberOrganizations" REPLICA IDENTITY FULL;
