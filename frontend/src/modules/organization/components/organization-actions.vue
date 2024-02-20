<template>
  <div>
    <el-button-group class="ml-4">
      <!-- Edit organization -->
      <el-button class="btn btn--bordered btn--sm !h-8" :disabled="isEditLockedForSampleData" @click="edit()">
        <span class="ri-pencil-line text-base mr-2" />Edit organization
      </el-button>
      <el-tooltip
        v-if="mergeSuggestionsCount > 0"
        content="Coming soon"
        placement="top"
        :disabled="hasPermissionsToMerge"
      >
        <span>
          <el-button
            class="btn btn--sm !h-8 !-ml-px !-mr-0.5 !bg-brand-25 !rounded-l-none !rounded-r-none"
            :disabled="isEditLockedForSampleData || !hasPermissionsToMerge"
            @click="mergeSuggestions()"
          >
            <span class="mr-2 h-5 px-1.5 rounded-md bg-brand-100 text-brand-500 leading-5">{{ mergeSuggestionsCount }}</span>Merge suggestion
          </el-button>
        </span>
      </el-tooltip>

      <el-tooltip
        v-else
        content="Coming soon"
        placement="top"
        :disabled="hasPermissionsToMerge"
      >
        <span>
          <el-button
            class="btn btn--bordered btn--sm !h-8 !-ml-px !-mr-0.5 !rounded-l-none !rounded-r-none"
            :disabled="isEditLockedForSampleData || !hasPermissionsToMerge"
            @click="merge()"
          >
            <span class="ri-shuffle-line text-base mr-2" />Merge
          </el-button>
        </span>
      </el-tooltip>
      <app-organization-dropdown
        :organization="props.organization"
        :hide-merge="true"
        :hide-edit="true"
      >
        <template #trigger>
          <el-button class="btn btn--bordered btn--sm !p-2 !h-8 !border-l-2 !border-l-gray-200">
            <span class="ri-more-fill text-base" />
          </el-button>
        </template>
      </app-organization-dropdown>
    </el-button-group>
  </div>
  <app-organization-merge-dialog v-model="isMergeDialogOpen" :to-merge="organizationToMerge" />
  <app-organization-merge-suggestions-dialog
    v-if="isMergeSuggestionsDialogOpen"
    v-model="isMergeSuggestionsDialogOpen"
    :query="{
      organizationId: props.organization?.id,
    }"
  />
</template>

<script setup>
import {
  computed, onMounted, ref, watch,
} from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { OrganizationPermissions } from '@/modules/organization/organization-permissions';
import AppOrganizationDropdown from '@/modules/organization/components/organization-dropdown.vue';
import { OrganizationService } from '@/modules/organization/organization-service';
import AppOrganizationMergeDialog from '@/modules/organization/components/organization-merge-dialog.vue';
import { useOrganizationStore } from '@/modules/organization/store/pinia';
import { storeToRefs } from 'pinia';
import AppOrganizationMergeSuggestionsDialog
  from '@/modules/organization/components/organization-merge-suggestions-dialog.vue';
import { useAuthStore } from '@/modules/auth/store/auth.store';

const props = defineProps({
  organization: {
    type: Object,
    default: () => {},
  },
});

const route = useRoute();
const router = useRouter();

const organizationStore = useOrganizationStore();
const { toMergeOrganizations } = storeToRefs(organizationStore);

const authStore = useAuthStore();
const { user, tenant } = storeToRefs(authStore);

const isMergeSuggestionsDialogOpen = ref(false);
const isMergeDialogOpen = ref(null);
const mergeSuggestionsCount = ref(0);
const organizationToMerge = ref(null);

const isEditLockedForSampleData = computed(
  () => new OrganizationPermissions(tenant.value, user.value)
    .editLockedForSampleData,
);

const hasPermissionsToMerge = computed(() => new OrganizationPermissions(
  tenant.value,
  user.value,
)?.mergeOrganizations);

watch(toMergeOrganizations.value, (updatedValue) => {
  if (updatedValue.originalId && updatedValue.toMergeId) {
    OrganizationService.find(updatedValue.toMergeId, [route.query.projectGroup]).then((response) => {
      isMergeDialogOpen.value = props.organization;
      organizationToMerge.value = response;

      organizationStore.removeToMergeOrganizations();
    });
  }
}, {
  deep: true,
});

const fetchOrganizationsToMergeCount = () => {
  OrganizationService.fetchMergeSuggestions(1, 0, {
    organizationId: props.organization.id,
  })
    .then(({ count }) => {
      mergeSuggestionsCount.value = count;
    });
};

const edit = () => {
  if (isEditLockedForSampleData.value) {
    return;
  }
  router.push({
    name: 'organizationEdit',
    params: {
      id: props.organization.id,
    },
    query: {
      segmentId: route.query.segmentId || route.query.projectGroup,
    },
  });
};

const mergeSuggestions = () => {
  if (isEditLockedForSampleData.value) {
    return;
  }
  isMergeSuggestionsDialogOpen.value = true;
};

const merge = () => {
  if (isEditLockedForSampleData.value) {
    return;
  }
  isMergeDialogOpen.value = props.organization;
};

watch(() => props.organization, () => {
  fetchOrganizationsToMergeCount();
});

onMounted(() => {
  fetchOrganizationsToMergeCount();
});
</script>

<script>
export default {
  name: 'AppOrganizationActions',
};
</script>

<style lang="scss">
</style>
