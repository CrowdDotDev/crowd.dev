-- global member activity counts
drop materialized view if exists "membersGlobalActivityCount" cascade;
create materialized view "membersGlobalActivityCount" as
select msa."memberId",
    sum(msa."activityCount") AS total_count
from "memberSegmentsAgg" msa
where msa."segmentId" IN (
        select id
        from segments
        where "grandparentId" is not null
            and "parentId" is not null
    )
group by msa."memberId"
order by sum(msa."activityCount") desc;
create unique index ix_member_global_activity_count_member_id on "membersGlobalActivityCount" ("memberId");
create index ix_member_global_activity_count on "membersGlobalActivityCount" (total_count);

-- member enrichment monitoring (total)
drop materialized view if exists "memberEnrichmentMonitoringTotal";
create materialized view "memberEnrichmentMonitoringTotal" as
with all_members as (
    select count(*) as count from members
),
total_enrichable_members as (
    with enrichable_in_at_least_one_source as (
        select mem.id
        from members mem
        inner join "memberIdentities" mi on mem.id = mi."memberId" and mi.verified
        left join "membersGlobalActivityCount" on "membersGlobalActivityCount"."memberId" = mem.id
        left join "memberEnrichmentCache" mec on mec."memberId" = mem.id
        where (
                (mi.verified and
                ((mi.type = 'username' AND mi.platform = 'github') OR (mi.type = 'email')))
                    OR
                ("membersGlobalActivityCount".total_count > 10 AND mi.type = 'email' and mi.verified)
                    OR
                (
                  ("membersGlobalActivityCount".total_count > 500) AND
                  (mem."displayName" like '% %') AND
                  (mem.attributes -> 'location' ->> 'default' is not null and
                   mem.attributes -> 'location' ->> 'default' <> '') AND
                  (
                    (mem.attributes -> 'websiteUrl' ->> 'default' is not null and
                    mem.attributes -> 'websiteUrl' ->> 'default' <> '') OR
                    (mi.verified AND mi.type = 'username' and mi.platform = 'github') OR
                    (mi.verified AND mi.type = 'email')
                  )
                )
                    OR
                ((mi.verified AND mi.type = 'username' and mi.platform = 'linkedin'))
              )
       group by mem.id
       order by mem.id desc)
    select count(*) as count from enrichable_in_at_least_one_source
 ),
 attempted_to_enrich_among_enrichable_members as (
    with enrichable_by_clearbit as (
        select distinct mec."memberId"
        from "memberEnrichmentCache" mec
        where mec.source = 'clearbit'
        and mec."memberId" in (
            select distinct mi."memberId"
            from "memberIdentities" mi
            where mi.verified and mi.type = 'email'
        )
    ),
    enrichable_by_progai as (
        select distinct mec."memberId"
        from "memberEnrichmentCache" mec
        where mec.source = 'progai'
        and mec."memberId" in (
            select distinct mi."memberId"
            from "memberIdentities" mi
            where mi.verified
            and mi.type = 'username'
            and mi.platform = 'github'
        )
    ),
    enrichable_by_serp as (
        select distinct mec."memberId"
        from "memberEnrichmentCache" mec
        where mec.source = 'serp'
        and mec."memberId" in (
            select distinct mem.id as "memberId"
            from members mem
                  inner join "memberIdentities" mi on mem.id = mi."memberId" and mi.verified
                  inner join "membersGlobalActivityCount"
                             on "membersGlobalActivityCount"."memberId" = mem.id
            where
                ("membersGlobalActivityCount".total_count > 500 and
                (mem."displayName" like '% %') and
                (mem.attributes -> 'location' ->> 'default' is not null and
                 mem.attributes -> 'location' ->> 'default' <> '') and
                ((mem.attributes -> 'websiteUrl' ->> 'default' is not null and
                  mem.attributes -> 'websiteUrl' ->> 'default' <> '') OR
                 (mi.verified and mi.type = 'username' and mi.platform = 'github') OR
                 (mi.verified and mi.type = 'email')))
            group by mem.id
            order by mem.id desc
        )
    ),
    enrichable_by_progai_linkedin_scraper as (
        with clearbit_linkedin_profiles as (
            select distinct mec."memberId"
            from "memberEnrichmentCache" mec
            where mec.source = 'clearbit'
              and mec.data is not null
              and mec.data -> 'linkedin' ->> 'handle' is not null),
        progai_linkedin_profiles as (
            select distinct mec."memberId"
            from "memberEnrichmentCache" mec
            where mec.source = 'progai'
              and mec.data is not null
              and mec.data ->> 'linkedin_url' is not null),
        serp_linkedin_profiles as (
            select distinct mec."memberId"
            from "memberEnrichmentCache" mec
            where mec.source = 'serp'
              and mec.data is not null
        ),
        existing_verified_linkedin_identities as (
            select distinct mi."memberId"
            from "memberIdentities" mi
            where mi.platform = 'linkedin' and mi.verified
            group by mi."memberId"),
        all_unique_members_enrichable_by_progai_linkedin_scraper as (
            select "memberId" from clearbit_linkedin_profiles
            union
            select "memberId" from progai_linkedin_profiles
            union
            select "memberId" from serp_linkedin_profiles
            union
            select "memberId" from existing_verified_linkedin_identities)
        select distinct "memberId"
        from all_unique_members_enrichable_by_progai_linkedin_scraper
    ),
   enrichable_by_crustdata_linkedin_scraper as (
        with clearbit_linkedin_profiles as (
            select distinct mec."memberId"
            from "memberEnrichmentCache" mec
            left join "membersGlobalActivityCount" on "membersGlobalActivityCount"."memberId" = mec."memberId"
            where "membersGlobalActivityCount".total_count > 1000
              and mec.source = 'clearbit'
              and mec.data is not null
              and mec.data -> 'linkedin' ->> 'handle' is not null),
        progai_linkedin_profiles as (
            select distinct mec."memberId"
            from "memberEnrichmentCache" mec
            left join "membersGlobalActivityCount" on "membersGlobalActivityCount"."memberId" = mec."memberId"
            where "membersGlobalActivityCount".total_count > 1000
              and mec.source = 'progai'
              and mec.data is not null
              and mec.data ->> 'linkedin_url' is not null),
        serp_linkedin_profiles as (
            select distinct mec."memberId"
            from "memberEnrichmentCache" mec
            left join "membersGlobalActivityCount" on "membersGlobalActivityCount"."memberId" = mec."memberId"
            where "membersGlobalActivityCount".total_count > 1000
              and mec.source = 'serp'
              and mec.data is not null),
        existing_verified_linkedin_identities as (
            select distinct mi."memberId"
            from "memberIdentities" mi
            left join "membersGlobalActivityCount" on "membersGlobalActivityCount"."memberId" = mi."memberId"
            where "membersGlobalActivityCount".total_count > 1000
              and mi.verified
              and mi.platform = 'linkedin'
            group by mi."memberId"),
        all_unique_members_enrichable_by_crustdata as (
            select "memberId" from clearbit_linkedin_profiles
            union
            select "memberId" from progai_linkedin_profiles
            union
            select "memberId" from serp_linkedin_profiles
            union
            select "memberId" from existing_verified_linkedin_identities)
        select distinct "memberId" from all_unique_members_enrichable_by_crustdata
   ),
   unique_members as (
        select "memberId" from enrichable_by_clearbit
        union
        select "memberId" from enrichable_by_progai
        union
        select "memberId" from enrichable_by_serp
        union
        select "memberId" from enrichable_by_progai_linkedin_scraper
        union
        select "memberId" from enrichable_by_crustdata_linkedin_scraper)
   select count(distinct "memberId") as count
   from unique_members)
    SELECT (SELECT count FROM all_members)                                                                         as "totalMembers",
           (SELECT count FROM total_enrichable_members)                                                            as "enrichableMembers",
           (SELECT count FROM attempted_to_enrich_among_enrichable_members)                                       as "attemptedToEnrich";


