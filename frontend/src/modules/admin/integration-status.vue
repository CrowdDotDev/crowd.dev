<template>
  <div class="pt-6 h-screen">
    <div class="pb-6 flex justify-between items-center">
      <div class="flex">
        <lf-button @click="status = 'done'">
          Connected
        </lf-button>
        <lf-button @click="status = 'in-progress'">
          In progress
        </lf-button>
      </div>
      <lf-admin-integration-platform-select v-model="platform" />
    </div>
    <lf-search v-model="query" :lazy="true" placeholder="Search sub-projects..." class="!h-9" />
    <div class="pt-5">
      <div v-if="loading" class="pt-3 flex justify-center">
        <lf-spinner />
      </div>
      <div v-else>
        <lf-table>
          <thead>
            <tr>
              <lf-table-head class="pl-2">
                Sub-project
              </lf-table-head>
              <lf-table-head>Integration</lf-table-head>
            </tr>
          </thead>
          <tbody>
            <tr v-for="integration of integrations" :key="integration.id">
              <td class="pl-2">
                <p class="text-medium font-semibold mb-1">
                  {{ integration.name }}
                </p>
                <p class="text-tiny text-gray-500">
                  {{ integration.grandparentName }} > {{ integration.parentName }}
                </p>
              </td>
              <td>
                <div class="flex flex-col gap-1 items-start">
                  <div class="flex items-center gap-1.5">
                    <div>
                      <img :src="getConfig(integration.platform)?.image" :alt="getConfig(integration.platform)?.name" class="w-4 h-4" />
                    </div>
                    <p class="text-medium font-semibold">
                      {{ getConfig(integration.platform)?.name }}
                    </p>
                  </div>
                  <p class="text-tiny text-gray-500 flex">
                    100 out of 1,000 data streams processed...
                  </p>
                </div>
              </td>
            </tr>
          </tbody>
        </lf-table>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref, watch } from 'vue';
import { UsersService } from '@/modules/admin/services/users.service';
import LfSearch from '@/ui-kit/search/Search.vue';
import LfSpinner from '@/ui-kit/spinner/Spinner.vue';
import LfTable from '@/ui-kit/table/Table.vue';
import LfTableHead from '@/ui-kit/table/TableHead.vue';
import { CrowdIntegrations } from '@/integrations/integrations-config';
import LfButton from '@/ui-kit/button/Button.vue';
import LfAdminIntegrationPlatformSelect from '@/modules/admin/integration-platform-select.vue';

const loading = ref(true);

const platform = ref('');
const status = ref('done');
const query = ref<string>('');

const integrations = ref<any[]>([]);
const offset = ref<number>(0);
const limit = ref<number>(20);

const fetchGlobalIntegrations = () => {
  UsersService.fetchGlobalIntegrations({
    limit: limit.value,
    offset: offset.value,
    query: query.value,
    platform: platform.value || undefined,
    status: status.value,
  })
    .then((res) => {
      integrations.value = res;
    })
    .finally(() => {
      loading.value = false;
    });
};

const fetchGlobalIntegrationStatusCount = () => {
  UsersService.fetchGlobalIntegrationStatusCount()
    .then((res) => {
      console.log(res);
      // integrations.value = res;
    })
};

const getConfig = (platform: string) => CrowdIntegrations.getConfig(platform);

watch(() => status.value, () => {
  loading.value = true;
  offset.value = 0;
  fetchGlobalIntegrations();
});

watch(() => platform.value, () => {
  loading.value = true;
  offset.value = 0;
  fetchGlobalIntegrations();
});

watch(() => query.value, () => {
  loading.value = true;
  offset.value = 0;
  fetchGlobalIntegrations();
});

onMounted(() => {
  fetchGlobalIntegrations();
  fetchGlobalIntegrationStatusCount();
});
</script>

<script lang="ts">
export default {
  name: 'LfAdminIntegrationStatus',
};
</script>
