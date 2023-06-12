export enum OpenSearchIndex {
  MEMBERS = 'members',
}

export const OPENSEARCH_INDEX_MAPPINGS: Record<OpenSearchIndex, unknown> = {
  [OpenSearchIndex.MEMBERS]: {
    properties: {
      // ids,
      id: {
        type: 'keyword',
      },
      tenantId: {
        type: 'keyword',
      },

      // strings or string arrays
      displayName: {
        type: 'text',
      },
      activeOn: {
        type: 'keyword',
      },
      activityTypes: {
        type: 'keyword',
      },
      toMergeIds: {
        type: 'keyword',
      },
      noMergeIds: {
        type: 'keyword',
      },

      // objects
      attributes: {
        type: 'object',
      },

      // arrays of objects
      identities: {
        type: 'nested',
        properties: {
          platform: {
            type: 'keyword',
          },
          username: {
            type: 'keyword',
          },
        },
      },

      organizations: {
        type: 'nested',
        properties: {
          id: {
            type: 'keyword',
          },
          logo: {
            type: 'text',
          },
          displayName: {
            type: 'text',
          },
        },
      },

      tags: {
        type: 'nested',
        properties: {
          id: {
            type: 'keyword',
          },
          name: {
            type: 'text',
          },
        },
      },

      // dates
      joinedAt: {
        type: 'date',
        format:
          'strict_date_optional_time||epoch_millis||yyyy-MM-dd HH:mm:ssXXX||yyyy-MM-dd HH:mm:ssX',
      },
      lastEnriched: {
        type: 'date',
        format:
          'strict_date_optional_time||epoch_millis||yyyy-MM-dd HH:mm:ssXXX||yyyy-MM-dd HH:mm:ssX',
      },
      lastActive: {
        type: 'date',
        format:
          'strict_date_optional_time||epoch_millis||yyyy-MM-dd HH:mm:ssXXX||yyyy-MM-dd HH:mm:ssX',
      },

      // numbers
      activeDaysCount: {
        type: 'integer',
      },
      activityCount: {
        type: 'integer',
      },
      numberOfOpenSourceContributions: {
        type: 'integer',
      },
      score: {
        type: 'integer',
      },
      averageSentiment: {
        type: 'float',
      },
      totalReach: {
        type: 'integer',
      },
    },
  },
}
