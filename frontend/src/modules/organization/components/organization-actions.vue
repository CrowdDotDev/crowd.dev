<template>
  <div>
    <el-button-group class="ml-4">
      <!-- Edit organization -->
      <el-button
        v-if="hasPermission(LfPermission.organizationEdit)"
        class="btn btn--bordered btn--sm !h-8"
        @click="edit()"
      >
        <span class="ri-pencil-line text-base mr-2" />Edit organization
      </el-button>
      <el-button
        v-if="mergeSuggestionsCount > 0 && hasPermission(LfPermission.mergeOrganizations)"
        class="btn btn--sm !h-8 !-ml-px !-mr-0.5 !bg-primary-25 !rounded-l-none !rounded-r-none"
        :disabled="!hasPermission(LfPermission.mergeOrganizations)"
        @click="mergeSuggestions()"
      >
        <span class="mr-2 h-5 px-1.5 rounded-md bg-primary-100 text-primary-500 leading-5">{{ mergeSuggestionsCount }}</span>Merge suggestion
      </el-button>

      <el-button
        v-else-if="hasPermission(LfPermission.mergeOrganizations)"
        class="btn btn--bordered btn--sm !h-8 !-ml-px !-mr-0.5 !rounded-l-none !rounded-r-none"
        :disabled="!hasPermission(LfPermission.mergeOrganizations)"
        @click="merge()"
      >
        <span class="ri-shuffle-line text-base mr-2" />Merge
      </el-button>
      <app-organization-dropdown
        :organization="props.organization"
        :hide-merge="true"
        :hide-edit="true"
        @unmerge="emit('unmerge')"
      >
        <template #trigger>
          <el-button
            class="btn btn--bordered btn--sm !p-2 !h-8 !border-l-gray-200"
            :class="{ '!rounded-l-md': !hasPermission(LfPermission.mergeOrganizations) }"
          >
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
      filter: {
        organizationId: props.organization?.id,
      },
    }"
  />
</template>

<script setup>
import {
  onMounted, ref, watch,
} from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppOrganizationDropdown from '@/modules/organization/components/organization-dropdown.vue';
import { OrganizationService } from '@/modules/organization/organization-service';
import AppOrganizationMergeDialog from '@/modules/organization/components/organization-merge-dialog.vue';
import { useOrganizationStore } from '@/modules/organization/store/pinia';
import { storeToRefs } from 'pinia';
import AppOrganizationMergeSuggestionsDialog
  from '@/modules/organization/components/organization-merge-suggestions-dialog.vue';
import usePermissions from '@/shared/modules/permissions/helpers/usePermissions';
import { LfPermission } from '@/shared/modules/permissions/types/Permissions';

const props = defineProps({
  organization: {
    type: Object,
    default: () => {},
  },
});

const emit = defineEmits(['unmerge']);

const route = useRoute();
const router = useRouter();

const organizationStore = useOrganizationStore();
const { toMergeOrganizations } = storeToRefs(organizationStore);

const { hasPermission } = usePermissions();

const isMergeSuggestionsDialogOpen = ref(false);
const isMergeDialogOpen = ref(null);
const mergeSuggestionsCount = ref(0);
const organizationToMerge = ref(null);

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
    filter: {
      organizationId: props.organization.id,
    },
    countOnly: true,
  })
    .then(({ count }) => {
      mergeSuggestionsCount.value = count;
    });
};

const edit = () => {
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
  isMergeSuggestionsDialogOpen.value = true;
};

const merge = () => {
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
