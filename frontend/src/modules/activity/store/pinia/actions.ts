import { ActivityState } from '@/modules/activity/store/pinia/state';
import { ActivityService } from '@/modules/activity/activity-service';

export default {
  fetchActivities(this: ActivityState, { body = {}, reload = false, append = false }:
    { body?: any, reload?: boolean, append?: boolean }): Promise<any> {
    const mappedBody = reload ? this.savedFilterBody : body;

    // Clear activities
    if (!append) {
      this.activities = [];
      this.pagination = {
        page: 1,
        perPage: 20,
      };
    }
    return ActivityService.query(mappedBody)
      .then((data: any) => {
        // If append is true, join new activities with the existent ones
        if (append) {
          this.activities = this.activities.concat(...data.rows);
        } else {
          this.activities = data.rows;
        }

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
  fetchActivityChannels() {
    return ActivityService.listActivityChannels()
      .then((res) => {
        this.activityChannels = res;
        return Promise.resolve(res);
      });
  },
};
