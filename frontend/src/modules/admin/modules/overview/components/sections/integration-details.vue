<template>
  <div class="bg-white border border-gray-200 rounded-lg shadow-sm">
    <!-- Header -->
    <div class="border-b border-gray-200 px-5 pt-5 pb-0">
      <h3 class="text-base font-semibold text-gray-900 mb-6">
        In progress & troubleshooting
      </h3>
      
      <!-- Tabs -->
      <el-tabs v-model="activeTab" class="integration-tabs">
        <el-tab-pane label="In progress (4)" name="in-progress">
          <template #label>
            <div class="flex items-center gap-1.5">
              <lf-icon name="clock" :size="16" class="text-gray-600" />
              <span>In progress (4)</span>
            </div>
          </template>
        </el-tab-pane>
        <el-tab-pane label="Action required (2)" name="action-required">
          <template #label>
            <div class="flex items-center gap-1.5">
              <lf-icon name="triangle-exclamation" :size="16" class="text-gray-600" />
              <span>Action required (2)</span>
            </div>
          </template>
        </el-tab-pane>
        <el-tab-pane label="Connection failed (1)" name="connection-failed">
          <template #label>
            <div class="flex items-center gap-1.5">
              <lf-icon name="circle-exclamation" :size="16" class="text-gray-600" />
              <span>Connection failed (1)</span>
            </div>
          </template>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- Table Headers -->
    <div class="flex items-center gap-4 px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">
      <div class="w-40">Integration</div>
      <div class="flex-1">Project</div>
      <div class="w-32">Status</div>
      <div class="w-10"></div>
    </div>

    <!-- Integration Rows -->
    <div class="divide-y divide-gray-200">
      <div 
        v-for="integration in filteredIntegrations" 
        :key="integration.id"
        class="flex items-center gap-4 px-5 py-5"
      >
        <!-- Integration Column -->
        <div class="w-40 flex items-center gap-1.5">
          <div class="w-4 h-4 flex-shrink-0">
            <img :src="integration.icon" :alt="integration.platform" class="w-full h-full" />
          </div>
          <span class="text-sm font-medium text-gray-900">{{ integration.platform }}</span>
        </div>

        <!-- Project Column -->
        <div class="flex-1">
          <div class="text-sm font-medium text-gray-900">{{ integration.projectName }}</div>
          <div class="text-xs text-gray-500">{{ integration.projectPath }}</div>
        </div>

        <!-- Status Column -->
        <div class="w-32">
          <div class="flex items-center gap-1.5 mb-1">
            <lf-icon 
              :name="integration.status.icon" 
              :size="16" 
              :class="integration.status.iconClass"
            />
            <span class="text-sm font-medium text-gray-900">{{ integration.status.label }}</span>
          </div>
          <div class="text-xs text-gray-500">{{ integration.status.description }}</div>
        </div>

        <!-- Actions Column -->
        <div class="w-10">
          <button class="p-2.5 hover:bg-gray-50 rounded-md">
            <lf-icon name="ellipsis" :size="16" class="text-gray-900" />
          </button>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="px-5 py-6 flex items-center justify-center gap-4">
      <span class="text-xs text-gray-400">{{ paginationText }}</span>
      <button class="text-xs text-primary-500 font-semibold hover:text-primary-600">
        Load more
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';

