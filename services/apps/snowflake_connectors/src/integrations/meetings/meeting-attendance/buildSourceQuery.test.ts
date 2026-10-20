import { describe, expect, it } from 'vitest'

import { buildSourceQuery } from './buildSourceQuery'

describe('buildSourceQuery', () => {
  it.each([undefined, '2026-10-19 00:00:00'])(
    'keeps placeholder LF user ids out of the LF SSO lookup (since %j)',
    (sinceTimestamp) => {
      const query = buildSourceQuery(sinceTimestamp)

      expect(query).toContain(
        "UPPER(TRIM(INVITEE_LF_USER_ID)) NOT IN ('', 'NONE', 'NULL', 'UNDEFINED', 'NA', 'N/A', '-')",
      )
      expect(query).toContain(
        "UPPER(TRIM(INVITEE_LF_SSO)) NOT IN ('', 'NONE', 'NULL', 'UNDEFINED', 'NA', 'N/A', '-')",
      )
    },
  )

  it('lets the LF SSO lookup fill in when the row itself carries a placeholder SSO', () => {
    expect(buildSourceQuery()).toContain(
      "CASE WHEN UPPER(TRIM(t.INVITEE_LF_SSO)) NOT IN ('', 'NONE', 'NULL', 'UNDEFINED', 'NA', 'N/A', '-') THEN t.INVITEE_LF_SSO END,\n      sso.LF_SSO",
    )
  })
})
