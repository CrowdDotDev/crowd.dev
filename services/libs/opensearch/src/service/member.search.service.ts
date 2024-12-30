import merge from 'lodash.merge'

import { DbConnection, DbStore } from '@crowd/database'
import { isFeatureEnabled } from '@crowd/feature-flags'
import { ActivityDisplayService, DEFAULT_ACTIVITY_TYPE_SETTINGS } from '@crowd/integrations'
import { Logger, getChildLogger } from '@crowd/logging'
import { RedisClient } from '@crowd/redis'
import {
  ActivityDisplayVariant,
  FeatureFlag,
  IMemberAttributeData,
  OpenSearchIndex,
  PageData,
  SegmentRawData,
} from '@crowd/types'

import { FieldTranslatorFactory } from '../fieldTranslatorFactory'
import { OpensearchQueryParser } from '../opensearchQueryParser'
import { MemberRepository } from '../repo/member.repo'

import { OpenSearchService } from './opensearch.service'

export class MemberSearchService {
  private log: Logger
  private readonly memberRepo: MemberRepository

  constructor(
    redisClient: RedisClient,
    store: DbStore,
    private readonly qdbstore: DbConnection,
    private readonly openSearchService: OpenSearchService,
    parentLog: Logger,
  ) {
    this.log = getChildLogger('member-search-service', parentLog)
    this.memberRepo = new MemberRepository(redisClient, store, this.log)
  }

  public async findAndCountAll(
    tenantId: string,
    {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      filter = {} as any,
      limit = 20,
      offset = 0,
      orderBy = 'joinedAt_DESC',
      countOnly = false,
      attributesSettings = [] as IMemberAttributeData[],
      segments = [] as string[],
      customSortFunction = undefined,
    },
  ): // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Promise<PageData<any>> {
    const availablePlatforms = await this.memberRepo.db().any(
      `
        select distinct platform from "memberIdentities" where "tenantId" = $(tenantId);
      `,
      {
        tenantId,
      },
    )

    const translator = FieldTranslatorFactory.getTranslator(
      OpenSearchIndex.MEMBERS,
      attributesSettings,
      ['default', 'custom', 'crowd', 'enrichment', ...availablePlatforms.map((p) => p.platform)],
    )

    const parsed = OpensearchQueryParser.parse(
      { filter, limit, offset, orderBy },
      OpenSearchIndex.MEMBERS,
      translator,
    )

    // add tenant filter to parsed query
    parsed.query.bool.must.push({
      term: {
        uuid_tenantId: tenantId,
      },
    })

    // remove deleted members
    if (!parsed.query.bool.must_not) {
      parsed.query.bool.must_not = []
    }
    parsed.query.bool.must_not.push({
      term: {
        'obj_attributes.obj_isDeleted.bool_default': true,
      },
    })

    const segmentsEnabled = await isFeatureEnabled(FeatureFlag.SEGMENTS, async () => {
      return {
        tenantId,
      }
    })
    if (segmentsEnabled && segments) {
      // add segment filter
      parsed.query.bool.must.push({
        terms: {
          uuid_segmentId: segments,
        },
      })
    }

    if (customSortFunction) {
      parsed.sort = customSortFunction
    }

    if (filter.organizations && filter.organizations.length > 0) {
      parsed.query.bool.must = parsed.query.bool.must.filter(
        (d) => d.nested?.query?.term?.['nested_organizations.uuid_id'] === undefined,
      )

      // add organizations filter manually for now

      for (const organizationId of filter.organizations) {
        parsed.query.bool.must.push({
          nested: {
            path: 'nested_organizations',
            query: {
              bool: {
                must: [
                  {
                    term: {
                      'nested_organizations.uuid_id': organizationId,
                    },
                  },
                  {
                    bool: {
                      must_not: {
                        exists: {
                          field: 'nested_organizations.obj_memberOrganizations.date_dateEnd',
                        },
                      },
                    },
                  },
                ],
              },
            },
          },
        })
      }
    }

    const countResponse = await this.openSearchService.client.count({
      index: OpenSearchIndex.MEMBERS,
      body: { query: parsed.query },
    })

    if (countOnly) {
      return {
        rows: [],
        count: countResponse.body.count,
        limit,
        offset,
      }
    }

    parsed.from = offset || 0

    const response = await this.openSearchService.client.search({
      index: OpenSearchIndex.MEMBERS,
      body: parsed,
    })

    const translatedRows = response.body.hits.hits.map((o) =>
      translator.translateObjectToCrowd(o._source),
    )

    for (const row of translatedRows) {
      const identities = []
      const username: object = {}

      for (const identity of row.identities) {
        identities.push(identity.platform)
        if (identity.platform in username) {
          username[identity.platform].push(identity.username)
        } else {
          username[identity.platform] = [identity.username]
        }
      }

      row.identities = identities
      row.username = username
      row.activeDaysCount = parseInt(row.activeDaysCount, 10)
      row.activityCount = parseInt(row.activityCount, 10)
    }

    const memberIds = translatedRows.map((r) => r.id)
    if (memberIds.length > 0) {
      const lastActivities = await this.qdbstore.query(
        `
        WITH latest AS (
          SELECT last(id) AS id, memberId FROM activities
          WHERE deletedAt IS NULL
          AND tenantId = $(tenantId)
          AND memberId IN ($(memberIds:csv))
          GROUP BY memberId
        )
        SELECT * FROM activities
        INNER JOIN latest ON latest.id = activities.id;
        `,
        {
          tenantId,
          memberIds,
        },
      )

      let rows: SegmentRawData[]

      try {
        rows = await this.memberRepo.db().any(
          `SELECT
          s.*
        FROM segments s
        WHERE s."grandparentSlug" IS NOT NULL
          AND s."parentSlug" IS NOT NULL
          AND s."tenantId" = $(tenantId)
        ORDER BY s.name;`,
          {
            tenantId,
          },
        )
      } catch (err) {
        throw new Error(err)
      }

      for (const row of translatedRows) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const r = row as any

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        r.lastActivity = lastActivities.find((a) => (a as any).memberId === r.id)
        if (r.lastActivity) {
          r.lastActivity.display = ActivityDisplayService.getDisplayOptions(
            r.lastActivity,
            {
              default: DEFAULT_ACTIVITY_TYPE_SETTINGS,
              custom: rows.reduce((acc, s) => merge(acc, s.customActivityTypes), {}),
            },
            [ActivityDisplayVariant.SHORT, ActivityDisplayVariant.CHANNEL],
          )
        }
      }
    }

    return { rows: translatedRows, count: countResponse.body.count, limit, offset }
  }
}
