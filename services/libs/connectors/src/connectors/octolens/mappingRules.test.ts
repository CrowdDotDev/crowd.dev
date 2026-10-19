import { describe, expect, it } from 'vitest'

import type { OctolensFeed } from './configClient'
import { feedKeywordIds, insightsSlugFromWebhookUrl } from './mappingRules'

function feed(overrides: Partial<OctolensFeed> = {}): OctolensFeed {
  return { id: 1, name: 'feed', simpleFilters: null, advancedFilters: null, ...overrides }
}

describe('insightsSlugFromWebhookUrl', () => {
  it('extracts the project slug from an Insights community webhook, ignoring the query', () => {
    expect(
      insightsSlugFromWebhookUrl('https://insights.linuxfoundation.org/api/community/ebpf?auth=x'),
    ).toBe('ebpf')
  })

  it('returns null for a webhook that is not Insights', () => {
    expect(insightsSlugFromWebhookUrl('https://example.com/api/community/ebpf')).toBeNull()
    expect(
      insightsSlugFromWebhookUrl('https://insights.linuxfoundation.org/api/other/ebpf'),
    ).toBeNull()
  })

  it('returns null for a missing or malformed URL', () => {
    expect(insightsSlugFromWebhookUrl(undefined)).toBeNull()
    expect(
      insightsSlugFromWebhookUrl('https://insights.linuxfoundation.org/api/community/%E0%A4%A'),
    ).toBeNull()
  })
})

describe('feedKeywordIds', () => {
  it('reads comma-separated keyword ids from a simple Keywords condition', () => {
    const result = feedKeywordIds(
      feed({
        simpleFilters: { conditions: [{ field: 'Keywords', values: '34382, 34383,34384' }] },
      }),
    )

    expect(result).toEqual({ keywordIds: [34382, 34383, 34384] })
  })

  it('ignores non-keyword conditions next to the Keywords one', () => {
    const result = feedKeywordIds(
      feed({
        simpleFilters: {
          conditions: [
            { field: 'Source', values: 'reddit,twitter' },
            { field: 'Keywords', values: '7' },
          ],
        },
      }),
    )

    expect(result).toEqual({ keywordIds: [7] })
  })

  it('unions Keywords `in` values across advanced groups, whatever the AND/OR nesting', () => {
    const result = feedKeywordIds(
      feed({
        advancedFilters: {
          top_level_operator: 'OR',
          groups: [
            {
              group_operator: 'AND',
              conditions: [
                { field: 'Keywords', operator: 'in', values: '1,2' },
                { field: 'Sentiment', operator: 'in', values: 'Positive' },
              ],
            },
            {
              group_operator: 'OR',
              conditions: [{ field: 'Keywords', operator: 'in', values: '2,3' }],
            },
          ],
        },
      }),
    )

    expect(result).toEqual({ keywordIds: [1, 2, 3] })
  })

  it('skips a feed with a Keywords `not in`, even next to an `in`', () => {
    const result = feedKeywordIds(
      feed({
        advancedFilters: {
          top_level_operator: 'AND',
          groups: [
            {
              group_operator: 'AND',
              conditions: [
                { field: 'Keywords', operator: 'in', values: '1' },
                { field: 'Keywords', operator: 'not in', values: '2' },
              ],
            },
          ],
        },
      }),
    )

    expect(result).toEqual({ skipReason: 'unsupported keyword operator' })
  })

  it('skips a feed with no filter or no Keywords condition, never mapping every keyword', () => {
    expect(feedKeywordIds(feed())).toEqual({ skipReason: 'no keyword condition' })
    expect(
      feedKeywordIds(
        feed({ simpleFilters: { conditions: [{ field: 'Source', values: 'reddit' }] } }),
      ),
    ).toEqual({ skipReason: 'no keyword condition' })
  })

  it('skips a feed whose keyword ids are not numeric', () => {
    const result = feedKeywordIds(
      feed({ simpleFilters: { conditions: [{ field: 'Keywords', values: '1,abc' }] } }),
    )

    expect(result).toEqual({ skipReason: 'malformed keyword ids' })
  })
})
