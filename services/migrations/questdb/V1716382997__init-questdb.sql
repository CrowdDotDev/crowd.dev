CREATE TABLE IF NOT EXISTS 'activities' (
  id UUID,
  type VARCHAR,
  timestamp TIMESTAMP,
  platform SYMBOL CAPACITY 30,
  isContribution BOOLEAN,
  score INT,
  importHash VARCHAR,
  sourceId VARCHAR,
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP,
  deletedAt TIMESTAMP,
  memberId UUID,
  parentId UUID,
  tenantId SYMBOL,
  createdById UUID,
  updatedById UUID,
  sourceParentId VARCHAR,
  conversationId UUID,
  attributes VARCHAR,
  title VARCHAR,
  body VARCHAR,
  channel VARCHAR,
  url VARCHAR,
  username VARCHAR,
  objectMemberId UUID,
  objectMemberUsername VARCHAR,
  segmentId SYMBOL capacity 1024 CACHE,
  organizationId UUID,

  sentimentLabel VARCHAR,
  sentimentScore INT,
  sentimentScoreMixed DOUBLE,
  sentimentScoreNeutral DOUBLE,
  sentimentScoreNegative DOUBLE,
  sentimentScorePositive DOUBLE,

  member_isBot BOOLEAN,
  member_isTeamMember BOOLEAN,

  gitIsMainBranch BOOLEAN,
  gitIsIndirectFork BOOLEAN,
  gitLines INT,
  gitInsertions INT,
  gitDeletions INT,
  gitIsMerge BOOLEAN
)
  TIMESTAMP (timestamp) PARTITION BY MONTH WAL
  DEDUP UPSERT KEYS(type, platform, channel, sourceId, segmentId, timestamp);

CREATE TABLE IF NOT EXISTS 'conversations' (
  id UUID,
  title VARCHAR,
  slug VARCHAR,
  published BOOLEAN,
  timestamp TIMESTAMP,
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP,
  deletedAt TIMESTAMP,
  tenantId SYMBOL,
  segmentId SYMBOL capacity 1024 CACHE,
  createdById UUID,
  updatedById UUID
)
  TIMESTAMP (timestamp) PARTITION BY MONTH WAL
  DEDUP UPSERT KEYS(title, segmentId, timestamp);