-- member enrichment monitoring (clearbit)
drop materialized view if exists "memberEnrichmentMonitoringClearbit";
create materialized view "memberEnrichmentMonitoringClearbit" as
with clearbit_enrichable_members as (
    select count(distinct mi."memberId") as count
    from "memberIdentities" mi
    left join "membersGlobalActivityCount" on "membersGlobalActivityCount"."memberId" = mi."memberId"
    where mi.verified and mi.type = 'email' and "membersGlobalActivityCount".total_count > 10
),
attempted_to_enrich_among_clearbit_enrichable_members as (
    select count(distinct mec."memberId") as count
    from "memberEnrichmentCache" mec
    where mec."memberId" in (
        select distinct mi."memberId"
        from "memberIdentities" mi
        left join "membersGlobalActivityCount" on "membersGlobalActivityCount"."memberId" = mi."memberId"
        where mi.verified and mi.type = 'email' and "membersGlobalActivityCount".total_count > 10
    )
),
clearbit_hit_count_among_attempted as (
    select count(*) as count
    from "memberEnrichmentCache" mec
    where mec.data is not null
    and mec.source = 'clearbit'
    and mec."memberId" in (
        select distinct mi."memberId"
        from "memberIdentities" mi
        left join "membersGlobalActivityCount" on "membersGlobalActivityCount"."memberId" = mi."memberId"
        where mi.verified and mi.type = 'email' and "membersGlobalActivityCount".total_count > 10
    )
)
select
      (select count from clearbit_enrichable_members) as "enrichableMembers",
      (select count from attempted_to_enrich_among_clearbit_enrichable_members) as "attemptedToEnrich",
      case when (select count from clearbit_enrichable_members)::numeric = 0 then 0 else 
      (round((select count from attempted_to_enrich_among_clearbit_enrichable_members)::numeric /
              (select count from clearbit_enrichable_members)::numeric * 100, 2)) end as progress,
       ((select count from clearbit_hit_count_among_attempted)) as "hitCount",
       case when (select count from attempted_to_enrich_among_clearbit_enrichable_members)::numeric = 0 then 0 else 
       (round((select count from clearbit_hit_count_among_attempted)::numeric /
              (select count from attempted_to_enrich_among_clearbit_enrichable_members)::numeric * 100,
              2)) end as "hitRate";


