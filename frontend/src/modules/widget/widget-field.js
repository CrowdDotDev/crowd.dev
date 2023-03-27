import { WidgetService } from '@/modules/widget/widget-service';
import RelationToOneField from '@/shared/fields/relation-to-one-field';
import RelationToManyField from '@/shared/fields/relation-to-many-field';
import Permissions from '@/security/permissions';

export class WidgetField {
  static relationToOne(name, label, options) {
    return new RelationToOneField(
      name,
      label,
      '/widgets',
      Permissions.values.widgetRead,
      WidgetService.listAutocomplete,
      (record) => {
        if (!record) {
          return null;
        }

        return {
          id: record.id,
          label: record.type,
        };
      },
      options,
    );
  }

  static relationToMany(name, label, options) {
    return new RelationToManyField(
      name,
      label,
      '/widgets',
      Permissions.values.widgetRead,
      WidgetService.listAutocomplete,
      (record) => {
        if (!record) {
          return null;
        }

        return {
          id: record.id,
          label: record.type,
        };
      },
      options,
    );
  }
}
