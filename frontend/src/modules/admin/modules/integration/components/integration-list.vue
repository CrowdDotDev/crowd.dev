<template>
  <section class="sticky top-43 z-10">
    <div class="w-full bg-white">
      <lf-tabs v-model="tab">
        <lf-tab v-model="tab" name="all">
          All integrations
        </lf-tab>
        <lf-tab
          v-for="(status, key) in lfIntegrationStatusesTabs"
          :key="key"
          v-model="tab"
          :name="key"
        >
          <div class="flex items-center gap-1.5">
            <span>{{ status.tabs.text }}</span>
            <div v-if="getIntegrationCountPerStatus[key] > 0" class="rounded py-0.5 px-1 text-tiny" :class="status.tabs.badge">
              {{ getIntegrationCountPerStatus[key] }}
            </div>
          </div>
        </lf-tab>
      </lf-tabs>
    </div>
    <div class="w-full h-8 bg-gradient-to-b from-white to-transparent pl-10" />
  </section>
  <section>
    <app-integration-progress-wrapper :segments="[route.params.id]">
      <template #default="{ progress, progressError }">
        <div v-if="platformsByStatus.length > 0" class="flex flex-col gap-6">
          <lf-integration-list-item
            v-for="key in platformsByStatus"
            :key="key"
            :config="lfIntegrations[key]"
            :progress="progress"
            :progress-error="progressError"
          />
        </div>
        <div v-else class="pt-12 flex flex-col items-center">
          <lf-icon name="grid-round" :size="120" class="text-gray-300" />
          <h6 class="text-center pt-6">
            {{ lfIntegrationStatusesTabs[tab]?.tabs?.empty || 'No integrations connected' }}
          </h6>
        </div>
      </template>
    </app-integration-progress-wrapper>
  </section>
</template>

<script lang="ts" setup>
import { lfIntegrations } from '@/config/integrations';
import { computed, onMounted, ref } from 'vue';
import LfIntegrationListItem from '@/modules/admin/modules/integration/components/integration-list-item.vue';
import { mapActions, mapGetters } from '@/shared/vuex/vuex.helpers';
import AppIntegrationProgressWrapper from '@/modules/integration/components/integration-progress-wrapper.vue';
import { useRoute } from 'vue-router';
import LfTabs from '@/ui-kit/tabs/Tabs.vue';
import LfTab from '@/ui-kit/tabs/Tab.vue';
import { lfIntegrationStatusesTabs } from '@/modules/admin/modules/integration/config/status';
import LfIcon from '@/ui-kit/icon/Icon.vue';

const route = useRoute();

const { doFetch } = mapActions('integration');
const { array } = mapGetters('integration');

const tab = ref('all');

const platformsByStatus = computed(() => {
  const statusConfig = lfIntegrationStatusesTabs[tab.value];
  const all = Object.keys(lfIntegrations);
  if (!statusConfig) {
    return all;
  }
  if (statusConfig.key === 'notConnected') {
    return all.filter((platform) => !array.value.map((integration) => integration.platform).includes(platform));
  }
  const matching = array.value.filter((integration) => statusConfig.show(integration)).map((integration) => integration.platform);
  return all.filter((platform) => matching.includes(platform));
});

const getIntegrationCountPerStatus = computed<Record<string, number>>(() => {
  const statusCount = {};
  Object.entries(lfIntegrationStatusesTabs).forEach(([key, statusConfig]) => {
    statusCount[key] = array.value.filter((integration) => statusConfig.show(integration)).length;
  });
  return statusCount;
});

onMounted(() => {
  doFetch();
});
</script>

<script lang="ts">
export default {
  name: 'LfIntegrationList',
};
</script>
