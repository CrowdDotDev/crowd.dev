<template>
  <div class="activity-timeline">
    <div class="mb-6">
      <div class="flex gap-2">
        <el-input
          v-model="query"
          placeholder="Search activities"
          :prefix-icon="SearchIcon"
          clearable
          class="activity-timeline-search"
        >
          <template #append>
            <el-select
              v-model="platform"
              clearable
              filterable
              no-match-text="Platform not found"
              placeholder="All platforms"
              class="w-40"
              @clear="reloadActivities"
            >
              <template
                v-if="
                  platform && lfIdentities[platform]
                "
                #prefix
              >
                <img
                  v-if="lfIdentities[platform]"
                  :alt="lfIdentities[platform].name"
                  :src="lfIdentities[platform].image"
                  class="w-4 h-4"
                />
                <i
                  v-else
                  class="ri-radar-line text-base text-gray-400"
                />
              </template>
              <el-option
                v-for="enabledPlatform of enabledPlatforms"
                :key="enabledPlatform.key"
                :value="enabledPlatform.key"
                :label="enabledPlatform.name"
                @mouseleave="onSelectMouseLeave"
              >
                <img
                  :alt="enabledPlatform.name"
                  :src="enabledPlatform.image"
                  class="w-4 h-4 mr-2"
                />
                {{ enabledPlatform.label }}
              </el-option>
              <el-option
                value="other"
                label="Other"
                @mouseleave="onSelectMouseLeave"
              >
                <i
                  class="ri-radar-line text-base text-gray-400 mr-2"
                />
                Other
              </el-option>
            </el-select>
          </template>
        </el-input>
        <el-select
          v-model="selectedSegment"
          clearable
          filterable
          no-match-text="Sub-project not found"
          placeholder="All sub-projects"
          class="w-52"
          @change="fetchActivities({ reset: true })"
        >
          <el-option
            v-for="segment of segments"
            :key="segment.id"
            :value="segment.id"
            :label="segment.name"
            @mouseleave="onSelectMouseLeave"
          />
        </el-select>
      </div>
    </div>
    <div>
      <el-timeline>
        <template v-if="activities.length">
          <el-timeline-item
            v-for="activity in activities"
            :key="activity.id"
          >
            <div class="-mt-1.5">
              <app-member-display-name
                v-if="entityType === 'organization'"
                :member="activity.member"
                custom-class="block text-gray-900 font-medium"
                with-link
                class="bl"
              />
              <div
                class="flex gap-4 justify-between min-h-9 -mt-1"
                :class="{
                  'items-center': !isMemberEntity,
                  'items-start': isMemberEntity,
                }"
              >
                <app-activity-header
                  :activity="activity"
                  class="flex flex-wrap items-center"
                  :class="{
                    'mt-1.5': isMemberEntity,
                  }"
                />

                <div class="flex items-center flex-nowrap">
                  <a
                    v-if="
                      activity.conversationId && isMemberEntity
                    "
                    class="text-xs font-medium flex items-center mr-4 cursor-pointer hover:underline"
                    target="_blank"
                    @click="
                      conversationId = activity.conversationId
                    "
                  >
                    <i
                      class="text-sm ri-eye-line mr-1"
                    />
                    <span class="block whitespace-nowrap">View {{ activity.platform !== Platform.GIT ? 'conversation' : 'commit' }}</span>
                  </a>
                  <app-activity-dropdown
                    v-if="showAffiliations"
                    :show-affiliations="true"
                    :activity="activity"
                    :organizations="entity.organizations ?? activity.member.organizations ?? []"
                    :disable-edit="true"
                    @on-update="fetchActivities({ reset: true })"
                  />
                </div>
              </div>

              <!-- For now only render a special UI for Git -->
              <div v-if="activity.platform === Platform.GIT">
                <lf-activity-display
                  :activity="activity"
                  in-profile
                />
              </div>
              <div v-else>
                <app-lf-activity-parent
                  v-if="activity.parent && isMemberEntity"
                  :parent="activity.parent"
                />

                <app-activity-content
                  v-if="activity.title || activity.body"
                  class="text-sm bg-gray-50 rounded-lg p-4 mt-3"
                  :activity="activity"
                  :show-more="true"
                >
                  <template v-if="lfIdentities[activity.platform]?.activity?.showContentDetails" #details>
                    <div v-if="activity.attributes">
                      <app-activity-content-footer
                        :source-id="isMemberEntity && activity.parent ? activity.parent?.sourceId : activity.sourceId"
                        :changes="activity.attributes.lines"
                        changes-copy="line"
                        :insertions="activity.attributes.insertions"
                        :deletions="activity.attributes.deletions"
                        :display-source-id="isMemberEntity && activity.parent
                          ? activity.parent?.type === 'authored-commit' : activity.type === 'authored-commit'"
                      />
                    </div>
                  </template>

                  <template #bottomLink>
                    <div v-if="activity.url" class="pt-6">
                      <app-activity-link
                        :activity="activity"
                      />
                    </div>
                  </template>
                </app-activity-content>
              </div>
            </div>
            <template #dot>
              <span
                class="btn btn--circle cursor-auto p-2 bg-gray-100 border border-gray-200"
                :class="`btn--${activity.platform}`"
              >
                <img
                  v-if="lfIdentities[activity.platform]"
                  :src="
                    lfIdentities[activity.platform].image
                  "
                  :alt="`${activity.platform}-icon`"
                  class="w-4 h-4"
                />
                <i
                  v-else
                  class="ri-radar-line text-base text-gray-400"
                />
              </span>
            </template>
          </el-timeline-item>
        </template>

        <app-empty-state-cta
          v-if="!activities.length && !loading"
          icon="ri-list-check-2"
          title="No activities found"
          description="We couldn't find any results that match your search criteria, please try a different query"
        />
      </el-timeline>
      <div
        v-if="loading"
        v-loading="loading"
        class="app-page-spinner"
      />
      <div v-if="!noMore" class="flex justify-center pt-4">
        <lf-button
          type="primary-ghost"
          :disabled="loading"
          @click="fetchActivities()"
        >
          Load more
        </lf-button>
      </div>
    </div>
  </div>

  <app-conversation-drawer
    :expand="conversationId != null"
    :conversation-id="conversationId"
    @close="conversationId = null"
  />
