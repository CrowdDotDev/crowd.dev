import { ActivityService } from '@/modules/activity/activity-service';

export default {
  fetchActivityTypes(segment) {
    return ActivityService.listActivityTypes(segment)
      .then((types) => {
        this.types = types;
        return Promise.resolve(types);
      });
  },
};
