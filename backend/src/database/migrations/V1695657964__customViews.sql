create type "customViewVisibility" as enum ('user', 'tenant');

create table "customViews" (
  id uuid not null primary key,
  name varchar(255) not null check (name <> ''),
  visibility "customViewVisibility" not null,
  config jsonb default '{}',
  placement text not null check (placement in ('member', 'organization', 'activity', 'conversation')),
  "tenantId" uuid not null references "tenants"(id) on delete cascade,
  "createdById" uuid not null references "users"(id),
  "updatedById" uuid references "users"(id),
  "createdAt" timestamp with time zone not null default now(),
  "updatedAt" timestamp with time zone,
  "deletedAt" timestamp with time zone
);

create table "customViewOrders" (
  id uuid not null primary key,
  "order" integer,
  "customViewId" uuid not null references "customViews"(id) on delete cascade,
  "userId" uuid not null references "users"(id) on delete cascade,
  "createdAt" timestamp with time zone not null default now(),
  "updatedAt" timestamp with time zone,
  "deletedAt" timestamp with time zone,

  -- Ensures that the order is unique per user and custom view
  constraint unique_custom_view_order unique ("userId", "customViewId")
);

create or replace function create_custom_view_and_order(p_name text, p_config jsonb, p_placement text ,p_tenant_id uuid, p_created_by_id uuid) returns void as $$
declare
  custom_view_id uuid;
begin
  insert into "customViews" (id, name, visibility, config, placement, "tenantId", "createdById", "updatedById", "createdAt", "updatedAt")
  values (uuid_generate_v4(), p_name, 'tenant', p_config, p_placement, p_tenant_id, p_created_by_id, p_created_by_id, now(), now())
  returning id into custom_view_id;

  insert into "customViewOrders" (id, "order", "customViewId", "userId", "createdAt", "updatedAt")
  values (uuid_generate_v4(), null, custom_view_id, p_created_by_id, now(), now());
end;
$$ language plpgsql;

do $$
declare
  tenant record;
begin
  for tenant in (select id, "createdById" from tenants)
  loop
    -- Member custom views
    perform create_custom_view_and_order('New and active', '{"search": "", "relation": "and", "order": {"prop": "lastActive", "order": "descending"},"settings": {"bot": "exclude","teamMember": "exclude","organization": "exclude"},"joinedDate": {"operator": "gt","value": "2021-12-10"},"lastActivityDate": {"operator": "gt","value": "2021-12-10"}}', 'member', tenant.id, tenant."createdById");

    perform create_custom_view_and_order('Slipping away', '{"search": "", "relation": "and", "order": {"prop": "lastActive", "order": "descending"},"settings": {"bot": "exclude","teamMember": "exclude","organization": "exclude"},"engagementLevel": {"value": ["fan", "ultra"],"include": true},"lastActivityDate": {"operator": "lt","value": "2021-12-10"}}', 'member', tenant.id, tenant."createdById");

    perform create_custom_view_and_order('Most engaged', '{"search": "", "relation": "and", "order": {"prop": "lastActive", "order": "descending"}, "settings": {"bot": "exclude", "teamMember": "exclude", "organization": "exclude"}, "engagementLevel": {"value": ["fan", "ultra"], "include": true}}', 'member', tenant.id, tenant."createdById");

    perform create_custom_view_and_order('Influential', '{"search": "", "relation": "and", "order": {"prop": "lastActive", "order": "descending"}, "settings": {"bot": "exclude", "teamMember": "exclude", "organization": "exclude"}, "reach": {"operator": "gte", "value": 500}}', 'member', tenant.id, tenant."createdById");

    perform create_custom_view_and_order('Team members', '{"search": "", "relation": "and", "order": {"prop": "lastActive", "order": "descending"}, "settings": {"bot": "exclude", "teamMember": "filter", "organization": "exclude"}}', 'member', tenant.id, tenant."createdById");

    -- Organization custom views
    -- TODO: SQL doesn't support dynamic values like moment.subtract(1, 'month').format('YYYY-MM-DD')

    perform create_custom_view_and_order('New and active', '{"search": "", "relation": "and", "order": {"prop": "joinedAt", "order": "descending"}, "settings": {"teamOrganization": "exclude"}, "joinedDate": {"operator": "gt", "value": "2021-12-10"}}', 'organization', tenant.id, tenant."createdById");

    perform create_custom_view_and_order('Most members', '{"search": "", "relation": "and", "order": {"prop": "memberCount", "order": "descending"}, "settings": {"teamOrganization": "exclude"}}', 'organization', tenant.id, tenant."createdById");

    perform create_custom_view_and_order('Team organizations', '{"search": "", "relation": "and", "order": {"prop": "lastActive", "order": "descending"}, "settings": {"teamOrganization": "filter"}}', 'organization', tenant.id, tenant."createdById");
  end loop;
end $$;