</template>

<script setup lang="ts">
import { useStore } from 'vuex';
import {
  computed,
  ref,
  h,
  onMounted,
  watch,
} from 'vue';
import debounce from 'lodash/debounce';
import AppActivityHeader from '@/modules/activity/components/activity-header.vue';
import AppActivityContent from '@/modules/activity/components/activity-content.vue';
import { onSelectMouseLeave } from '@/utils/select';
import AppMemberDisplayName from '@/modules/member/components/member-display-name.vue';
import AppActivityLink from '@/modules/activity/components/activity-link.vue';
import AppActivityContentFooter from '@/modules/activity/components/activity-content-footer.vue';
import AppLfActivityParent from '@/modules/lf/activity/components/lf-activity-parent.vue';
import AppConversationDrawer from '@/modules/conversation/components/conversation-drawer.vue';
import AppActivityDropdown from '@/modules/activity/components/activity-dropdown.vue';
import { storeToRefs } from 'pinia';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';
import { getSegmentsFromProjectGroup } from '@/utils/segments';
import { Platform } from '@/shared/modules/platform/types/Platform';
import LfActivityDisplay from '@/shared/modules/activity/components/activity-display.vue';
import moment from 'moment';
import LfButton from '@/ui-kit/button/Button.vue';
import { IdentityConfig, lfIdentities } from '@/config/identities';
import { ActivityService } from '../activity-service';

const SearchIcon = h(
  'i', // type
  { class: 'ri-search-line' }, // props
  [],
);

const store = useStore();
const props = defineProps({
  entityType: {
    type: String,
    default: null,
  },
  entity: {
    type: Object,
    default: () => {},
  },
  showAffiliations: {
    type: Boolean,
    default: false,
  },
  selectedSegment: {
    type: String,
    default: null,
  },
});

const lsSegmentsStore = useLfSegmentsStore();
const { projectGroups, selectedProjectGroup } = storeToRefs(lsSegmentsStore);

const conversationId = ref(null);
const enabledPlatforms: IdentityConfig[] = Object.values(lfIdentities);

