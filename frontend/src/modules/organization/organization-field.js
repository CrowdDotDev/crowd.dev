import { OrganizationService } from '@/modules/organization/organization-service';
import RelationToManyField from '@/shared/fields/relation-to-many-field';
import Permissions from '@/security/permissions';

export class OrganizationField {
  static relationToMany(name, label, options) {
    return new RelationToManyField(
      name,
      label,
      '/organization',
      Permissions.values.organizationRead,
      OrganizationService.listAutocomplete,
      (record) => {
        if (!record) {
          return null;
        }

        return {
          id: record.id,
          label: record.name,
        };
      },
      options,
    );
  }
}
