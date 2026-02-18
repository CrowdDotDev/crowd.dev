// Exclude TIMESTAMP_TZ columns and re-add as TIMESTAMP_NTZ so Parquet export gets timezone-normalized values.
const TIMESTAMP_TZ_COLUMNS = [
  'EVENT_START_DATE',
  'EVENT_END_DATE',
  'EVENT_CREATED_TS',
  'EVENT_UPDATED_AT',
  'REGISTRATION_TS',
  'REGISTRATION_CREATED_TS',
  'EVENT_REGISTRATION_UPDATED_AT',
  'PURCHASE_TS',
  'UPDATED_TS',
]

export const buildSourceQuery = (sinceTimestamp?: string): string => {
  const excludeClause = TIMESTAMP_TZ_COLUMNS.join(', ')
  const castClauses = TIMESTAMP_TZ_COLUMNS.map(
    (col) => `r.${col}::TIMESTAMP_NTZ AS ${col}`,
  ).join(', ')

  let query = `
  SELECT
    r.* EXCLUDE (${excludeClause}),
    ${castClauses}
  FROM ANALYTICS.SILVER_FACT.event_registrations r
  LEFT JOIN ANALYTICS.SILVER_DIM._CROWD_DEV_SEGMENTS_UNION s
    ON s.slug = r.project_slug
    AND s.PARENT_SLUG is null
    AND s.GRANDPARENTS_SLUG is null
`

  if (sinceTimestamp) {
    return `${query.trim()} WHERE r.updated_ts > '${sinceTimestamp}'`
  }
  return query.trim()
  }
