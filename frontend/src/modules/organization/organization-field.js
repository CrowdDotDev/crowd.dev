import { OrganizationService } from '@/modules/organization/organization-service';
import RelationToManyField from '@/shared/fields/relation-to-many-field';

export class OrganizationField {
  static relationToMany(name, label, options) {
    return new RelationToManyField(
      name,
      label,
      '/organization',
      null,
      OrganizationService.listOrganizationsAutocomplete,
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