// Mock data for integrations
const integrations = ref([
  // In Progress integrations
  {
    id: 1,
    platform: 'GitHub',
    icon: 'https://www.figma.com/api/mcp/asset/0ab14917-e2ca-446a-8f6c-1dc7c520707e',
    projectName: 'Academy Software Foundation',
    projectPath: 'Academy Software Fou... > Academy Software Fou...',
    status: {
      label: 'In progress',
      description: '100 out of 1,000 data streams processed...',
      icon: 'loader-4-fill',
      iconClass: 'text-primary-500',
      type: 'in-progress'
    }
  },
  {
    id: 2,
    platform: 'Stack Overflow',
    icon: 'https://www.figma.com/api/mcp/asset/eca989d0-0cea-45f2-a0fa-463c6ae3ad5d',
    projectName: 'Asset Repository Working Group',
    projectPath: 'Academy Software Fou... > Asset Repository Wor...',
    status: {
      label: 'In progress',
      description: '600 data streams being processed...',
      icon: 'loader-4-fill',
      iconClass: 'text-primary-500',
      type: 'in-progress'
    }
  },
  {
    id: 3,
    platform: 'Git',
    icon: 'https://www.figma.com/api/mcp/asset/1efa7655-45c4-41b4-a3ce-3a913f22520d',
    projectName: 'AcademyMaterialX Software Foundation',
    projectPath: 'Academy Software Fou... > MaterialX',
    status: {
      label: 'In progress',
      description: '600 data streams being processed...',
      icon: 'loader-4-fill',
      iconClass: 'text-primary-500',
      type: 'in-progress'
    }
  },
  {
    id: 4,
    platform: 'GitLab',
    icon: 'https://www.figma.com/api/mcp/asset/fc824466-7e66-4681-a7fb-588ea1221ff9',
    projectName: 'OpenAssetIO',
    projectPath: 'Academy Software Fou... > OpenAssetIO',
    status: {
      label: 'In progress',
      description: '600 data streams being processed...',
      icon: 'loader-4-fill',
      iconClass: 'text-primary-500',
      type: 'in-progress'
    }
  },
  // Action Required integrations
  {
    id: 5,
    platform: 'Slack',
    icon: 'https://www.figma.com/api/mcp/asset/0ab14917-e2ca-446a-8f6c-1dc7c520707e',
    projectName: 'Community Management',
    projectPath: 'Academy Software Fou... > Community',
    status: {
      label: 'Action required',
      description: 'API key expired, please update credentials',
      icon: 'triangle-exclamation',
      iconClass: 'text-yellow-500',
      type: 'action-required'
    }
  },
  {
    id: 6,
    platform: 'Discord',
    icon: 'https://www.figma.com/api/mcp/asset/eca989d0-0cea-45f2-a0fa-463c6ae3ad5d',
    projectName: 'Developer Relations',
    projectPath: 'Academy Software Fou... > DevRel',
    status: {
      label: 'Action required',
      description: 'Permission denied, check bot permissions',
      icon: 'triangle-exclamation',
      iconClass: 'text-yellow-500',
      type: 'action-required'
    }
  },
  // Connection Failed integrations
  {
    id: 7,
    platform: 'Jira',
    icon: 'https://www.figma.com/api/mcp/asset/1efa7655-45c4-41b4-a3ce-3a913f22520d',
    projectName: 'Project Management',
    projectPath: 'Academy Software Fou... > PM',
    status: {
      label: 'Connection failed',
      description: 'Unable to connect to server',
      icon: 'circle-exclamation',
      iconClass: 'text-red-500',
      type: 'connection-failed'
    }
  }
]);

const activeTab = ref('in-progress');

const filteredIntegrations = computed(() => {
  return integrations.value.filter(integration => {
    switch (activeTab.value) {
      case 'in-progress':
        return integration.status.type === 'in-progress';
      case 'action-required':
        return integration.status.type === 'action-required';
      case 'connection-failed':
        return integration.status.type === 'connection-failed';
      default:
        return true;
    }
  });
});

const paginationText = computed(() => {
  const total = 120;
  const showing = filteredIntegrations.value.length;
  return `${showing} out of ${total} integrations`;
});
</script>

<script lang="ts">
export default {
  name: 'AppLfOverviewIntegrationDetails',
};
</script>

<style scoped>
.integration-tabs :deep(.el-tabs__header) {
  margin: 0;
  border: none;
}

.integration-tabs :deep(.el-tabs__nav-wrap::after) {
  height: 1px;
  background-color: #e5e7eb;
}

.integration-tabs :deep(.el-tabs__item) {
  padding: 0 0 16px 0;
  margin-right: 24px;
  font-weight: 500;
  font-size: 14px;
  color: #6b7280;
  border: none;
}

.integration-tabs :deep(.el-tabs__item.is-active) {
  color: #0f172a;
  font-weight: 500;
}

.integration-tabs :deep(.el-tabs__active-bar) {
  background-color: #0094ff;
  height: 2px;
}

.integration-tabs :deep(.el-tabs__item:hover) {
  color: #0094ff;
}
</style>