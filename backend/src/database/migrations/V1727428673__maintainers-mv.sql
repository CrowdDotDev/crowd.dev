CREATE MATERIALIZED VIEW mv_maintainer_roles AS
SELECT
    mai.id,
    mei."memberId",
    gr."segmentId",
    mai."createdAt" AS "dateStart",
    NULL as "dateEnd",
    gr.url,
    'github' AS "repoType",
    mai.role
FROM "maintainersInternal" mai
JOIN "memberIdentities" mei ON mai."identityId" = mei.id
JOIN "githubRepos" gr ON mai."repoId" = gr.id
;

CREATE UNIQUE INDEX IF NOT EXISTS mv_maintainer_roles_id ON mv_maintainer_roles (id);
