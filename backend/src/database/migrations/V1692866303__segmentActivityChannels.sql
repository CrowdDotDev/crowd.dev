CREATE TABLE IF NOT EXISTS "public"."segmentActivityChannels" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "tenantId" UUID NOT NULL REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE,
    "segmentId" UUID NOT NULL REFERENCES public.segments(id) ON UPDATE CASCADE ON DELETE CASCADE,
    "platform" TEXT NOT NULL,
    "channel" TEXT NOT NULL
);

CREATE UNIQUE INDEX unique_segment_activity_channel
    ON "public"."segmentActivityChannels" ("tenantId", "segmentId", "platform", "channel");

INSERT INTO "public"."segmentActivityChannels" ("segmentId", "tenantId", "platform", "channel")
	SELECT
        "id",
        "tenantId",
	    jsonb_object_keys("activityChannels"),
	    TRIM('"' FROM jsonb_array_elements("activityChannels"->jsonb_object_keys("activityChannels"))::TEXT)
	FROM "public"."segments";
