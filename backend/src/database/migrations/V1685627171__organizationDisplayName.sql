ALTER TABLE public."organizations" ADD COLUMN "displayName" text;

update organizations set "displayName" = "name";