<template>
  <app-page-wrapper>
    <div class="w-full mb-6">
      <h4 class="text-gray-900 py-6">
        Admin panel
      </h4>
    </div>

    <el-tabs :model-value="activeTab" class="mb-6" @update:model-value="changeView">
      <el-tab-pane label="Project Groups" name="project-groups">
        <app-lf-project-groups-page
          v-if="activeTab === 'project-groups'"
        />
      </el-tab-pane>
      <el-tab-pane v-if="isAdminUser" label="Integrations" name="integrations">
        <lf-admin-integration-status
          v-if="activeTab === 'integrations'"
        />
      </el-tab-pane>
      <el-tab-pane v-if="isAdminUser" label="Organizations" name="organizations">
        <app-organization-common-page
          v-if="activeTab === 'organizations'"
        />
      </el-tab-pane>
      <el-tab-pane v-if="isAdminUser" label="Automations" name="automations">
        <app-automation-list
          v-if="activeTab === 'automations'"
        />
      </el-tab-pane>
      <el-tab-pane v-if="isAdminUser" label="API Keys" name="api-keys">
        <app-api-keys-page
          v-if="activeTab === 'api-keys'"
        />
      </el-tab-pane>
      <el-tab-pane v-if="isAdminUser" label="Audit logs" name="audit-logs">
        <app-lf-audit-logs-page
          v-if="activeTab === 'audit-logs'"
        />
      </el-tab-pane>
      <el-tab-pane v-if="isAdminUser" label="Users" name="users">
        <lf-admin-users v-if="activeTab === 'users'" />
      </el-tab-pane>
      <el-tab-pane v-if="isDevMode" label="Dev" name="dev">
        <lf-devmode v-if="isDevMode && activeTab === 'dev'" />
      </el-tab-pane>
    </el-tabs>
  </app-page-wrapper>
</template>

<script setup lang="ts">
import {
  computed, onMounted, ref, watch,
} from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppLfProjectGroupsPage from '@/modules/lf/segments/pages/lf-project-groups-page.vue';
import AppApiKeysPage from '@/modules/settings/pages/api-keys-page.vue';
import AppAutomationList from '@/modules/automation/components/automation-list.vue';
import { useAuthStore } from '@/modules/auth/store/auth.store';
import { storeToRefs } from 'pinia';
import AppLfAuditLogsPage from '@/modules/lf/segments/pages/lf-audit-logs-page.vue';
import LfDevmode from '@/modules/lf/segments/components/dev/devmode.vue';
import { LfRole } from '@/shared/modules/permissions/types/Roles';
import AppOrganizationCommonPage from '@/modules/organization/pages/organization-common-page.vue';
import LfAdminIntegrationStatus from '@/modules/admin/modules/integration/pages/integration-status.page.vue';
import LfAdminUsers from '@/modules/admin/modules/users/pages/users.page.vue';

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

const isDevMode = !!localStorage.getItem('devmode');

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
