create table if not exists "public"."segmentActivityChannels" (
    "id"        uuid primary key default uuid_generate_v4(),
    "tenantId"  uuid not null references public.tenants (id) on update cascade on delete cascade,
    "segmentId" uuid not null references public.segments (id) on update cascade on delete cascade,
    "platform"  text not null,
    "channel"   text not null
);

create unique index unique_segment_activity_channel
    on "public"."segmentActivityChannels" ("tenantId", "segmentId", "platform", "channel");

insert into "public"."segmentActivityChannels" ("segmentId", "tenantId", "platform", "channel")
select "id",
       "tenantId",
       jsonb_object_keys("activityChannels"),
       trim('"' from jsonb_array_elements("activityChannels" -> jsonb_object_keys("activityChannels"))::text)
from "public"."segments"
on conflict do nothing;
