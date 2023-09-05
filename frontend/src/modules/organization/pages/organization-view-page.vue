<template>
  <app-page-wrapper>
    <div
      v-if="loading"
      v-loading="loading"
      class="app-page-spinner"
    />
    <div v-else-if="organization">
      <router-link
        class="text-gray-600 btn-link--md btn-link--secondary p-0 inline-flex items-center"
        :to="{
          path: '/organizations',
          query: { projectGroup: selectedProjectGroup?.id },
        }"
      >
        <i class="ri-arrow-left-s-line mr-2" />Organizations
      </router-link>
      <div class="grid grid-cols-3 gap-6 mt-4">
        <app-organization-view-header
          :organization="organization"
          class="col-span-2"
        />
        <div class="row-span-4">
          <app-organization-view-aside
            :organization="organization"
          />
        </div>
        <div class="panel w-full col-span-2">
          <el-tabs v-model="tab">
            <el-tab-pane
              label="Current contributors"
              name="members"
            >
              <template #label>
                <span class="flex gap-2">
                  <span>Current contributors</span>
                  <el-tooltip
                    content="Members that are currently a part of this organization."
                    placement="top"
                  >
                    <i class="ri-information-line" />
                  </el-tooltip>
                </span>
              </template>
              <template #default>
                <app-organization-view-members
                  :organization-id="props.id"
                />
              </template>
            </el-tab-pane>
            <el-tab-pane
              label="Activities"
              name="activities"
            >
              <app-activity-timeline
                :entity="{
                  ...organization,
                  organizations: [organization],
                }"
                entity-type="organization"
                :show-affiliations="true"
              />
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>
    </div>
  </app-page-wrapper>
</template>

<script setup>
import { onMounted, ref } from 'vue';

import AppActivityTimeline from '@/modules/activity/components/activity-timeline.vue';
import AppOrganizationViewHeader from '@/modules/organization/components/view/organization-view-header.vue';
import AppOrganizationViewAside from '@/modules/organization/components/view/organization-view-aside.vue';
import AppOrganizationViewMembers from '@/modules/organization/components/view/organization-view-members.vue';
import Message from '@/shared/message/message';
import { storeToRefs } from 'pinia';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';
import { useOrganizationStore } from '@/modules/organization/store/pinia';
import { useRoute } from 'vue-router';

const props = defineProps({
  id: {
    type: String,
    default: null,
  },
});
const route = useRoute();

const organizationStore = useOrganizationStore();
const { organization } = storeToRefs(organizationStore);
const { fetchOrganization } = organizationStore;

const lsSegmentsStore = useLfSegmentsStore();
const { selectedProjectGroup } = storeToRefs(lsSegmentsStore);

const loading = ref(true);
const tab = ref('members');

onMounted(() => {
  const segments = route.query.segmentId ? [route.query.segmentId] : [route.query.projectGroup];

  try {
    fetchOrganization(props.id, segments).finally(() => {
      loading.value = false;
    });
  } catch (e) {
    Message.error('Something went wrong');
  }
});
</script>

<script>
export default {
  name: 'AppOrganizationViewPage',
};
</script>
