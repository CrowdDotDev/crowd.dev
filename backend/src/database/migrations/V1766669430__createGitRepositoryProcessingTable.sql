CREATE TABLE git."repositoryProcessing" (
	"id" UUID PRIMARY KEY NOT NULL DEFAULT uuid_generate_v4(),
	"createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
	"updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

	"repositoryId" UUID NOT NULL UNIQUE REFERENCES public.repositories ("id") ON DELETE CASCADE,
	"branch" VARCHAR(255) DEFAULT NULL,
	"state" VARCHAR(50) NOT NULL DEFAULT 'pending',
	"priority" INTEGER NOT NULL DEFAULT 1,
	"lockedAt" TIMESTAMP WITH TIME ZONE DEFAULT NULL,
	"lastProcessedAt" TIMESTAMP WITH TIME ZONE DEFAULT NULL,
	"lastProcessedCommit" VARCHAR(64) DEFAULT NULL,
	"maintainerFile" VARCHAR(255) DEFAULT NULL,
	"lastMaintainerRunAt" TIMESTAMP WITH TIME ZONE DEFAULT NULL,
	"stuckRequiresReOnboard" BOOLEAN NOT NULL DEFAULT FALSE,
	"reOnboardingCount" INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX "ix_git_repositoryProcessing_onboarding_acquisition"
	ON git."repositoryProcessing" ("state", "lockedAt", "priority", "createdAt")
	WHERE "state" = 'pending' AND "lockedAt" IS NULL;

CREATE INDEX "ix_git_repositoryProcessing_recurrent_acquisition"
	ON git."repositoryProcessing" ("state", "lockedAt", "lastProcessedAt", "priority")
	WHERE "lockedAt" IS NULL;

CREATE INDEX "ix_git_repositoryProcessing_active_onboarding_count"
	ON git."repositoryProcessing" ("state")
	WHERE "state" = 'processing' AND "lastProcessedCommit" IS NULL;
