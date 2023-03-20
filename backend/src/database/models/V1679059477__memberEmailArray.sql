alter table members
   alter column email type text[] using case when email is null then array[]::text[] else array[email] end;

ALTER TABLE members 
RENAME COLUMN email TO emails;