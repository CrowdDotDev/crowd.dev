DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication WHERE pubname = 'sequin_pub'
    ) THEN
        CREATE PUBLICATION sequin_pub
        FOR TABLE "activityRelations", segments, members, organizations, collections, "insightsProjects", "collectionsInsightsProjects";
    END IF;
END$$;


ALTER TABLE public.members REPLICA IDENTITY FULL;
ALTER TABLE public.organizations REPLICA IDENTITY FULL;
ALTER TABLE public.segments REPLICA IDENTITY FULL;
ALTER TABLE public."activityRelations" REPLICA IDENTITY FULL;
ALTER TABLE public.collections REPLICA IDENTITY FULL;
ALTER TABLE public."insightsProjects" REPLICA IDENTITY FULL;
ALTER TABLE public."collectionsInsightsProjects" REPLICA IDENTITY FULL;
