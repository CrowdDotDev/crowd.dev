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
    grandParentSegment: {
      type: OpensearchFieldType.BOOL,
    },
    displayName: {
      type: OpensearchFieldType.STRING,
    },
    score: {
      type: OpensearchFieldType.INT,
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
    verifiedEmails: {
      type: OpensearchFieldType.STRING_ARR,
    },
    unverifiedEmails: {
      type: OpensearchFieldType.STRING_ARR,
    },
    verifiedUsernames: {
      type: OpensearchFieldType.STRING_ARR,
    },
    unverifiedUsernames: {
      type: OpensearchFieldType.STRING_ARR,
    },
    identityPlatforms: {
      type: OpensearchFieldType.STRING_ARR,
    },
    identities: {
      type: OpensearchFieldType.NESTED,
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
