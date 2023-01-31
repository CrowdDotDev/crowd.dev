CREATE TABLE public."weeklyAnalyticsEmailsHistory" (
	"emailSentAt" timestamptz NOT NULL,
    "tenantId" uuid NOT NULL,
    "weekOfYear" text NOT NULL,
    "emailSentTo" text[] NOT NULL,
	CONSTRAINT "weeklyAnalyticsEmailsHistory_pkey" PRIMARY KEY ("tenantId", "weekOfYear")

);

ALTER TABLE public."weeklyAnalyticsEmailsHistory" ADD CONSTRAINT "weeklyAnalyticsEmailsHistory_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public.tenants(id) ON DELETE NO ACTION ON UPDATE NO ACTION;
