create unique index if not exists "uix_memberIdentities_memberId_platform_value_type"
    on "memberIdentities" ("memberId", platform, value, type);