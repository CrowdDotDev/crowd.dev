CREATE TABLE public."weeklyAnalyticsEmailsHistory" (
    id uuid NOT NULL,
	"emailSentAt" timestamptz NOT NULL,
    "tenantId" uuid NOT NULL,
    "weekOfYear" text NOT NULL,
    "emailSentTo" text[] NOT NULL,
	CONSTRAINT "weeklyAnalyticsEmailsHistory_pkey" PRIMARY KEY ("id")

);

ALTER TABLE public."weeklyAnalyticsEmailsHistory" ADD CONSTRAINT "weeklyAnalyticsEmailsHistory_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public.tenants(id) ON DELETE NO ACTION ON UPDATE NO ACTION;
CREATE INDEX "weeklyAnalyticsEmailsHistory_tenantId_weekOfYear" ON public."weeklyAnalyticsEmailsHistory" USING btree ("tenantId", "weekOfYear");