import { ActivityState } from '@/modules/activity/store/pinia/state';
import { ActivityService } from '@/modules/activity/activity-service';
import moment from 'moment';

export default {
  fetchActivities(this: ActivityState, { body = {}, reload = false, append = false }:
    { body?: any, reload?: boolean, append?: boolean }): Promise<any> {
    const mappedBody = reload ? this.savedFilterBody : body;

    // Clear activities
    if (!append) {
      this.activities = [];
      this.timestamp = moment().toISOString();
    }
    return ActivityService.query(mappedBody)
      .then((data: any) => {
        // If append is true, join new activities with the existent ones
        if (append) {
          const filteredRows = data.rows.filter((row: any) => !this.activities.some((activity: any) => activity.id === row.id));

          this.activities = this.activities.concat(...filteredRows);
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
  fetchActivityChannels(segments: string[]) {
    return ActivityService.listActivityChannels(segments)
      .then((res) => {
        this.activityChannels = res;
        return Promise.resolve(res);
      });
  },
};
