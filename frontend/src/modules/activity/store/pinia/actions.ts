import { ActivityState } from '@/modules/activity/store/pinia/state';
import { ActivityService } from '@/modules/activity/activity-service';

export default {
  fetchActivities(this: ActivityState, { body = {}, reload = false } :{ body?: any, reload?: boolean }): Promise<any> {
    const mappedBody = reload ? this.savedFilterBody : body;
    this.activities = [];
    return ActivityService.listActivities(mappedBody)
      .then((data: any) => {
        this.activities = data.rows;
        this.totalActivities = data.count;
        this.savedFilterBody = mappedBody;
        return Promise.resolve(data);
      })
      .catch((err) => {
        this.activities = [];
        this.totalActivities = 0;
        return Promise.reject(err);
      });
  },
};
