<template>
  <app-page-wrapper>
    <div class="w-full">
      <h4 class="text-gray-900 py-6">
        Admin panel
      </h4>
    </div>
    <lf-tabs v-model="activeTab" @update:model-value="changeView">
      <lf-tab v-model="activeTab" name="project-groups">
        Projects
      </lf-tab>
      <template v-if="isAdminUser">
        <lf-tab v-model="activeTab" name="integrations">
          Integrations
        </lf-tab>
        <lf-tab v-model="activeTab" name="organizations">
          Organizations
        </lf-tab>
        <lf-tab v-model="activeTab" name="automations">
          Automations
        </lf-tab>
        <lf-tab v-model="activeTab" name="api-keys">
          API Keys
        </lf-tab>
        <lf-tab v-model="activeTab" name="audit-logs">
          Audit logs
        </lf-tab>
        <lf-tab v-model="activeTab" name="users">
          Users
        </lf-tab>
      </template>
    </lf-tabs>
    <div class="mt-6 border-t border-gray-100">
      <div class="tab-content">
        <app-lf-project-groups-page
          v-if="activeTab === 'project-groups'"
        />
        <lf-admin-integration-status
          v-else-if="activeTab === 'integrations'"
        />
        <app-organization-common-page
          v-else-if="activeTab === 'organizations'"
        />
        <app-automation-list
          v-else-if="activeTab === 'automations'"
        />
        <app-api-keys-page
          v-else-if="activeTab === 'api-keys'"
        />
        <app-lf-audit-logs-page
          v-else-if="activeTab === 'audit-logs'"
        />
        <lf-admin-users v-else-if="activeTab === 'users'" />
      </div>
    </div>
  </app-page-wrapper>
</template>

<script setup lang="ts">
import {
  computed, onMounted, ref, watch,
} from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppLfProjectGroupsPage from '@/modules/admin/modules/projects/pages/project-groups.page.vue';
import AppApiKeysPage from '@/modules/settings/pages/api-keys-page.vue';
import AppAutomationList from '@/modules/automation/components/automation-list.vue';
import { useAuthStore } from '@/modules/auth/store/auth.store';
import { storeToRefs } from 'pinia';
import AppLfAuditLogsPage from '@/modules/lf/segments/pages/lf-audit-logs-page.vue';
import { LfRole } from '@/shared/modules/permissions/types/Roles';
import AppOrganizationCommonPage from '@/modules/organization/pages/organization-common-page.vue';
import LfAdminIntegrationStatus from '@/modules/admin/modules/integration/pages/integration-status.page.vue';
import LfAdminUsers from '@/modules/admin/modules/users/pages/users.page.vue';
import LfTabs from '@/ui-kit/tabs/Tabs.vue';
import LfTab from '@/ui-kit/tabs/Tab.vue';

const route = useRoute();
const router = useRouter();

const activeTab = ref<string>();

const authStore = useAuthStore();
const { roles } = storeToRefs(authStore);

const changeView = (view: string) => {
  router.push({
    hash: `#${view}`,
    query: {},
  });
};

const isAdminUser = computed(() => roles.value.includes(LfRole.admin));

onMounted(() => {
  const initialActiveTab = route.hash.substring(1) as string;

  if ((initialActiveTab === 'automations' || initialActiveTab === 'api-keys' || initialActiveTab === 'audit-logs') && !isAdminUser.value) {
    activeTab.value = 'project-groups';
  } else {
    activeTab.value = route.hash.substring(1) as string || 'project-groups';
  }
});

watch(() => route.hash, (hash: string) => {
  const view = hash.substring(1);
  if (view.length > 0 && view !== activeTab.value) {
    activeTab.value = view;
  }
}, { immediate: true });
</script>
