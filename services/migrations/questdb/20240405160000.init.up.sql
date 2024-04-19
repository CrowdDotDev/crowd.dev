CREATE TABLE 'activities' (
  id UUID,
  type STRING,
  timestamp TIMESTAMP,
  platform SYMBOL CAPACITY 30,
  isContribution BOOLEAN,
  score INT,
  sourceId STRING,
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP,
  deletedAt TIMESTAMP,
  memberId UUID,
  parentId UUID,
  tenantId SYMBOL,
  createdById UUID,
  updatedById UUID,
  sourceParentId STRING,
  conversationId UUID,
  attributes STRING,
  title STRING,
  body STRING,
  channel STRING,
  url STRING,
  username STRING,
  objectMemberId UUID,
  objectMemberUsername STRING,
  segmentId SYMBOL,
  organizationId UUID,

  sentimentLabel STRING,
  sentimentScore INT,
  sentimentScoreMixed FLOAT,
  sentimentScoreNeutral FLOAT,
  sentimentScoreNegative FLOAT,
  sentimentScorePositive FLOAT,

  member_isBot BOOLEAN
  member_isTeamMember BOOLEAN

  gitIsMainBranch BOOLEAN,
  gitInsertions INT,
  gitDeletions INT
) TIMESTAMP (timestamp) PARTITION BY DAY WAL;

CREATE TABLE 'conversations' (
  id UUID,
  title STRING,
  slug STRING,
  published BOOLEAN,
  timestamp TIMESTAMP,
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP,
  deletedAt TIMESTAMP,
  tenantId SYMBOL,
  segmentId SYMBOL,
  createdById UUID,
  updatedById UUID
) TIMESTAMP (timestamp) PARTITION BY DAY WAL;
