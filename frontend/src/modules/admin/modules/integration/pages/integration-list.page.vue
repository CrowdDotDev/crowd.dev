<template>
  <div class="mx-auto max-w-254">
    <div class="sticky -top-5 -mt-5 z-10 bg-white border-b border-b-white">
      <!-- Back button -->
      <div class="border-b border-gray-100 py-3.5">
        <router-link
          :to="{
            name: 'adminProjects',
            params: {
              id: grandparentId,
            },
          }"
        >
          <lf-button type="secondary-ghost">
            <lf-icon name="angle-left" type="regular" />
            {{ getSegmentName(grandparentId) || subproject?.grandparentName }}
          </lf-button>
        </router-link>
      </div>

      <!-- Header -->
      <div class="py-6">
        <p v-if="subproject" class="text-small text-gray-500 pb-2">
          {{ subproject?.name }}
        </p>
        <h4 class="pb-2">
          Integrations
        </h4>
        <p class="text-small text-gray-500">
          Connect with the data sources where interactions happen within your community.
        </p>
      </div>

      <!-- Tabs -->
      <section>
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
                <div v-if="getIntegrationCountPerStatus[key] > 0" class="rounded py-0.5 px-1 text-tiny text-black" :class="status.tabs.badge">
                  {{ getIntegrationCountPerStatus[key] }}
                </div>
              </div>
            </lf-tab>
          </lf-tabs>
        </div>
        <div class="w-full h-8 bg-gradient-to-b from-white to-transparent pl-10" />
      </section>
    </div>

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
  </div>
</template>

<script lang="ts" setup>
import { useRoute } from 'vue-router';
import LfButton from '@/ui-kit/button/Button.vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';
import { computed, onMounted, ref } from 'vue';
import { getSegmentName } from '@/utils/segments';
import { lfIntegrationStatusesTabs } from '@/modules/admin/modules/integration/config/status';
import { lfIntegrations } from '@/config/integrations';
import LfTabs from '@/ui-kit/tabs/Tabs.vue';
import LfIntegrationListItem from '@/modules/admin/modules/integration/components/integration-list-item.vue';
import LfTab from '@/ui-kit/tabs/Tab.vue';
import AppIntegrationProgressWrapper from '@/modules/integration/components/integration-progress-wrapper.vue';
import { mapActions, mapGetters } from '@/shared/vuex/vuex.helpers';

const route = useRoute();

const { findSubProject } = useLfSegmentsStore();
const { doFetch } = mapActions('integration');
const { array } = mapGetters('integration');

const { id, grandparentId } = route.params;

const subproject = ref<any>();

const tab = ref('all');

const platformsByStatus = computed(() => {
  const statusConfig = lfIntegrationStatusesTabs[tab.value];
  const all = Object.keys(lfIntegrations);
  if (!statusConfig) {
    return all;
  }
  if (statusConfig.key === 'notConnected') {
    return all.filter((platform) => !array.value.map((integration: any) => integration.platform).includes(platform));
  }
  const matching = array.value.filter((integration: any) => statusConfig.show(integration)).map((integration: any) => integration.platform);
  return all.filter((platform) => matching.includes(platform));
});

const getIntegrationCountPerStatus = computed<Record<string, number>>(() => {
  const statusCount: any = {};
  Object.entries(lfIntegrationStatusesTabs).forEach(([key, statusConfig]) => {
    statusCount[key] = array.value.filter((integration: any) => statusConfig.show(integration)).length;
  });
  statusCount.notConnected = Object.keys(lfIntegrations).length - array.value.length;
  return statusCount;
});

onMounted(() => {
  doFetch();
  findSubProject(id)
    .then((res) => {
      console.log(res);
      subproject.value = res;
    });
});
</script>

<script lang="ts">
export default {
  name: 'LfIntegrationListPage',
};
</script>
