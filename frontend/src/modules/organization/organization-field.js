import { OrganizationService } from '@/modules/organization/organization-service'
import RelationToOneField from '@/shared/fields/relation-to-one-field'
import RelationToManyField from '@/shared/fields/relation-to-many-field'
import Permissions from '@/security/permissions'

export class OrganizationField {
  static relationToOne(name, label, options) {
    return new RelationToOneField(
      name,
      label,
      '/organizations',
      Permissions.values.organizationRead,
      OrganizationService.listAutocomplete,
      (record) => {
        if (!record) {
          return null
        }

        return {
          id: record.id,
          label: record.name
        }
      },
      options
    )
  }

  static relationToMany(name, label, options) {
    return new RelationToManyField(
      name,
      label,
      '/organizations',
      Permissions.values.organizationRead,
      OrganizationService.listAutocomplete,
      (record) => {
        if (!record) {
          return null
        }

        return {
          id: record.id,
          label: record.name
        }
      },
      options
    )
  }
}
