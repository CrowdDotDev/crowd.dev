DROP INDEX ix_unique_activities_tenantid_platform_type_sourceid_segmentid;
CREATE UNIQUE INDEX ix_unique_activities_tenantid_platform_type_sourceid ON activities ("tenantId", platform, type, "sourceId");