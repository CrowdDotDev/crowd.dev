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

  let query = `SELECT r.* EXCLUDE (${excludeClause}), ${castClauses} FROM ANALYTICS.SILVER_FACT.EVENT_REGISTRATIONS r`

  if (sinceTimestamp) {
    query += ` WHERE r.UPDATED_TS > '${sinceTimestamp}'`
  }

  return query
}
