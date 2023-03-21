alter table members
   alter column email type text[] using case when email is null then array[]::text[] else array[email] end;

ALTER TABLE members 
RENAME COLUMN email TO emails;

UPDATE members
SET emails = array(
   select distinct a.c 
   from  unnest(members.emails || ARRAY( SELECT jsonb_array_elements_text( cache.data->'emails' ) ))  WITH ORDINALITY a(c,idx)
   where nullif(trim(c), '') is not null 
)
FROM "memberEnrichmentCache" cache
WHERE members.id = cache."memberId"