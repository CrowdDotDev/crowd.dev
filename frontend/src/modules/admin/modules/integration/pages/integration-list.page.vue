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
            {{ getSegmentName(grandparentId) }}
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
    </div>
    <lf-integration-list />
  </div>
</template>

<script lang="ts" setup>
import LfIntegrationList from '@/modules/admin/modules/integration/components/integration-list.vue';
import { useRoute } from 'vue-router';
import LfButton from '@/ui-kit/button/Button.vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';
import { onMounted, ref } from 'vue';
import { getSegmentName } from '@/utils/segments';

const route = useRoute();

const { findSubProject } = useLfSegmentsStore();

const { id, grandparentId } = route.params;

const subproject = ref<any>();

onMounted(() => {
  findSubProject(id)
    .then((res) => {
      subproject.value = res;
    });
});
</script>

<script lang="ts">
export default {
  name: 'LfIntegrationListPage',
};
</script>
