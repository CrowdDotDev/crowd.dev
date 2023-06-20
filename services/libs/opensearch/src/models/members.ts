import { OpensearchField } from '@crowd/types'
import { OpensearchFieldType } from '@crowd/types'
import OpensearchModelBase from './base'

export class MembersOpensearch extends OpensearchModelBase {
  fields: Record<string, OpensearchField> = {
    id: {
      type: OpensearchFieldType.UUID,
    },
    tenantId: {
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
    totalReach: {
      type: OpensearchFieldType.INT,
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
    },
    organizations: {
      type: OpensearchFieldType.OBJECT_ARR,
    },
  }
}
