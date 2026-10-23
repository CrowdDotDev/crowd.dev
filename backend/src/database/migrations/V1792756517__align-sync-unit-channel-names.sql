UPDATE integration.sync_units su
SET "channelName" = r.url
FROM (
  SELECT DISTINCT ON ("sourceIntegrationId", lower(url)) "sourceIntegrationId", url
  FROM public.repositories
  WHERE "deletedAt" IS NULL
  ORDER BY "sourceIntegrationId", lower(url), url
) r
WHERE r."sourceIntegrationId" = su."integrationId"
  AND lower(r.url) = lower(su."channelName")
  AND r.url <> su."channelName";
