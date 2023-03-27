import { ActivityService } from '@/modules/activity/activity-service';
import RelationToOneField from '@/shared/fields/relation-to-one-field';
import RelationToManyField from '@/shared/fields/relation-to-many-field';
import Permissions from '@/security/permissions';

export class ActivityField {
  static relationToOne(name, label, options) {
    return new RelationToOneField(
      name,
      label,
      '/activities',
      Permissions.values.activityRead,
      ActivityService.listAutocomplete,
      (record) => {
        if (!record) {
          return null;
        }

        return {
          id: record.id,
          label: record.id,
        };
      },
      options,
    );
  }

  static relationToMany(name, label, options) {
    return new RelationToManyField(
      name,
      label,
      '/activities',
      Permissions.values.activityRead,
      ActivityService.listAutocomplete,
      (record) => {
        if (!record) {
          return null;
        }

        return {
          id: record.id,
          label: record.id,
        };
      },
      options,
    );
  }
}
