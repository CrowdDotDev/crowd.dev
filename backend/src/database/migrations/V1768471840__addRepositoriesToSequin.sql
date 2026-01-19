ALTER PUBLICATION sequin_pub ADD TABLE "repositories";
ALTER TABLE public."repositories" REPLICA IDENTITY DEFAULT;