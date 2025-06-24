-- extend activityRelations table with sourceId, type, and timestamp columns
alter table "activityRelations" 
add column "sourceId" varchar(150) not null,
add column "type" varchar(50) not null,
add column "timestamp" timestamp with time zone not null;
