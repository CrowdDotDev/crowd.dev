import { OrganizationService } from '@/modules/organization/organization-service';
import RelationToManyField from '@/shared/fields/relation-to-many-field';
import Permissions from '@/security/permissions';

export class OrganizationField {
  static relationToMany(name, label, options) {
    return new RelationToManyField(
      name,
      label,
      '/config',
      Permissions.values.organizationRead,
      OrganizationService.listAutocomplete,
      (record) => {
        if (!record) {
          return null;
        }

        return {
          ...record,
          label: record.displayName,
        };
      },
      options,
    );
  }
}
