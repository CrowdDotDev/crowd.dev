ALTER TABLE public."weeklyAnalyticsEmailsHistory" RENAME TO "recurringEmailsHistory";

CREATE TYPE public."recurringEmailTypes_type" AS ENUM ('weekly-analytics', 'eagle-eye-digest');

ALTER TABLE "recurringEmailsHistory" ADD COLUMN "type"  public."recurringEmailTypes_type";

UPDATE "recurringEmailsHistory" SET "type"='weekly-analytics';

ALTER TABLE "recurringEmailsHistory" ALTER COLUMN "type" SET NOT NULL; 
ALTER TABLE "recurringEmailsHistory" ALTER COLUMN "weekOfYear" DROP NOT NULL; 