-- member enrichment monitoring (crustdata)
drop materialized view if exists "memberEnrichmentMonitoringCrustdata";
create materialized view "memberEnrichmentMonitoringCrustdata" as
with crustdata_members_with_scrapable_profiles AS (
    with clearbit_linkedin_profiles as (
        select distinct mec."memberId"
        from "memberEnrichmentCache" mec
        left join "membersGlobalActivityCount" on "membersGlobalActivityCount"."memberId" = mec."memberId"
        where "membersGlobalActivityCount".total_count > 1000
         and mec.source = 'clearbit'
         and mec.data is not null
         and mec.data -> 'linkedin' ->> 'handle' is not null),
    progai_linkedin_profiles as (
        select distinct mec."memberId"
         from "memberEnrichmentCache" mec
         left join "membersGlobalActivityCount" on "membersGlobalActivityCount"."memberId" = mec."memberId"
         where "membersGlobalActivityCount".total_count > 1000
           and mec.source = 'progai'
           and mec.data is not null
           and mec.data ->> 'linkedin_url' is not null),
    serp_linkedin_profiles as (
        select distinct mec."memberId"
        from "memberEnrichmentCache" mec
        left join "membersGlobalActivityCount" on "membersGlobalActivityCount"."memberId" = mec."memberId"
        where "membersGlobalActivityCount".total_count > 1000
         and mec.source = 'serp'
         and mec.data is not null),
    existing_verified_linkedin_identities as (
        select distinct mi."memberId"
        from "memberIdentities" mi
        left join "membersGlobalActivityCount" on "membersGlobalActivityCount"."memberId" = mi."memberId"
        where "membersGlobalActivityCount".total_count > 1000
          and mi.verified
          and mi.platform = 'linkedin'
        group by mi."memberId"),
    unique_members AS (
        select "memberId" from clearbit_linkedin_profiles
        union
        select "memberId" from progai_linkedin_profiles
        union
        select "memberId" from serp_linkedin_profiles
        union
        select "memberId" from existing_verified_linkedin_identities)
select count(distinct "memberId") as count
from unique_members),
 crustdata_attempted_to_scrape_among_scrapable_profiles as (
    select count(*) as count
    from "memberEnrichmentCache" mec
    where mec.source = 'crustdata'
    and mec."memberId" in (
        with clearbit_linkedin_profiles as (
            select distinct mec."memberId"
            from "memberEnrichmentCache" mec
            left join "membersGlobalActivityCount" on "membersGlobalActivityCount"."memberId" = mec."memberId"
            where "membersGlobalActivityCount".total_count > 1000
              and mec.source = 'clearbit'
              and mec.data is not null
              and mec.data -> 'linkedin' ->> 'handle' is not null),
        progai_linkedin_profiles as (
            select distinct mec."memberId"
            from "memberEnrichmentCache" mec
            left join "membersGlobalActivityCount" on "membersGlobalActivityCount"."memberId" = mec."memberId"
            where "membersGlobalActivityCount".total_count > 1000
              and mec.source = 'progai'
              and mec.data is not null
              and mec.data ->> 'linkedin_url' is not null),
        serp_linkedin_profiles as (
            select distinct mec."memberId"
            from "memberEnrichmentCache" mec
            left join "membersGlobalActivityCount" on "membersGlobalActivityCount"."memberId" = mec."memberId"
            where "membersGlobalActivityCount".total_count > 1000
              and mec.source = 'serp'
              and mec.data is not null),
        existing_verified_linkedin_identities as (
            select distinct mi."memberId"
            from "memberIdentities" mi
            left join "membersGlobalActivityCount" on "membersGlobalActivityCount"."memberId" = mi."memberId"
            where mi.verified 
              and mi.platform = 'linkedin'
            group by mi."memberId"),
        unique_members as (
            select "memberId" from clearbit_linkedin_profiles
            union
            select "memberId" from progai_linkedin_profiles
            union
            select "memberId" from serp_linkedin_profiles
            union
            select "memberId" from existing_verified_linkedin_identities)
 select distinct "memberId" from unique_members)),
 crustdata_hit_count_among_attempted as (
    select count(*) as count
    from "memberEnrichmentCache" mec
    where mec.source = 'crustdata'
      and mec.data is not null
      and mec."memberId" in (
      with clearbit_linkedin_profiles as (
            select distinct mec."memberId"
            from "memberEnrichmentCache" mec
            left join "membersGlobalActivityCount" on "membersGlobalActivityCount"."memberId" = mec."memberId"
            where "membersGlobalActivityCount".total_count > 1000
              and mec.source = 'clearbit'
              and mec.data is not null
              and mec.data -> 'linkedin' ->> 'handle' is not null),
      progai_linkedin_profiles as (
            select distinct mec."memberId"
            from "memberEnrichmentCache" mec
            left join "membersGlobalActivityCount" on "membersGlobalActivityCount"."memberId" = mec."memberId"
            where "membersGlobalActivityCount".total_count > 1000
              and mec.source = 'progai'
              and mec.data is not null
              and mec.data ->> 'linkedin_url' is not null),
      serp_linkedin_profiles as (
            select distinct mec."memberId"
            from "memberEnrichmentCache" mec
            left join "membersGlobalActivityCount" on "membersGlobalActivityCount"."memberId" = mec."memberId"
            where "membersGlobalActivityCount".total_count > 1000
              and mec.source = 'serp'
              and mec.data is not null),
      existing_verified_linkedin_identities as (
            select distinct mi."memberId"
            from "memberIdentities" mi
            left join "membersGlobalActivityCount" on "membersGlobalActivityCount"."memberId" = mi."memberId"
            where mi.verified
            and mi.platform = 'linkedin'
            group by mi."memberId"),
      unique_members as (
            select "memberId" from clearbit_linkedin_profiles
            union
            select "memberId" from progai_linkedin_profiles
            union
            select "memberId" from serp_linkedin_profiles
            union
            select "memberId" from existing_verified_linkedin_identities)
select distinct "memberId" from unique_members))
select
      (select count from crustdata_members_with_scrapable_profiles) as "membersWithScrapableProfiles",
      (select count from crustdata_attempted_to_scrape_among_scrapable_profiles) as "attemptedToScrape",
      case when (select count from crustdata_members_with_scrapable_profiles)::numeric = 0 then 0 else 
      (round((select count from crustdata_attempted_to_scrape_among_scrapable_profiles)::numeric /
              (select count from crustdata_members_with_scrapable_profiles)::numeric * 100, 2)) end as progress,
       ((select count from crustdata_hit_count_among_attempted)) as "hitCount",
       case when (select count from crustdata_attempted_to_scrape_among_scrapable_profiles)::numeric = 0 then 0 else 
       (round((select count from crustdata_hit_count_among_attempted)::numeric /
              (select count from crustdata_attempted_to_scrape_among_scrapable_profiles)::numeric * 100,
              2)) end as "hitRate";

