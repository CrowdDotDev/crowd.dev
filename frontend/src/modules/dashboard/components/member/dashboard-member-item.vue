<template>
  <!-- loading state -->
  <article
    v-if="loading || !member"
    class="flex items-center"
  >
    <app-loading height="32px" width="32px" radius="2rem" />
    <div class="flex-grow pl-3">
      <app-loading
        height="12px"
        width="120px"
      />
    </div>
  </article>
  <router-link
    v-else
    class="flex items-center justify-between group"
    :to="{
      name: 'memberView',
      params: { id: member.id },
      query: { projectGroup: selectedProjectGroup?.id },
    }"
  >
    <div class="flex items-center">
      <app-avatar :entity="member" size="xs" />
      <app-member-display-name
        :member="member"
        :show-badge="showBadge"
        class="flex items-center pl-3"
        custom-class="text-xs leading-5 font-medium text-gray-900 group-hover:text-brand-500 transition"
      />
    </div>
    <p class="text-2xs leading-4 !text-gray-500 pl-3 text-right">
      <slot />
    </p>
  </router-link>
</template>

<script>
import { CrowdIntegrations } from '@/integrations/integrations-config';
import AppAvatar from '@/shared/avatar/avatar.vue';
import AppLoading from '@/shared/loading/loading-placeholder.vue';
import AppMemberDisplayName from '@/modules/member/components/member-display-name.vue';
import { storeToRefs } from 'pinia';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';

export default {
  name: 'AppDashboardMemberItem',
  components: {
    AppMemberDisplayName,
    AppLoading,
    AppAvatar,
  },
  props: {
    member: {
      type: Object,
      required: false,
      default: () => ({}),
    },
    showBadge: {
      type: Boolean,
      required: false,
      default: true,
    },
    loading: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  computed: {
    selectedProjectGroup() {
      const lsSegmentsStore = useLfSegmentsStore();

      return storeToRefs(lsSegmentsStore).selectedProjectGroup.value;
    },
  },
  methods: {
    getPlatformDetails(platform) {
      return CrowdIntegrations.getConfig(platform);
    },
  },
};
</script>
