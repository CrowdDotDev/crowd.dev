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
      <el-tab-pane label="Automations" name="automations">
        <app-automation-list
          v-if="activeTab === 'automations'"
        />
      </el-tab-pane>
      <el-tab-pane label="API Keys" name="api-keys">
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

const route = useRoute();
const router = useRouter();

const activeTab = ref<string>();

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

onMounted(() => {
  activeTab.value = route.query.activeTab as string || 'project-groups';
});

watch(() => route.query.activeTab, (newActiveTab) => {
  if (newActiveTab) {
    activeTab.value = newActiveTab as string;
  }
});
</script>
