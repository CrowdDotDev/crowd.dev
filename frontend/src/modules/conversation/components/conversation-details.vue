<template>
  <article v-if="loading || !conversation">
    <div class="flex relative">
      <div>
        <app-loading
          height="32px"
          width="32px"
          radius="50%"
        />
      </div>
      <div class="flex-grow pl-3 pt-2.5">
        <app-loading
          height="12px"
          width="320px"
          class="mb-3"
        />
        <app-loading height="12px" width="280px" />
      </div>
    </div>
    <div class="pt-6">
      <app-conversation-reply
        v-for="el of Array(3)"
        :key="el"
        class="mb-4"
        :loading="true"
      />
    </div>
  </article>
  <article v-else class="h-full">
    <div v-if="!editing" class="flex items-center pb-8">
      <!-- avatar conversation starter -->
      <router-link
        :to="{
          name: 'memberView',
          params: { id: member.id },
        }"
      >
        <app-avatar :entity="member" size="xs" />
      </router-link>
      <!-- conversation info-->
      <div class="pl-3">
        <app-member-display-name
          class="flex items-center mb-0.5"
          custom-class="text-2xs leading-4 font-medium text-gray-900"
          :member="member"
          with-link
        />
        <div class="flex items-center">
          <el-tooltip
            v-if="platform"
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
          <div class="flex-grow leading-none">
            <app-activity-header
              :activity="conversation.conversationStarter"
              class="text-xs pl-2 inline-flex"
            />
          </div>
        </div>
      </div>
    </div>
    <div v-if="!editing">
      <app-activity-content
        :class="
          conversation.conversationStarter.title
            ? 'text-sm'
            : 'text-base'
        "
        title-classes="text-[18px] font-semibold"
        :activity="conversation.conversationStarter"
        :show-more="true"
      />
    </div>
    <div v-else>
      <div class="flex items-center justify-between">
        <div class="text-base flex-shrink mr-4">
          {{ conversation.title }}
        </div>
        <button
          class="btn btn--transparent w-8 !h-8 flex-shrink-0"
          type="button"
          :disabled="isEditLockedForSampleData"
          @click.stop="$emit('edit-title')"
        >
          <i class="ri-lg ri-pencil-line" />
        </button>
      </div>
    </div>
    <div class="py-6 whitespace-nowrap">
      <app-conversation-details-footer
        :conversation="conversation"
      />
    </div>

    <el-divider class="!my-0 -mx-6 w-auto border-gray-200" />

    <div v-if="replies.length || sorter !== 'all'">
      <div class="flex justify-between items-center">
        <h6 class="mb-8 mt-6">
          Activities
        </h6>

        <div v-if="sorterOptions.length > 2" class="flex gap-1 items-center text-sm">
          <span class="text-gray-500">Activity type:</span>

          <app-inline-select-input
            v-model="sorter"
            popper-class="sorter-popper-class"
            placement="bottom-end"
            :options="sorterOptions"
            @change="doChangeSort"
          />
        </div>
      </div>

      <div v-if="loadingActivities">
        <div
          v-loading="loadingActivities"
          class="app-page-spinner h-16 !relative !min-h-5"
        />
      </div>
      <div v-else-if="replies.length" class="pb-6">
        <app-conversation-reply
          v-for="(reply, ri) in replies"
          :key="reply.id"
          :activity="reply"
          :display-content="true"
          :body-classes="
            ri < replies.length - 1 ? 'pb-8' : ''
          "
          :show-more="true"
        >
          <template #underAvatar>
            <div
              v-if="ri < replies.length - 1"
              class="h-full w-0.5 bg-gray-200 my-2"
            />
          </template>
        </app-conversation-reply>
      </div>
      <div v-else class="text-gray-400">
        No activities found
      </div>
    </div>
  </article>
</template>

