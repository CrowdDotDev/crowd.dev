import { IS_PROD_ENV } from '@crowd/common'

// TODO: user resolution — course_actions only has INTERNAL_TI_USER_ID.
// Need to identify the join table that maps INTERNAL_TI_USER_ID to user_email, learner_name, account_id, etc.

const CDP_MATCHED_SEGMENTS = `
  cdp_matched_segments AS (
    SELECT DISTINCT
      s.SOURCE_ID AS sourceId,
      s.slug
    FROM ANALYTICS.SILVER_DIM._CROWD_DEV_SEGMENTS_UNION s
    WHERE s.PARENT_SLUG IS NOT NULL
      AND s.GRANDPARENTS_SLUG IS NOT NULL
      AND s.SOURCE_ID IS NOT NULL
  )`

export const buildSourceQuery = (sinceTimestamp?: string): string => {
  let select = `
  SELECT
    ca.course_action_id,
    ca.course_id,
    ca.timestamp,
    ca.type,
    ca.source,
    ca.internal_ti_user_id,
    co.title AS COURSE_NAME,
    co.course_group_id,
    co.slug AS COURSE_SLUG,
    co.instruction_type,
    co.product_type,
    co.is_training,
    co.is_certification
  FROM analytics.bronze_census_ti.course_actions ca
  INNER JOIN analytics.bronze_census_ti.courses co
    ON ca.course_id = co.course_id
  WHERE ca.type = 'status_change'
    AND ca.source = 'course_started'
    AND co.is_test_or_archived = false`

  if (!IS_PROD_ENV) {
    select += ` AND 1=1` // TODO: add non-prod project filter once segment join is available
  }

  if (!sinceTimestamp) {
    return select.trim()
  }

  return `${select}
    AND ca.timestamp >= '${sinceTimestamp}'`.trim()
}
