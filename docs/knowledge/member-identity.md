---
type: data-model
slug: model-member-identity
name: Members, organizations and identity
repo: crowd.dev
owner: CDP team
depends_on: []
used_by: [flow-activities, sys-cdp]
sources:
  - services/libs/types/src/members.ts
  - services/libs/types/src/organizations.ts
  - services/libs/types/src/enums/members.ts
  - services/libs/types/src/enums/organizations.ts
  - services/apps/data_sink_worker/src/service/member.service.ts
  - services/libs/data-access-layer/src/members/
  - services/libs/common_services/src/services/member/unmerge.ts
  - docs/adr/0015-how-cdp-stores-member-identities.md
---

# Members, organizations and identity

CDP's central job is deciding that a commit author, a GitHub login and a mailing list address
are the same person, and which organization that person worked for at the time. This note maps
the tables and the services that make those decisions.

How identity values are compared and cased is decided in
[ADR-0015](../adr/0015-how-cdp-stores-member-identities.md); read it before touching any identity
write path.

## Tables

| Table                                    | Holds                                                                                                                                             |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `members`                                | One row per person                                                                                                                                |
| `memberIdentities`                       | How a member appears on each platform: `platform`, `type`, `value`, `verified`, `verifiedBy`, `verifiedAt`, `source`, `sourceId`, `integrationId` |
| `organizations`                          | One row per organization                                                                                                                          |
| `organizationIdentities`                 | How an organization appears: domains, usernames, emails, affiliated profiles                                                                      |
| `memberOrganizations`                    | Work history: which organization a member was at, with `dateStart` and `dateEnd`                                                                  |
| `memberSegmentAffiliations`              | Per-project affiliation, used when a member contributes to a project on behalf of a specific organization                                         |
| `memberOrganizationAffiliationOverrides` | Per-work-experience overrides, such as marking one as the member's primary work experience                                                        |
| `memberToMerge`, `organizationToMerge`   | Merge suggestions waiting for a decision                                                                                                          |
| `memberNoMerge`                          | Pairs that must not be suggested again                                                                                                            |
| `mergeActions`                           | Merge and unmerge history: `type` (member or organization), `primaryId`, `secondaryId`, `state`                                                   |

Identity types are small enums: members have `username` and `email`; organizations have
`username`, `primary-domain`, `alternative-domain`, `affiliated-profile` and `email`. Members also
carry a bot classification (`confirmed_bot`, `suspected_bot`, `not_bot`), and activity from bots
is stored without an organization.

## Verified and unverified identities

The rule the whole model rests on: **a verified identity belongs to exactly one member.** The
unique index `uix_memberIdentities_platform_type_lower_value_verified` enforces it, on
`(platform, type, lower(value))` for verified rows.

Unverified identities can appear on several members. They are hints, not claims.

## How ingest resolves a member

`data_sink_worker` (`member.service.ts`) handles incoming identities like this:

1. Deduplicate the payload on `(platform, type, lower(value))`, preferring the verified copy.
2. Drop unverified identities that another member already holds.
3. Insert the rest. If a verified identity collides with the unique index, another member already
   owns it: look up that owner and, when merging is allowed, merge the two members.

So ingest can merge members on its own, and does so only on a verified collision. Everything
else goes through suggestions.

## Merging and unmerging

- `merge_suggestions_worker` generates suggestions into `memberToMerge` and
  `organizationToMerge`, including suggestions checked by an LLM.
- A merge combines the records; `entity_merging_worker` then finishes the job by moving dependent
  data, including `activityRelations` through `moveActivityRelationsToAnotherMember`, and deleting
  orphans. `mergeActions` records each merge's state (`pending`, `in-progress`, `done`).
- Unmerging is in `services/libs/common_services/src/services/member/unmerge.ts`, also finished by
  `entity_merging_worker`.
- `script_executor_worker` holds bulk fixes, such as merging members whose identities differ only
  in capitalization.

Because activity relations live in Postgres, the rewrite replicates to Tinybird. Activity content is untouched; see [`data-flow.md`](data-flow.md).

## Enrichment

`members_enrichment_worker` and `organizations_enrichment_worker` add attributes, identities and
work history from external sources. Member sources are under
`services/apps/members_enrichment_worker/src/sources/`: Clearbit, Crustdata, LFID, ProgAI and
SERP. Enrichment follows the same rule as ingest: it does not add an unverified identity that
another member already has.

## Affiliation

Which organization gets credited for an activity is decided by `selectPrimaryWorkExperience` in
`services/libs/data-access-layer/src/affiliations/index.ts`. Among the organizations active on the
activity's date, it picks:

1. a manual per-project affiliation from `memberSegmentAffiliations`, which always wins (the
   longest date range if there are several);
2. otherwise, a work experience marked primary through `memberOrganizationAffiliationOverrides`,
   preferring one with a start date;
3. otherwise, the only work experience with a start date, if there is exactly one;
4. otherwise, the best source among dated rows: `ui`, then `email-domain`, then enrichment;

with further tie-breaks after that in the same file. Bot members get no organization at all.
