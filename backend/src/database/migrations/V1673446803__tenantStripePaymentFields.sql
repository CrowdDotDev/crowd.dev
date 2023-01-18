ALTER TABLE tenants ADD COLUMN "planSubscriptionEndsAt"  timestamp with time zone DEFAULT null;
ALTER TABLE tenants ADD COLUMN "stripeSubscriptionId" TEXT DEFAULT null;
ALTER TABLE tenants DROP COLUMN "planStatus";
ALTER TABLE tenants DROP COLUMN "planStripeCustomerId";
ALTER TABLE tenants DROP COLUMN "planUserId";
