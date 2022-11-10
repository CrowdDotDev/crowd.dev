CREATE TABLE public."taskAssignees" (
	"createdAt" timestamptz NOT NULL,
	"updatedAt" timestamptz NOT NULL,
	"taskId" uuid NOT NULL,
	"userId" uuid NOT NULL,
	CONSTRAINT "taskAssignees_pkey" PRIMARY KEY ("taskId", "userId")
);


-- public."taskAssignees" foreign keys
ALTER TABLE public."taskAssignees" ADD CONSTRAINT "taskAssignees_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES public.tasks(id) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE public."taskAssignees" ADD CONSTRAINT "taskAssignees_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE ON UPDATE CASCADE;

-- remove obsolete assignedToId field from tasks
ALTER TABLE tasks DROP COLUMN "assignedToId";

-- add tasks.type
ALTER TABLE public.tasks ADD "type" text NOT NULL;
