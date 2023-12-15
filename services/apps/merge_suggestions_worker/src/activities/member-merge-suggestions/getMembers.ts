import {
  IMemberPartialAggregatesOpensearch,
  IMemberPartialAggregatesOpensearchRawResult,
  IMemberQueryBody,
} from 'types'
import { svc } from '../../main'
import { OpenSearchIndex } from '@crowd/types'

export async function getMembers(
  tenantId: string,
  batchSize: number = 100,
  afterMemberId?: string,
): Promise<IMemberPartialAggregatesOpensearch[]> {
  try {
    const queryBody: IMemberQueryBody = {
      from: 0,
      size: batchSize,
      query: {
        bool: {
          filter: [
            {
              term: {
                uuid_tenantId: tenantId,
              },
            },
          ],
        },
      },
      sort: {
        [`uuid_memberId`]: 'asc',
      },
      collapse: {
        field: 'uuid_memberId',
      },
      _source: [
        'uuid_memberId',
        'nested_identities',
        'uuid_arr_noMergeIds',
        'keyword_displayName',
        'string_arr_emails',
      ],
    }

    if (afterMemberId) {
      queryBody.query.bool.filter.push({
        range: {
          uuid_memberId: {
            gt: afterMemberId,
          },
        },
      })
    }

    const members: IMemberPartialAggregatesOpensearchRawResult[] =
      (
        await svc.opensearch.client.search({
          index: OpenSearchIndex.MEMBERS,
          body: queryBody,
        })
      ).body?.hits?.hits || []

    return members.map((member) => member._source)
  } catch (err) {
    throw new Error(err)
  }
}
