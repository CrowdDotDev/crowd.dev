DROP TABLE public."taskAssignees";

ALTER TABLE public.tasks ADD "assignedToId" uuid NULL;

ALTER TABLE public.tasks ADD CONSTRAINT "tasks_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES public.users(id) ON DELETE SET NULL ON UPDATE CASCADE;

-- remove tasks.type
ALTER TABLE tasks DROP COLUMN "type";
