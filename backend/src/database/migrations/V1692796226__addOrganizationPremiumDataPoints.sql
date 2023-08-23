ALTER TABLE public."organizations" ADD COLUMN "affiliatedProfiles" TEXT[];
ALTER TABLE public."organizations" ADD COLUMN "allSubsidiaries" TEXT[];
ALTER TABLE public."organizations" ADD COLUMN "alternativeDomains" TEXT[];
ALTER TABLE public."organizations" ADD COLUMN "alternativeNames" TEXT[];
ALTER TABLE public."organizations" ADD COLUMN "averageEmployeeTenure" INTEGER NULL;
ALTER TABLE public."organizations" ADD COLUMN "averageTenureByLevel" JSONB NULL;
ALTER TABLE public."organizations" ADD COLUMN "averageTenureByRole" JSONB NULL;
ALTER TABLE public."organizations" ADD COLUMN "directSubsidiaries" TEXT[];
ALTER TABLE public."organizations" ADD COLUMN "employeeChurnRate" JSONB NULL;
ALTER TABLE public."organizations" ADD COLUMN "employeeCountByMonth" JSONB NULL;
ALTER TABLE public."organizations" ADD COLUMN "employeeGrowthRate" JSONB NULL;
ALTER TABLE public."organizations" ADD COLUMN "employeeCountByMonthByLevel" JSONB NULL;
ALTER TABLE public."organizations" ADD COLUMN "employeeCountByMonthByRole" JSONB NULL;
ALTER TABLE public."organizations" ADD COLUMN "gicsSector" TEXT NULL;
ALTER TABLE public."organizations" ADD COLUMN "grossAdditionsByMonth" JSONB NULL;
ALTER TABLE public."organizations" ADD COLUMN "grossDeparturesByMonth" JSONB NULL;
ALTER TABLE public."organizations" ADD COLUMN "inferredRevenue" INTEGER NULL;
ALTER TABLE public."organizations" ADD COLUMN "recentExecutiveDepartures" JSONB NULL;
ALTER TABLE public."organizations" ADD COLUMN "recentExecutiveHires" JSONB NULL;
ALTER TABLE public."organizations" ADD COLUMN "ultimateParent" TEXT NULL;

-- TODO: immediateParent is still pending