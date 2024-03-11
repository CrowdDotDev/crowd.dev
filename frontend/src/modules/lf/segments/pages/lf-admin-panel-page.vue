<template>
  <app-page-wrapper>
    <div class="w-full mb-6">
      <h4 class="text-gray-900 py-6">
        Admin panel
      </h4>
    </div>

    <el-tabs v-model="computedActiveTab">
      <el-tab-pane label="Project Groups" name="project-groups">
        <app-lf-project-groups-page
          v-if="activeTab === 'project-groups'"
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
import { PermissionChecker } from '@/modules/user/permission-checker';
import Roles from '@/security/roles';
import { mapGetters } from '@/shared/vuex/vuex.helpers';

const route = useRoute();
const router = useRouter();

const activeTab = ref<string>();

const { currentTenant, currentUser } = mapGetters('auth');

const computedActiveTab = computed({
  get() {
    return activeTab.value;
  },
  set(v) {
    router.push({
      name: '',
      query: { activeTab: v },
    });
  },
});

const isAdminUser = computed(() => {
  const permissionChecker = new PermissionChecker(
    currentTenant.value,
    currentUser.value,
  );

  return permissionChecker.currentUserRolesIds.includes(Roles.values.admin);
});

onMounted(() => {
  const initialActiveTab = route.query.activeTab as string;

  if ((initialActiveTab === 'automations' || initialActiveTab === 'api-keys') && !isAdminUser.value) {
    activeTab.value = 'project-groups';
  } else {
    activeTab.value = route.query.activeTab as string || 'project-groups';
  }
});

watch(() => route.query.activeTab, (newActiveTab) => {
  if (newActiveTab) {
    activeTab.value = newActiveTab as string;
  }
});
</script>
