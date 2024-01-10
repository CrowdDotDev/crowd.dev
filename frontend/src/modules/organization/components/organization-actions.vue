<template>
  <div>
    <el-button-group class="ml-4">
      <!-- Edit organization -->
      <el-button class="btn btn--bordered btn--sm !h-8" :disabled="isEditLockedForSampleData" @click="edit()">
        <span class="ri-pencil-line text-base mr-2" />Edit organization
      </el-button>
      <el-button
        v-if="mergeSuggestionsCount > 0"
        class="btn btn--sm !h-8 !-ml-px !-mr-0.5 !bg-brand-25"
        :disabled="isEditLockedForSampleData"
        @click="mergeSuggestions()"
      >
        <span class="mr-2 h-5 px-1.5 rounded-md bg-brand-100 text-brand-500 leading-5">{{ mergeSuggestionsCount }}</span>Merge suggestion
      </el-button>

      <el-button
        v-else
        class="btn btn--bordered btn--sm !h-8 !-ml-px !-mr-0.5"
        :disabled="isEditLockedForSampleData"
        @click="merge()"
      >
        <span class="ri-shuffle-line text-base mr-2" />Merge
      </el-button>
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
  <app-organization-merge-dialog v-model="isMergeDialogOpen" />
</template>

<script setup>
import {
  computed, onMounted, ref, watch,
} from 'vue';
import { mapGetters } from '@/shared/vuex/vuex.helpers';
import { useRoute, useRouter } from 'vue-router';
import { OrganizationPermissions } from '@/modules/organization/organization-permissions';
import AppOrganizationDropdown from '@/modules/organization/components/organization-dropdown.vue';
import { OrganizationService } from '@/modules/organization/organization-service';
import AppOrganizationMergeDialog from '@/modules/organization/components/organization-merge-dialog.vue';

const props = defineProps({
  organization: {
    type: Object,
    default: () => {},
  },
});

const route = useRoute();
const router = useRouter();

const { currentUser, currentTenant } = mapGetters('auth');

const isMergeDialogOpen = ref(null);
const mergeSuggestionsCount = ref(0);

const isEditLockedForSampleData = computed(
  () => new OrganizationPermissions(currentTenant.value, currentUser.value)
    .editLockedForSampleData,
);

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
  router.push({
    name: 'organizationMergeSuggestions',
    query: {
      organizationId: props.organization.id,
    },
  });
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
