<template>
  <article
    v-if="loading || !activity"
    class="py-5 border-gray-200 relative"
  >
    <div class="flex">
      <div class="pr-3">
        <app-loading
          height="32px"
          width="32px"
          radius="50%"
        />
      </div>
      <div class="flex-grow w-full pt-2.5">
        <app-loading
          height="12px"
          width="320px"
          class="mb-3"
        />
        <app-loading height="12px" width="280px" />
      </div>
    </div>
  </article>
  <article v-else class="py-5 border-gray-200 relative">
    <div class="flex">
      <!-- avatar -->
      <div class="pr-3">
        <router-link
          :to="{
            name: 'memberView',
            params: { id: activity.member.id },
          }"
          target="_blank"
        >
          <app-avatar :entity="activity.member" size="xs" />
        </router-link>
      </div>
      <div class="flex-grow w-full">
        <!-- Name -->
        <div class="flex justify-between w-full">
          <div>
            <app-member-display-name
              class="flex items-center pb-0.5"
              custom-class="text-2xs leading-4 block text-gray-600"
              :member="activity.member"
              with-link
            />
            <div class="flex items-center">
              <div v-if="platform">
                <el-tooltip
                  effect="dark"
                  :content="platform.name"
                  placement="top"
                >
                  <img
                    :alt="platform.name"
                    class="w-4 h-4"
                    :src="platform.image"
                  />
                </el-tooltip>
              </div>
              <i
                v-else
                class="ri-radar-line text-base text-gray-400"
              />
              <app-activity-header
                :activity="activity"
                class="flex text-2xs leading-4 pl-2"
              />
            </div>
          </div>
          <div>
            <app-activity-dropdown
              :show-affiliations="false"
              :activity="activity"
            />
          </div>
        </div>
        <!-- Content -->
        <div v-if="activity.title || activity.body" class="pt-4">
          <app-activity-content
            :activity="activity"
            :display-body="false"
            :display-title="false"
          />
          <app-activity-content
            class="text-xs bg-gray-50 rounded-lg p-4"
            :activity="activity"
            :show-more="true"
            :display-thread="false"
          >
            <template v-if="platform?.activityDisplay?.showContentDetails" #details>
              <div v-if="activity.attributes">
                <app-activity-content-footer
                  :source-id="activity.sourceId"
                  :changes="activity.attributes.lines"
                  changes-copy="line"
                  :insertions="activity.attributes.insertions"
                  :deletions="activity.attributes.deletions"
                />
              </div>
            </template>

            <template #bottomLink>
              <div v-if="activity.url && platform?.activityDisplay?.showLinkToUrl" class="pt-6">
                <a
                  :href="activity.url"
                  class="text-2xs text-gray-600 font-medium flex items-center"
                  target="_blank"
                  rel="noopener noreferrer"
                ><i
                   class="ri-lg ri-external-link-line mr-1"
                 />
                  <span class="block">Open on {{ platform?.name || 'platform' }}</span></a>
              </div>
            </template>
          </app-activity-content>
        </div>
      </div>
    </div>
  </article>
</template>

<script>
import { CrowdIntegrations } from '@/integrations/integrations-config';
import AppAvatar from '@/shared/avatar/avatar.vue';
import AppActivityDropdown from '@/modules/activity/components/activity-dropdown.vue';
import AppLoading from '@/shared/loading/loading-placeholder.vue';
import AppActivityContent from '@/modules/activity/components/activity-content.vue';
import AppMemberDisplayName from '@/modules/member/components/member-display-name.vue';
import AppActivityContentFooter from '@/modules/activity/components/activity-content-footer.vue';
import AppActivityHeader from '@/modules/activity/components/activity-header.vue';

export default {
  name: 'AppDashboardActivityItem',
  components: {
    AppMemberDisplayName,
    AppActivityContent,
    AppLoading,
    AppActivityDropdown,
    AppAvatar,
    AppActivityContentFooter,
    AppActivityHeader,
  },
  props: {
    activity: {
      type: Object,
      required: false,
      default: () => ({}),
    },
    loading: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  computed: {
    platform() {
      return CrowdIntegrations.getConfig(
        this.activity.platform,
      );
    },
  },
};
</script>
