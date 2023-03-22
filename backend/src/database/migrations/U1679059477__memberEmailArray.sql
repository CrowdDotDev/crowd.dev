alter table members
   alter column emails type text using coalesce(emails[1],'');

ALTER TABLE members 
RENAME COLUMN emails TO email;