-- member enrichment monitoring (progai-github)
drop materialized view if exists "memberEnrichmentMonitoringProgaiGithub";
create materialized view "memberEnrichmentMonitoringProgaiGithub" as
with progai_enrichable_members as (
    select count(distinct mi."memberId") as count
    from "memberIdentities" mi
    where mi.verified
      and mi.type = 'username' and mi.platform = 'github'
),
attempted_to_enrich_among_progai_enrichable_members as (
    select count(distinct mec."memberId") as count
    from "memberEnrichmentCache" mec
    where mec."memberId" in (
        select distinct mi."memberId"
        from "memberIdentities" mi
        where mi.verified
          and mi.type = 'username' and mi.platform = 'github'
    )
),
progai_hit_count_among_attempted as (
    select count(*) as count
    from "memberEnrichmentCache" mec
    where mec.data is not null and mec.source = 'progai' and mec."memberId" in (
        select distinct mi."memberId"
        from "memberIdentities" mi
        where mi.verified
          and mi.type = 'username' and mi.platform = 'github'
    )
)
select
    (select count from progai_enrichable_members) as "enrichableMembers",
    (select count from attempted_to_enrich_among_progai_enrichable_members) as "attemptedToEnrich",
    case when (select count from progai_enrichable_members)::numeric = 0 then 0 else 
    round((select count from attempted_to_enrich_among_progai_enrichable_members)::numeric / (select count from progai_enrichable_members)::numeric * 100, 2) end as progress,
    (select count from progai_hit_count_among_attempted) as "hitCount",
    case when (select count from attempted_to_enrich_among_progai_enrichable_members)::numeric = 0 then 0 else 
    round((select count from progai_hit_count_among_attempted)::numeric / (select count from attempted_to_enrich_among_progai_enrichable_members)::numeric * 100, 2) end as "hitRate";