<script>
import { mapGetters } from 'vuex';
import { toSentenceCase } from '@/utils/string';
import { CrowdIntegrations } from '@/integrations/integrations-config';
import AppConversationReply from '@/modules/conversation/components/conversation-reply.vue';
import AppActivityContent from '@/modules/activity/components/activity-content.vue';
import AppActivityHeader from '@/modules/activity/components/activity-header.vue';
import AppLoading from '@/shared/loading/loading-placeholder.vue';
import AppAvatar from '@/shared/avatar/avatar.vue';
import AppMemberDisplayName from '@/modules/member/components/member-display-name.vue';
import AppConversationDetailsFooter from '@/modules/conversation/components/conversation-details-footer.vue';
import { ActivityService } from '@/modules/activity/activity-service';
import Message from '@/shared/message/message';
import config from '@/config';
import { ConversationPermissions } from '../conversation-permissions';

export default {
  name: 'AppConversationDetails',
  components: {
    AppMemberDisplayName,
    AppConversationReply,
    AppActivityContent,
    AppLoading,
    AppAvatar,
    AppConversationDetailsFooter,
    AppActivityHeader,
  },
  props: {
    conversation: {
      type: Object,
      required: false,
      default: () => ({}),
    },
    editing: {
      type: Boolean,
      default: false,
    },
    loading: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  emits: ['edit-title'],
  data() {
    return {
      sorter: 'all',
      loadingActivities: false,
      filteredActivities: [],
    };
  },
  computed: {
    ...mapGetters({
      currentTenant: 'auth/currentTenant',
      currentUser: 'auth/currentUser',
    }),
    platform() {
      return CrowdIntegrations.getConfig(
        this.conversation.conversationStarter?.platform,
      );
    },
    member() {
      return this.conversation.conversationStarter.member;
    },
    url() {
      return this.conversation.url;
    },
    replies() {
      if (this.sorter !== 'all') {
        return this.filteredActivities;
      }

      return this.editing
        ? this.conversation.activities
        : this.conversation.activities.slice(1);
    },
    isEditLockedForSampleData() {
      return new ConversationPermissions(
        this.currentTenant,
        this.currentUser,
      ).editLockedForSampleData;
    },
    conversationTypes() {
      const [, ...activities] = this.conversation.activities;

      return activities.map((a) => a.type);
    },
    sorterOptions() {
      const { platform } = this.conversation;
      const defaultActivityTypes = this.currentTenant?.settings[0]?.activityTypes?.default;
      const options = [{
        value: 'all',
        label: 'All',
      }];

      if (config.isGitIntegrationEnabled && (platform === 'github' || platform === 'git')) {
        if (this.conversationTypes.includes('authored-commit')) {
          options.push({
            value: 'authored-commit',
            label: 'Authored a commit',
          });
        }
      }

      if (!platform) {
        return options;
      }

      options.push(
        ...Object.entries(defaultActivityTypes[platform] || {})
          .filter(([key]) => this.conversationTypes.includes(key)
           || (platform === 'discord'
            && (key === 'replied_thread' || key === 'replied')))
          .map(([key, value]) => ({
            value: key,
            label: toSentenceCase(value.display.short),
          })),
      );

      return options;
    },
  },
  methods: {
    doChangeSort(value) {
      if (value !== 'all') {
        this.loadingActivities = true;

        ActivityService.list({
          customFilters: {
            and: [
              {
                type: value,
              },
              {
                conversationId: this.conversation.id,
              },
            ],
          },
          orderBy: ['timestamp_ASC', 'createdAt_ASC'],
          limit: null,
          offset: 0,
          buildFilter: false,
          buildWithDefaultRootFilters: false,
        }).then((response) => {
          this.filteredActivities = response.rows;
        }).catch((error) => {
          console.error(error);
          Message.error(
            'Something went wrong. Please try again',
          );
        }).finally(() => {
          this.loadingActivities = false;
        });
      }
    },
  },
};
</script>
