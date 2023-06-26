ALTER TABLE public."activities" DROP constraint "activities_organizationId_fkey";

ALTER TABLE public."activities" ADD FOREIGN KEY ("organizationId") REFERENCES organizations(id) on delete set null;