const loading = ref(false);
const platform = ref(null);
const query = ref('');
const activities = ref([]);
const limit = ref(10);
const timestamp = ref(moment(props.entity.lastActive).toISOString());
const noMore = ref(false);
const selectedSegment = ref(props.selectedSegment || null);

const isMemberEntity = computed(() => props.entityType === 'member');

const subprojects = computed(() => projectGroups.value.list.reduce((acc, projectGroup) => {
  projectGroup.projects.forEach((project) => {
    project.subprojects.forEach((subproject) => {
      acc[subproject.id] = {
        id: subproject.id,
        name: subproject.name,
      };
    });
  });

  return acc;
}, {}));

const segments = computed(() => {
  if (!props.entity.segments) {
    return getSegmentsFromProjectGroup(selectedProjectGroup.value)?.map((s) => subprojects.value[s]) || [];
  }
  return props.entity.segments?.map((s) => {
    if (typeof s === 'string') {
      return subprojects.value[s];
    }

    return s;
  }).filter((s) => !!s) || [];
});

const fetchActivities = async ({ reset } = { reset: false }) => {
  if (loading.value) {
    return;
  }
  const filterToApply = {
    platform: platform.value ? { in: [platform.value] } : undefined,
  };

  if (props.entityType === 'member') {
    filterToApply.memberId = { in: [props.entity.id] };
  } else {
    filterToApply.organizationId = { in: [props.entity.id] };
  }

  if (props.entity.id) {
    if (query.value && query.value !== '') {
      filterToApply.or = [
        {
          channel: {
            textContains: query.value,
          },
        },
        {
          type: {
            textContains: query.value,
          },
        },
      ];
    }
  }

  filterToApply.and = [
    {
      timestamp: {
        lte: timestamp.value,
      },
    },
    ...(timestamp.value ? [{
      timestamp: {
        gte: moment(timestamp.value).subtract(1, 'month').toISOString(),
      },
    }] : []),
  ];

  if (reset) {
    activities.value.length = 0;
    timestamp.value = moment().toISOString();
    noMore.value = false;
  }

  if (noMore.value) {
    return;
  }

  loading.value = true;

  const data = await ActivityService.query({
    filter: filterToApply,
    orderBy: 'timestamp_DESC',
    limit: limit.value,
    segments: selectedSegment.value ? [selectedSegment.value] : segments.value.map((s) => s.id),
  });

  loading.value = false;

  const activityIds = activities.value.map((a) => a.id);
  const rows = data.rows.filter((a) => !activityIds.includes(a.id));
  if (rows.length >= props.entity.activityCount) {
    noMore.value = true;
  }
  activities.value = reset ? rows : [...activities.value, ...rows];

  if (data.rows.length === 0) {
    timestamp.value = moment(timestamp.value).subtract(1, 'month').toISOString();
  } else {
    timestamp.value = moment(data.rows.at(-1).timestamp).toISOString();
  }
};

const reloadActivities = async () => {
  platform.value = undefined;
  await fetchActivities();
};

const debouncedQueryChange = debounce(async () => {
  await fetchActivities({ reset: true });
}, 300);

watch(query, (newValue, oldValue) => {
  if (newValue !== oldValue) {
    debouncedQueryChange();
  }
});

watch(platform, async (newValue, oldValue) => {
  if (newValue !== oldValue) {
    await fetchActivities({ reset: true });
  }
});

onMounted(async () => {
  await store.dispatch('integration/doFetch', segments.value.map((s) => s.id));
  await fetchActivities();
});

defineExpose({
  fetchActivities,
});
</script>

<script lang="ts">
export default {
  name: 'AppMemberViewActivities',
};
</script>

<style lang="scss">
.activity-timeline {
  .el-input-group__append {
    @apply bg-white;

    .el-select .el-input .el-input__wrapper {
      border-radius: 0 6px 6px 0 !important;
    }
  }
  .activity-header {
    @apply max-w-full overflow-visible;
  }
  .el-timeline-item__dot {
    @apply relative;
  }
  .el-timeline-item__wrapper {
    @apply top-1 pl-4;
  }
  .el-timeline-item__tail {
    @apply left-4;
  }
}
</style>