-- member enrichment monitoring (progai-linkedin)
drop materialized view if exists "memberEnrichmentMonitoringProgaiLinkedin";
create materialized view "memberEnrichmentMonitoringProgaiLinkedin" as
with progai_linkedin_members_with_scrapable_profiles as (
    with clearbit_linkedin_profiles as (
                 select distinct mec."memberId"
                 from "memberEnrichmentCache" mec
                 where mec.source = 'clearbit'
                   and mec.data is not null
                   and mec.data->'linkedin'->>'handle' is not null
    ),
    progai_linkedin_profiles as (
        select distinct mec."memberId"
                 from "memberEnrichmentCache" mec
                 where mec.source = 'progai'
                   and mec.data is not null
                   and mec.data->>'linkedin_url' is not null
    ),
    serp_linkedin_profiles as (
                 select distinct mec."memberId"
                 from "memberEnrichmentCache" mec
                 where mec.source = 'serp'
                   and mec.data is not null
    ),
    existing_verified_linkedin_identities as (
                 select distinct mi."memberId"
                 from "memberIdentities" mi
                 where mi.platform = 'linkedin'
                   and mi.verified
                 group by  mi."memberId"
    ),
    unique_members as (
            select "memberId" from clearbit_linkedin_profiles
            union
            select "memberId" from progai_linkedin_profiles
            union
            select "memberId" from serp_linkedin_profiles
            union
            select "memberId" from existing_verified_linkedin_identities
        )
    select count(distinct "memberId") as count from unique_members
),
progai_linkedin_attempted_to_scrape_among_scrapable_profiles as (
    select count(*) as count from "memberEnrichmentCache" mec where mec.source= 'progai-linkedin-scraper'
    and mec."memberId" in (
        with clearbit_linkedin_profiles as (
                 select distinct mec."memberId"
                 from "memberEnrichmentCache" mec
                 where mec.source = 'clearbit'
                   and mec.data is not null
                   and mec.data->'linkedin'->>'handle' is not null
        ),
        progai_linkedin_profiles as (
            select distinct mec."memberId"
                     from "memberEnrichmentCache" mec
                     where mec.source = 'progai'
                       and mec.data is not null
                       and mec.data->>'linkedin_url' is not null
        ),
        serp_linkedin_profiles as (
                     select distinct mec."memberId"
                     from "memberEnrichmentCache" mec
                     where mec.source = 'serp'
                       and mec.data is not null
        ),
        existing_verified_linkedin_identities as (
                     select distinct mi."memberId"
                     from "memberIdentities" mi
                     where mi.platform = 'linkedin'
                       and mi.verified
                     group by  mi."memberId"
        ),
        unique_members as (
                select "memberId" from clearbit_linkedin_profiles
                union
                select "memberId" from progai_linkedin_profiles
                union
                select "memberId" from serp_linkedin_profiles
                union
                select "memberId" from existing_verified_linkedin_identities
            )
    select distinct "memberId" from unique_members
    )
),
progai_linkedin_scraper_hit_count_among_attempted as (
    select count(*) as count from "memberEnrichmentCache" mec where mec.source= 'progai-linkedin-scraper'
    and mec.data is not null and mec."memberId" in (
        with clearbit_linkedin_profiles as (
                 select distinct mec."memberId"
                 from "memberEnrichmentCache" mec
                 where mec.source = 'clearbit'
                   and mec.data is not null
                   and mec.data->'linkedin'->>'handle' is not null
        ),
        progai_linkedin_profiles as (
            select distinct mec."memberId"
                     from "memberEnrichmentCache" mec
                     where mec.source = 'progai'
                       and mec.data is not null
                       and mec.data->>'linkedin_url' is not null
        ),
        serp_linkedin_profiles as (
                     select distinct mec."memberId"
                     from "memberEnrichmentCache" mec
                     where mec.source = 'serp' and mec.data is not null
        ),
        existing_verified_linkedin_identities as (
                     select distinct mi."memberId"
                     from "memberIdentities" mi
                     where mi.platform = 'linkedin'
                       and mi.verified
                     group by  mi."memberId"
        ),
        unique_members as (
                select "memberId" from clearbit_linkedin_profiles
                union
                select "memberId" from progai_linkedin_profiles
                union
                select "memberId" from serp_linkedin_profiles
                union
                select "memberId" from existing_verified_linkedin_identities
        )
    select distinct "memberId" from unique_members
    )
)
select
      (select count from progai_linkedin_members_with_scrapable_profiles) as "membersWithScrapableProfiles",
      (select count from progai_linkedin_attempted_to_scrape_among_scrapable_profiles) as "attemptedToScrape",
      case when (select count from progai_linkedin_members_with_scrapable_profiles)::numeric = 0 then 0 else 
      (round((select count from progai_linkedin_attempted_to_scrape_among_scrapable_profiles)::numeric /
              (select count from progai_linkedin_members_with_scrapable_profiles)::numeric * 100, 2)) end as progress,
       ((select count from progai_linkedin_scraper_hit_count_among_attempted)) as "hitCount",
      case when (select count from progai_linkedin_attempted_to_scrape_among_scrapable_profiles)::numeric = 0 then 0 else 
      (round((select count from progai_linkedin_scraper_hit_count_among_attempted)::numeric /
              (select count from progai_linkedin_attempted_to_scrape_among_scrapable_profiles)::numeric * 100,
              2)) end as "hitRate";

