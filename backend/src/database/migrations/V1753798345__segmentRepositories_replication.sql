ALTER PUBLICATION sequin_pub ADD TABLE "segmentRepositories";
ALTER TABLE "segmentRepositories" REPLICA IDENTITY FULL;
GRANT SELECT ON "segmentRepositories" to sequin;
