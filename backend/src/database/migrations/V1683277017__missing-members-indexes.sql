create index "ix_members_displayName"
    on "members" ("displayName");

create index "ix_members_reach_total"
    on "members" (((reach ->> 'total')::int));

create index "ix_members_score"
    on "members" (score);

create index "ix_members_numberOfOpenSourceContributions"
    on "members" (coalesce(jsonb_array_length(contributions), 0));

create index "ix_members_lastEnriched"
    on "members" ("lastEnriched");

create index "ix_members_updatedAt"
    on "members" ("updatedAt");

create index "ix_members_attributes_isOrganization"
    on "members" (coalesce((attributes -> 'isOrganization' -> 'default')::boolean, false));

create index "ix_members_attributes_isTeamMember"
    on "members" (coalesce((attributes -> 'isTeamMember' -> 'default')::boolean, false));

create index "ix_members_attributes_isBot"
    on "members" (coalesce((attributes -> 'isBot' -> 'default')::boolean, false));
