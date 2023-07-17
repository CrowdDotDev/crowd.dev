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
    reach: {
      type: OpensearchFieldType.INT,
      customTranslation: {
        toOpensearch: 'int_totalReach',
        fromOpensearch: 'int_totalReach',
      },
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
      type: OpensearchFieldType.OBJECT_ARR,
      customTranslation: {
        toOpensearch: 'obj_arr_identities.string_platform',
        fromOpensearch: 'obj_arr_identities',
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
      type: OpensearchFieldType.OBJECT_ARR,
      customTranslation: {
        toOpensearch: 'obj_arr_tags.uuid_id',
        fromOpensearch: 'obj_arr_tags',
      },
    },
    organizations: {
      type: OpensearchFieldType.OBJECT_ARR,
      customTranslation: {
        toOpensearch: 'obj_arr_organizations.uuid_id',
        fromOpensearch: 'obj_arr_organizations',
      },
    },
  }
}