-- member enrichment monitoring (serp)
drop materialized view if exists "memberEnrichmentMonitoringSerp";
create materialized view "memberEnrichmentMonitoringSerp" as
with serp_enrichable_members as (
    select count(distinct mem.id) as count from members mem
    join "membersGlobalActivityCount" on "membersGlobalActivityCount"."memberId" = mem.id
    join "memberIdentities" mi on mi."memberId" = mem.id
    where
    ("membersGlobalActivityCount".total_count > 500) and
    (mem."displayName" like '% %') and
    (mem.attributes->'location'->>'default' is not null and mem.attributes->'location'->>'default' <> '') and
    ((mem.attributes->'websiteUrl'->>'default' is not null and mem.attributes->'websiteUrl'->>'default' <> '') or
     (mi.verified and mi.type = 'username' and mi.platform = 'github') or
     (mi.verified and mi.type = 'email')
    )
),
attempted_to_enrich_among_serp_enrichable_members as (
    select count(*) as count
    from "memberEnrichmentCache" mec
    where mec.source = 'serp' and mec."memberId" in (
            select distinct mem.id
            from members mem
            join "membersGlobalActivityCount" on "membersGlobalActivityCount"."memberId" = mem.id
            join "memberIdentities" mi on mi."memberId" = mem.id
            where
            ("membersGlobalActivityCount".total_count > 500) and
            (mem."displayName" like '% %') and
            (mem.attributes->'location'->>'default' is not null and mem.attributes->'location'->>'default' <> '') and
            ((mem.attributes->'websiteUrl'->>'default' is not null and mem.attributes->'websiteUrl'->>'default' <> '') or
            (mi.verified and mi.type = 'username' and mi.platform = 'github') or
            (mi.verified and mi.type = 'email'))
    )
),
serp_hit_count_among_attempted as (
    select count(*) as count
    from "memberEnrichmentCache" mec
    where mec.data is not null
    and mec.source = 'serp'
    and mec."memberId" in (
        select distinct mem.id from members mem
        join "membersGlobalActivityCount" on "membersGlobalActivityCount"."memberId" = mem.id
        join "memberIdentities" mi on mi."memberId" = mem.id
        where
        ("membersGlobalActivityCount".total_count > 500) and
        (mem."displayName" like '% %') and
        (mem.attributes->'location'->>'default' is not null and mem.attributes->'location'->>'default' <> '') and
        ((mem.attributes->'websiteUrl'->>'default' is not null and mem.attributes->'websiteUrl'->>'default' <> '') or
         (mi.verified and mi.type = 'username' and mi.platform = 'github') or
         (mi.verified and mi.type = 'email')
        )
    )
)
select
    (select count from serp_enrichable_members) as "enrichableMembers",
    (select count from attempted_to_enrich_among_serp_enrichable_members) as "attemptedToEnrich",
    case when (select count from serp_enrichable_members)::numeric = 0 then 0 else 
    round((select count from attempted_to_enrich_among_serp_enrichable_members)::numeric / (select count from serp_enrichable_members)::numeric * 100, 2) end as progress,
    (select count from serp_hit_count_among_attempted) as "hitCount",
    case when (select count from attempted_to_enrich_among_serp_enrichable_members)::numeric = 0 then 0 else 
    round((select count from serp_hit_count_among_attempted)::numeric / (select count from attempted_to_enrich_among_serp_enrichable_members)::numeric * 100, 2) end as "hitRate";

