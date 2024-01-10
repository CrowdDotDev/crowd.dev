import { OpensearchField } from '@crowd/types'
import { OpensearchFieldType } from '@crowd/types'
import OpensearchModelBase from './base'

export class MembersOpensearch extends OpensearchModelBase {
  fields: Record<string, OpensearchField> = {
    id: {
      type: OpensearchFieldType.UUID,
      customTranslation: {
        toOpensearch: 'uuid_memberId',
        fromOpensearch: 'uuid_memberId',
      },
    },
    tenantId: {
      type: OpensearchFieldType.UUID,
    },
    segmentId: {
      type: OpensearchFieldType.UUID,
    },
    displayName: {
      type: OpensearchFieldType.STRING,
    },
    emails: {
      type: OpensearchFieldType.STRING_ARR,
    },
    score: {
      type: OpensearchFieldType.INT,
    },
    lastEnriched: {
      type: OpensearchFieldType.DATE,
    },
    joinedAt: {
      type: OpensearchFieldType.DATE,
    },
    createdAt: {
      type: OpensearchFieldType.DATE,
    },
    manuallyCreated: {
      type: OpensearchFieldType.BOOL,
    },
    reach: {
      type: OpensearchFieldType.OBJECT,
      preventNestedFieldTranslation: true,
    },
    numberOfOpenSourceContributions: {
      type: OpensearchFieldType.INT,
    },
    activeOn: {
      type: OpensearchFieldType.STRING_ARR,
    },
    activityCount: {
      type: OpensearchFieldType.INT,
    },
    activityTypes: {
      type: OpensearchFieldType.STRING_ARR,
    },
    activeDaysCount: {
      type: OpensearchFieldType.INT,
    },
    lastActive: {
      type: OpensearchFieldType.DATE,
    },
    averageSentiment: {
      type: OpensearchFieldType.FLOAT,
    },
    identities: {
      type: OpensearchFieldType.NESTED,
      customTranslation: {
        toOpensearch: 'nested_identities.string_platform',
        fromOpensearch: 'nested_identities',
      },
    },
    attributes: {
      type: OpensearchFieldType.OBJECT,
    },
    toMergeIds: {
      type: OpensearchFieldType.UUID_ARR,
    },
    noMergeIds: {
      type: OpensearchFieldType.UUID_ARR,
    },
    tags: {
      type: OpensearchFieldType.NESTED,
      customTranslation: {
        toOpensearch: 'nested_tags.uuid_id',
        fromOpensearch: 'nested_tags',
      },
    },
    contributions: {
      type: OpensearchFieldType.NESTED,
      customTranslation: {
        toOpensearch: 'nested_contributions.uuid_id',
        fromOpensearch: 'nested_contributions',
      },
    },
    affiliations: {
      type: OpensearchFieldType.NESTED,
      customTranslation: {
        toOpensearch: 'nested_affiliations.uuid_id',
        fromOpensearch: 'nested_affiliations',
      },
    },
    organizations: {
      type: OpensearchFieldType.NESTED,
      customTranslation: {
        toOpensearch: 'nested_organizations.uuid_id',
        fromOpensearch: 'nested_organizations',
      },
    },
    notes: {
      type: OpensearchFieldType.NESTED,
      customTranslation: {
        toOpensearch: 'nested_notes.uuid_id',
        fromOpensearch: 'nested_notes',
      },
    },
    tasks: {
      type: OpensearchFieldType.NESTED,
      customTranslation: {
        toOpensearch: 'nested_tasks.uuid_id',
        fromOpensearch: 'nested_tasks',
      },
    },
  }
}
