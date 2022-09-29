import { CommunityMemberModel } from '@/modules/community-member/community-member-model'

const { fields } = CommunityMemberModel

export default [
  fields.id,
  fields.username,
  fields.email,
  fields.createdAt,
  fields.updatedAt
]
