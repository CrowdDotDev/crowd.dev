import { IntegrationService } from '@/modules/integration/integration-service'
import RelationToOneField from '@/shared/fields/relation-to-one-field'
import RelationToManyField from '@/shared/fields/relation-to-many-field'
import Permissions from '@/security/permissions'

export class IntegrationField {
  static relationToOne(name, label, options) {
    return new RelationToOneField(
      name,
      label,
      '/integration',
      Permissions.values.integrationRead,
      IntegrationService.listAutocomplete,
      (record) => {
        if (!record) {
          return null
        }

        return {
          id: record.id,
          label: record.type
        }
      },
      options
    )
  }

  static relationToMany(name, label, options) {
    return new RelationToManyField(
      name,
      label,
      '/integration',
      Permissions.values.integrationRead,
      IntegrationService.listAutocomplete,
      (record) => {
        if (!record) {
          return null
        }

        return {
          id: record.id,
          label: record.type
        }
      },
      options
    )
  }
}
