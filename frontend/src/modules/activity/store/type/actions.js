import { ActivityTypeService } from '@/modules/activity/services/activity-type-service';

export default {
  createActivityType(data, segments) {
    return ActivityTypeService.create(data, segments).then(
      (types) => {
        this.types = types;
        return Promise.resolve(types);
      },
    );
  },
  updateActivityType(key, data, segments) {
    return ActivityTypeService.update(key, data, segments).then(
      (types) => {
        this.types = types;
        return Promise.resolve(types);
      },
    );
  },
  deleteActivityType(key, segments) {
    return ActivityTypeService.delete(key, segments).then((types) => {
      this.types = types;
      return Promise.resolve(types);
    });
  },
  setTypes(types) {
    this.types = types;
  },
};
