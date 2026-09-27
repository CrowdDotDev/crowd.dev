// Copyright (c) 2026 The Linux Foundation and each contributor.
// SPDX-License-Identifier: MIT
import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Filter } from '@/shared/modules/filters/types/FilterConfig';
import { ActivityService } from '@/modules/activity/activity-service';
import type { Activity } from '@/shared/modules/activity/types/Activity';
import { dateHelper } from '@/shared/date-helper/date-helper';

export const useActivityStore = defineStore('activity', () => {
  const filters = ref<Filter>({
    search: '',
    relation: 'and',
    order: {
      prop: 'timestamp',
      order: 'descending',
    },
  } as Filter);
  const limit = ref<number>(20);
  const timestamp = ref<string>(dateHelper().toISOString());
  const savedFilterBody = ref<any>({});
  const activities = ref<Activity[]>([]);
  const totalActivities = ref<number>(0);
  const activityChannels = ref<Record<string, string[]>>({});

  function fetchActivities({ body = {}, reload = false, append = false }:
    { body?: any, reload?: boolean, append?: boolean }): Promise<any> {
    const mappedBody = reload ? savedFilterBody.value : body;

    if (!append) {
      activities.value = [];
      timestamp.value = dateHelper().toISOString();
    }
    return ActivityService.query(mappedBody)
      .then((data: any) => {
        if (append) {
          const filteredRows = data.rows.filter((row: any) => !activities.value.some((activity: any) => activity.id === row.id));

          activities.value = activities.value.concat(...filteredRows);
        } else {
          activities.value = data.rows;
        }

        totalActivities.value = data.count;
        savedFilterBody.value = mappedBody;
        return Promise.resolve(data);
      })
      .catch((err) => {
        activities.value = [];
        totalActivities.value = 0;
        return Promise.reject(err);
      });
  }

  function fetchActivityChannels(segment: string) {
    return ActivityService.listActivityChannels(segment)
      .then((res) => {
        activityChannels.value = res;
        return Promise.resolve(res);
      });
  }

  return {
    filters,
    limit,
    timestamp,
    savedFilterBody,
    activities,
    totalActivities,
    activityChannels,
    fetchActivities,
    fetchActivityChannels,
  };
});
