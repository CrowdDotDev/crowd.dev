<template>
  <app-page-wrapper>
    <div
      v-if="loading"
      v-loading="loading"
      class="app-page-spinner"
    />
    <div v-else>
      <div class="flex justify-between">
        <router-link
          class="text-gray-600 btn-link--md btn-link--secondary p-0 inline-flex items-center"
          :to="{
            path: '/contributors',
            query: { projectGroup: selectedProjectGroup?.id },
          }"
        >
          <i class="ri-arrow-left-s-line mr-2" />Contributors
        </router-link>

        <app-member-actions :member="member" />
      </div>
      <div class="grid grid-cols-3 gap-6 mt-4">
        <app-member-view-header
          :member="member"
          class="col-span-2"
        />
        <div class="row-span-4">
          <app-member-view-aside :member="member" />
        </div>
        <app-member-view-contributions-cta
          v-if="!isEnrichmentEnabled"
        />
        <app-member-view-contributions
          v-else-if="member.contributions"
          :contributions="member.contributions"
          class="col-span-2"
        />
        <div class="panel w-full col-span-2">
          <el-tabs v-model="tab">
            <el-tab-pane
              label="Activities"
              name="activities"
            >
              <app-activity-timeline
                :entity="member"
                entity-type="member"
                :show-affiliations="true"
              />
            </el-tab-pane>
            <el-tab-pane label="Notes" name="notes">
              <app-member-view-notes :member="member" />
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>
    </div>
  </app-page-wrapper>
</template>

<script setup>
import { useStore } from 'vuex';
import {
  computed,
  ref,
  watch,
} from 'vue';

import AppActivityTimeline from '@/modules/activity/components/activity-timeline.vue';
import AppMemberViewHeader from '@/modules/member/components/view/member-view-header.vue';
import AppMemberViewAside from '@/modules/member/components/view/member-view-aside.vue';
import AppMemberViewNotes from '@/modules/member/components/view/member-view-notes.vue';
import AppMemberActions from '@/modules/member/components/member-actions.vue';
import AppMemberViewContributions from '@/modules/member/components/view/member-view-contributions.vue';
import { useMemberStore } from '@/modules/member/store/pinia';
import { storeToRefs } from 'pinia';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';
import AppMemberViewContributionsCta from '@/modules/member/components/view/member-view-contributions-cta.vue';
import Plans from '@/security/plans';
import { mapGetters } from '@/shared/vuex/vuex.helpers';

const store = useStore();
const props = defineProps({
  id: {
    type: String,
    default: null,
  },
});

const memberStore = useMemberStore();
const { customAttributes } = storeToRefs(memberStore);
const { getMemberCustomAttributes } = memberStore;

const lsSegmentsStore = useLfSegmentsStore();
const { selectedProjectGroup } = storeToRefs(lsSegmentsStore);

const { currentTenant } = mapGetters('auth');

const member = computed(() => store.getters['member/find'](props.id) || {});
const isEnrichmentEnabled = computed(() => currentTenant.value.plan !== Plans.values.essential);

const loading = ref(true);
const tab = ref('activities');

watch(() => props.id, (id) => {
  loading.value = true;

  store.dispatch('member/doFind', {
    id,
    segments: [selectedProjectGroup.value?.id],
  }).then(() => {
    if (
      Object.keys(customAttributes.value)
        .length === 0
    ) {
      getMemberCustomAttributes();
    }

    loading.value = false;
  });
}, {
  immediate: true,
});
</script>

<script>
export default {
  name: 'AppMemberViewPage',
};
</script>
