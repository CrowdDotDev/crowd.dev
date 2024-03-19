alter table members
    drop column if exists "usernameOld",
    drop column if exists type,
    drop column if exists info,
    drop column if exists "crowdInfo",
    drop column if exists bio,
    drop column if exists organisation,
    drop column if exists location,
    drop column if exists signals;