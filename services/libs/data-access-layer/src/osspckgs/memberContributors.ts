import { QueryExecutor } from '../queryExecutor'
import { AffiliationConfidence } from './identityAffiliations'
import { BEST_REPO_LINK_JOIN } from './sqlFragments'

export type MemberIdentitySource = 'git_activity' | 'github' | 'governance_file' | 'registry'
export type MemberIdentityType = 'github-login' | 'email' | 'git-author-name' | 'registry-username'

export interface MemberContributorsPackageRow {
  packageId: string
  purl: string
  name: string
  ecosystem: string
  repoId: string | null
  repoUrl: string | null
  repoMappingConfidence: string | number | null
  hasContributorRows: boolean
}

export interface AffiliatedMemberIdentityRow {
  person: string
  source: MemberIdentitySource
  role: string | null
  roleKind: string
  identityType: MemberIdentityType
  identityValue: string
  endedAt: string | null
  lastSeenAt: string | null
  registryUsername: string | null
  registryDisplayName: string | null
  akritesMember: string | null
  cdpOrganizationId: string | null
  confidence: AffiliationConfidence | null
  confidenceScore: string | number | null
}

export async function findMemberContributorsPackage(
  qx: QueryExecutor,
  purl: string,
): Promise<MemberContributorsPackageRow | null> {
  return qx.selectOneOrNone(
    `
    SELECT p.id AS "packageId", p.purl, p.name, p.ecosystem,
           pr.repo_id AS "repoId", r.url AS "repoUrl", pr.confidence AS "repoMappingConfidence",
           EXISTS (SELECT 1 FROM repo_contributors rc WHERE rc.repo_id = pr.repo_id) AS "hasContributorRows"
    FROM packages p
    ${BEST_REPO_LINK_JOIN}
    WHERE p.purl = $(purl)
    `,
    { purl },
  )
}

export async function findAffiliatedMemberIdentities(
  qx: QueryExecutor,
  keys: { packageId: string; repoId: string | null },
): Promise<AffiliatedMemberIdentityRow[]> {
  return qx.select(
    `
    WITH rc AS (
      SELECT rc.source, rc.role, rc.role_kind, rc.identity_type, rc.identity_value, rc.ended_at,
             rc.last_seen_at, COALESCE(rc.cdp_member_id, ia.cdp_member_id)::text AS cdp_member_id,
             ia.akrites_member, ia.cdp_organization_id, ia.confidence, ia.confidence_score
      FROM repo_contributors rc
      LEFT JOIN identity_affiliations ia
        ON ia.identity_type = rc.identity_type AND ia.identity_value = rc.identity_value
      WHERE rc.repo_id = $(repoId)
    ),
    login_member AS (
      SELECT identity_value AS login, min(cdp_member_id) AS member
      FROM rc WHERE identity_type = 'github-login' AND cdp_member_id IS NOT NULL GROUP BY 1
    ),
    email_member AS (
      SELECT identity_value AS email, min(cdp_member_id) AS member
      FROM rc WHERE identity_type = 'email' AND cdp_member_id IS NOT NULL GROUP BY 1
    ),
    repo_login AS (
      SELECT DISTINCT identity_value AS login FROM rc WHERE identity_type = 'github-login'
    ),
    reg AS (
      SELECT pm.role, m.username, m.display_name,
             nullif(lower(trim(m.github_login)), '') AS login, nullif(lower(trim(m.email)), '') AS email
      FROM package_maintainers pm
      JOIN maintainers m ON m.id = pm.maintainer_id
      WHERE pm.package_id = $(packageId)
    ),
    reg_keyed AS (
      SELECT reg.*,
             COALESCE(lm.member, em.member, um.member, il.cdp_member_id::text, ie.cdp_member_id::text,
                      'github-login:' || reg.login, 'email:' || reg.email, 'github-login:' || rl.login,
                      'registry:' || reg.username) AS person,
             il.akrites_member AS login_akrites_member, il.cdp_organization_id AS login_cdp_organization_id,
             il.confidence AS login_confidence, il.confidence_score AS login_confidence_score,
             ie.akrites_member AS email_akrites_member, ie.cdp_organization_id AS email_cdp_organization_id,
             ie.confidence AS email_confidence, ie.confidence_score AS email_confidence_score
      FROM reg
      LEFT JOIN login_member lm ON lm.login = reg.login
      LEFT JOIN email_member em ON em.email = reg.email
      LEFT JOIN login_member um ON um.login = lower(reg.username)
      LEFT JOIN repo_login rl ON rl.login = lower(reg.username)
      LEFT JOIN identity_affiliations il ON il.identity_type = 'github-login' AND il.identity_value = reg.login
      LEFT JOIN identity_affiliations ie ON ie.identity_type = 'email' AND ie.identity_value = reg.email
    ),
    idents AS (
      SELECT COALESCE(rc.cdp_member_id, lm.member, em.member, rc.identity_type || ':' || rc.identity_value) AS person,
             rc.source, rc.role, rc.role_kind, rc.identity_type, rc.identity_value, rc.ended_at, rc.last_seen_at,
             NULL::text AS registry_username, NULL::text AS registry_display_name,
             rc.akrites_member, rc.cdp_organization_id, rc.confidence, rc.confidence_score
      FROM rc
      LEFT JOIN login_member lm ON rc.identity_type = 'github-login' AND lm.login = rc.identity_value
      LEFT JOIN email_member em ON rc.identity_type = 'email' AND em.email = rc.identity_value
      UNION ALL
      SELECT person, 'registry', role, 'registry', 'registry-username', username, NULL, NULL,
             username, display_name, NULL, NULL, NULL, NULL
      FROM reg_keyed
      UNION ALL
      SELECT r.person, 'registry', NULL, 'identity', 'github-login', r.login, NULL, NULL, NULL, NULL,
             r.login_akrites_member, r.login_cdp_organization_id, r.login_confidence, r.login_confidence_score
      FROM reg_keyed r
      WHERE r.login IS NOT NULL
      UNION ALL
      SELECT r.person, 'registry', NULL, 'identity', 'email', r.email, NULL, NULL, NULL, NULL,
             r.email_akrites_member, r.email_cdp_organization_id, r.email_confidence, r.email_confidence_score
      FROM reg_keyed r
      WHERE r.email IS NOT NULL
    ),
    affiliated AS (SELECT DISTINCT person FROM idents WHERE akrites_member IS NOT NULL)
    SELECT i.person, i.source, i.role, i.role_kind AS "roleKind", i.identity_type AS "identityType",
           i.identity_value AS "identityValue", i.ended_at AS "endedAt", i.last_seen_at AS "lastSeenAt",
           i.registry_username AS "registryUsername", i.registry_display_name AS "registryDisplayName",
           i.akrites_member AS "akritesMember", i.cdp_organization_id AS "cdpOrganizationId",
           i.confidence, i.confidence_score AS "confidenceScore"
    FROM idents i JOIN affiliated a ON a.person = i.person
    ORDER BY i.person, i.source, i.identity_type, i.identity_value, i.role
    `,
    { packageId: keys.packageId, repoId: keys.repoId },
  )
}
