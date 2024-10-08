<template>
  <app-page-wrapper>
    <div
      v-if="loading"
      v-loading="loading"
      class="app-page-spinner"
    />
    <div v-else-if="organization">
      <div class="flex items-center justify-between">
        <app-back-link
          :default-route="{
            path: '/organizations',
            query: { projectGroup: selectedProjectGroup?.id },
          }"
        >
          <template #default>
            Organizations
          </template>
        </app-back-link>
        <app-organization-actions
          :organization="organization"
          @unmerge="unmerge"
        />
      </div>

      <div class="grid grid-cols-3 gap-6 mt-4">
        <app-organization-view-header
          :organization="organization"
          class="col-span-2"
        />
        <div class="row-span-4">
          <app-organization-view-aside
            :organization="organization"
            @unmerge="unmerge"
          />
        </div>
        <div class="panel w-full col-span-2">
          <el-tabs v-model="tab">
            <el-tab-pane
              label="Current people"
              name="members"
            >
              <template #label>
                <span class="flex gap-2">
                  <span>Current people</span>
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
  <app-organization-unmerge-dialog
    v-if="isUnmergeDialogOpen"
    v-model="isUnmergeDialogOpen"
    :selected-identity="selectedIdentity"
    @update:model-value="selectedIdentity = null"
  />
</template>

<script setup>
import { onMounted, ref, watch } from 'vue';
import AppActivityTimeline from '@/modules/activity/components/activity-timeline.vue';
import AppOrganizationViewHeader from '@/modules/organization/components/view/organization-view-header.vue';
import AppOrganizationViewAside from '@/modules/organization/components/view/organization-view-aside.vue';
import AppOrganizationViewMembers from '@/modules/organization/components/view/organization-view-members.vue';
import Message from '@/shared/message/message';
import { storeToRefs } from 'pinia';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';
import { useOrganizationStore } from '@/modules/organization/store/pinia';
import { useRoute } from 'vue-router';
import AppOrganizationActions from '@/modules/organization/components/organization-actions.vue';
import AppBackLink from '@/shared/modules/back-link/components/back-link.vue';
import AppOrganizationUnmergeDialog from '@/modules/organization/components/organization-unmerge-dialog.vue';

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

watch(() => props.id, (id) => {
  const segments = route.query.segmentId ? [route.query.segmentId] : [route.query.projectGroup];

  fetchOrganization(id, segments)
    .catch(() => {
      Message.error('Something went wrong');
    })
    .finally(() => {
      loading.value = false;
    });
}, {
  immediate: true,
});

// Unmerge
const isUnmergeDialogOpen = ref(null);
const selectedIdentity = ref(null);
const unmerge = (identity) => {
  if (identity) {
    selectedIdentity.value = identity;
  }
  isUnmergeDialogOpen.value = organization.value;
};

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
