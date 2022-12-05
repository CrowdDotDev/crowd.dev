CREATE TYPE tenant_plans AS ENUM ('Essential', 'Growth');

alter table tenants
    alter column plan type tenant_plans default 'Essential' not null