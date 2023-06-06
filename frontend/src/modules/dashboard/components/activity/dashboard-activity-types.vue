<template>
  <app-cube-render :query="activityTypes(period, platform)">
    <template #loading>
      <div
        v-for="i in 3"
        :key="i"
        class="border-t flex items-center py-4 border-gray-100 first:border-none"
      >
        <app-loading
          height="16px"
          width="16px"
          radius="50%"
        />
        <div class="flex-grow pl-3">
          <app-loading
            height="12px"
            width="120px"
          />
        </div>
      </div>
    </template>
    <template #default="{ resultSet }">
      <app-cube-render
        :query="activitiesCount(dateRange(period), platform)"
      >
        <template #loading>
          <div
            v-for="i in 3"
            :key="i"
            class="border-t flex items-center py-4 border-gray-100 first:border-none"
          >
            <app-loading
              height="16px"
              width="16px"
              radius="50%"
            />
            <div class="flex-grow pl-3">
              <app-loading
                height="12px"
                width="120px"
              />
            </div>
          </div>
        </template>
        <template #default="current">
          <article 
          v-for="{ total, plat, type } of 
          compileData(resultSet)" 
          :key="`${plat}-${type}`"
            class="border-t border-gray-100 py-4 flex items-center cursor-pointer justify-between first:border-none"
            @click="handleActivityClick(plat, type)">
            <div class="flex items-center">
              <img
                v-if="getPlatformDetails(plat)"
                class="w-4 h-4 mr-3"
                :src="getPlatformDetails(plat)?.image"
                :alt="getPlatformDetails(plat)?.name"
              />
              <i v-else class="ri-radar-line text-base text-gray-400 mr-3" />
              <p v-if="typeNames?.[plat]?.[type]?.display" class="text-xs leading-5 activity-type">
                {{ typeNames?.[plat]?.[type]?.display?.short }}
              </p>
              <div v-else class="text-xs leading-5 activity-type">
                Conducted an activity
              </div>
            </div>
            <p class="text-2xs text-gray-400">
              {{ pluralize('activity', total, true) }} ・
              {{
                Math.round(
                  (total
                    / computedScore(current.resultSet))
                    * 100,
                )
              }}%
            </p>
          </article>
          <div
            v-if="compileData(resultSet).length === 0"
            class="flex items-center justify-center pt-6 pb-5"
          >
            <div
              class="ri-list-check-2 text-3xl text-gray-300 mr-4 h-10 flex items-center"
            />
            <p
              class="text-xs leading-5 text-center italic text-gray-400"
            >
              No activities during this period
            </p>
          </div>
        </template>
      </app-cube-render>
    </template>
  </app-cube-render>
</template>

<script setup>
import {
  activityTypes,
  activitiesCount,
  dateRange,
} from '@/modules/dashboard/dashboard.cube';
import { CrowdIntegrations } from '@/integrations/integrations-config';
import { mapGetters } from '@/shared/vuex/vuex.helpers';
import AppCubeRender from '@/shared/cube/cube-render.vue';
import AppLoading from '@/shared/loading/loading-placeholder.vue';
import { useActivityTypeStore } from '@/modules/activity/store/type';
import { storeToRefs } from 'pinia';
import { computed, watch } from 'vue';
import pluralize from 'pluralize';
import merge from 'lodash/merge';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import ActivityTypeField from '@/modules/activity/activity-type-field';
import ActivityDateField from '@/shared/fields/activity-date-field';
import { formatDate } from '@/utils/date';


const router = useRouter()
const store = useStore();
const { period, platform } = mapGetters('dashboard');
const { currentTenant } = mapGetters('auth');
const activityTypeStore = useActivityTypeStore();
const { types } = storeToRefs(activityTypeStore);
const { setTypes } = activityTypeStore;

const typeNames = computed(() => (merge(types.value.default, types.value.custom)));

watch(
  () => currentTenant,
  (tenant) => {
    if (tenant.value?.settings.length > 0) {
      setTypes(tenant.value.settings[0].activityTypes);
    }
  },
  { immediate: true, deep: true },
);

const compileData = (resultSet) => {
  const pivot = resultSet.chartPivot();
  return pivot.map((el) => {
    const [plat, type] = el.x.split(',');
    return {
      total: el['Activities.count'],
      plat,
      type,
    };
  });
};

const computedScore = (resultSet) => {
  const seriesNames = resultSet.seriesNames();
  const pivot = resultSet.chartPivot();
  let count = 0;
  seriesNames.forEach((e) => {
    const data = pivot.map((p) => p[e.key]);
    count += data.reduce((a, b) => a + b, 0);
  });
  return count;
};

const getPlatformDetails = (plat) => CrowdIntegrations.getConfig(plat);

const handleActivityClick = (plat, type) => {
  const dateField = new ActivityDateField(
    "lastActive",
    "Last activity",
    {
      filterable: true,
    } 
  ).forFilter()

  const activityTypeField = new ActivityTypeField(
    'type',
    'Activity type',
    {
      filterable: true,
      fromMembers: false
    }
  ).forFilter()

  

 
  const optionsArray = activityTypeField.props.options

  // Finding the option object with the matching platform key
  const platformOption = optionsArray.find((option) => option.label.key === plat);

  // Find the nested option object with the matching value within the platform option
  const nestedOption = platformOption.nestedOptions.find((option) => option.value === type);

  // Retrieve the desired values
  const platformValue = platformOption.label.value; //for example : Github, Twitter etc.
  const displayLabel = nestedOption.label; // for example : Commented on an Issue, Merged a pull request etc.

  activityTypeField.value = {
    displayValue: displayLabel,
    displayKey: platformValue,
    type: "platform",
    key: plat,
    value: type,
  }

  const periodValue = period.value.value //7 or 14 or 30

  dateField.name = 'timestamp'
  dateField.value = formatDate({
    subtractDays: periodValue,
  })
  dateField.label = "Date"

  store.dispatch(`activity/updateFilterAttribute`, activityTypeField)
  store.dispatch(`activity/updateFilterAttribute`, dateField)
  router.push("/activities")
}
</script>

<script>
export default {
  name: 'AppDashboardActivityTypes',
};

</script>

<style lang="scss">
.activity-type {
  display: block;

  &:first-letter {
    text-transform: uppercase;
  }
}
</style>
