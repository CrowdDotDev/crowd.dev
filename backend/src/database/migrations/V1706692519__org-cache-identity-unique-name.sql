alter table "organizationCacheIdentities"
  drop constraint ix_unique_website_name;
  
alter table "organizationCacheIdentities"
    add constraint ix_unique_name unique (name);