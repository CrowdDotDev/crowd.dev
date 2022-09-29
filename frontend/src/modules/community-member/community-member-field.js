import { CommunityMemberService } from '@/modules/community-member/community-member-service'
import RelationToOneField from '@/shared/fields/relation-to-one-field'
import RelationToManyField from '@/shared/fields/relation-to-many-field'
import Permissions from '@/security/permissions'

export class CommunityMemberField {
  static relationToOne(name, label, options) {
    return new RelationToOneField(
      name,
      label,
      '/members',
      Permissions.values.communityMemberRead,
      CommunityMemberService.listAutocomplete,
      (record) => {
        if (!record) {
          return null
        }

        return {
          id: record.id,
          label: record.displayName
        }
      },
      options
    )
  }

  static relationToMany(name, label, options) {
    return new RelationToManyField(
      name,
      label,
      '/members',
      Permissions.values.communityMemberRead,
      CommunityMemberService.listAutocomplete,
      (record) => {
        if (!record) {
          return null
        }

        return {
          id: record.id,
          label: record.displayName
        }
      },
      options
    )
  }
}
